import { Router, Request, Response } from 'express';
import { getSupabase } from '../db/supabase';
import { config } from '../config';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'not_configured';
  if (config.supabase.url && config.supabase.serviceRoleKey) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('restaurants').select('id').limit(1);
      dbStatus = error ? 'degraded' : 'connected';
    } catch (e) {
      dbStatus = 'unreachable';
    }
  }

  res.status(200).json({
    status: 'ok',
    service: 'Somi Go API',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

export default router;
