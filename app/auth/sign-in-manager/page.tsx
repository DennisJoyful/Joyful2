'use client'
import Link from 'next/link'

export default function SignInManagerPage() {
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Manager/Admin Login</h1>
      <p className="text-sm text-gray-600">
        Nutze die zentrale Anmeldeseite, um dich mit E‑Mail & Passwort einzuloggen.
      </p>
      <Link href="/auth/sign-in" className="inline-block rounded-xl px-4 py-2 bg-black text-white">
        Zur Anmeldeseite
      </Link>
      <p className="text-xs text-gray-500 mt-2">
        Wenn du in einer Weiterleitungsschleife landest, rufe <code>/auth/clear-session</code> auf.
      </p>
    </main>
  )
}
