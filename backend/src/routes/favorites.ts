import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { requireFirebaseAuth } from '../middleware/auth';
import { getSupabase } from '../db/supabase';

const router = Router();

// GET /api/v1/favorites
router.get('/', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (!user) {
      res.json([]);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        restaurant_id,
        restaurants (
          id,
          restaurant_name,
          cuisine_type,
          average_rating,
          cover_image_url
        )
      `)
      .eq('user_id', user.id);

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch favorites', message: error.message });
  }
});

// POST /api/v1/favorites/:restaurantId
router.post('/:restaurantId', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const restaurantId = parseInt(req.params.restaurantId, 10);
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

    const { error } = await supabase
      .from('favorites')
      .upsert({ user_id: user.id, restaurant_id: restaurantId });

    if (error) throw error;
    res.status(201).json({ status: 'favorited' });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to add favorite', message: error.message });
  }
});

// DELETE /api/v1/favorites/:restaurantId
router.delete('/:restaurantId', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const restaurantId = parseInt(req.params.restaurantId, 10);
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

    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId);

    res.json({ status: 'unfavorited' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove favorite', message: error.message });
  }
});

export default router;
