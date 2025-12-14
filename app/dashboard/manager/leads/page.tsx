import { supabaseServer } from '@/lib/supabaseServer'
import { getAdminClient } from '@/lib/supabase/admin'
import LeadsTable, { LeadRow } from '@/components/leads/LeadsTable'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Page({ searchParams }: { searchParams: { debug?: string } }) {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id
  if (!uid) redirect('/auth/sign-in?next=/dashboard/manager/leads')

  // Resolve current manager id (profile first, then owner fallback)
  let managerId: string | null = null
  const { data: prof } = await s.from('profiles').select('manager_id').eq('user_id', uid).maybeSingle()
  if (prof?.manager_id) {
    managerId = prof.manager_id
  } else {
    const { data: mgr } = await s.from('managers').select('id').eq('user_id', uid).maybeSingle()
    managerId = mgr?.id ?? null
  }

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

  // Read with service role but strictly filter by managerId and post-filter as double safety.
  const admin = getAdminClient()
  const { data: rowsRaw, error } = await admin
    .from('leads')
    .select('id, handle, status, source, notes, utm, extras, created_at, follow_up_at, follow_up_date, manager_id')
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

  const safeRows = (rowsRaw ?? []).filter((r: any) => r?.manager_id === managerId)
  const rows: LeadRow[] = safeRows.map((r: any) => ({
    id: r.id,
    handle: r.handle ?? '',
    status: r.status ?? 'new',
    source: r.source ?? null,
    notes: r.notes ?? null,
    utm: r.utm ?? null,
    extras: r.extras ?? null,
    created_at: r.created_at ?? null,
    follow_up_at: r.follow_up_at ?? null,
    follow_up_date: r.follow_up_date ?? null,
  }))

  const showDebug = searchParams?.debug === '1'
  const distinctManagerIds = Array.from(new Set(safeRows.map((r: any) => r.manager_id).filter(Boolean)))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
      </div>

      {showDebug && (
        <div className="rounded-lg border bg-slate-50 text-slate-900 p-3 text-xs">
          <div><strong>Debug</strong></div>
          <div>User: <code>{uid}</code></div>
          <div>managerId (scope): <code>{managerId}</code></div>
          <div>distinct manager_ids in result: <code>{JSON.stringify(distinctManagerIds)}</code></div>
          <div>rows: {rows.length}</div>
        </div>
      )}

      <LeadsTable rows={rows} />
    </div>
  )
}
