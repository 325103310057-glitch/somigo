import { getSupabase } from '../db/supabase';
import { PlaceOrderDto } from '../types';

export class OrderService {
  static async createOrder(firebaseUid: string, dto: PlaceOrderDto) {
    const supabase = getSupabase();

    // 1. Authoritative User Lookup from verified Firebase UID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, phone_number')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      throw new Error('Authenticated customer profile not found in Supabase.');
    }

    // 2. Validate Restaurant
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', dto.restaurantId)
      .eq('is_active', true)
      .single();

    if (restError || !restaurant) {
      throw new Error('Restaurant not found or currently inactive.');
    }

    // 3. Retrieve and Validate Menu Items from Supabase (Server-side calculation)
    let subtotal = 0;
    const orderItemsToInsert: any[] = [];

    if (dto.items && dto.items.length > 0) {
      const itemIds = dto.items.map((i) => i.menuItemId);
      const { data: menuItems, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .in('id', itemIds)
        .eq('restaurant_id', dto.restaurantId);

      if (itemsError || !menuItems || menuItems.length === 0) {
        throw new Error('Selected menu items could not be validated.');
      }

      const itemMap = new Map(menuItems.map((m) => [m.id, m]));

      for (const item of dto.items) {
        const dbItem = itemMap.get(item.menuItemId);
        if (!dbItem || !dbItem.available) {
          throw new Error(`Item "${dbItem?.item_name || item.menuItemId}" is currently unavailable.`);
        }
        const unitPrice = dbItem.discounted_price || dbItem.price;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItemsToInsert.push({
          menu_item_id: dbItem.id,
          item_name: dbItem.item_name,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: itemTotal,
        });
      }
    } else {
      // Default to minimum order threshold if items are checked out from cart session
      subtotal = restaurant.minimum_order_value || 149.0;
    }

    // 4. Server-Side Calculations (Taxes, Delivery fee, Platform fee, Tip, Discount)
    const deliveryFee = restaurant.delivery_fee ?? 25.0;
    const taxes = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const platformFee = 5.0;
    const tip = Math.max(0, dto.tip || 0);

    let discount = 0;
    if (dto.couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', dto.couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (coupon && subtotal >= coupon.minimum_order_value) {
        discount =
          coupon.discount_type === 'PERCENTAGE'
            ? Math.min(coupon.maximum_discount, (subtotal * coupon.discount_value) / 100)
            : coupon.discount_value;
      }
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee + taxes + platformFee + tip - discount);

    // 5. Generate secure 4-digit PIN for delivery completion
    const deliveryPin = `${Math.floor(1000 + Math.random() * 9000)}`;
    const orderNumber = `ORD${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    // 6. Insert Order into Supabase
    const { data: newOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: user.id,
        restaurant_id: restaurant.id,
        delivery_address_id: dto.deliveryAddressId || null,
        subtotal,
        delivery_fee: deliveryFee,
        taxes,
        platform_fee: platformFee,
        discount,
        tip,
        total_amount: totalAmount,
        order_status: 'PLACED',
        payment_status: 'PENDING', // Requirement 15: Always PENDING until real payment gateway confirmation
        payment_method: dto.paymentMethod || 'UPI',
        delivery_pin: deliveryPin,
      })
      .select()
      .single();

    if (orderInsertError || !newOrder) {
      console.error('Error inserting order in Supabase:', orderInsertError);
      throw new Error(`Failed to place order: ${orderInsertError?.message}`);
    }

    // 7. Insert Order Items
    if (orderItemsToInsert.length > 0) {
      const itemsPayload = orderItemsToInsert.map((item) => ({
        ...item,
        order_id: newOrder.id,
      }));
      await supabase.from('order_items').insert(itemsPayload);
    }

    // 8. Create Payment Record (Pending)
    await supabase.from('payments').insert({
      order_id: newOrder.id,
      user_id: user.id,
      amount: totalAmount,
      currency: 'INR',
      payment_method: dto.paymentMethod || 'UPI',
      status: 'PENDING',
    });

    return {
      id: newOrder.id,
      orderNumber: newOrder.order_number,
      restaurantId: newOrder.restaurant_id,
      restaurantName: restaurant.restaurant_name,
      totalAmount: newOrder.total_amount,
      orderStatus: newOrder.order_status,
      paymentStatus: newOrder.payment_status,
      deliveryPin: newOrder.delivery_pin,
      placedAt: newOrder.created_at,
    };
  }

  static async listUserOrders(firebaseUid: string) {
    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        restaurant_id,
        subtotal,
        delivery_fee,
        taxes,
        total_amount,
        order_status,
        payment_status,
        delivery_pin,
        created_at,
        restaurants (
          restaurant_name
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return (data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      restaurantId: o.restaurant_id,
      restaurantName: o.restaurants?.restaurant_name || 'Restaurant',
      totalAmount: o.total_amount,
      orderStatus: o.order_status,
      paymentStatus: o.payment_status,
      deliveryPin: o.delivery_pin,
      placedAt: o.created_at,
    }));
  }

  static async getOrderTracking(orderId: number) {
    const supabase = getSupabase();
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_status,
        delivery_pin,
        delivery_partner_id,
        delivery_partners (
          full_name,
          phone_number,
          vehicle_number,
          current_latitude,
          current_longitude
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      throw new Error('Order not found');
    }

    const partner = (order as any).delivery_partners;

    return {
      orderId: order.id,
      orderStatus: order.order_status,
      deliveryPartnerName: partner?.full_name || null,
      deliveryPartnerPhone: partner?.phone_number || null,
      deliveryPartnerVehicle: partner?.vehicle_number || null,
      driverLatitude: partner?.current_latitude || null,
      driverLongitude: partner?.current_longitude || null,
      accuracy: 5.0,
      deliveryPin: order.delivery_pin,
    };
  }

  static async verifyDeliveryPin(orderId: number, pin: string) {
    const supabase = getSupabase();
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, delivery_pin, order_status')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      throw new Error('Order not found');
    }

    if (order.delivery_pin !== pin) {
      return false;
    }

    await supabase
      .from('orders')
      .update({
        order_status: 'DELIVERED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return true;
  }
}
