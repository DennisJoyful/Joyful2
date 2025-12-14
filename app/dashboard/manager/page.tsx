// Manager root: SIMPLE MENU ONLY (no leads here)
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getSessionInfo() {
  const s = supabaseServer()
  const { data: me } = await s.auth.getUser()
  return { uid: me?.user?.id ?? null }
}

export default async function ManagerMenu() {
  const { uid } = await getSessionInfo()
  if (!uid) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Manager</h1>
        <p className="text-sm text-muted-foreground mt-2">Bitte anmelden…</p>
      </div>
    )
  }

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
        {/* Weitere Menüpunkte können hier ergänzt werden */}
      </div>
    </div>
  )
}
