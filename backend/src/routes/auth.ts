import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from '../types';
import { requireFirebaseAuth } from '../middleware/auth';
import { UserService } from '../services/userService';
import { getSupabase } from '../db/supabase';

const router = Router();

// GET /api/v1/me (or /api/v1/auth/me)
router.get(['/me', '/auth/me'], requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUser = req.firebaseUser!;
    const user = await UserService.getUserByFirebaseUid(firebaseUser.uid);
    if (!user) {
      // Sync if first time
      const synced = await UserService.syncFirebaseUser(firebaseUser);
      res.json(synced);
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile', message: error.message });
  }
});

// POST /api/v1/users/sync
router.post('/users/sync', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUser = req.firebaseUser!;
    const { displayName, photoUrl, phoneNumber } = req.body;
    const user = await UserService.syncFirebaseUser(firebaseUser, {
      displayName,
      photoUrl,
      phoneNumber
    });
    res.status(200).json({
      status: 'success',
      user
    });
  } catch (error: any) {
    res.status(500).json({ error: 'User sync failed', message: error.message });
  }
});

// POST /api/v1/auth/firebase
// Dual support: can be called with Bearer token OR with { idToken } in body
router.post('/auth/firebase', async (req: AuthenticatedRequest, res: Response) => {
  try {
    let idToken = req.body.idToken || req.body.id_token;
    if (!idToken && req.headers.authorization?.startsWith('Bearer ')) {
      idToken = req.headers.authorization.split('Bearer ')[1].trim();
    }

    if (!idToken) {
      res.status(401).json({ error: 'Unauthorized', message: 'Missing Firebase ID token' });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    const user = await UserService.syncFirebaseUser(decodedToken, {
      displayName: req.body.displayName || req.body.display_name,
      photoUrl: req.body.photoUrl || req.body.photo_url,
      phoneNumber: req.body.phoneNumber || req.body.phone_number
    });

    res.status(200).json({
      accessToken: idToken,
      tokenType: 'bearer',
      userId: user.id || 1,
      firebaseUid: user.firebaseUid,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl
    });
  } catch (error: any) {
    console.error('Firebase authentication route error:', error);
    res.status(401).json({ error: 'Authentication failed', message: error.message });
  }
});

// POST /api/v1/auth/logout
router.post('/auth/logout', (_req, res) => {
  res.status(200).json({ message: 'Logged out successfully', status: 'ok' });
});

// GET /api/v1/profile
router.get('/profile', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  const firebaseUser = req.firebaseUser!;
  const user = await UserService.getUserByFirebaseUid(firebaseUser.uid);
  res.json(user || { firebaseUid: firebaseUser.uid, email: firebaseUser.email });
});

// PATCH /api/v1/profile
router.patch('/profile', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUser = req.firebaseUser!;
    const { fullName, phoneNumber, profileImageUrl } = req.body;
    const supabase = getSupabase();

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        profile_image_url: profileImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('firebase_uid', firebaseUser.uid)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ status: 'updated', user: updated });
  } catch (error: any) {
    res.status(400).json({ error: 'Update failed', message: error.message });
  }
});

export default router;
