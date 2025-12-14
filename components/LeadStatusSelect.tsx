/* components/LeadStatusSelect.tsx
 * Temporary stub to satisfy imports during build.
 * TODO: Replace with your real LeadStatusSelect that persists status to Supabase.
 */
"use client"
import React, { useState } from "react"

type Props = {
  id: string
  initial?: string | null
  onChange?: (v: string) => void
}

const OPTIONS = ["new", "contacted", "qualified", "rejected", "hired"]

export default function LeadStatusSelect({ id, initial = "new", onChange }: Props) {
  const [val, setVal] = useState(initial || "new")
  return (
    <select
      className="rounded-md border px-2 py-1 text-sm"
      value={val}
      onChange={(e) => {
        const v = e.target.value
        setVal(v)
        onChange?.(v)
        // NOTE: This is a stub; no API call. Replace with your real update logic.
      }}
      aria-label={`Lead status for ${id}`}
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
