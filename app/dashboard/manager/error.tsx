// app/dashboard/manager/error.tsx
'use client'

export default function ManagerError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="m-6 rounded-md border border-red-300 bg-red-50 p-4">
      <div className="font-semibold">Fehler in der Manager-Ansicht</div>
      <div className="mt-1 text-sm opacity-80">{error?.message || 'Unbekannter Fehler'}</div>
      {error?.digest && <div className="mt-1 text-xs opacity-60">Digest: {error.digest}</div>}
      <div className="mt-3 flex gap-3 text-sm">
        <button onClick={() => reset()} className="rounded-md bg-red-600 px-3 py-1 text-white">Neu laden</button>
        <a href="/api/health" className="underline">Health-Check öffnen</a>
      </div>
    </div>
  )
}