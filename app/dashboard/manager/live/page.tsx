// app/dashboard/manager/live/page.tsx
import { getAdminClient } from '@/lib/supabase/admin'
import LeadActions from '@/components/leads/LeadActions'
import LeadLiveBadge from '@/components/LeadLiveBadge'
import Link from 'next/link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Lead = {
  id: string
  handle?: string | null
  status?: string | null
  follow_up_at?: string | null
  follow_up_date?: string | null
  created_at?: string | null
  archived_at?: string | null
}

async function fetchLeads(): Promise<Lead[]> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('leads')
    .select('id, handle, status, follow_up_at, follow_up_date, created_at, archived_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[manager/live] fetchLeads error:', error)
    return []
  }
  return (data as Lead[]) ?? []
}

export default async function ManagerLeadsLivePage() {
  const leads = await fetchLeads()
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads (mit Live-Badge)</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/manager" className="text-sm underline">Zur Standardliste</Link>
          <Link href="/api/health" className="text-xs underline opacity-70">Health</Link>
          <Link href="/api/debug/leads" className="text-xs underline opacity-70">Debug</Link>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
          Keine Leads gefunden oder Datenzugriff aktuell nicht möglich.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Handle</th>
                <th className="px-3 py-2 text-left">Live</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Follow‑Up (Date)</th>
                <th className="px-3 py-2 text-left">Follow‑Up (At)</th>
                <th className="px-3 py-2 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-3 py-2">{l.handle ?? '—'}</td>
                  <td className="px-3 py-2"><LeadLiveBadge handle={l.handle || ''} /></td>
                  <td className="px-3 py-2">{l.status ?? '—'}</td>
                  <td className="px-3 py-2">{l.follow_up_date ?? '—'}</td>
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