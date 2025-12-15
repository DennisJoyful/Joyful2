import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

/**
 * Admin-Route zum Nachtragen/Ändern einer Werber↔Bewerber-Beziehung.
 * Nutzt vorhandene Tabellen: werber, leads, streamer. Triggert im Anschluss /api/sws/recalc.
 *
 * POST body:
 * {
 *   "creator_id": "tiktok_creator_id",      // Pflicht (Datenwahrheit)
 *   "werber_id": "uuid-oder-slug",          // Pflicht (id der Tabelle 'werber'; alternativ slug via { useSlug: true })
 *   "useSlug": false,                        // optional; wenn true, wird werber über slug aufgelöst
 *   "override": false                        // optional; wenn true, wird first-touch überschrieben
 * }
 */
export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supa.auth.getUser()

  // Admin-Gate (profiles.role === 'admin')
  const { data: prof, error: profErr } = await supa
    .from('profiles')
    .select('role')
    .eq('user_id', user?.id ?? '')
    .maybeSingle()

  if (profErr || !prof || prof.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const creator_id = String(body.creator_id ?? '').trim()
  const werberKey = String(body.werber_id ?? '').trim()
  const useSlug = !!body.useSlug
  const override = !!body.override

  if (!creator_id || !werberKey) {
    return NextResponse.json({ error: 'creator_id and werber_id are required' }, { status: 400 })
  }

  // Resolve werber id (either by id or slug)
  let werber_id = werberKey
  if (useSlug) {
    const w = await supabaseAdmin
      .from('werber')
      .select('id')
      .eq('slug', werberKey)
      .maybeSingle()
    if (w.error) {
      return NextResponse.json({ error: 'Failed to resolve werber by slug', details: w.error.message }, { status: 500 })
    }
    if (!w.data) {
      return NextResponse.json({ error: 'Werber with given slug not found' }, { status: 404 })
    }
    werber_id = w.data.id
  }

  // Ensure streamer row exists (so Recalc findet join_date/handle etc.)
  const st = await supabaseAdmin
    .from('streamer')
    .select('creator_id, joined_at')
    .eq('creator_id', creator_id)
    .maybeSingle()
  if (st.error) {
    return NextResponse.json({ error: 'Failed to read streamer', details: st.error.message }, { status: 500 })
  }
  if (!st.data) {
    const ins = await supabaseAdmin.from('streamer').insert({ creator_id }).select('creator_id').maybeSingle()
    if (ins.error) {
      return NextResponse.json({ error: 'Failed to create streamer placeholder', details: ins.error.message }, { status: 500 })
    }
  }

  // Leads: first touch respektieren, außer override=true
  // Annahme: leads hat mindestens (creator_id, werber_id, status, source, joined_at?)
  // Wir markieren status='joined' und source='admin'.
  // Wenn schon ein Lead für diesen creator existiert:
  const existing = await supabaseAdmin
    .from('leads')
    .select('id, werber_id, status')
    .eq('creator_id', creator_id)
    .order('created_at', { ascending: true })
    .limit(1)

  if (existing.error) {
    return NextResponse.json({ error: 'Failed to read leads', details: existing.error.message }, { status: 500 })
  }

  if (existing.data && existing.data.length > 0 && !override) {
    // First touch – keine Änderung
    return NextResponse.json({
      status: 'exists_first_touch_kept',
      lead_id: existing.data[0].id,
      message: 'Existing lead kept (first touch). Use override=true to change.'
    })
  }

  if (existing.data && existing.data.length > 0 && override) {
    // Update existing first lead
    const upd = await supabaseAdmin
      .from('leads')
      .update({ werber_id, status: 'joined', source: 'admin' })
      .eq('id', existing.data[0].id)
      .select('id')
      .maybeSingle()
    if (upd.error) {
      return NextResponse.json({ error: 'Failed to update lead', details: upd.error.message }, { status: 500 })
    }
  } else {
    // Create new lead
    const ins = await supabaseAdmin
      .from('leads')
      .insert({ creator_id, werber_id, status: 'joined', source: 'admin' })
      .select('id')
      .maybeSingle()
    if (ins.error) {
      return NextResponse.json({ error: 'Failed to insert lead', details: ins.error.message }, { status: 500 })
    }
  }

  // Trigger Recalc
  try {
    const resp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/sws/recalc`, { method: 'POST' })
    if (!resp.ok) {
      return NextResponse.json({
        status: 'updated_but_recalc_warning',
        warning: 'Lead saved, but /api/sws/recalc failed; please run recalculation manually.',
        http_status: resp.status
      }, { status: 207 })
    }
  } catch (e: any) {
    return NextResponse.json({
      status: 'updated_but_recalc_warning',
      warning: 'Lead saved, but calling /api/sws/recalc threw an error; please run recalculation manually.',
      error: String(e?.message ?? e)
    }, { status: 207 })
  }

  return NextResponse.json({ status: 'ok' })
}
