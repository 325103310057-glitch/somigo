import { Router, Response } from 'express';
import { AuthenticatedRequest, CreateAddressDto } from '../types';
import { requireFirebaseAuth } from '../middleware/auth';
import { getSupabase } from '../db/supabase';

const router = Router();

// GET /api/v1/addresses
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
      .from('customer_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch addresses', message: error.message });
  }
});

// POST /api/v1/addresses
router.post('/', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const dto: CreateAddressDto = req.body;
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
      .from('customer_addresses')
      .insert({
        user_id: user.id,
        address_line: dto.addressLine,
        apartment: dto.apartment,
        landmark: dto.landmark,
        city: dto.city,
        state: dto.state,
        postal_code: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address_type: dto.addressType || 'Home',
        is_default: dto.isDefault ?? false
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to save address', message: error.message });
  }
});

// DELETE /api/v1/addresses/:id
router.delete('/:id', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const supabase = getSupabase();
    await supabase.from('customer_addresses').delete().eq('id', id);
    res.json({ status: 'deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete address', message: error.message });
  }
});

export default router;
