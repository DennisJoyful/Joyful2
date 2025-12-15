import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

function ymAdd(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 + n, 1))
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${yy}-${mm}`
}

function firstFullMonth(joinedAt: string): string {
  const d = new Date(joinedAt)
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  const y = next.getUTCFullYear()
  const m = String(next.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// GET /api/werber/overview
// Auth: role=werber (via profiles)
export async function GET() {
  const supa = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supa.auth.getUser()
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // find werber by user_id
  const w = await supabaseAdmin.from('werber').select('id').eq('user_id', user.id).maybeSingle()
  if (w.error) return NextResponse.json({ error: 'Failed to read werber', details: w.error.message }, { status: 500 })
  if (!w.data) return NextResponse.json({ error: 'Werber not found for user' }, { status: 404 })
  const werber_id = w.data.id

  // leads joined for this werber
  const leads = await supabaseAdmin
    .from('leads')
    .select('creator_id')
    .eq('werber_id', werber_id)
    .eq('status', 'joined')

  if (leads.error) return NextResponse.json({ error: 'Failed to read leads', details: leads.error.message }, { status: 500 })

  const creatorIds = (leads.data ?? []).map(l => l.creator_id).filter(Boolean)
  if (creatorIds.length === 0) return NextResponse.json({ items: [] })

  // streamer base data
  const st = await supabaseAdmin
    .from('streamer')
    .select('creator_id, handle, joined_at')
    .in('creator_id', creatorIds)

  if (st.error) return NextResponse.json({ error: 'Failed to read streamer', details: st.error.message }, { status: 500 })
  const streamer = Object.fromEntries((st.data ?? []).map(s => [s.creator_id, s]))

  // points per creator (events for this werber grouped by creator)
  const ev = await supabaseAdmin
    .from('sws_events')
    .select('creator_id, points')
    .eq('werber_id', werber_id)
    .in('creator_id', creatorIds)

  if (ev.error) return NextResponse.json({ error: 'Failed to read events', details: ev.error.message }, { status: 500 })
  const pointsMap: Record<string, number> = {}
  for (const e of ev.data ?? []) {
    const cid = e.creator_id as string
    if (!pointsMap[cid]) pointsMap[cid] = 0
    pointsMap[cid] += Number(e.points || 0)
  }

  // For each creator compute statuses and reachability
  const items: any[] = []

  for (const cid of creatorIds) {
    const s = streamer[cid]
    const joined_at = s?.joined_at
    const handle = s?.handle ?? null
    if (!joined_at) {
      items.push({ creator_id: cid, handle, joined: false, points: pointsMap[cid] ?? 0, statuses: { note: 'No join date yet' } })
      continue
    }
    const ym1 = firstFullMonth(joined_at)
    const ym2 = ymAdd(ym1, 1)
    const ym3 = ymAdd(ym1, 2)

    const stats = await supabaseAdmin
      .from('stream_stats')
      .select('period_month, days_valid, hours_streamed, diamonds, graduation')
      .eq('creator_id', cid)
      .in('period_month', [ym1, ym2, ym3])

    if (stats.error) return NextResponse.json({ error: 'Failed to read stream_stats', details: stats.error.message }, { status: 500 })

    const byYm: any = {}
    for (const r of stats.data ?? []) byYm[r.period_month as string] = r

    const cond = (ym: string) => {
      const r = byYm[ym]
      return !!r && (Number(r.days_valid ?? 0) >= 7) && (Number(r.hours_streamed ?? 0) >= 15)
    }

    const activeFirst = cond(ym1)
    const active3Consec = cond(ym1) && cond(ym2) && cond(ym3)

    const sumDiamonds = ['ym1','ym2','ym3'].map((k,i)=>byYm[[ym1,ym2,ym3][i]]?.diamonds ?? 0).reduce((a,b)=>a+Number(b),0)

    const now = new Date()
    const currentYm = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}`
    let elapsed = 0
    if (currentYm > ym1) elapsed++
    if (currentYm > ym2) elapsed++
    if (currentYm > ym3) elapsed++
    if (elapsed > 3) elapsed = 3
    const remaining = Math.max(0, 3 - elapsed)

    const need15 = Math.max(0, 15000 - sumDiamonds)
    const need50 = Math.max(0, 50000 - sumDiamonds)

    // simple projection: average diamonds per completed month * remaining
    const completedMonths = [ym1, ym2, ym3].slice(0, elapsed)
    const completedDiamonds = completedMonths.map(m => Number(byYm[m]?.diamonds ?? 0))
    const avg = completedMonths.length ? (completedDiamonds.reduce((a,b)=>a+b,0) / completedMonths.length) : 0
    const projected = avg * remaining

    const possible15k = remaining > 0 && projected >= need15
    const possible50k = remaining > 0 && projected >= need50

    // rookie check: graduation in first full month labeled as 'Anfänger'
    const rookie = String(byYm[ym1]?.graduation ?? '').toLowerCase().startsWith('anf')
    const rookie150k = [ym1, ym2, ym3].some(m => Number(byYm[m]?.diamonds ?? 0) >= 150000) && rookie

    items.push({
      creator_id: cid,
      handle,
      joined: true,
      first_full_month: ym1,
      points: pointsMap[cid] ?? 0,
      statuses: {
        active_first_month_7_15: activeFirst,
        active_three_consecutive: active3Consec,
        diamonds_15k_3m_reached: sumDiamonds >= 15000,
        diamonds_50k_3m_reached: sumDiamonds >= 50000,
        rookie_150k_any_month_within_3m: rookie150k,
        still_possible_15k_in_3m: possible15k,
        still_possible_50k_in_3m: possible50k
      }
    })
  }

  return NextResponse.json({ items })
}
