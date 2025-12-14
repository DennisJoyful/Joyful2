// Placeholder for 'Werber anlegen' (we keep it minimal; no backend changes here)
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function WerberPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Werber anlegen</h1>
      <p className="text-sm text-muted-foreground">
        Hier kannst du später Werber anlegen und Einladungslinks verwalten.
      </p>
      <div className="rounded-lg border p-4">
        <p className="text-sm">
          Bereits vorhanden: SWS Formular unter <code>/sws/[werberSlug]</code>.
        </p>
      </div>
      <Link href="/dashboard/manager" className="inline-flex items-center px-3 py-1.5 rounded-md border hover:bg-muted">
        Zurück zum Manager-Dashboard
      </Link>
    </div>
  )
}
