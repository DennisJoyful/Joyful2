'use client'
import * as React from 'react'
import { useState } from 'react'

export default function PinDebugPage(): JSX.Element {
  const [slug, setSlug] = useState('')
  const [pin, setPin] = useState('')
  const [id, setId] = useState('')
  const [out, setOut] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function test(e: React.FormEvent) {
    e.preventDefault()
    setOut(''); setLoading(true)
    try {
      const res = await fetch('/api/werber/pin-login?debug=1', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-debug': '1' },
        body: JSON.stringify({ slug: slug.trim() || undefined, id: id.trim() || undefined, pin })
      })
      const text = await res.text()
      setOut(text)
    } catch (e:any) {
      setOut(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6 space-y-4">
      <h1 className="text-xl font-semibold">PIN Debug</h1>
      <p className="text-sm text-gray-600">Setze temporär <code>ALLOW_PIN_DEBUG=1</code> in den Env Vars, dann siehst du Detailgründe.</p>
      <form onSubmit={test} className="space-y-3 border rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Werber‑Slug</label>
            <input value={slug} onChange={(e)=>setSlug(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="z. B. max-stream"/>
          </div>
          <div>
            <label className="block text-sm mb-1">ODER Werber‑ID</label>
            <input value={id} onChange={(e)=>setId(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="uuid"/>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">PIN</label>
          <input type="password" value={pin} onChange={(e)=>setPin(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" required/>
        </div>
        <button type="submit" disabled={loading || (!slug && !id) || !pin} className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50">
          {loading ? 'Teste…' : 'Test ausführen'}
        </button>
      </form>
      <pre className="text-xs whitespace-pre-wrap bg-gray-50 border rounded p-3">{out || '—'}</pre>
    </div>
  )
}
