'use client'
import { useState } from 'react'

export default function AdminRecalc() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setLoading(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/sws/recalc', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.error || 'Fehler beim Recalc')
      }
      setMsg('Recalc gestartet/ausgeführt.')
    } catch (e:any) { setErr(e.message || String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">SWS neu berechnen</h1>
      <div className="rounded-2xl border p-4 space-y-3">
        <p className="text-sm text-gray-600">
          Normalerweise nicht nötig, da der Import automatisch berechnet.
        </p>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Berechne…' : 'Neu berechnen'}
        </button>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {msg && <div className="text-sm text-green-600">{msg}</div>}
      </div>
    </div>
  )
}
