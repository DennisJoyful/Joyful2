// app/api/apply/[managerSlug]/route.ts (lead_source fix)
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request, { params }: { params: { managerSlug: string } }) {
  try {
    const { handle, contact } = await req.json()
    const cleanHandle = String(handle || '').replace(/^@+/, '').trim()
    if (!params?.managerSlug || !cleanHandle) return NextResponse.json({ error: 'bad request' }, { status: 400 })

    const { data: mgr, error: mgrErr } = await supabaseAdmin
      .from('managers')
      .select('id')
      .eq('code', params.managerSlug)
      .maybeSingle()
    if (mgrErr) return NextResponse.json({ error: mgrErr.message }, { status: 500 })
    if (!mgr?.id) return NextResponse.json({ error: 'invalid manager slug' }, { status: 404 })

    const payload: any = {
      handle: cleanHandle,
      lead_source: 'manager',
      status: 'new',
      contact_date: contact || null,
      manager_id: mgr.id,
    }
    const { data, error } = await supabaseAdmin.from('leads').insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
