import { supabaseServer } from '@/lib/supabaseServer'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

async function getSessionInfo() {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  const uid = me?.user?.id ?? null

  let managerId: string | null = null
  if (uid) {
    const { data: prof } = await s
      .from('profiles')
      .select('manager_id')
      .eq('user_id', uid)
      .maybeSingle()
    managerId = (prof?.manager_id as string) ?? null
    if (!managerId) {
      const { data: mgr } = await s
        .from('managers')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle()
      managerId = (mgr?.id as string) ?? null
    }
  }
  return { uid, managerId }
}

export default async function ManagerHome() {
  const { uid, managerId } = await getSessionInfo()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/manager/leads" className="px-3 py-1.5 rounded-md border hover:bg-muted">
            Zu meinen Leads
          </Link>
        </div>
      </div>

      {/* Debug panel visible to help diagnose manager scoping */}
      <div className="rounded-lg border bg-slate-50 text-slate-900 p-3 text-xs">
        <div><strong>Debug</strong></div>
        <div>User: <code>{uid ?? '–'}</code></div>
        <div>managerId (scope candidate): <code>{managerId ?? '–'}</code></div>
        <div>Tipp: Öffne <code>/dashboard/manager/leads</code>, dort siehst du zusätzlich die distinct manager_ids der geladenen Leads.</div>
      </div>

      <p className="text-sm text-muted-foreground">
        Wenn hier eine andere <code>managerId</code> steht als erwartet, stimmt die Zuordnung in <code>profiles</code> nicht.
      </p>
    </div>
  )
}
