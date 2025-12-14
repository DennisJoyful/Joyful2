import { supabaseServer } from '@/lib/supabaseServer'
import { getAdminClient } from '@/lib/supabase/admin'
import LeadsTable, { LeadRow } from '@/components/leads/LeadsTable'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page({ searchParams }: { searchParams: { m?: string } }) {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id
  if (!uid) redirect('/auth/sign-in?next=/dashboard/admin/leads')

  const { data: prof } = await s.from('profiles').select('role').eq('user_id', uid).single()
  if (prof?.role !== 'admin') redirect('/')

  const admin = getAdminClient()
  const { data: managers } = await admin.from('managers').select('id, slug').order('slug')
  const activeManagerId = searchParams.m || managers?.[0]?.id

  const { data: rowsRaw } = await admin
    .from('leads')
    .select('id, handle, status, lead_source, notes, utm, extras, created_at, follow_up_at, follow_up_date')
    .eq('manager_id', activeManagerId)
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Leads (Admin)</h1>
        <form>
          <select
            name="m"
            defaultValue={activeManagerId}
            className="border rounded-md px-2 py-1"
            onChange={(e) => (window.location.search = '?m=' + e.target.value)}
          >
            {(managers ?? []).map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.slug}
              </option>
            ))}
          </select>
        </form>
      </div>
      <LeadsTable rows={rows} />
    </div>
  )
}
