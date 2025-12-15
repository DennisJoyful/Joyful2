'use client'
import { useEffect, useState } from 'react'

type WerberItem = { id: string; slug: string; name: string | null; status: string | null }

export default function AdminReferrals() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<WerberItem[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [creatorId, setCreatorId] = useState('')
  const [override, setOverride] = useState(false)
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
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          creator_id: creatorId,
          werber_id: selectedId,
          useSlug: false,
          override
        })
      })
      const json = await res.json()
      if (!res.ok && res.status !== 207) throw new Error(json?.error || 'Fehler')
      setMsg('Gespeichert' + (json.warning ? ` (Hinweis: ${json.warning})` : ''))
    } catch (e:any) { setErr(e.message || String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">Werber ↔ Bewerber nachtragen</h1>
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

        <div>
          <label className="block text-sm font-medium mb-1">Bewerber – Creator*in-ID</label>
          <input
            value={creatorId}
            onChange={e=>setCreatorId(e.target.value)}
            placeholder="Datenwahrheit von TikTok (ID)"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={override} onChange={e=>setOverride(e.target.checked)} />
          First-Touch überschreiben (bewusst)
        </label>

        <button
          type="submit"
          disabled={!selectedId || !creatorId || loading}
          className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Speichere…' : 'Beziehung speichern'}
        </button>
      </form>

      {err && <div className="mt-4 text-sm text-red-600">{err}</div>}
      {msg && <div className="mt-4 text-sm text-green-600">{msg}</div>}
    </div>
  )
}
