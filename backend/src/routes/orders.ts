import { Router, Response } from 'express';
import { AuthenticatedRequest, PlaceOrderDto } from '../types';
import { requireFirebaseAuth } from '../middleware/auth';
import { OrderService } from '../services/orderService';
import { getSupabase } from '../db/supabase';

const router = Router();

// POST /api/v1/orders
router.post('/', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const dto: PlaceOrderDto = req.body;

    if (!dto.restaurantId) {
      res.status(400).json({ error: 'restaurantId is required' });
      return;
    }

    const order = await OrderService.createOrder(firebaseUid, dto);
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(400).json({
      error: 'OrderPlacementFailed',
      message: error.message || 'Unable to place order at this time.'
    });
  }
});

// GET /api/v1/orders
router.get('/', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.firebaseUser!.uid;
    const orders = await OrderService.listUserOrders(firebaseUid);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
  }
});

// GET /api/v1/orders/:id
router.get('/:id', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const tracking = await OrderService.getOrderTracking(id);
    res.json(tracking);
  } catch (error: any) {
    res.status(404).json({ error: 'Order not found', message: error.message });
  }
});

// GET /api/v1/orders/:id/tracking
router.get('/:id/tracking', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const tracking = await OrderService.getOrderTracking(id);
    res.json(tracking);
  } catch (error: any) {
    res.status(404).json({ error: 'Tracking unavailable', message: error.message });
  }
});

// POST /api/v1/orders/:id/verify-delivery
router.post('/:id/verify-delivery', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { pin } = req.body;
    if (!pin) {
      res.status(400).json({ error: 'Delivery pin is required' });
      return;
    }
    const success = await OrderService.verifyDeliveryPin(id, pin);
    if (!success) {
      res.status(400).json({ error: 'Invalid delivery pin', status: 'rejected' });
      return;
    }
    res.json({ status: 'delivered', message: 'Order marked as successfully delivered' });
  } catch (error: any) {
    res.status(500).json({ error: 'Delivery verification error', message: error.message });
  }
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', requireFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const supabase = getSupabase();
    await supabase
      .from('orders')
      .update({ order_status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', id);
    res.json({ status: 'cancelled', message: 'Order was successfully cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: 'Cancellation failed', message: error.message });
  }
});

export default router;
