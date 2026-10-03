import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { requireFirebaseAuth } from '../middleware/auth';
import { getSupabase } from '../db/supabase';

const router = Router();

// GET /api/v1/cart
router.get('/', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (!user) {
      res.json({ items: [], subtotal: 0 });
      return;
    }

    const { data: cart } = await supabase
      .from('carts')
      .select('id, restaurant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cart) {
      res.json({ items: [], subtotal: 0 });
      return;
    }

    const { data: items } = await supabase
      .from('cart_items')
      .select(`
        id,
        menu_item_id,
        quantity,
        menu_items (
          item_name,
          price,
          discounted_price,
          image_url,
          is_veg
        )
      `)
      .eq('cart_id', cart.id);

    const formattedItems = (items || []).map((i: any) => ({
      id: i.id,
      menuItemId: i.menu_item_id,
      name: i.menu_items?.item_name || 'Item',
      quantity: i.quantity,
      unitPrice: i.menu_items?.discounted_price || i.menu_items?.price || 0,
      totalPrice: (i.menu_items?.discounted_price || i.menu_items?.price || 0) * i.quantity,
      isVeg: i.menu_items?.is_veg ?? true
    }));

    const subtotal = formattedItems.reduce((acc, item) => acc + item.totalPrice, 0);

    res.json({
      cartId: cart.id,
      restaurantId: cart.restaurant_id,
      items: formattedItems,
      subtotal
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch cart', message: error.message });
  }
});

// POST /api/v1/cart/items
router.post('/items', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const { menuItemId, quantity, restaurantId } = req.body;
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get or create cart
    let { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cart) {
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert({ user_id: user.id, restaurant_id: restaurantId })
        .select()
        .single();
      if (error) throw error;
      cart = newCart;
    }

    if (!cart) {
      res.status(500).json({ error: 'Failed to initialize cart' });
      return;
    }

    // Add or increment item
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('menu_item_id', menuItemId)
      .maybeSingle();

    if (existingItem) {
      await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + (quantity || 1) })
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({ cart_id: cart.id, menu_item_id: menuItemId, quantity: quantity || 1 });
    }

    res.status(201).json({ status: 'success', message: 'Item added to cart' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add item', message: error.message });
  }
});

// DELETE /api/v1/cart/items/:id
router.delete('/items/:id', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const supabase = getSupabase();
    await supabase.from('cart_items').delete().eq('id', id);
    res.json({ status: 'deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove item', message: error.message });
  }
});

export default router;
