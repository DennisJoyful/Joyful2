// app/dashboard/manager/leads/page.tsx
import { getAdminClient } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabaseServer'
import ManagerLeadsSafeEnhanced, { BaseLead } from '@/components/leads/ManagerLeadsSafeEnhanced'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function resolveCurrentManagerId() : Promise<string | null> {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id
  if (!uid) return null

  // Prefer explicit profiles.manager_id
  const { data: prof } = await s.from('profiles').select('manager_id').eq('user_id', uid).maybeSingle()
  if (prof?.manager_id) return prof.manager_id as string

  // Fallback: managers.id via managers.user_id === uid
  const { data: mgr } = await s.from('managers').select('id').eq('user_id', uid).maybeSingle()
  return (mgr?.id as string) ?? null
}

async function fetchLeadsFor(managerId: string): Promise<BaseLead[]> {
  const sb = getAdminClient()
  const { data, error } = await sb
    .from('leads')
    .select('id, handle, status, contact_date, follow_up_at, follow_up_date, created_at, archived_at, manager_id')
    .eq('manager_id', managerId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchLeadsFor error', error)
    return []
  }
  // Narrow to BaseLead shape expected by ManagerLeadsSafeEnhanced
  return (data ?? []).map((r: any) => ({
    id: r.id,
    handle: r.handle ?? null,
    status: r.status ?? null,
    contact_date: r.contact_date ?? null,
    follow_up_at: r.follow_up_at ?? null,
    follow_up_date: r.follow_up_date ?? null,
    created_at: r.created_at ?? null,
    archived_at: r.archived_at ?? null,
  })) as BaseLead[]
}

export default async function ManagerLeadsPage() {
  const managerId = await resolveCurrentManagerId()
  if (!managerId) redirect('/auth/sign-in?next=/dashboard/manager/leads')

  const baseRows = await fetchLeadsFor(managerId)
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
      </div>
      <ManagerLeadsSafeEnhanced baseRows={baseRows} />
    </div>
  )
}
