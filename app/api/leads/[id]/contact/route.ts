// app/api/leads/[id]/contact/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { addDaysBerlinLocalDate } from '@/lib/time/berlin'

export const runtime = 'nodejs'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const supabase = getAdminClient()

  const followUpAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  const followUpDate = addDaysBerlinLocalDate(5)
  const nowIso = new Date().toISOString()

  try {
    // Primary attempt: update with status 'no_response' (matches your live schema)
    let { error } = await supabase
      .from('leads')
      .update({
        contact_set_at: nowIso,
        contacted_at: nowIso,
        follow_up_at: followUpAt,
        follow_up_date: followUpDate,
        status: 'no_response'
      })
      .eq('id', id)

    if (error) {
      const msg = String(error.message || '')
      const code = String((error as any).code || '')
      const isEnumProblem = code === '22P02' || /invalid input value for enum/i.test(msg)

      if (isEnumProblem) {
        // Fallback: perform the update without touching status
        const f2 = await supabase
          .from('leads')
          .update({
            contact_set_at: nowIso,
            contacted_at: nowIso,
            follow_up_at: followUpAt,
            follow_up_date: followUpDate,
          })
          .eq('id', id)
        if (f2.error) throw f2.error
      } else {
        throw error
      }
    }

    return NextResponse.json({ ok: true, follow_up_at: followUpAt, follow_up_date: followUpDate })
  } catch (err: any) {
    console.error('Kontakt-Fehler', { id, err })
    return NextResponse.json({ ok: false, message: err?.message ?? 'Kontakt-Fehler' }, { status: 500 })
  }
}