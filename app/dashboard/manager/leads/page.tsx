// app/dashboard/manager/leads/page.tsx — mirrors original manager page (UI & logic),
// only addition: filter by current manager_id.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminClient } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabaseServer'
import ManagerLeadsSafeEnhanced, { BaseLead } from '@/components/leads/ManagerLeadsSafeEnhanced'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCurrentManagerId(): Promise<string | null> {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id
  if (!uid) return null
  const { data: prof } = await s.from('profiles').select('manager_id').eq('user_id', uid).maybeSingle()
  if (prof?.manager_id) return prof.manager_id as string
  const { data: mgr } = await s.from('managers').select('id').eq('user_id', uid).maybeSingle()
  return (mgr?.id as string) ?? null
}

async function fetchLegacyScoped(managerId: string): Promise<BaseLead[]> {
  const sb = getAdminClient()
  const { data, error } = await sb
    .from('leads')
    .select('id, handle, status, contact_date, follow_up_at, follow_up_date, created_at, archived_at')
    .eq('manager_id', managerId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Leads-Select-Fehler:', error.message)
    return []
  }
  return (data ?? []) as BaseLead[]
}

export default async function ManagerLeadsPage() {
  const managerId = await getCurrentManagerId()
  if (!managerId) {
    redirect('/auth/sign-in?next=/dashboard/manager/leads')
  }
  const baseRows = await fetchLegacyScoped(managerId!)
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <Link className="text-sm text-blue-600 hover:underline" href="/dashboard/manager/leads/create">Lead anlegen</Link>
      </div>
      <ManagerLeadsSafeEnhanced baseRows={baseRows} />
    </div>
  )
}
