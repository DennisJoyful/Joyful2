// app/dashboard/manager/leads/layout.tsx
import dynamic from 'next/dynamic'

const ClientBinder = dynamic(() => import('@/app/dashboard/manager/ClientBinder'), { ssr: false })

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      <ClientBinder />
      {children}
    </div>
  )
}
