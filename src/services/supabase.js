import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;

/**
 * Singleton Supabase client for frontend use (Realtime WebSocket + direct DB).
 * Returns null if env vars are not configured.
 */
export function getSupabaseClient() {
  if (!client && supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return client;
}
