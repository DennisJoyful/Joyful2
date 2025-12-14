// /dashboard/manager/leads uses original ManagerLeadsSafeEnhanced with required baseRows prop
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAdminClient } from '@/lib/supabase/admin'
import ManagerLeadsSafeEnhanced, { BaseLead } from '@/components/leads/ManagerLeadsSafeEnhanced'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function resolveCurrentManagerId(uid: string) {
  const s = supabaseServer()
  const { data: prof } = await s.from('profiles').select('manager_id').eq('user_id', uid).maybeSingle()
  if (prof?.manager_id) return prof.manager_id as string
  const { data: mgr } = await s.from('managers').select('id').eq('user_id', uid).maybeSingle()
  return (mgr?.id as string) ?? null
}

export default async function ManagerLeadsPage() {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id
  if (!uid) redirect('/auth/sign-in?next=/dashboard/manager/leads')

  const managerId = await resolveCurrentManagerId(uid)
  if (!managerId) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <div className="rounded-lg border bg-amber-50 text-amber-900 p-3 text-sm">
          <div><strong>Hinweis:</strong> Kein manager_id gefunden. Bitte in profiles.manager_id zuweisen.</div>
        </div>
      </div>
    )
  }

  const admin = getAdminClient()
  const { data: rowsRaw, error } = await admin
    .from('leads')
    .select(`
      id,
      handle,
      status,
      contact_date,
      follow_up_at,
      follow_up_date,
      created_at,
      archived_at
    `)
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-red-600 mt-2">Fehler beim Laden: {error.message}</p>
      </div>
    )
  }

  const baseRows: BaseLead[] = (rowsRaw ?? []).map((r: any) => ({
    id: r.id,
    handle: r.handle ?? null,
    status: r.status ?? null,
    contact_date: r.contact_date ?? null,
    follow_up_at: r.follow_up_at ?? null,
    follow_up_date: r.follow_up_date ?? null,
    created_at: r.created_at ?? null,
    archived_at: r.archived_at ?? null,
  }))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
      </div>
      <ManagerLeadsSafeEnhanced baseRows={baseRows} />
    </div>
  )
}
