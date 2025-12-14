'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  handle: string | null | undefined
  refreshMs?: number
}

// Always shows a pill: defaults to OFFLINE, switches to LIVE if API returns isLive=true.
// Resilient: on error it stays OFFLINE and retries on interval.
export default function LeadLiveBadge({ handle, refreshMs = 15000 }: Props) {
  const h = (handle || '').replace(/^@/, '').trim()
  const [isLive, setIsLive] = useState(false)
  const [ready, setReady] = useState(false)
  const timer = useRef<any>(null)

  const fetchOnce = async () => {
    if (!h) { setReady(true); setIsLive(false); return }
    try {
      const res = await fetch(`/api/livecheck?handle=${encodeURIComponent(h)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('livecheck failed')
      const data = await res.json()
      const live = !!(data?.isLive || data?.live || data?.status === 'live' || data?.statusText === 'Live')
      setIsLive(live)
    } catch (_e) {
      setIsLive(false) // default to offline on error
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    fetchOnce()
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(fetchOnce, Math.max(5000, refreshMs))
    return () => { if (timer.current) clearInterval(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, refreshMs])

  const cls = useMemo(() => isLive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700', [isLive])
  const label = isLive ? 'LIVE' : 'OFFLINE'

  // Always render a pill; when no handle, still shows OFFLINE so the column is never empty.
  return (
    <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
