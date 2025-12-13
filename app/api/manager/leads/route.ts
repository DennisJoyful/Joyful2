// app/api/manager/leads/route.ts (ensure inserts use 'source')
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const handle = String(body?.handle || '').trim()
    const contact_date = body?.contact_date || null
    if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

    // Ensure manager mapping (idempotent)
    const email = user.email || ''
    const name = email ? email.split('@')[0] : 'Manager'

    const { data: mgrExisting } = await supabaseAdmin
      .from('managers')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle()

    let managerId = mgrExisting?.id
    if (!managerId) {
      const { data: created } = await supabaseAdmin
        .from('managers')
        .insert({ user_id: user.id, name: name })
        .select('id')
        .single()
      managerId = created?.id
    }

    const payload: any = {
      handle,
      source: 'manual', // write into column 'source' (type: lead_source)
      status: 'new',
      contact_date,
      manager_id: managerId,
    }

    const { data, error } = await supabaseAdmin.from('leads').insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
