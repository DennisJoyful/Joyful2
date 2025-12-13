// app/dashboard/manager/archive/page.tsx
import { getAdminClient } from '@/lib/supabase/admin'
import UnarchiveButton from '@/components/leads/UnarchiveButton'
import Link from 'next/link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Lead = {
  id: string
  handle?: string | null
  status?: string | null
  notes?: string | null
  archived_at?: string | null
  archived_by_manager_id?: string | null
  created_at?: string | null
}

async function fetchArchived(): Promise<Lead[]> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('leads')
    .select('id, handle, status, notes, archived_at, archived_by_manager_id, created_at')
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false })
  if (error) {
    console.error('[archive/page] fetchArchived error:', error)
    return []
  }
  return (data as Lead[]) ?? []
}

export default async function ArchivePage() {
  const data = await fetchArchived()
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Archivierte Leads</h1>
        <Link href="/dashboard/manager" className="text-sm underline">Zurück zur Übersicht</Link>
      </div>

      {data.length === 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
          Keine archivierten Leads gefunden.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Handle</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Archiviert am</th>
                <th className="px-3 py-2 text-left">Notizen</th>
                <th className="px-3 py-2 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-3 py-2">{l.handle ?? '—'}</td>
                  <td className="px-3 py-2">{l.status ?? '—'}</td>
                  <td className="px-3 py-2">{l.archived_at ? new Date(l.archived_at).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2">{l.notes ?? '—'}</td>
                  <td className="px-3 py-2"><UnarchiveButton id={l.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}