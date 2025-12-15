'use client'
import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Tab = 'manager' | 'werber'

export default function MixedSignInPage(): JSX.Element {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [tab, setTab] = useState<Tab>('manager')

  // Manager form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mLoading, setMLoading] = useState(false)
  const [mError, setMError] = useState<string | null>(null)

  // Werber form
  const [slug, setSlug] = useState('')
  const [pin, setPin] = useState('')
  const [wLoading, setWLoading] = useState(false)
  const [wError, setWError] = useState<string | null>(null)

  async function onManagerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMError(null); setMLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // fetch role and redirect
      const { data, error: profErr } = await supabase
        .from('profiles')
        .select('role')
        .limit(1)
        .single()
      if (profErr) {
        // fallback: generic dashboard if profiles fetch fails
        router.push('/dashboard')
        return
      }
      const role = (data?.role || '').toString()
      if (role === 'admin') router.push('/dashboard/admin')
      else if (role === 'manager') router.push('/dashboard/manager')
      else if (role === 'werber') router.push('/dashboard/werber')
      else router.push('/dashboard')
    } catch (e: any) {
      setMError(e.message || 'Login fehlgeschlagen')
    } finally {
      setMLoading(false)
    }
  }

  async function onWerberSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setWError(null); setWLoading(true)
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
      setWError(e.message || 'Login fehlgeschlagen')
    } finally {
      setWLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Anmelden</h1>
      <p className="text-sm text-gray-600 mb-4">
        Wähle aus, wie du dich anmelden möchtest.
      </p>

      <div className="flex rounded-xl overflow-hidden border mb-4">
        <button
          onClick={()=>setTab('manager')}
          className={\`flex-1 px-4 py-2 text-sm \${tab==='manager' ? 'bg-black text-white' : ''}\`}
        >
          Manager (E‑Mail / Passwort)
        </button>
        <button
          onClick={()=>setTab('werber')}
          className={\`flex-1 px-4 py-2 text-sm \${tab==='werber' ? 'bg-black text-white' : ''}\`}
        >
          Werber (Slug / PIN)
        </button>
      </div>

      {tab === 'manager' ? (
        <form onSubmit={onManagerSubmit} className="space-y-3 rounded-2xl border p-4">
          <div>
            <label className="block text-sm font-medium mb-1">E‑Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!email || !password || mLoading}
            className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50 w-full"
          >
            {mLoading ? 'Prüfe…' : 'Einloggen'}
          </button>
          {mError && <div className="text-sm text-red-600">{mError}</div>}
        </form>
      ) : (
        <form onSubmit={onWerberSubmit} className="space-y-3 rounded-2xl border p-4">
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
            disabled={!slug || !pin || wLoading}
            className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50 w-full"
          >
            {wLoading ? 'Prüfe…' : 'Einloggen'}
          </button>
          {wError && <div className="text-sm text-red-600">{wError}</div>}
          <p className="text-xs text-gray-500">
            Hinweis: Der Werber‑Login setzt ein Sitzungscookie und benötigt kein Benutzerkonto.
          </p>
        </form>
      )}
    </div>
  )
}
