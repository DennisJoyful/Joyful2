// lib/env.ts
export function getSupabaseUrl() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  return url
}
export function getSupabaseServiceRole() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE')
  return key
}
