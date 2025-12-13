// app/dashboard/layout.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isManagerRoot = pathname === '/dashboard/manager'
  const isManagerLeads = pathname?.startsWith('/dashboard/manager/leads') || pathname?.includes('/dashboard/manager/lead')

  const showLeadButton = isManagerRoot || isManagerLeads

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Dashboard</div>
        {showLeadButton && (
          <Link
            href="/dashboard/manager/leads/create"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 bg-black text-white hover:opacity-90"
          >
            <span>+ Lead hinzufügen</span>
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}
