/* Joyful3/components/leads/ManagerLeadsSafeEnhanced.tsx
 * FINAL COLUMN FIX:
 * - Column order is EXACT: Handle → Live → Lead-Status → Quelle → Angelegt
 * - Live badge is the **second** column
 * - No 'unknown' fallbacks; render '—' only if truly empty
 * - Extras merge is conservative (never overwrite with null/undefined)
 */
"use client"

import React, { useEffect, useState } from "react"
import LeadLiveBadge from "@/components/LeadLiveBadge"
import LeadStatusSelect from "@/components/LeadStatusSelect"
import { Badge } from "@/components/ui/badge"

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
  [key: string]: any
}

function safeMergeExtras<T extends Record<string, any>>(base: T[], extras: Record<string, Partial<T>> | null | undefined) {
  if (!extras) return base
  return base.map((r: any) => {
    const patch = (extras as any)[r.id]
    if (!patch) return r
    const next: any = { ...r }
    for (const key of Object.keys(patch)) {
      const v = (patch as any)[key]
      if (v !== null && v !== undefined) {
        next[key] = v
      }
    }
    return next
  })
}

export default function ManagerLeadsSafeEnhanced({ baseRows }: { baseRows: BaseLead[] }) {
  // Normalize initial rows (NEVER inject 'unknown')
  const [rows, setRows] = useState<BaseLead[]>(() =>
    (baseRows ?? []).map((r) => ({
      ...r,
      handle: r.handle ?? null,
      source: r.source ?? null,
    }))
  )

  // Keep SSR -> CSR in sync
  useEffect(() => {
    setRows((baseRows ?? []).map((r) => ({ ...r, handle: r.handle ?? null, source: r.source ?? null })))
  }, [baseRows])

  // OPTIONAL: merge extras conservatively if your route exists
  useEffect(() => {
    let active = true
    async function loadExtras() {
      try {
        const res = await fetch("/api/manager/leads/extra", { cache: "no-store" })
        if (!res.ok) return
        const extras = await res.json()
        if (!active) return
        setRows((prev) => safeMergeExtras(prev, extras))
      } catch {
        /* ignore */ 
      }
    }
    loadExtras()
    return () => {
      active = false
    }
  }, [])

  return (
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
              {/* 1) HANDLE */}
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

              {/* 2) LIVE (this is the **second** column) */}
              <td className="px-3 py-2 whitespace-nowrap">
                <LeadLiveBadge handle={l.handle ?? ""} refreshMs={15000} />
              </td>

              {/* 3) LEAD-STATUS */}
              <td className="px-3 py-2">
                <LeadStatusSelect id={l.id} initial={l.status ?? "new"} />
              </td>

              {/* 4) QUELLE */}
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge>{l.source ?? "—"}</Badge>
              </td>

              {/* 5) ANGELEGT */}
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
  )
}
