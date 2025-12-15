import { NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

type Row = {
  creator_id: string
  handle?: string | null
  period_month?: string | null
  joined_at?: string | null
  days_valid?: number | null
  hours_streamed?: number | null
  diamonds?: number | null
  graduation?: string | null
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseExcelDate(x: any): Date | null {
  if (x == null || x === '') return null
  if (typeof x === 'number') {
    // Excel serial to JS date (UTC-ish)
    const d = new Date(Math.round((x - 25569) * 86400 * 1000))
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(x).trim()
  const try1 = new Date(s)
  if (!isNaN(try1.getTime())) return try1
  // Fallback: YYYY-MM, YYYY/MM, MM.YYYY, 'Nov 2025'
  const m = s.match(/^(\d{4})[-\/.](\d{1,2})$/)
  if (m) {
    const y = parseInt(m[1], 10)
    const mo = parseInt(m[2], 10) - 1
    const d = new Date(Date.UTC(y, mo, 1))
    return d
  }
  return null
}

function toYYYYMM(d: Date | null): string | null {
  if (!d) return null
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

function parseHours(x: any): number | null {
  if (x == null || x === '') return null
  if (typeof x === 'number') return x
  const s = String(x).trim()
  // "15:30" → 15.5
  const m = s.match(/^(\d{1,3}):([0-5]?\d)$/)
  if (m) {
    const h = parseInt(m[1], 10)
    const min = parseInt(m[2], 10)
    return h + min / 60
  }
  const n = Number(s.replace(',', '.'))
  return isNaN(n) ? null : n
}

function parseIntSafe(x: any): number | null {
  if (x == null || x === '') return null
  const n = Number(String(x).replace(',', '.'))
  return isNaN(n) ? null : Math.trunc(n)
}

function parseNumber(x: any): number | null {
  if (x == null || x === '') return null
  const n = Number(String(x).replace(',', '.'))
  return isNaN(n) ? null : n
}

function detectHeaderRow(sheet: XLSX.WorkSheet): number {
  // Find the first row that contains something like "Creator*in-ID"
  const range = XLSX.utils.decode_range(sheet['!ref'] as string)
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 20); r++) {
    const rowVals: string[] = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })]
      rowVals.push(cell ? String(cell.v) : '')
    }
    const joined = rowVals.join(' ').toLowerCase()
    if (joined.includes('creator') && (joined.includes('id') || joined.includes('anmeldename'))) {
      return r
    }
  }
  return range.s.r // fallback first row
}

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded (expected form-data field "file").' }, { status: 400 })
  }

  const ab = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(ab), { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const headerRow = detectHeaderRow(ws)

  // Read rows with custom header row
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][]
  const headersRow = (json[headerRow] || []).map((h) => normalizeHeader(String(h ?? '')))

  const mapIdx = (candidates: string[]) => {
    const idx = headersRow.findIndex((h) =>
      candidates.some((cand) => h.includes(cand))
    )
    return idx >= 0 ? idx : -1
  }

  // Column indices (German TikTok + fallbacks)
  const idxCreatorId = mapIdx(['creatorin-id', 'creator id', 'creatorid', 'id'])
  const idxHandle = mapIdx(['creatorinnen anmeldename', 'anmeldename', 'handle', 'username', 'name'])
  const idxPeriod = mapIdx(['datenzeitraum', 'zeitraum', 'monat', 'month', 'period'])
  const idxJoin = mapIdx(['beitrittszeit', 'beitritt', 'join', 'beigetreten'])
  const idxHours = mapIdx(['live-dauer', 'live dauer', 'hours', 'stunden'])
  const idxDays = mapIdx(['gültige live-gehen-tage', 'gueltige live-gehen-tage', 'tage', 'days'])
  const idxDiamonds = mapIdx(['diamanten', 'diamonds'])
  const idxGraduation = mapIdx(['graduierungsstatus', 'graduation'])

  if (idxCreatorId < 0) {
    return NextResponse.json({ error: 'Header with Creator*in-ID not found.' }, { status: 400 })
  }

  const rows: Row[] = []
  for (let r = headerRow + 1; r < json.length; r++) {
    const row = json[r] || []
    const creatorRaw = row[idxCreatorId]
    if (creatorRaw == null || String(creatorRaw).trim() === '') continue

    const creator_id = String(creatorRaw).trim()
    const handle = idxHandle >= 0 ? String(row[idxHandle] ?? '').trim() || null : null
    const periodDate = idxPeriod >= 0 ? parseExcelDate(row[idxPeriod]) : null
    const period_month = toYYYYMM(periodDate)

    const joined_at_dt = idxJoin >= 0 ? parseExcelDate(row[idxJoin]) : null
    const joined_at = joined_at_dt ? joined_at_dt.toISOString() : null

    const hours_streamed = idxHours >= 0 ? parseHours(row[idxHours]) : null
    const days_valid = idxDays >= 0 ? parseIntSafe(row[idxDays]) : null
    const diamonds = idxDiamonds >= 0 ? parseNumber(row[idxDiamonds]) : null
    const graduation = idxGraduation >= 0 ? String(row[idxGraduation] ?? '').trim() || null : null

    rows.push({ creator_id, handle, period_month, joined_at, hours_streamed, days_valid, diamonds, graduation })
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data rows detected after header.' }, { status: 400 })
  }

  // 1) Upsert streamer (creator_id + latest handle)
  const streamerUpserts = rows.map(r => ({
    creator_id: r.creator_id,
    handle: r.handle ?? undefined
  }))

  let up1 = await supabaseAdmin
    .from('streamer')
    .upsert(streamerUpserts, { onConflict: 'creator_id' })
    .select('creator_id')

  if (up1.error) {
    return NextResponse.json({ error: 'Failed to upsert streamer', details: up1.error.message }, { status: 500 })
  }

  // 2) Set join_date only where null
  const joinUpdates = rows.filter(r => !!r.joined_at).map(r => ({
    creator_id: r.creator_id,
    joined_at: r.joined_at!
  }))

  if (joinUpdates.length > 0) {
    // Update where current join_date is null
    // Using single query per row might be heavy; attempt bulk UPSERT into a temp table is overkill here.
    for (const ju of joinUpdates) {
      const res = await supabaseAdmin
        .from('streamer')
        .update({ joined_at: ju.joined_at })
        .is('joined_at', null)
        .eq('creator_id', ju.creator_id)
      if (res.error) {
        return NextResponse.json({ error: 'Failed to set join_date', details: res.error.message }, { status: 500 })
      }
    }
  }

  // 3) Upsert stream_stats per (creator_id, period_month)
  const statsUpserts = rows
    .filter(r => r.period_month) // must have period
    .map(r => ({
      creator_id: r.creator_id,
      period_month: r.period_month,
      days_valid: r.days_valid ?? null,
      hours_streamed: r.hours_streamed ?? null,
      diamonds: r.diamonds ?? null,
      graduation: r.graduation ?? null
    }))

  if (statsUpserts.length > 0) {
    const up3 = await supabaseAdmin
      .from('stream_stats')
      .upsert(statsUpserts, { onConflict: 'creator_id,period_month' })
    if (up3.error) {
      return NextResponse.json({ error: 'Failed to upsert stream_stats', details: up3.error.message }, { status: 500 })
    }
  }

  // 4) Trigger SWS recalculation (call existing route)
  try {
    const proto = headers().get('x-forwarded-proto') ?? 'http'
    const host = headers().get('host') ?? 'localhost:3000'
    const cookieHeader = cookies().getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const resp = await fetch(`${proto}://${host}/api/sws/recalc`, {
      method: 'POST',
      headers: { 'cookie': cookieHeader }
    })
    if (!resp.ok) {
      // Non-fatal: we still imported. Return a warning.
      return NextResponse.json({
        imported_rows: rows.length,
        warning: 'Imported OK, but /api/sws/recalc returned non-OK status. Please run recalculation manually.',
        recalculation_status: resp.status
      }, { status: 207 })
    }
  } catch (e: any) {
    return NextResponse.json({
      imported_rows: rows.length,
      warning: 'Imported OK, but failed to call /api/sws/recalc. Please run recalculation manually.',
      error: String(e?.message ?? e)
    }, { status: 207 })
  }

  return NextResponse.json({ imported_rows: rows.length, status: 'ok' })
}
