// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing'
    const supabase = getAdminClient()
    const { data, error } = await supabase.from('leads').select('id').limit(1)
    if (error) throw error
    return NextResponse.json({ ok: true, env: { url, service_role_key: key }, db_ok: true, rows_seen: data?.length ?? 0 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message ?? 'unknown error' }, { status: 500 })
  }
}