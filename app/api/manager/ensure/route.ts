// app/api/manager/ensure/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Ensure the current authenticated user has a managers-row (idempotent)
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Try to find existing manager row by user_id
  const { data: existing, error: selErr } = await supabaseAdmin
    .from('managers')
    .select('id, name, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, id: existing.id }, { status: 200 })
  }

  // Create a new manager row
  const email = user.email || ''
  const name = email ? email.split('@')[0] : 'Manager'

  const { data: inserted, error: insErr } = await supabaseAdmin
    .from('managers')
    .insert({ user_id: user.id, name })
    .select('id')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: inserted?.id }, { status: 200 })
}
