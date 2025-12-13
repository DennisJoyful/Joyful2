// app/manager/leads/layout.tsx
import Link from 'next/link'

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Link
          href="/manager/leads/create"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 bg-black text-white hover:opacity-90"
        >
          <span>+ Lead hinzufügen</span>
        </Link>
      </div>
      {children}
    </div>
  )
}
