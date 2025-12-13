// app/dashboard/manager/leads/page.tsx
import { getAdminClient } from '@/lib/supabase/admin'
import LeadsTable from '@/components/leads/LeadsTable'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export type Lead = {
  id: string
  handle?: string | null
  status?: string | null
  follow_up_at?: string | null
  follow_up_date?: string | null
  created_at?: string | null
  archived_at?: string | null
  source?: string | null
  notes?: string | null
  utm?: any | null
  extras?: any | null
}

async function fetchLeads(): Promise<Lead[]> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('leads')
    .select('id, handle, status, follow_up_at, follow_up_date, created_at, archived_at, source, notes, utm, extras')
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch leads', error)
    return []
  }
  return data || []
}

export default async function ManagerLeadsPage() {
  const rows = await fetchLeads()
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
      </div>
      <LeadsTable rows={rows} />
    </div>
  )
}
