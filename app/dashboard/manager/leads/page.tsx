/* app/dashboard/manager/leads/page.tsx
 * Manager Leads page (V2 patch)
 * - Uses ManagerLeadsSafeEnhanced exclusively
 * - Selects `source` (and optional metadata) directly from Supabase
 */
import React from "react"
import ManagerLeadsSafeEnhanced, { BaseLead } from "@/components/leads/ManagerLeadsSafeEnhanced"
import { getAdminClient } from "@/lib/supabase/server" // keep your existing helper
import { getSessionManagerId } from "@/lib/auth"        // replace with your actual session->manager resolver

async function fetchScoped(managerId: string): Promise<BaseLead[]> {
  const sb = getAdminClient()
  const { data, error } = await sb
    .from("leads")
    .select(`
      id,
      handle,
      status,
      contact_date,
      follow_up_at,
      follow_up_date,
      created_at,
      archived_at,
      source,
      notes,
      utm,
      extras
    `)
    .eq("manager_id", managerId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchScoped error:", error.message)
    return []
  }
  return (data ?? []) as unknown as BaseLead[]
}

export default async function Page() {
  // Determine manager from session/cookie (adapt to your auth)
  const managerId = await getSessionManagerId()
  const baseRows = managerId ? await fetchScoped(managerId) : []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Leads</h1>
      <ManagerLeadsSafeEnhanced baseRows={baseRows} />
    </div>
  )
}
