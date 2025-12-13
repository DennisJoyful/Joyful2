// app/api/apply/[managerSlug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { managerSlug: string } }) {
  try {
    const { handle, contact } = await req.json().catch(() => ({ handle: '', contact: null }))
    const cleanHandle = String(handle || '').trim()
    if (!cleanHandle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

    // resolve manager by slug
    const { data: mgr, error: mgrErr } = await supabaseAdmin
      .from('managers')
      .select('id')
      .eq('code', params.managerSlug)
      .maybeSingle()
    if (mgrErr) return NextResponse.json({ error: mgrErr.message }, { status: 500 })
    if (!mgr?.id) return NextResponse.json({ error: 'invalid manager slug' }, { status: 404 })

    const payload: any = {
      handle: cleanHandle,
      source: 'application',
      status: 'neu',
      contact_date: contact || null,
      manager_id: mgr.id,
    }
    const { data, error } = await supabaseAdmin.from('leads').insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
