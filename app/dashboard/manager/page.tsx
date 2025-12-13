// app/dashboard/manager/page.tsx
import { getAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import ManagerLeadsSafeEnhanced, { BaseLead } from '@/components/leads/ManagerLeadsSafeEnhanced'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchLegacy(): Promise<BaseLead[]> {
  const sb = getAdminClient()
  const { data, error } = await sb
    .from('leads')
    .select('id, handle, status, follow_up_at, follow_up_date, created_at, archived_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchLegacy error', error)
    return []
  }
  return (data ?? []) as BaseLead[]
}

export default async function ManagerPage() {
  const baseRows = await fetchLegacy()
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
