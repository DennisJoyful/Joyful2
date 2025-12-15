'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ClearSessionPage() {
  const supabase = createClientComponentClient()
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        // 1) Werber-Cookie serverseitig löschen
        await fetch('/api/auth/clear-werber', { method: 'POST' })
        // 2) Supabase-Session clientseitig abmelden
        await supabase.auth.signOut()
        setDone(true)
      } catch (e:any) {
        setErr(e?.message || String(e))
      }
    })()
  }, [])

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Session zurückgesetzt</h1>
      {err ? (
        <p className="text-sm text-red-600">Fehler: {err}</p>
      ) : (
        <p className="text-sm text-gray-600">
          Cookies & Session wurden bereinigt{done ? ' ✔️' : ' …'}
        </p>
      )}
      <div className="space-x-2">
        <Link href="/auth/sign-in" className="inline-block rounded-xl px-4 py-2 bg-black text-white">
          Zur Anmeldung
        </Link>
        <Link href="/" className="inline-block rounded-xl px-4 py-2 border">Startseite</Link>
      </div>
    </main>
  )
}
