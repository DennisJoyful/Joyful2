/* components/leads/LeadsTable.tsx
 * Temporary stub so the Admin Leads page keeps building.
 * TODO: Replace with the real Admin Leads table implementation.
 */
"use client"
import React from "react"

type AnyProps = Record<string, any>

export default function LeadsTable(props: AnyProps) {
  const rows = props?.rows || props?.data || []
  return (
    <div className="rounded-lg border p-4 text-sm">
      <div className="mb-2 font-semibold">Admin Leads (Stub)</div>
      <div className="text-gray-600">Diese Komponente ist ein Platzhalter. Bitte echte LeadsTable einbinden.</div>
      <ul className="mt-3 list-disc pl-5">
        {rows.slice(0, 5).map((r: any) => (
          <li key={r?.id || JSON.stringify(r)}>{r?.handle || "—"}</li>
        ))}
      </ul>
    </div>
  )
}
