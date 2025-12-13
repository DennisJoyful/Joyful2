// lib/adminSupabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE env for admin client');
  }
  return createClient<Database>(url, serviceKey);
}
