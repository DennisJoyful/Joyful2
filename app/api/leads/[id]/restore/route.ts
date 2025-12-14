// app/api/leads/[id]/restore/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const supabase = getAdminClient()
  try {
    const { error } = await supabase.from('leads').update({ archived_at: null }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Wiederherstellen-Fehler', { id, err })
    return NextResponse.json({ ok: false, message: err?.message ?? 'Wiederherstellen-Fehler' }, { status: 500 })
  }
}