/* components/LeadLiveBadge.tsx
 * Lightweight badge that polls /api/livecheck?handle=...
 */
"use client"

import React, { useEffect, useState } from "react"

type LiveResp = {
  success: boolean
  handle: string
  isLive: boolean
  statusText?: string
}

export default function LeadLiveBadge({ handle, refreshMs = 15000 }: { handle: string; refreshMs?: number }) {
  const [state, setState] = useState<LiveResp | null>(null)

  async function load() {
    if (!handle) return
    try {
      const res = await fetch(`/api/livecheck?handle=${encodeURIComponent(handle)}`, { cache: "no-store" })
      const json = (await res.json()) as LiveResp
      setState(json)
    } catch (e) {
      // network errors shouldn't crash the row
      setState({ success: false, handle, isLive: false, statusText: "Offline" })
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, refreshMs)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle])

  const isLive = !!state?.isLive
  const label = isLive ? "LIVE" : "OFFLINE"

  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset " +
        (isLive
          ? "bg-red-100 text-red-700 ring-red-200"
          : "bg-gray-100 text-gray-700 ring-gray-200")
      }
    >
      {label}
    </span>
  )
}
