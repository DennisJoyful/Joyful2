// app/api/manager/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  // return yyyy-mm-dd
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${dd}`
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json().catch(() => ({} as any))
    const next: any = {}

    if (body.status !== undefined) {
      next.status = String(body.status)
    }
    if (body.contact_date !== undefined) {
      const cd = String(body.contact_date).slice(0,10) // yyyy-mm-dd
      next.contact_date = cd
      // auto follow-up in +5 days if not explicitly set
      next.follow_up_date = body.follow_up_date ? String(body.follow_up_date).slice(0,10) : addDays(cd, 5)
    }
    if (Object.keys(next).length === 0) {
      return NextResponse.json({ error: 'No changes' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(next)
      .eq('id', id)
      .select('id, status, contact_date, follow_up_date, follow_up_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 200 })
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
