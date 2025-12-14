// components/LeadCreateForm.tsx
'use client'
import { useState } from 'react'

export default function LeadCreateForm({ onCreated }: { onCreated?: (row: any) => void }) {
  const [handle, setHandle] = useState('')
  const [contact, setContact] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!handle.trim()) { setErr('Bitte Handle eingeben.'); return }
    setBusy(true)
    const res = await fetch('/api/manager/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handle, contact_date: contact || null }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(()=>({}))
      setErr(data?.error || 'Fehler beim Anlegen.')
      return
    }
    const data = await res.json()
    setHandle(''); setContact('')
    onCreated?.(data)
  }

  return (
    <form onSubmit={submit} className="grid gap-2 bg-white border rounded-xl p-3 max-w-2xl">
      <div className="font-medium">Lead manuell anlegen</div>
      <div className="grid sm:grid-cols-3 gap-2">
        <input
          className="border rounded p-2"
          placeholder="TikTok Handle (ohne @)"
          value={handle}
          onChange={e=>setHandle(e.target.value)}
        />
        <input
          className="border rounded p-2"
          type="date"
          value={contact}
          onChange={e=>setContact(e.target.value)}
          placeholder="Kontaktdatum (optional)"
        />
        <button
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={busy}
          type="submit"
        >
          {busy ? 'Speichere…' : 'Anlegen'}
        </button>
      </div>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="text-xs text-gray-500">Follow-up-Datum wird automatisch +5 Tage gesetzt, wenn Kontaktdatum angegeben ist.</div>
    </form>
  )
}
