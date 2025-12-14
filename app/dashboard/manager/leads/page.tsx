import { supabaseServer } from '@/lib/supabaseServer'
import LeadsTable, { LeadRow } from '@/components/leads/LeadsTable'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function resolveCurrentManagerId() {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id
  if (!uid) return { uid: null, managerId: null }

  // 1) Prefer explicit profiles.manager_id
  const { data: prof } = await s
    .from('profiles')
    .select('manager_id')
    .eq('user_id', uid)
    .maybeSingle()

  if (prof?.manager_id) return { uid, managerId: prof.manager_id as string }

  // 2) Fallback: managers.id via managers.user_id === uid
  const { data: mgr } = await s
    .from('managers')
    .select('id')
    .eq('user_id', uid)
    .maybeSingle()

  return { uid, managerId: (mgr?.id as string) ?? null }
}

export default async function Page() {
  const { uid, managerId } = await resolveCurrentManagerId()
  if (!uid) redirect('/auth/sign-in?next=/dashboard/manager/leads')

  if (!managerId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Kein Manager zugeordnet. Bitte dem Nutzer in <code>profiles.manager_id</code> einen Manager zuweisen
          oder den Nutzer als Owner in <code>managers.user_id</code> hinterlegen.
        </p>
      </div>
    )
  }

  // IMPORTANT:
  // - Use the session-bound server client (not service role).
  // - Filter STRICTLY by leads.manager_id === current managerId.
  const s = supabaseServer()
  const { data: rowsRaw, error } = await s
    .from('leads')
    .select('id, handle, status, lead_source, notes, utm, extras, created_at, follow_up_at, follow_up_date, manager_id')
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
