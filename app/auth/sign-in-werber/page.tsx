'use client'
import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WerberSignInPage(): JSX.Element {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const res = await fetch('/api/werber/pin-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim().toLowerCase(), pin })
      })
      const json = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(json?.error || 'Login fehlgeschlagen. Bitte Eingaben prüfen.')
      router.push('/dashboard/werber')
    } catch (e: any) {
      setError(e.message || 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Werber Login</h1>
      <p className="text-sm text-gray-600 mb-4">Anmeldung mit Werber‑Slug & PIN.</p>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Werber‑Slug</label>
          <input
            value={slug}
            onChange={(e)=>setSlug(e.target.value)}
            placeholder="z. B. max-stream"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">PIN</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            value={pin}
            onChange={(e)=>setPin(e.target.value)}
            placeholder="4–8 Ziffern"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={!slug || !pin || loading}
          className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50 w-full"
        >
          {loading ? 'Prüfe…' : 'Einloggen'}
        </button>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>

      <div className="text-xs text-gray-500 mt-4">
        Manager/Admin mit E‑Mail/Passwort?&nbsp;
        <a href="/auth/sign-in-manager" className="underline">Hier entlang</a>
      </div>
    </div>
  )
}
