import { supabaseServer } from '@/lib/supabaseServer'
import LeadsTable, { LeadRow } from '@/components/leads/LeadsTable'
import { redirect } from 'next/navigation'

// Hard disable caching for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

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
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id
  if (!uid) redirect('/auth/sign-in?next=/dashboard/manager/leads')

  const { managerId } = await resolveCurrentManagerId()

  if (!managerId) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <div className="rounded-lg border bg-amber-50 text-amber-900 p-3 text-sm">
          <div><strong>Debug:</strong> Kein manager_id für aktuellen User gefunden.</div>
          <div>User: <code>{uid}</code></div>
          <div>profiles.manager_id ist null und kein managers.user_id Match vorhanden.</div>
        </div>
      </div>
    )
  }

  // Query strictly scoped to current managerId (session client, no service role)
  const { data: rowsRaw, error } = await s
    .from('leads')
    .select('id, handle, status, lead_source, notes, utm, extras, created_at, follow_up_at, follow_up_date, manager_id')
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })

  // Collect distinct manager_ids in result (should be exactly [managerId])
  const distinctManagerIds = Array.from(new Set((rowsRaw ?? []).map((r: any) => r.manager_id).filter(Boolean)))

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

      {/* Debug banner to verify scoping at runtime */}
      <div className="rounded-lg border bg-slate-50 text-slate-900 p-3 text-xs">
        <div><strong>Debug</strong></div>
        <div>User: <code>{uid}</code></div>
        <div>managerId (scope): <code>{managerId}</code></div>
        <div>distinct manager_ids in result: <code>{JSON.stringify(distinctManagerIds)}</code></div>
        <div>rows: {rows.length}</div>
      </div>

      <LeadsTable rows={rows} />
    </div>
  )
}
