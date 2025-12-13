// app/api/manager/leads/extra/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sb = getAdminClient()
  // Try full extra set first; progressively degrade if schema/roles differ
  const tries = [
    'id, lead_source, source, notes, utm, extras',
    'id, lead_source, source, notes, utm',
    'id, lead_source, source',
  ]
  for (const sel of tries) {
    const { data, error } = await sb.from('leads').select(sel).is('archived_at', null)
    if (!error && data) {
      // coalesce lead_source/source into `source` for client
      const out = data.map((r:any) => ({
        id: r.id,
        source: r.lead_source ?? r.source ?? null,
        notes: r.notes ?? null,
        utm: r.utm ?? null,
        extras: r.extras ?? null,
      }))
      return NextResponse.json(out, { status: 200 })
    }
  }
  // If everything fails, return empty extras but do not break UI
  return NextResponse.json([], { status: 200 })
}
