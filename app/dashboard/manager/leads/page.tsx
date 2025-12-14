// app/dashboard/manager/leads/page.tsx with optional debug (?debug=1)
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminClient } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabaseServer'
import ManagerLeadsSafeEnhanced, { BaseLead } from '@/components/leads/ManagerLeadsSafeEnhanced'
import LeadLiveBadge from '@/components/LeadLiveBadge'

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

async function fetchScoped(managerId: string): Promise<BaseLead[]> {
  const sb = getAdminClient()
  const { data } = await sb
    .from('leads')
    .select('id, handle, status, contact_date, follow_up_at, follow_up_date, created_at, archived_at')
    .eq('manager_id', managerId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  return (data ?? []) as BaseLead[]
}

export default async function ManagerLeadsPage({ searchParams }: { searchParams?: { debug?: string } }) {
  const managerId = await getCurrentManagerId()
  if (!managerId) {
    redirect('/auth/sign-in?next=/dashboard/manager/leads')
  }
  const baseRows = await fetchScoped(managerId!)
  const debug = searchParams?.debug === '1'
  const first = baseRows.slice(0,3).map(r => r.handle || '—').join(', ')

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <Link className="text-sm text-blue-600 hover:underline" href="/dashboard/manager/leads/create">Lead anlegen</Link>
      </div>

      {debug && (
        <div className="rounded-lg border p-3 text-xs">
          <div><strong>Debug</strong></div>
          <div>Handles (erste 3): {first}</div>
          <div className="mt-1">Badge-Demo: <LeadLiveBadge handle={baseRows[0]?.handle || ''} refreshMs={5000} /></div>
        </div>
      )}

      <ManagerLeadsSafeEnhanced baseRows={baseRows} />
    </div>
  )
}
