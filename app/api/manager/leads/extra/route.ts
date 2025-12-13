// app/api/manager/leads/extra/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'  // service role: bypass RLS reliably

export const dynamic = 'force-dynamic'

export async function GET() {
  // Always use service role for this admin-only, server-side API to avoid RLS surprises.
  // Read exactly the column name 'source' (enum lead_source) plus optional notes/utm/extras.
  const selects = [
    'id, source, notes, utm, extras',
    'id, source, notes, utm',
    'id, source'
  ] as const

  for (const sel of selects) {
    const { data, error } = await supabaseAdmin.from('leads').select(sel).is('archived_at', null)
    if (!error && Array.isArray(data)) {
      const out = data.map((r: any) => ({
        id: r.id,
        source: r.source ?? null,
        notes: r.notes ?? null,
        utm: r.utm ?? null,
        extras: r.extras ?? null
      }))
      return NextResponse.json(out, { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }
  }

  // If even the minimal select fails, return an empty array (non-blocking on the UI).
  return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
