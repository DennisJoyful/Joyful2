/* components/leads/ManagerLeadsSafeEnhanced.tsx
 * HOTFIX: Always render incoming baseRows immediately.
 * - No rows are hidden/filtered.
 * - Optional extra fetch merges conservatively (never deletes or overwrites with undefined).
 * - Columns: Handle → Live → Lead-Status → Quelle (— if missing).
 */
"use client"

import React, { useEffect, useMemo, useState } from "react"
import LeadLiveBadge from "@/components/LeadLiveBadge"
import { Badge } from "@/components/ui/badge"
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

type Props = { baseRows: BaseLead[] }

export default function ManagerLeadsSafeEnhanced({ baseRows }: Props) {
  // 1) Start by showing what we got
  const [rows, setRows] = useState<BaseLead[]>(() => baseRows ?? [])

  // 2) Keep rows in sync if baseRows change (SSR -> CSR hydration etc.)
  useEffect(() => {
    setRows(baseRows ?? [])
  }, [baseRows])

  // 3) Optional: Try to load extras; if it fails or returns nothing, keep current rows
  useEffect(() => {
    let active = true
    async function loadExtras() {
      try {
        const res = await fetch("/api/manager/leads/extra", { cache: "no-store" })
        if (!res.ok) return
        const extra: Record<string, Partial<BaseLead>> = await res.json()

        if (!active || !extra) return

        setRows((prev) => {
          if (!prev?.length) return prev // don't fabricate rows
          return prev.map((r) => {
            const patch = extra[r.id]
            if (!patch) return r
            const next: BaseLead = { ...r }
            // Only overwrite fields that are actually present (not null/undefined)
            if (patch.source != null) next.source = patch.source
            if (patch.status != null) next.status = patch.status
            // carry any other provided keys, but never remove existing values
            for (const k of Object.keys(patch)) {
              const v = (patch as any)[k]
              if (v != null && (next as any)[k] == null) {
                ;(next as any)[k] = v
              }
            }
            return next
          })
        })
      } catch {
        // silent fail: keep previously shown rows
      }
    }
    loadExtras()
    return () => {
      active = false
    }
  }, [])

  // Debug helper (visible only if something is odd)
  const count = rows?.length ?? 0

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Leads: {count}</div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Handle</th>
              <th className="px-3 py-2 text-left font-medium">Live</th>
              <th className="px-3 py-2 text-left font-medium">Lead-Status</th>
              <th className="px-3 py-2 text-left font-medium">Quelle</th>
              <th className="px-3 py-2 text-left font-medium">Angelegt</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((l) => (
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
                {/* Live badge */}
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
                {/* Angelegt */}
                <td className="px-3 py-2 whitespace-nowrap">
                  {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  Keine Leads gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
