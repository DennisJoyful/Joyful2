// app/api/manager/ensure/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sc = createServerComponentClient({ cookies })
  const { data: me } = await sc.auth.getUser()
  if (!me?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(url, service)

  // 1) ensure managers row
  const { data: mgr } = await admin.from('managers').select('id').eq('user_id', me.user.id).maybeSingle()
  let managerId = mgr?.id
  if (!managerId) {
    const { data: created, error: insErr } = await admin.from('managers').insert({ user_id: me.user.id, name: me.user.email?.split('@')[0] || 'Manager' }).select('id').single()
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    managerId = created?.id
  }

  // 2) ensure profiles row with role='manager' and manager_id set
  const { data: prof } = await admin.from('profiles').select('user_id, role, manager_id').eq('user_id', me.user.id).maybeSingle()
  if (!prof) {
    const { error: upErr } = await admin.from('profiles').insert({ user_id: me.user.id, role: 'manager', manager_id: managerId })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  } else {
    const updates: any = {}
    if (prof.role !== 'manager') updates.role = 'manager'
    if (!prof.manager_id) updates.manager_id = managerId
    if (Object.keys(updates).length) {
      const { error: upErr } = await admin.from('profiles').update(updates).eq('user_id', me.user.id)
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, manager_id: managerId }, { status: 200 })
}
