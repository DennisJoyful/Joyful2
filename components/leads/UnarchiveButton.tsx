// components/leads/UnarchiveButton.tsx
'use client'
import { useState } from 'react'

export default function UnarchiveButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<boolean | null>(null)

  async function onClick() {
    setLoading(true)
    setOk(null)
    try {
      const res = await fetch('/api/leads/unarchive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const json = await res.json().catch(() => ({}))
      setOk(!!json?.ok)
      if (json?.ok) {
        // reload to reflect changes
        window.location.reload()
      }
    } catch {
      setOk(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-md bg-blue-600 text-white px-3 py-1 text-xs disabled:opacity-60"
      title="Lead wieder aktiv setzen"
    >
      {loading ? '…' : 'Wieder aktiv setzen'}
    </button>
  )
}