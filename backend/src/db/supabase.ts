import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    console.warn(
      '⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment. Database calls will fail until configured.'
    );
  }

  supabaseClient = createClient(
    config.supabase.url || 'https://placeholder.supabase.co',
    config.supabase.serviceRoleKey || 'placeholder_service_role_key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return supabaseClient;
}
