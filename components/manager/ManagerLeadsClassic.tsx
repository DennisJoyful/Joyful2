'use client'
import { useState, useMemo, useTransition } from 'react'

export type ClassicLead = {
  id: string
  handle: string | null
  status: string | null
  source: string | null
  notes: string | null
  created_at: string | null
  contact_date: string | null
  contacted_at: string | null
  follow_up_at: string | null
  follow_up_date: string | null
  last_follow_up_at: string | null
  follow_up_sent: string | null
  follow_up_sent_count: number | null
  follow_up_count: number | null
  archived_at: string | null
  archived_by_manager_id: string | null
  werber_id: string | null
  creator_id: string | null
  manager_id: string
}

const STATUS_OPTIONS = ['new','contacted','no_response','live','archived']

function LiveBadge({ status }: { status: string | null }) {
  if (status !== 'live') return null
  return <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">LIVE</span>
}

async function updateLead(id: string, patch: Record<string, any>) {
  const res = await fetch('/api/leads/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j?.error || 'Update failed')
  }
  return res.json()
}

export default function ManagerLeadsClassic({ initial }: { initial: ClassicLead[] }) {
  const [rows, setRows] = useState<ClassicLead[]>(initial)
  const [isPending, startTransition] = useTransition()

  const sorted = useMemo(() => {
    return [...rows].sort((a,b) => (b.created_at || '').localeCompare(a.created_at || ''))
  }, [rows])

  const onStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateLead(id, { status })
        setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      } catch (e) {
        console.error(e)
        alert((e as Error).message)
      }
    })
  }

  const onArchive = (id: string) => {
    startTransition(async () => {
      try {
        await updateLead(id, { status: 'archived', archived_at: new Date().toISOString() })
        setRows(prev => prev.filter(r => r.id !== id))
      } catch (e) {
        console.error(e)
        alert((e as Error).message)
      }
    })
  }

  const onContactSet = (id: string) => {
    startTransition(async () => {
      try {
        await updateLead(id, { contacted_at: new Date().toISOString(), status: 'contacted' })
        setRows(prev => prev.map(r => r.id === id ? { ...r, contacted_at: new Date().toISOString(), status: 'contacted' } : r))
      } catch (e) {
        console.error(e)
        alert((e as Error).message)
      }
    })
  }

  const onFollowUp = (id: string) => {
    startTransition(async () => {
      try {
        await updateLead(id, { follow_up_at: new Date().toISOString(), follow_up_sent_count: (rows.find(r=>r.id===id)?.follow_up_sent_count || 0) + 1 })
        setRows(prev => prev.map(r => r.id === id ? { ...r, follow_up_at: new Date().toISOString(), follow_up_sent_count: (r.follow_up_sent_count || 0) + 1 } : r))
      } catch (e) {
        console.error(e)
        alert((e as Error).message)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">{sorted.length} Leads</div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">Handle</th>
              <th className="text-left p-2">Quelle</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Kontakt</th>
              <th className="text-left p-2">Follow-up</th>
              <th className="text-right p-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.id} className="border-t">
                <td className="p-2 font-medium">@{row.handle}{<LiveBadge status={row.status} />}</td>
                <td className="p-2">{row.source}</td>
                <td className="p-2">
                  <select
                    className="border rounded-md px-2 py-1 bg-background"
                    defaultValue={row.status ?? 'new'}
                    onChange={(e) => onStatusChange(row.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="p-2">{row.contacted_at ? new Date(row.contacted_at).toLocaleString() : '–'}</td>
                <td className="p-2">{row.follow_up_at ? new Date(row.follow_up_at).toLocaleString() : '–'}</td>
                <td className="p-2 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      className="px-2 py-1 rounded-md border hover:bg-muted disabled:opacity-50"
                      onClick={() => onContactSet(row.id)}
                      disabled={isPending}
                    >Kontakt gesetzt</button>
                    <button
                      className="px-2 py-1 rounded-md border hover:bg-muted disabled:opacity-50"
                      onClick={() => onFollowUp(row.id)}
                      disabled={isPending}
                    >Follow-up</button>
                    <button
                      className="px-2 py-1 rounded-md border hover:bg-destructive text-destructive-foreground disabled:opacity-50"
                      onClick={() => onArchive(row.id)}
                      disabled={isPending}
                    >Archivieren</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
