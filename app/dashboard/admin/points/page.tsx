'use client'
import { useEffect, useState } from 'react'

type WerberItem = { id: string; slug: string; name: string | null; status: string | null }

export default function AdminPointsAdjust() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<WerberItem[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [points, setPoints] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [creatorId, setCreatorId] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(()=>{
    const t = setTimeout(async ()=>{
      const res = await fetch('/api/admin/werber/search?q=' + encodeURIComponent(q))
      const json = await res.json()
      if (res.ok) setItems(json.items || [])
    }, 250)
    return ()=>clearTimeout(t)
  }, [q])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/admin/sws/adjust', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          werber_id: selectedId,
          useSlug: false,
          points: Number(points),
          reason,
          creator_id: creatorId || undefined,
          period_month: period || undefined
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Fehler')
      setMsg('Punkte gebucht. Event-ID: ' + (json.event_id || '—'))
      setPoints(''); setReason(''); setCreatorId(''); setPeriod('')
    } catch (e:any) { setErr(e.message || String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">Punkte manuell anpassen</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Werber suchen</label>
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Suche nach slug oder name…"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <div className="mt-2 max-h-48 overflow-auto border rounded-lg">
            {items.map(it => (
              <label key={it.id} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 cursor-pointer">
                <input
                  type="radio"
                  name="w"
                  value={it.id}
                  checked={selectedId === it.id}
                  onChange={()=>setSelectedId(it.id)}
                />
                <div className="text-sm">
                  <div className="font-medium">{it.slug}{it.name ? ` – ${it.name}` : ''}</div>
                  <div className="text-gray-500 text-xs">{it.id}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Punkte (+/−)</label>
            <input
              value={points}
              onChange={e=>setPoints(e.target.value)}
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="z. B. 500 oder -300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bezug Monat (optional)</label>
            <input
              value={period}
              onChange={e=>setPeriod(e.target.value)}
              placeholder="YYYY-MM"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Grund</label>
          <input
            value={reason}
            onChange={e=>setReason(e.target.value)}
            placeholder="z. B. Korrektur November, Kulanz…"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bewerber – Creator*in-ID (optional)</label>
          <input
            value={creatorId}
            onChange={e=>setCreatorId(e.target.value)}
            placeholder="falls sich die Anpassung auf einen Geworbenen bezieht"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedId || !points || !reason || loading}
          className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Buche…' : 'Punkte buchen'}
        </button>
      </form>

      {err && <div className="mt-4 text-sm text-red-600">{err}</div>}
      {msg && <div className="mt-4 text-sm text-green-600">{msg}</div>}
    </div>
  )
}
