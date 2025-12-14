// app/dashboard/admin/leads/page.tsx
'use client'
import React from 'react'

type Lead = any
type Manager = { id: string, name?: string|null }

export default function AdminLeadsPage(){
  const [rows, setRows] = React.useState<Lead[]>([])
  const [managers, setManagers] = React.useState<Manager[]>([])
  const [managerId, setManagerId] = React.useState<string>('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>('')

  async function loadManagers(){
    try{
      const res = await fetch('/api/admin/managers', { cache:'no-store', credentials:'include' })
      if (!res.ok) return
      const js = await res.json()
      setManagers(js.items || js.data || [])
    }catch{}
  }

  async function loadLeads(){
    setLoading(true); setError('')
    try{
      const qs = managerId ? ('?manager_id=' + encodeURIComponent(managerId)) : ''
      const res = await fetch('/api/leads/for-dashboard' + qs, { cache:'no-store', credentials:'include' })
      if (!res.ok) throw new Error(await res.text())
      const js = await res.json()
      setRows(js.items || [])
    }catch(e:any){ setError(String(e?.message || e)) }
    setLoading(false)
  }

  React.useEffect(()=>{ loadManagers() }, [])
  React.useEffect(()=>{ loadLeads() }, [managerId])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Leads (Admin)</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm">Manager:</label>
          <select className="border rounded px-2 py-1 text-sm" value={managerId} onChange={e=>setManagerId(e.target.value)}>
            <option value="">Alle</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
          </select>
          <button onClick={loadLeads} className="px-3 py-1.5 rounded border">Aktualisieren</button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600 whitespace-pre-wrap">{error}</div>}
      {loading ? <div>Lade…</div> : (
        <div className="rounded-2xl border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2">Handle</th>
                <th className="px-3 py-2">Manager</th>
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
                  <td className="px-3 py-2">{r.manager_id || '—'}</td>
                  <td className="px-3 py-2">{r.source || '—'}</td>
                  <td className="px-3 py-2">{r.status || '—'}</td>
                  <td className="px-3 py-2">{r.contact_date ? new Date(r.contact_date).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">{r.follow_up ? new Date(r.follow_up).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!rows.length && <tr><td className="px-3 py-4 text-sm opacity-70" colSpan={6}>Keine Leads gefunden.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
