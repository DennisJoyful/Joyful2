// app/api/manager/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json([], { status: 200 })

    const { data: prof } = await supabase
      .from('profiles')
      .select('manager_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (prof?.role === 'admin') {
      const { data, error } = await supabaseAdmin
        .from('leads_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data ?? [])
    }

    const { data: mgr } = await supabaseAdmin
      .from('managers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!mgr?.id) return NextResponse.json([], { status: 200 })

    const { data, error } = await supabaseAdmin
      .from('leads_view')
      .select('*')
      .eq('manager_id', mgr.id)
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

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

    const { data: mgrExisting, error: mgrErr } = await supabaseAdmin
      .from('managers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (mgrErr) return NextResponse.json({ error: mgrErr.message }, { status: 500 })

    let managerId = mgrExisting?.id as string | undefined
    if (!managerId) {
      const { data: up, error: upErr } = await supabaseAdmin
        .from('managers')
        .upsert([{ user_id: user.id, email, name }], { onConflict: 'user_id' })
        .select('id')
        .single()
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
      managerId = up?.id
    }
    if (!managerId) return NextResponse.json({ error: 'manager mapping failed' }, { status: 500 })

    // Set initial status = 'new'; DB trigger will flip to 'no_response' when contact_date gets set later.
    const payload: any = {
      handle,
      source: 'manual',
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
