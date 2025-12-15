'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminMenu() {
  const cards = [
    {
      href: '/dashboard/admin/imports',
      title: 'Monatsdaten importieren',
      desc: 'TikTok-Excel (Monatsbasis) hochladen. Import triggert automatisch die SWS-Berechnung.'
    },
    {
      href: '/dashboard/admin/referrals',
      title: 'Werber ↔ Bewerber nachtragen',
      desc: 'Bestehende Beziehungen anlegen oder per Override korrigieren (First-Touch beachten).'
    },
    {
      href: '/dashboard/admin/points',
      title: 'Punkte manuell anpassen',
      desc: 'Punkte gutschreiben oder abziehen – mit Grund. Optional mit Bewerber- und Monatsbezug.'
    },
    {
      href: '/dashboard/admin/recalc',
      title: 'SWS neu berechnen',
      desc: 'Manueller Recalc – nur nutzen, wenn nötig. (Import erledigt das automatisch.)'
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Admin – SWS</h1>
      <p className="text-sm text-gray-500 mb-6">
        Wähle eine Aktion. Diese Seite ändert keine bestehenden Daten automatisch.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border p-4 hover:shadow-md transition"
          >
            <div className="text-lg font-medium">{c.title}</div>
            <div className="text-sm text-gray-600 mt-1">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
