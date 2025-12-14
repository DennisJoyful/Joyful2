// components/leads/LeadActions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { id: string; compact?: boolean }

export default function LeadActions({ id, compact }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function call(path: string) {
    setLoading(path)
    try {
      const res = await fetch(path, { method: 'POST' })
      let msg = ''
      try { const d = await res.json(); msg = (d && (d.message || (!d.ok && 'Fehler'))) || '' } catch {}
      if (!res.ok) throw new Error(msg || 'Fehler')
      router.refresh()
    } catch (e: any) {
      alert(`Aktion fehlgeschlagen: ${e?.message || 'Bitte erneut versuchen.'}`)
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={compact ? 'flex gap-1' : 'flex gap-2'}>
      <button onClick={() => call(`/api/leads/${id}/contact`)}
        className="rounded-md px-2 py-1 text-sm bg-blue-600 text-white disabled:opacity-50"
        disabled={loading !== null}>
        {loading?.includes('/contact') ? 'Speichere…' : 'Kontakt'}
      </button>
      <button onClick={() => call(`/api/leads/${id}/followup`)}
        className="rounded-md px-2 py-1 text-sm bg-amber-600 text-white disabled:opacity-50"
        disabled={loading !== null}>
        {loading?.includes('/followup') ? 'Sende…' : 'Follow‑Up'}
      </button>
      <button onClick={() => call(`/api/leads/${id}/archive`)}
        className="rounded-md px-2 py-1 text-sm bg-gray-700 text-white disabled:opacity-50"
        disabled={loading !== null}>
        {loading?.includes('/archive') ? 'Verschiebe…' : 'Archivieren'}
      </button>
    </div>
  )
}