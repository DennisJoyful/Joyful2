// app/api/leads/update/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

type Body = {
  id: string
  // optional fields we allow to update
  status?: string | null
  notes?: string | null
  contacted_at?: string | null
  follow_up_at?: string | null
  follow_up_date?: string | null
  archived_at?: string | null
  last_follow_up_at?: string | null
  follow_up_sent?: string | null
  follow_up_sent_count?: number | null
  follow_up_count?: number | null
  contact_date?: string | null
}

const ALLOWED = new Set([
  'status','notes','contacted_at','follow_up_at','follow_up_date',
  'archived_at','last_follow_up_at','follow_up_sent','follow_up_sent_count',
  'follow_up_count','contact_date'
])

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    if (!body?.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // who is calling?
    const s = supabaseServer()
    const { data: me } = await s.auth.getUser()
    const uid = me?.user?.id
    if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // find caller manager_id
    const { data: prof, error: profErr } = await s.from('profiles').select('manager_id, role').eq('user_id', uid).maybeSingle()
    if (profErr) return NextResponse.json({ error: 'profile read failed' }, { status: 500 })
    const callerManagerId = prof?.manager_id || null
    const isAdmin = prof?.role === 'admin'

    const admin = getAdminClient()

    // load target lead to verify scope
    const { data: lead, error: leadErr } = await admin.from('leads').select('id, manager_id').eq('id', body.id).single()
    if (leadErr || !lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 })

    if (!isAdmin && (!callerManagerId || lead.manager_id !== callerManagerId)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // build safe update
    const patch: Record<string, any> = {}
    for (const [k,v] of Object.entries(body)) {
      if (k === 'id') continue
      if (ALLOWED.has(k)) patch[k] = v
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: 'no updatable fields in payload' }, { status: 400 })
    }

    const { error: upErr } = await admin.from('leads').update(patch).eq('id', body.id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'unexpected' }, { status: 500 })
  }
}
