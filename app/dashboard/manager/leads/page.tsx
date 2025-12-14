import { supabaseServer } from '@/lib/supabaseServer'
import { getAdminClient } from '@/lib/supabase/admin'
import LeadsTable, { LeadRow } from '@/components/leads/LeadsTable'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  // 1) Require a session
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id
  if (!uid) redirect('/auth/sign-in?next=/dashboard/manager/leads')

  // 2) Try to resolve manager_id in a robust way:
  //    a) profiles.manager_id (if present)
  //    b) fallback: managers.id via managers.user_id === uid
  let managerId: string | null = null

  const { data: prof } = await s
    .from('profiles')
    .select('manager_id')
    .eq('user_id', uid)
    .single()

  if (prof?.manager_id) {
    managerId = prof.manager_id
  } else {
    const { data: mgrByUser } = await s
      .from('managers')
      .select('id')
      .eq('user_id', uid)
      .maybeSingle()
    managerId = mgrByUser?.id ?? null
  }

  if (!managerId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Kein Manager zugeordnet. Bitte dem Nutzer einen Manager zuweisen
          (profiles.manager_id) oder den Nutzer als Manager (managers.user_id) anlegen.
        </p>
      </div>
    )
  }

  // 3) Load leads filtered by this manager_id (server-side, no caching)
  const admin = getAdminClient()
  const { data: rowsRaw } = await admin
    .from('leads')
    .select('id, handle, status, lead_source, notes, utm, extras, created_at, follow_up_at, follow_up_date')
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })

  const rows: LeadRow[] = (rowsRaw ?? []).map((r: any) => ({
    id: r.id,
    handle: r.handle ?? '',
    status: r.status ?? 'new',
    source: r.lead_source ?? null,
    notes: r.notes ?? null,
    utm: r.utm ?? null,
    extras: r.extras ?? null,
    created_at: r.created_at ?? null,
    follow_up_at: r.follow_up_at ?? null,
    follow_up_date: r.follow_up_date ?? null,
  }))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
      </div>
      <LeadsTable rows={rows} />
    </div>
  )
}
