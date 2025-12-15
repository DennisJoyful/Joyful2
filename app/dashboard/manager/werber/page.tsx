'use client'
import { useEffect, useState } from 'react'

type Werber = { id: string; slug: string; name: string | null; status: string | null; created_at: string; pin_set: boolean }

export default function ManagerWerberPage() {
  const [list, setList] = useState<Werber[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [errList, setErrList] = useState<string | null>(null)

  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [createErr, setCreateErr] = useState<string | null>(null)

  const [pinFor, setPinFor] = useState<string>('') // werber_id
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinMsg, setPinMsg] = useState<string | null>(null)
  const [pinErr, setPinErr] = useState<string | null>(null)

  async function refresh() {
    setLoadingList(true); setErrList(null)
    try {
      const res = await fetch('/api/manager/werber/list')
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Fehler beim Laden')
      setList(json.items || [])
    } catch (e:any) { setErrList(e.message || String(e)) }
    finally { setLoadingList(false) }
  }

  useEffect(() => { refresh() }, [])

  async function createWerber(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true); setCreateMsg(null); setCreateErr(null)
    try {
      const res = await fetch('/api/werber/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim().toLowerCase(), name: name || undefined })
      })
      const json = await res.json()
      if (!res.ok && res.status !== 200) throw new Error(json?.error || json?.message || 'Fehler bei Anlage')
      const finalSlug = json.slug || slug.trim().toLowerCase()
      setCreateMsg(json.message || `Werber gespeichert. Formular: /sws/${finalSlug}`)
      setSlug(''); setName('')
      await refresh()
    } catch (e:any) { setCreateErr(e.message || String(e)) }
    finally { setCreating(false) }
  }

  async function setPin(e: React.FormEvent) {
    e.preventDefault()
    setPinMsg(null); setPinErr(null)
    if (!pinFor) { setPinErr('Bitte zuerst einen Werber in der Liste auswählen.'); return }
    if (!pin || pin !== pin2) { setPinErr('PINs stimmen nicht überein.'); return }
    if (pin.length < 4 || pin.length > 8) { setPinErr('PIN-Länge 4–8 Ziffern.'); return }
    if (!/^\d+$/.test(pin)) { setPinErr('PIN darf nur Ziffern enthalten.'); return }

    try {
      const res = await fetch('/api/werber/update-pin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ werber_id: pinFor, pin })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Fehler beim Setzen der PIN')
      setPinMsg('PIN gespeichert.')
      setPin(''); setPin2('')
      await refresh()
    } catch (e:any) { setPinErr(e.message || String(e)) }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Werber anlegen & verwalten</h1>
        <p className="text-sm text-gray-600">Lege neue Werber an, setze/ändere PINs und öffne das SWS-Formular.</p>
      </header>

      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium mb-3">Neuen Werber anlegen</h2>
        <form onSubmit={createWerber} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Slug*</label>
            <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="z. B. max-stream" className="w-full border rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Anzeigename (optional)</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="z. B. Max Mustermann" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button disabled={!slug || creating} className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50 w-full">
              {creating ? 'Speichere…' : 'Werber anlegen'}
            </button>
          </div>
        </form>
        {createErr && <div className="mt-2 text-sm text-red-600">{createErr}</div>}
        {createMsg && <div className="mt-2 text-sm text-green-600">{createMsg}</div>}
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium mb-3">Bestehende Werber</h2>
        {loadingList ? (
          <div className="text-sm text-gray-500">Lade…</div>
        ) : errList ? (
          <div className="text-sm text-red-600">{errList}</div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Klicke auf einen Eintrag, um ihn für die PIN-Vergabe auszuwählen.</div>
            <div className="max-h-80 overflow-auto divide-y border rounded-xl">
              {list.map((w) => (
                <button
                  key={w.id}
                  onClick={()=>setPinFor(w.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${pinFor===w.id ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{w.slug}{w.name ? ` – ${w.name}` : ''}</div>
                    <div className="text-xs text-gray-500">{new Date(w.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Formular: <span className="font-mono">/sws/{w.slug}</span> · PIN: {w.pin_set ? 'gesetzt' : 'fehlend'}
                  </div>
                </button>
              ))}
              {list.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">Noch keine Werber vorhanden.</div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium mb-3">PIN setzen / ändern</h2>
        <form onSubmit={setPin} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3 text-sm text-gray-600">
            Ausgewählter Werber-ID: <span className="font-mono">{pinFor || '–'}</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PIN</label>
            <input value={pin} onChange={e=>setPin(e.target.value)} type="password" inputMode="numeric" pattern="\d*" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="4–8 Ziffern" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PIN wiederholen</label>
            <input value={pin2} onChange={e=>setPin2(e.target.value)} type="password" inputMode="numeric" pattern="\d*" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="nochmal eingeben" />
          </div>
          <div className="flex items-end">
            <button disabled={!pinFor} className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50 w-full">PIN speichern</button>
          </div>
        </form>
        {pinErr && <div className="mt-2 text-sm text-red-600">{pinErr}</div>}
        {pinMsg && <div className="mt-2 text-sm text-green-600">{pinMsg}</div>}
      </section>
    </div>
  )
}
