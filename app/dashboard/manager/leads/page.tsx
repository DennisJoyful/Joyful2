// Render the ORIGINAL leads UI component here so /dashboard/manager/leads looks exactly like before.
// We assume your project already contains this component from the original /dashboard/manager page.
// IMPORTANT: We DO NOT change that component at all.

import ManagerLeadsSafeEnhanced from '@/components/manager/ManagerLeadsSafeEnhanced'

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
