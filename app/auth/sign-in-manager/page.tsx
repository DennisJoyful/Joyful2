'use client'
import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ManagerSignInPage(): JSX.Element {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // Einheitliches Ziel: /dashboard (vermeidet 404 auf Subrouten)
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Manager/Admin Login</h1>
      <p className="text-sm text-gray-600 mb-4">Anmeldung mit E‑Mail & Passwort.</p>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border p-4">
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
          disabled={!email || !password || loading}
          className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50 w-full"
        >
          {loading ? 'Prüfe…' : 'Einloggen'}
        </button>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>

      <div className="text-xs text-gray-500 mt-4">
        Werber mit Slug/PIN?&nbsp;
        <a href="/auth/sign-in-werber" className="underline">Hier entlang</a>
      </div>
    </div>
  )
}
