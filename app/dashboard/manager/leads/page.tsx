// app/dashboard/manager/leads/page.tsx
'use client'
import React from 'react'

type Lead = any

export default function ManagerLeadsPage(){
  const [rows, setRows] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>('')

  async function load(){
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/leads/for-dashboard', { cache: 'no-store', credentials: 'include' })
      if (!res.ok) throw new Error(await res.text())
      const js = await res.json()
      setRows(js.items || [])
    } catch (e: any) {
      setError(String(e?.message || e))
    }
    setLoading(false)
  }

  React.useEffect(()=>{ load() }, [])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <button onClick={load} className="px-3 py-1.5 rounded border">Aktualisieren</button>
      </div>
      {error && <div className="text-sm text-red-600 whitespace-pre-wrap">{error}</div>}
      {loading ? <div>Lade…</div> : (
        <div className="rounded-2xl border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2">Handle</th>
                <th className="px-3 py-2">Quelle</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Kontakt</th>
                <th className="px-3 py-2">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.handle || '—'}</td>
                  <td className="px-3 py-2">{r.source || '—'}</td>
                  <td className="px-3 py-2">{r.status || '—'}</td>
                  <td className="px-3 py-2">{r.contact_date ? new Date(r.contact_date).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">{r.follow_up ? new Date(r.follow_up).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!rows.length && <tr><td className="px-3 py-4 text-sm opacity-70" colSpan={5}>Keine Leads gefunden.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
