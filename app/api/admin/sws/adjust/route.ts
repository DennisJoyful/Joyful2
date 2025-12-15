import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/sws/adjust
 * Manuelle Punkteanpassung (Gutschrift/Abzug) für einen Werber.
 * 
 * Body JSON:
 * {
 *   "werber_id": "uuid-oder-slug",   // Pflicht (ID aus 'werber' oder slug via useSlug:true)
 *   "useSlug": false,                // optional: wenn true, werber_id als slug interpretieren
 *   "points": 500,                   // Pflicht (kann negativ sein)
 *   "reason": "Korrektur November",  // Pflicht (im meta_json gespeichert)
 *   "creator_id": "optional",        // optional: Bezug auf bestimmten Bewerber (Creator)
 *   "period_month": "YYYY-MM"        // optional
 * }
 */
export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supa.auth.getUser()

  // Admin-Check
  const { data: prof } = await supa.from('profiles').select('role').eq('user_id', user?.id ?? '').maybeSingle()
  if (prof?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  let { werber_id, useSlug, points, reason, creator_id, period_month } = body as any

  if (!werber_id || points == null || points === '') {
    return NextResponse.json({ error: 'werber_id and points are required' }, { status: 400 })
  }
  points = Number(points)
  if (!Number.isFinite(points) || Math.abs(points) > 10_000_000) {
    return NextResponse.json({ error: 'Invalid points' }, { status: 400 })
  }
  reason = String(reason ?? '').trim()
  if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 })

  // Resolve werber id via slug if requested
  if (useSlug) {
    const w = await supabaseAdmin.from('werber').select('id').eq('slug', werber_id).maybeSingle()
    if (w.error) return NextResponse.json({ error: 'Failed to resolve werber by slug', details: w.error.message }, { status: 500 })
    if (!w.data) return NextResponse.json({ error: 'Werber with given slug not found' }, { status: 404 })
    werber_id = w.data.id
  }

  const meta = {
    reason,
    by_user_id: user?.id ?? null,
    creator_id: creator_id ?? null
  }

  const insert = {
    werber_id,
    creator_id: creator_id ?? null,
    rule_code: 'MANUAL_ADJUSTMENT',
    period_month: period_month ?? null,
    points,
    meta_json: meta
  }

  const ins = await supabaseAdmin.from('sws_events').insert(insert).select('id').maybeSingle()
  if (ins.error) {
    return NextResponse.json({ error: 'Failed to insert manual adjustment', details: ins.error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok', event_id: ins.data?.id ?? null })
}
