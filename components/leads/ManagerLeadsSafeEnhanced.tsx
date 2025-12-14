/* Joyful3/components/leads/ManagerLeadsSafeEnhanced.tsx
 * Small tweak: ensure Live badge cell cannot be truncated and remains the 2nd column.
 * (Assumes the rest of your file is unchanged. Only the Live <td> line matters.)
 * If your file differs, keep your existing file and only adjust the indicated <td>.
 */
"use client"
import React from "react"
import LeadLiveBadge from "@/components/LeadLiveBadge"
// This is a helper snippet to illustrate the correct cell:
// In your real file, ensure the second <td> of each row looks like this:
export function __LiveCellExample({ handle }: { handle?: string | null }) {
  return (
    <td className="px-3 py-2 whitespace-nowrap">
      <LeadLiveBadge handle={handle ?? ""} refreshMs={15000} />
    </td>
  )
}
