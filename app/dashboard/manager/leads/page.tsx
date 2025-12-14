import { supabaseServer } from '@/lib/supabaseServer'
import { getAdminClient } from '@/lib/supabase/admin'
import LeadsTable, { LeadRow } from '@/components/leads/LeadsTable'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Page() {
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
    .select(`
      id,
      handle,
      status,
      source,
      notes,
      created_at,
      contact_date,
      contacted_at,
      follow_up_at,
      follow_up_date,
      last_follow_up_at,
      follow_up_sent,
      follow_up_sent_count,
      follow_up_count,
      archived_at,
      archived_by_manager_id,
      werber_id,
      creator_id,
      manager_id
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

  // Defensive post-filter
  const safe = (rowsRaw ?? []).filter((r: any) => r?.manager_id === managerId)

  const rows: LeadRow[] = safe.map((r: any) => ({
    id: r.id,
    handle: r.handle ?? '',
    status: r.status ?? 'new',
    source: r.source ?? null,
    notes: r.notes ?? null,
    created_at: r.created_at ?? null,
    follow_up_at: r.follow_up_at ?? null,
    follow_up_date: r.follow_up_date ?? null,
    // Optional fields below are not present in DB; pass undefined/null if LeadRow allows them:
    // utm: null,
    // extras: null,
  })) as any

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
      </div>
      <LeadsTable rows={rows} />
    </div>
  )
}
