// app/dashboard/manager/leads/page.tsx
import { supabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import LeadsTable from '@/components/leads/LeadsTable'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type LeadRow = {
  id: string
  handle: string | null
  status: string | null
  follow_up_at: string | null
  follow_up_date: string | null
  created_at: string | null
  archived_at: string | null
  source: string | null
  notes: string | null
  utm: any | null
  extras: any | null
}

async function getManagerId(): Promise<string | null> {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data: prof } = await sb.from('profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!prof?.id) return null
  const { data: mgr } = await sb.from('managers').select('id').eq('profile_id', prof.id).maybeSingle()
  return mgr?.id ?? null
}

async function fetchLeads(): Promise<LeadRow[]> {
  const managerId = await getManagerId()
  if (!managerId) return []
  const { data, error } = await supabaseAdmin
    .from('leads_view')
    .select('id, handle, status, follow_up_at, follow_up_date, created_at, archived_at, source, notes, utm, extras')
    .eq('manager_id', managerId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Failed to fetch leads_view', error)
    return []
  }
  return (data ?? []) as LeadRow[]
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
