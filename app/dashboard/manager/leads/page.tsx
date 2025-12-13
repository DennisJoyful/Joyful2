// app/dashboard/manager/leads/page.tsx
import LeadsTable from '@/components/leads/LeadsTable'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Lead = {
  id: string
  handle?: string | null
  status?: string | null
  follow_up_at?: string | null
  follow_up_date?: string | null
  created_at?: string | null
  source?: string | null
  notes?: string | null
  utm?: any | null
  extras?: any | null
}

async function fetchLeads(): Promise<Lead[]> {
  const sb = getAdminClient()
  const { data, error } = await sb
    .from('leads_view')
    .select('id, handle, status, follow_up_at, follow_up_date, created_at, source, notes, utm, extras')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Failed to fetch leads', error)
    return []
  }
  return data || []
}

export default async function ManagerLeadsPage() {
  const leads = await fetchLeads()
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <a href="/dashboard/manager/leads/create" className="rounded px-3 py-2 text-sm bg-black text-white">Lead hinzufügen</a>
      </div>

      <LeadsTable rows={leads} />
    </div>
  )
}