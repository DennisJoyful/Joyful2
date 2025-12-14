/* Joyful3/components/LeadLiveBadge.tsx
 * Hardened live badge:
 * - Cache-busting (&t=timestamp) + cache: 'no-store'
 * - 4s timeout with AbortController
 * - One quick retry on failure
 * - Keeps last known good state to avoid flicker ("no response")
 * - Neutral tooltip on network errors; UI still shows LIVE/OFFLINE
 * - Fixed width + nowrap so it never becomes "..." due to truncation
 */
"use client"

import React, { useEffect, useRef, useState } from "react"

type LiveResp = { success: boolean; handle: string; isLive: boolean; statusText?: string }

function timeoutFetch(input: RequestInfo | URL, init: RequestInit, ms = 4000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(id))
}

export default function LeadLiveBadge({ handle, refreshMs = 15000 }: { handle: string; refreshMs?: number }) {
  const [isLive, setIsLive] = useState<boolean | null>(null)
  const [hadError, setHadError] = useState<boolean>(false)
  const mounted = useRef(true)

  async function loadOnce(): Promise<boolean> {
    if (!handle) { setIsLive(false); return true }
    try {
      const url = `/api/livecheck?handle=${encodeURIComponent(handle)}&t=${Date.now()}`
      const res = await timeoutFetch(url, { cache: "no-store", headers: { "accept": "application/json" } }, 4000)
      if (!res.ok) throw new Error("http " + res.status)
      const json = (await res.json()) as LiveResp
      if (!mounted.current) return false
      if (typeof json?.isLive === "boolean") {
        setIsLive(!!json.isLive)
        setHadError(false)
        return true
      } else {
        throw new Error("bad json")
      }
    } catch {
      if (!mounted.current) return false
      setHadError(true)
      // don't overwrite previous known good state; just report failure
      return false
    }
  }

  async function load() {
    const ok = await loadOnce()
    if (!ok) {
      // quick retry once
      await loadOnce()
    }
  }

  useEffect(() => {
    mounted.current = true
    load()
    const t = setInterval(load, refreshMs)
    return () => { mounted.current = false; clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle])

  const live = !!isLive
  const label = live ? "LIVE" : "OFFLINE"
  const title = hadError ? "Livecheck: kurzzeitig keine Antwort" : (live ? "Live" : "Offline")

  return (
    <span
      title={title}
      className={
        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset " +
        "min-w-[64px] whitespace-nowrap " +
        (live ? "bg-red-100 text-red-700 ring-red-200" : "bg-gray-100 text-gray-700 ring-gray-200")
      }
      aria-live="polite"
    >
      {label}
    </span>
  )
}
