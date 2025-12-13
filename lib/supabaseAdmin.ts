// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceRole } from './env'

const url = getSupabaseUrl()
const serviceRole = getSupabaseServiceRole()

export const supabaseAdmin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
})
