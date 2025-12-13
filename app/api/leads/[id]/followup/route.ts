// app/api/leads/[id]/followup/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const supabase = getAdminClient()
  try {
    // Try RPC if present
    const rpc = await supabase.rpc('increment_follow_up', { lead_id_input: id })
    if (rpc.error) {
      // Fallback: do it inline based on current value
      const current = await supabase.from('leads').select('follow_up_count').eq('id', id).single()
      if (current.error) throw current.error
      const next = (current.data?.follow_up_count ?? 0) + 1
      const upd = await supabase.from('leads').update({
        follow_up_count: next,
        last_follow_up_at: new Date().toISOString()
      }).eq('id', id)
      if (upd.error) throw upd.error
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Follow-Up-Fehler', { id, err })
    return NextResponse.json({ ok: false, message: err?.message ?? 'Follow-Up-Fehler' }, { status: 500 })
  }
}