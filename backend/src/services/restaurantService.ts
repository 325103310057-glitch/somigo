import { getSupabase } from '../db/supabase';
import { config } from '../config';

export class RestaurantService {
  static async listRestaurants(filters?: {
    city?: string;
    cuisine?: string;
    search?: string;
    vegOnly?: boolean;
  }) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase database configuration missing from environment.');
    }
    const supabase = getSupabase();
    let query = supabase.from('restaurants').select('*').eq('is_active', true);

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.cuisine) {
      query = query.ilike('cuisine_type', `%${filters.cuisine}%`);
    }
    if (filters?.search) {
      query = query.or(`restaurant_name.ilike.%${filters.search}%,cuisine_type.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('average_rating', { ascending: false });
    if (error) {
      console.error('Error fetching restaurants from Supabase:', error);
      throw new Error(`Failed to retrieve restaurants: ${error.message}`);
    }

    return (data || []).map((r) => ({
      id: r.id,
      restaurantName: r.restaurant_name,
      description: r.description,
      cuisineType: r.cuisine_type,
      averageRating: r.average_rating,
      totalReviews: r.total_reviews,
      estimatedDeliveryMinutes: r.estimated_delivery_minutes,
      deliveryFee: r.delivery_fee,
      minimumOrderValue: r.minimum_order_value,
      coverImageUrl: r.cover_image_url || r.logo_url,
      city: r.city,
      address: r.address,
      isOpen: r.is_open,
    }));
  }

  static async getRestaurantById(id: number) {
    const supabase = getSupabase();
    const { data: r, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get restaurant: ${error.message}`);
    }
    if (!r) {
      return null;
    }

    return {
      id: r.id,
      restaurantName: r.restaurant_name,
      description: r.description,
      cuisineType: r.cuisine_type,
      averageRating: r.average_rating,
      totalReviews: r.total_reviews,
      estimatedDeliveryMinutes: r.estimated_delivery_minutes,
      deliveryFee: r.delivery_fee,
      minimumOrderValue: r.minimum_order_value,
      coverImageUrl: r.cover_image_url || r.logo_url,
      city: r.city,
      address: r.address,
      isOpen: r.is_open,
    };
  }

  static async getRestaurantMenu(restaurantId: number) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('available', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching menu items:', error);
      throw new Error(`Failed to load menu items: ${error.message}`);
    }

    return (data || []).map((m) => ({
      id: m.id,
      restaurantId: m.restaurant_id,
      name: m.item_name,
      description: m.description,
      price: m.price,
      discountedPrice: m.discounted_price,
      vegetarian: m.is_veg,
      spicyLevel: m.spicy_level || 1,
      imageUrl: m.image_url,
      available: m.available,
      category: 'Specialties',
    }));
  }
}
