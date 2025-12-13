// components/leads/LeadStatusSelect.tsx
'use client'

import { useState } from 'react'

type Props = { id: string; value?: string | null }

const OPTIONS = [
  'new',
  'invited',
  'no_response',
  'interview',
  'accepted',
  'rejected'
]

export default function LeadStatusSelect({ id, value }: Props){
  const [val, setVal] = useState<string>(value || 'new')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string| null>(null)

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>){
    const next = e.target.value
    setVal(next)
    setSaving(true)
    setErr(null)
    try{
      const res = await fetch('/api/leads/update', {
        method:'POST',
        headers:{ 'content-type': 'application/json' },
        body: JSON.stringify({ id, status: next })
      })
      if(!res.ok){
        const j = await res.json().catch(()=>({}))
        throw new Error(j.error || 'Update failed')
      }
    }catch(e:any){
      setErr(e.message)
    }finally{
      setSaving(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <select
        className="border rounded px-2 py-1 text-sm bg-white"
        value={val}
        onChange={onChange}
        disabled={saving}
      >
        {OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {saving && <span className="text-gray-400 text-xs">speichern…</span>}
      {err && <span className="text-red-600 text-xs">Fehler: {err}</span>}
    </div>
  )
}
