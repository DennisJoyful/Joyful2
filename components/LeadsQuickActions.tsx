// components/LeadsQuickActions.tsx
'use client'
import { useState } from 'react'

export default function LeadsQuickActions() {
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [live, setLive] = useState<string | null>(null)

  async function setContact() {
    setBusy(true); setMsg(null)
    const r = await fetch('/api/manager/leads/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handle }),
    })
    setBusy(false)
    if (!r.ok) {
      const d = await r.json().catch(()=>({}))
      setMsg('Fehler: ' + (d?.error || r.statusText))
      return
    }
    setMsg('Kontakt gesetzt → Status: keine Reaktion, Follow-up +5 Tage')
  }

  async function checkLive() {
    setBusy(true); setLive(null); setMsg(null)
    const r = await fetch('/api/manager/leads/live?handle=' + encodeURIComponent(handle), { cache: 'no-store' })
    setBusy(false)
    const d = await r.json().catch(()=>({}))
    if (d?.error) setMsg('Fehler: ' + d.error)
    else if (d?.live === true) setLive('LIVE ✅')
    else if (d?.live === false) setLive('offline ❌')
    else setLive('unbekannt (nicht prüfbar)')
  }

  return (
    <div className="rounded-xl border p-3 bg-white grid gap-2">
      <div className="font-medium">Schnell-Aktionen (per Handle)</div>
      <div className="grid sm:grid-cols-4 gap-2">
        <input
          className="border rounded p-2 col-span-2"
          placeholder="TikTok Handle (ohne @)"
          value={handle}
          onChange={e=>setHandle(e.target.value)}
        />
        <button
          onClick={setContact}
          disabled={busy || !handle.trim()}
          className="rounded bg-black text-white px-3 py-2 disabled:opacity-50"
        >
          Kontakt gesetzt
        </button>
        <button
          onClick={checkLive}
          disabled={busy || !handle.trim()}
          className="rounded border px-3 py-2 disabled:opacity-50"
        >
          Live prüfen
        </button>
      </div>
      <div className="text-sm text-gray-600">
        Tipp: <a className="underline" target="_blank" href={handle ? `https://www.tiktok.com/@${handle}/live` : '#'}>Live-Seite öffnen</a>
      </div>
      {live && <div className="text-sm">{live}</div>}
      {msg && <div className="text-sm">{msg}</div>}
    </div>
  )
}
