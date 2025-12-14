// Tiny diag endpoint to inspect current session uid and profile mapping (no secrets).
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id || null

  let prof = null
  if (uid) {
    const { data } = await s.from('profiles').select('user_id, role, manager_id').eq('user_id', uid).maybeSingle()
    prof = data || null
  }

  return NextResponse.json({ uid, profile: prof })
}
