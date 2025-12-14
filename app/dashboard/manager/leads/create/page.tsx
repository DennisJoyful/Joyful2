// app/dashboard/manager/leads/create/page.tsx
'use client'
import dynamic from 'next/dynamic'
const LeadCreateForm = dynamic(() => import('@/components/LeadCreateForm'), { ssr: false })

export default function LeadCreatePage() {
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-medium">Lead manuell anlegen</h2>
      <LeadCreateForm onCreated={() => location.assign('/dashboard/manager')} />
    </div>
  )
}
