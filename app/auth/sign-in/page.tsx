export const dynamic = 'force-dynamic'
import SignInForm from '@/components/auth/SignInForm'

export default function SignInPage(){
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Anmelden</h1>
      <p className="text-sm text-gray-600 mb-4">Manager: E‑Mail & Passwort · Werber: Slug & PIN</p>
      <SignInForm />
    </main>
  )
}
