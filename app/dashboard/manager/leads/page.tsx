// /dashboard/manager/leads uses the original component from the project
import ManagerLeadsSafeEnhanced from '@/components/leads/ManagerLeadsSafeEnhanced'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function ManagerLeadsExact() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
      </div>
      <ManagerLeadsSafeEnhanced />
    </div>
  )
}
