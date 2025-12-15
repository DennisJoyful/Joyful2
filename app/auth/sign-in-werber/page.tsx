'use client'
import Link from 'next/link'

export default function SignInWerberPage() {
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Werber Login (Slug/PIN)</h1>
      <p className="text-sm text-gray-600">
        Nutze die zentrale Anmeldeseite, wähle dort den Tab <strong>Werber</strong> und logge dich mit <em>Slug & PIN</em> ein.
      </p>
      <Link href="/auth/sign-in" className="inline-block rounded-xl px-4 py-2 bg-black text-white">
        Zur Anmeldeseite
      </Link>
      <p className="text-xs text-gray-500 mt-2">
        Falls du im Redirect-Loop landest: <code>/auth/clear-session</code> aufrufen.
      </p>
    </main>
  )
}
