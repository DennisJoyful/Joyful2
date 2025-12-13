// app/dashboard/manager/page.tsx (ULTRA SAFE: legacy-first, source-merge best-effort)
import { getAdminClient } from '@/lib/supabase/admin'
import LeadActions from '@/components/leads/LeadActions'
import LeadStatusSelect from '@/components/leads/LeadStatusSelect'
import Link from 'next/link'
import LeadLiveBadge from '@/components/LeadLiveBadge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type LeadBase = {
  id: string
  handle?: string | null
  status?: string | null
  follow_up_at?: string | null
  follow_up_date?: string | null
  created_at?: string | null
  archived_at?: string | null
}

type LeadSourceRow = { id: string; lead_source?: string | null; source?: string | null }

async function fetchLegacy(): Promise<LeadBase[]> {
  const sb = getAdminClient()
  const { data, error } = await sb
    .from('leads')
    .select('id, handle, status, follow_up_at, follow_up_date, created_at, archived_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Failed to fetch leads (legacy):', error)
    return []
  }
  return data || []
}

async function fetchSources(): Promise<Record<string, string | null>> {
  const sb = getAdminClient()
  try {
    // fetch ONLY ids + possible source columns; if this fails, ignore
    const { data, error } = await sb
      .from('leads')
      .select('id, lead_source, source')
      .is('archived_at', null)
    if (error) throw error
    const map: Record<string, string | null> = {}
    for (const row of (data || []) as LeadSourceRow[]) {
      map[row.id] = (row.lead_source ?? row.source ?? null) as string | null
    }
    return map
  } catch (e) {
    console.warn('Skipping source merge (non-fatal):', e)
    return {}
  }
}

function SourceBadge({ s }: { s: string | null | undefined }){
  const label = s ?? '—'
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 border">{label}</span>
}

export default async function ManagerLeadsPage() {
  // ALWAYS load legacy list first – this never includes risky columns
  const legacy = await fetchLegacy()

  // Best-effort: try to merge source values by id; failure is NON-FATAL
  const sourceMap = await fetchSources()

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <Link className="text-sm text-blue-600 hover:underline" href="/dashboard/manager/leads/create">Lead anlegen</Link>
      </div>

      {legacy.length === 0 ? (
        <div className="text-gray-500">Keine Leads gefunden.</div>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-[1000px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="px-3 py-2 text-left">Handle</th>
                <th className="px-3 py-2 text-left">Live</th>
                <th className="px-3 py-2 text-left">Lead-Status</th>
                <th className="px-3 py-2 text-left">Quelle</th>
                <th className="px-3 py-2 text-left">Follow‑Up (Date)</th>
                <th className="px-3 py-2 text-left">Follow‑Up (At)</th>
                <th className="px-3 py-2 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {legacy.map((l) => (
                <tr key={l.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2">
                    {l.handle ? (
                      <a className="text-blue-600 hover:underline" href={`https://www.tiktok.com/@${l.handle}`} target="_blank" rel="noreferrer">
                        @{l.handle}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2"><LeadLiveBadge handle={l.handle ?? ''} /></td>
                  <td className="px-3 py-2"><LeadStatusSelect id={l.id} value={l.status ?? 'new'} /></td>
                  <td className="px-3 py-2"><SourceBadge s={sourceMap[l.id] ?? null} /></td>
                  <td className="px-3 py-2">{l.follow_up_date || '—'}</td>
                  <td className="px-3 py-2">{l.follow_up_at ? new Date(l.follow_up_at).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2"><LeadActions id={l.id} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
