'use client'

import { useEffect, useState } from 'react'

type Props = { handle?: string | null; refreshMs?: number }

export default function LeadLiveBadge({ handle, refreshMs = 60000 }: Props) {
  const [state, setState] = useState<'live' | 'offline'>('offline') // Default: offline

  useEffect(() => {
    // Wenn kein Handle oder leer → direkt offline
    if (!handle || handle.trim() === '') {
      setState('offline')
      return
    }

    const trimmedHandle = handle.trim()

    let cancelled = false
    let timeoutId: NodeJS.Timeout

    async function probe() {
      try {
        // encodeURIComponent nur mit sicherem String aufrufen
        const res = await fetch(`/api/livecheck?handle=${encodeURIComponent(trimmedHandle)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        let newState: 'live' | 'offline' = 'offline'

        // API-Response prüfen: isLive oder statusText
        if (json?.isLive === true || json?.statusText === 'Live') {
          newState = 'live'
        } else if (json?.isLive === false || json?.statusText === 'Offline') {
          newState = 'offline'
        }

        if (!cancelled) setState(newState)
      } catch (err) {
        console.error('Livecheck failed for', trimmedHandle, err)
        if (!cancelled) setState('offline')
      } finally {
        if (!cancelled && refreshMs > 0) {
          timeoutId = setTimeout(probe, refreshMs)
        }
      }
    }

    probe()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [handle, refreshMs])

  const color = state === 'live' ? 'bg-green-500' : 'bg-gray-400'
  const label = state === 'live' ? 'LIVE' : 'offline'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color} text-white`}>
      {state === 'live' && <span className="h-2 w-2 rounded-full bg-white/90 animate-pulse"></span>}
      {label}
    </span>
  )
}