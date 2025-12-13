// lib/supabaseClient.ts
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

/**
 * Export BOTH named and default, so pages that do
 *   import { supabase } from '@/lib/supabaseClient'
 * and pages that do
 *   import supabase from '@/lib/supabaseClient'
 * will both work.
 */
export const supabase = createClientComponentClient<Database>();
export default supabase;
