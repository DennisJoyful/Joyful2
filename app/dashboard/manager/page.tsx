// Manager Dashboard with simple menu surface
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getSessionInfo() {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id ?? null
  let managerId: string | null = null
  if (uid) {
    const { data: prof } = await s.from('profiles').select('manager_id').eq('user_id', uid).maybeSingle()
    managerId = prof?.manager_id ?? null
    if (!managerId) {
      const { data: mgr } = await s.from('managers').select('id').eq('user_id', uid).maybeSingle()
      managerId = mgr?.id ?? null
    }
  }
  return { uid, managerId }
}

export default async function ManagerDashboard() {
  const { uid, managerId } = await getSessionInfo()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manager</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/manager/leads" className="block rounded-2xl border p-4 hover:bg-muted">
          <div className="text-lg font-medium">Leads</div>
          <div className="text-sm text-muted-foreground">Leads ansehen & bearbeiten</div>
        </Link>
        <Link href="/dashboard/manager/werber" className="block rounded-2xl border p-4 hover:bg-muted">
          <div className="text-lg font-medium">Werber anlegen</div>
          <div className="text-sm text-muted-foreground">Neuen Werber erfassen / Einladungslink</div>
        </Link>
        <Link href="/dashboard/manager/hilfe" className="block rounded-2xl border p-4 hover:bg-muted">
          <div className="text-lg font-medium">Hilfe</div>
          <div className="text-sm text-muted-foreground">Kurze Anleitungen & Links</div>
        </Link>
      </div>

      <div className="rounded-lg border bg-slate-50 text-slate-900 p-3 text-xs">
        <div><strong>Debug</strong></div>
        <div>User: <code>{uid ?? '–'}</code></div>
        <div>managerId (scope candidate): <code>{managerId ?? '–'}</code></div>
      </div>
    </div>
  )
}
