// app/dashboard/admin/reports/followups/page.tsx
import { getAdminClient } from '@/lib/supabase/admin'

async function getStats() {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('leads')
    .select('follow_up_count')
  if (error) throw error
  const total = (data || []).reduce((acc, r: any) => acc + (r.follow_up_count || 0), 0)
  return { total }
}

export default async function FollowUpReport() {
  const stats = await getStats()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Follow-Up Report</h1>
      <p className="mt-2 text-sm text-gray-600">Summe aller gesendeten Follow-Ups (alle Leads):</p>
      <div className="mt-4 rounded-xl border p-6 text-4xl font-bold">{stats.total}</div>
    </div>
  )
}