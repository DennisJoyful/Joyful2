// components/leads/LeadsTable.tsx
'use client'

import { useMemo, useState, useEffect } from 'react'
import LeadLiveBadge from '@/components/LeadLiveBadge'
import LeadStatusSelect from '@/components/leads/LeadStatusSelect'
import LeadActions from '@/components/leads/LeadActions'

type Lead = {
  id: string
  handle?: string | null
  status?: string | null
  follow_up_at?: string | null
  follow_up_date?: string | null
  created_at?: string | null
  source?: string | null
  notes?: string | null
  utm?: any | null
  extras?: any | null
}

type Props = { rows: Lead[] }

type SortKey = 'created_at' | 'handle' | 'status' | 'follow_up_date' | 'follow_up_at' | 'source' | 'live'

export default function LeadsTable({ rows }: Props){
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [source, setSource] = useState<string>('all')
  const [follow, setFollow] = useState<string>('all') // due, today, future, none
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  // client-side live cache: map handle -> boolean
  const [liveMap, setLiveMap] = useState<Record<string, boolean>>({})

  // derive unique sources/statuses
  const sources = useMemo(() => {
    const s = new Set<string>()
    rows.forEach(r => { if (r.source) s.add(String(r.source)) })
    return Array.from(s).sort()
  }, [rows])

  const statuses = useMemo(() => {
    const s = new Set<string>()
    rows.forEach(r => { if (r.status) s.add(String(r.status)) })
    return Array.from(s).sort()
  }, [rows])

  // Filtering
  const filtered = useMemo(() => {
    const now = new Date()
    return rows.filter(r => {
      const hay = (r.handle || '') + ' ' + (r.notes || '') + ' ' + JSON.stringify(r.utm || {}) + ' ' + JSON.stringify(r.extras || {})
      if (q && !hay.toLowerCase().includes(q.toLowerCase())) return false
      if (status !== 'all' && r.status !== status) return false
      if (source !== 'all' && r.source !== source) return false
      if (follow !== 'all') {
        const d = r.follow_up_date ? new Date(r.follow_up_date) : null
        if (follow === 'none') {
          if (d) return false
        } else if (follow === 'due') {
          if (!d || d > now) return false
        } else if (follow === 'today') {
          if (!d) return false
          const sameDay = d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate()
          if (!sameDay) return false
        } else if (follow === 'future') {
          if (!d || d <= now) return false
        }
      }
      return true
    })
  }, [rows, q, status, source, follow])

  // Sorting (including a pseudo 'live' key)
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'live') {
        const la = liveMap[(a.handle||'').toLowerCase()] ? 1 : 0
        const lb = liveMap[(b.handle||'').toLowerCase()] ? 1 : 0
        if (la !== lb) return (la - lb) * dir
      } else {
        const va = (a as any)[sortKey] ?? ''
        const vb = (b as any)[sortKey] ?? ''
        const na = typeof va === 'string' ? va.toLowerCase() : String(va)
        const nb = typeof vb === 'string' ? vb.toLowerCase() : String(vb)
        if (na < nb) return -1 * dir
        if (na > nb) return 1 * dir
      }
      // tie-break by created_at desc
      const ca = a.created_at || ''
      const cb = b.created_at || ''
      return (ca < cb ? 1 : -1)
    })
    return arr
  }, [filtered, sortKey, sortDir, liveMap])

  function toggleSort(k: SortKey){
    if (sortKey === k) setSortDir(d => d==='asc'?'desc':'asc')
    else { setSortKey(k); setSortDir(k==='handle'?'asc':'desc') }
  }

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="grid md:flex gap-2 md:items-end md:justify-between">
        <div className="flex-1 grid sm:flex gap-2">
          <div className="relative flex-1">
            <input
              value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Suche (Handle, Notizen, UTM, Extras)…"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <select className="border rounded-md px-3 py-2"
            value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="all">Alle Status</option>
            {statuses.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2"
            value={source} onChange={e=>setSource(e.target.value)}>
            <option value="all">Alle Quellen</option>
            {sources.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2"
            value={follow} onChange={e=>setFollow(e.target.value)}>
            <option value="all">Follow‑Up: alle</option>
            <option value="due">Überfällig</option>
            <option value="today">Heute</option>
            <option value="future">Zukünftig</option>
            <option value="none">Keins</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button className="border rounded-md px-3 py-2" onClick={()=>toggleSort('handle')}>
            Sortieren: Alphabetisch {sortKey==='handle' ? (sortDir==='asc'?'↑':'↓') : ''}
          </button>
          <button className="border rounded-md px-3 py-2" onClick={()=>toggleSort('live')}>
            Sortieren: Live {sortKey==='live' ? (sortDir==='asc'?'↑':'↓') : ''}
          </button>
          <button className="border rounded-md px-3 py-2" onClick={()=>toggleSort('status')}>
            Sortieren: Status {sortKey==='status' ? (sortDir==='asc'?'↑':'↓') : ''}
          </button>
          <button className="border rounded-md px-3 py-2" onClick={()=>toggleSort('source')}>
            Sortieren: Quelle {sortKey==='source' ? (sortDir==='asc'?'↑':'↓') : ''}
          </button>
          <button className="border rounded-md px-3 py-2" onClick={()=>toggleSort('follow_up_date')}>
            Sortieren: Follow‑Up {sortKey==='follow_up_date' ? (sortDir==='asc'?'↑':'↓') : ''}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-gray-500">Keine Leads gefunden.</div>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-[1100px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>toggleSort('handle')}>Handle</th>
                <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>toggleSort('live')}>Live</th>
                <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>toggleSort('source')}>Quelle</th>
                <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>toggleSort('status')}>Lead‑Status</th>
                <th className="px-3 py-2 text-left">Follow‑Up (Date)</th>
                <th className="px-3 py-2 text-left">Follow‑Up (At)</th>
                <th className="px-3 py-2 text-left">Details</th>
                <th className="px-3 py-2 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(l => (
                <tr key={l.id} className="border-t align-top">
                  <td className="px-3 py-2">{l.handle ?? '—'}</td>
                  <td className="px-3 py-2"><LeadLiveBadge handle={l.handle} /></td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-white">
                      {l.source ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2"><LeadStatusSelect id={l.id} value={l.status} /></td>
                  <td className="px-3 py-2">{l.follow_up_date ? new Date(l.follow_up_date).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">{l.follow_up_at ? new Date(l.follow_up_at).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2">
                    <details>
                      <summary className="cursor-pointer select-none text-sm text-gray-700">Anzeigen</summary>
                      <div className="mt-2 space-y-1">
                        {l.notes ? <div><span className="font-medium">Notizen:</span> {l.notes}</div> : null}
                        {l.utm ? <pre className="bg-gray-50 rounded p-2 overflow-x-auto">{JSON.stringify(l.utm, null, 2)}</pre> : null}
                        {l.extras ? <pre className="bg-gray-50 rounded p-2 overflow-x-auto">{JSON.stringify(l.extras, null, 2)}</pre> : null}
                        {(!l.notes && !l.utm && !l.extras) ? <div className="text-gray-500">Keine zusätzlichen Angaben.</div> : null}
                      </div>
                    </details>
                  </td>
                  <td className="px-3 py-2"><LeadActions id={l.id} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}