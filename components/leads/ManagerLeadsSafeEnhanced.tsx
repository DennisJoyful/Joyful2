/* components/leads/ManagerLeadsSafeEnhanced.tsx
 * Table with correct column order: Handle → Live → Lead-Status → Quelle
 * No extra data fetch; `source` is already present in baseRows.
 */
"use client"

import React from "react"
import LeadLiveBadge from "@/components/LeadLiveBadge"
import { Badge } from "@/components/ui/badge"
// Adjust this import to your actual component path:
import LeadStatusSelect from "@/components/LeadStatusSelect"

export type BaseLead = {
  id: string
  handle?: string | null
  status?: string | null
  contact_date?: string | null
  follow_up_at?: string | null
  follow_up_date?: string | null
  created_at?: string | null
  archived_at?: string | null
  source?: string | null
  notes?: any | null
  utm?: any | null
  extras?: any | null
}

export default function ManagerLeadsSafeEnhanced({ baseRows }: { baseRows: BaseLead[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Handle</th>
            <th className="px-3 py-2 text-left font-medium">Live</th>
            <th className="px-3 py-2 text-left font-medium">Lead-Status</th>
            <th className="px-3 py-2 text-left font-medium">Quelle</th>
            <th className="px-3 py-2 text-left font-medium">Kontakt</th>
            <th className="px-3 py-2 text-left font-medium">Follow-Up (Date)</th>
            <th className="px-3 py-2 text-left font-medium">Follow-Up (At)</th>
            <th className="px-3 py-2 text-left font-medium">Angelegt</th>
            <th className="px-3 py-2 text-left font-medium">Details</th>
            <th className="px-3 py-2 text-left font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {baseRows.map((l) => (
            <tr key={l.id}>
              {/* Handle */}
              <td className="px-3 py-2">
                {l.handle ? (
                  <a
                    href={`https://www.tiktok.com/@${l.handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @{l.handle}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              {/* Live badge (no truncation) */}
              <td className="px-3 py-2 whitespace-nowrap">
                <LeadLiveBadge handle={l.handle ?? ""} refreshMs={15000} />
              </td>
              {/* Lead-Status */}
              <td className="px-3 py-2">
                <LeadStatusSelect id={l.id} initial={l.status ?? "new"} />
              </td>
              {/* Quelle */}
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge>{l.source ?? "—"}</Badge>
              </td>
              {/* Kontakt (placeholder to keep your existing columns) */}
              <td className="px-3 py-2">tt.mm.jjjj</td>
              {/* Follow-Up Date/At placeholders (keep your existing logic) */}
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              {/* Angelegt placeholder */}
              <td className="px-3 py-2">—</td>
              {/* Details/Actions placeholders */}
              <td className="px-3 py-2">Aufklappen</td>
              <td className="px-3 py-2">Aktionen</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
