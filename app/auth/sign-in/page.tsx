import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function LegacySignInRedirect() {
  // Wir nutzen jetzt zwei getrennte Loginseiten.
  // Diese alte Route leitet sauber weiter auf die Manager-Loginseite.
  redirect('/auth/sign-in-manager')
}
