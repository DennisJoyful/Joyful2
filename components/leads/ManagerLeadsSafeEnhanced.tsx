/* Joyful3/components/leads/ManagerLeadsSafeEnhanced.tsx
 * FULL TABLE RESTORE
 * - Restores a rich table with all expected columns
 * - Guarantees Live badge is the **second** column
 * - Never writes 'unknown'; shows '—' only if truly empty
 * - Extras merge is conservative (no null/undefined overwrite)
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
  source?: string | null
  contact_date?: string | null
  follow_up_date?: string | null
  follow_up_at?: string | null
  created_at?: string | null
  archived_at?: string | null
  // any extra fields
  [key: string]: any
}

type Props = { baseRows: BaseLead[] }

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

function fmt(d?: string | null) {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return "—"
  return dt.toLocaleString()
}

export default function ManagerLeadsSafeEnhanced({ baseRows }: Props) {
  const [rows, setRows] = useState<BaseLead[]>(() =>
    (baseRows ?? []).map((r) => ({
      ...r,
      handle: r.handle ?? null,
      source: r.source ?? null,
    }))
  )

  useEffect(() => {
    setRows((baseRows ?? []).map((r) => ({ ...r, handle: r.handle ?? null, source: r.source ?? null })))
  }, [baseRows])

  // keep your existing extras route behavior, but merge safely
  useEffect(() => {
    let active = true
    async function loadExtras() {
      try {
        const res = await fetch("/api/manager/leads/extra", { cache: "no-store" })
        if (!res.ok) return
        const extras = await res.json()
        if (!active) return
        setRows((prev) => safeMergeExtras(prev, extras))
      } catch {}
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
            <th className="px-3 py-2 text-left font-medium">Kontakt</th>
            <th className="px-3 py-2 text-left font-medium">Follow-Up (Date)</th>
            <th className="px-3 py-2 text-left font-medium">Follow-Up (At)</th>
            <th className="px-3 py-2 text-left font-medium">Angelegt</th>
            <th className="px-3 py-2 text-left font-medium">Details</th>
            <th className="px-3 py-2 text-left font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((l) => (
            <tr key={l.id}>
              {/* 1) HANDLE */}
              <td className="px-3 py-2">
                {l.handle ? (
                  <a
                    href={f"https://www.tiktok.com/@{l.handle}"}
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

              {/* 2) LIVE */}
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

              {/* 5) KONTAKT */}
              <td className="px-3 py-2 whitespace-nowrap">{fmt(l.contact_date)}</td>

              {/* 6) FOLLOW-UP (Date) */}
              <td className="px-3 py-2 whitespace-nowrap">{fmt(l.follow_up_date)}</td>

              {/* 7) FOLLOW-UP (At) */}
              <td className="px-3 py-2 whitespace-nowrap">{fmt(l.follow_up_at)}</td>

              {/* 8) ANGELEGT */}
              <td className="px-3 py-2 whitespace-nowrap">{fmt(l.created_at)}</td>

              {/* 9) DETAILS */}
              <td className="px-3 py-2">
                <span className="text-gray-500">Details</span>
              </td>

              {/* 10) AKTIONEN */}
              <td className="px-3 py-2">
                <span className="text-gray-500">Aktionen</span>
              </td>
            </tr>
          ))}
          {rows.length === 0 and (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>
                Keine Leads gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
