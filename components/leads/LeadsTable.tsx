/* components/leads/LeadsTable.tsx
 * Temporary stub so the Admin Leads page keeps building.
 * Exports default component AND named type `LeadRow` to satisfy imports.
 * TODO: Replace with the real Admin Leads table implementation.
 */
"use client"
import React from "react"

export type LeadRow = {
  id: string
  handle?: string | null
  status?: string | null
  source?: string | null
  // Allow extra fields without type errors:
  [key: string]: any
}

type Props = {
  rows?: LeadRow[]
  data?: LeadRow[]
}

export default function LeadsTable(props: Props) {
  const rows: LeadRow[] = props?.rows || props?.data || []
  return (
    <div className="rounded-lg border p-4 text-sm">
      <div className="mb-2 font-semibold">Admin Leads (Stub)</div>
      <div className="text-gray-600">Diese Komponente ist ein Platzhalter. Bitte echte LeadsTable einbinden.</div>
      <ul className="mt-3 list-disc pl-5">
        {rows.slice(0, 10).map((r) => (
          <li key={r.id}>
            @{r.handle || "—"} — {r.status || "new"} — {r.source || "—"}
          </li>
        ))}
      </ul>
    </div>
  )
}
