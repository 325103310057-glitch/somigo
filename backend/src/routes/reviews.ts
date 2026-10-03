import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { requireFirebaseAuth } from '../middleware/auth';
import { getSupabase } from '../db/supabase';

const router = Router();

// GET /api/v1/restaurants/:id/reviews
router.get('/:id/reviews', async (req, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.id, 10);
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        review_text,
        restaurant_reply,
        created_at,
        users (
          full_name,
          profile_image_url
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reviews', message: error.message });
  }
});

// POST /api/v1/restaurants/:id/reviews
router.post('/:id/reviews', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const restaurantId = parseInt(req.params.id, 10);
    const { orderId, rating, reviewText } = req.body;
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

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        restaurant_id: restaurantId,
        user_id: user.id,
        order_id: orderId,
        rating,
        review_text: reviewText
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to submit review', message: error.message });
  }
});

export default router;
