// app/api/manager/leads/extra/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sb = getAdminClient()
  // Your schema: column name is 'source' (type: lead_source). Read exactly that.
  const selects = [
    'id, source, notes, utm, extras',
    'id, source, notes, utm',
    'id, source',
  ]
  for (const sel of selects) {
    const { data, error } = await sb.from('leads').select(sel).is('archived_at', null)
    if (!error && Array.isArray(data)) {
      return NextResponse.json(
        data.map((r: any) => ({
          id: r.id,
          source: r.source ?? null,
          notes: r.notes ?? null,
          utm: r.utm ?? null,
          extras: r.extras ?? null,
        })),
        { status: 200 }
      )
    }
  }
  // Non-fatal: return empty extras
  return NextResponse.json([], { status: 200 })
}
