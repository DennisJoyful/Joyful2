// app/api/leads/unarchive/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const id = body?.id as string | undefined
    if (!id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 })

    const supabase = getAdminClient()
    const { error } = await supabase
      .from('leads')
      .update({ archived_at: null, archived_by_manager_id: null })
      .eq('id', id)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown_error' }, { status: 200 })
  }
}