// app/manager/leads/create/page.tsx
'use client'
import dynamic from 'next/dynamic'
const LeadCreateForm = dynamic(() => import('@/components/LeadCreateForm'), { ssr: false })

export default function LeadCreatePage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Lead manuell anlegen</h1>
      <LeadCreateForm onCreated={() => location.assign('/manager/leads')} />
    </div>
  )
}
