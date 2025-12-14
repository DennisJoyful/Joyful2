// components/leads/ManagerLeadsEnhanced.tsx
'use client';

import React from 'react';
import LeadActions from '@/components/leads/LeadActions';
import LeadStatusSelect from '@/components/leads/LeadStatusSelect';
import LeadLiveBadge from '@/components/LeadLiveBadge';

export type LeadRow = {
  id: string;
  handle: string | null;
  status?: string | null;
  source?: string | null;  // maps from lead_source
  notes?: any | null;
  utm?: any | null;
  extras?: any | null;
  created_at?: string | null;
  follow_up_at?: string | null;
  follow_up_date?: string | null;
};

type Props = { rows: LeadRow[] };

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 border">{children}</span>;
}

function pretty(obj: any) {
  if (obj == null) return null;
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

export default function ManagerLeadsEnhanced({ rows }: Props) {
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<string>('');
  const [source, setSource] = React.useState<string>('');
  const [follow, setFollow] = React.useState<string>('');
  const [sort, setSort] = React.useState<string>('created_at_desc');

  const normalized = React.useMemo(() => rows.map(r => ({
    ...r,
    handle: r.handle ?? 'unknown',
    status: r.status ?? 'new',
    source: r.source ?? 'unknown',
  })), [rows]);

  const filtered = React.useMemo(() => normalized.filter(r => {
    const text = `${r.handle} ${r.status} ${r.source} ${JSON.stringify(r.notes ?? '')} ${JSON.stringify(r.utm ?? '')} ${JSON.stringify(r.extras ?? '')}`.toLowerCase();
    const okQ = q ? text.includes(q.toLowerCase()) : true;
    const okStatus = status ? (r.status || '').toLowerCase() === status.toLowerCase() : true;
    const okSource = source ? (r.source || '').toLowerCase() === source.toLowerCase() : true;
    const okFollow = (() => {
      const d = r.follow_up_at || r.follow_up_date;
      if (!follow) return true;
      if (!d) return follow === 'none';
      const today = new Date();
      const dd = new Date(d);
      if (follow === 'overdue') return dd < new Date(today.toDateString());
      if (follow === 'today') return dd.toDateString() === today.toDateString();
      if (follow === 'future') return dd > new Date(today.toDateString());
      return true;
    })();
    return okQ && okStatus && okSource && okFollow;
  }), [normalized, q, status, source, follow]);

  const sources = React.useMemo(() => Array.from(new Set(normalized.map(x => x.source || 'unknown'))).sort(), [normalized]);
  const statuses = React.useMemo(() => Array.from(new Set(normalized.map(x => x.status || 'new'))).sort(), [normalized]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const cmp = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0);
    if (sort === 'handle_asc') return arr.sort((a,b)=>cmp(String(a.handle).toLowerCase(), String(b.handle).toLowerCase()));
    if (sort === 'status') return arr.sort((a,b)=>cmp(String(a.status), String(b.status)));
    if (sort === 'source') return arr.sort((a,b)=>cmp(String(a.source), String(b.source)));
    if (sort === 'follow') return arr.sort((a,b)=>cmp(a.follow_up_at || a.follow_up_date || '', b.follow_up_at || b.follow_up_date || ''));
    return arr.sort((a,b)=>cmp(a.created_at || '', b.created_at || '')).reverse();
  }, [filtered, sort]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded px-3 py-2 text-sm w-64"
          placeholder="Suche (Handle, Notiz, UTM...)"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select className="border rounded px-2 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Status…</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="border rounded px-2 py-2 text-sm" value={source} onChange={e => setSource(e.target.value)}>
          <option value="">Quelle…</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="border rounded px-2 py-2 text-sm" value={follow} onChange={e => setFollow(e.target.value)}>
          <option value="">Follow-Up…</option>
          <option value="overdue">Überfällig</option>
          <option value="today">Heute</option>
          <option value="future">Zukünftig</option>
          <option value="none">Keins</option>
        </select>

        <div className="ml-auto flex items-center gap-1 text-sm">
          <span className="opacity-60 mr-1">Sortieren:</span>
          <button className={"px-2 py-1 border rounded " + (sort==='handle_asc'?'bg-gray-100':'')} onClick={()=>setSort('handle_asc')}>A–Z</button>
          <button className={"px-2 py-1 border rounded " + (sort==='status'?'bg-gray-100':'')} onClick={()=>setSort('status')}>Status</button>
          <button className={"px-2 py-1 border rounded " + (sort==='source'?'bg-gray-100':'')} onClick={()=>setSort('source')}>Quelle</button>
          <button className={"px-2 py-1 border rounded " + (sort==='follow'?'bg-gray-100':'')} onClick={()=>setSort('follow')}>Follow-Up</button>
          <button className={"px-2 py-1 border rounded " + (sort==='created_at_desc'?'bg-gray-100':'')} onClick={()=>setSort('created_at_desc')}>Neueste</button>
        </div>
      </div>

      <div className="overflow-auto rounded border">
        <table className="min-w-[1100px] w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="px-3 py-2 text-left">Handle</th>
              <th className="px-3 py-2 text-left">Live</th>
              <th className="px-3 py-2 text-left">Lead-Status</th>
              <th className="px-3 py-2 text-left">Quelle</th>
              <th className="px-3 py-2 text-left">Follow‑Up (Date)</th>
              <th className="px-3 py-2 text-left">Follow‑Up (At)</th>
              <th className="px-3 py-2 text-left">Angelegt</th>
              <th className="px-3 py-2 text-left">Details</th>
              <th className="px-3 py-2 text-left">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => (
              <tr key={l.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2">
                  {l.handle ? <a className="text-blue-600 hover:underline" href={`https://www.tiktok.com/@${l.handle}`} target="_blank" rel="noreferrer">@{l.handle}</a> : '—'}
                </td>
                <td className="px-3 py-2"><LeadLiveBadge handle={l.handle ?? ''} /></td>
                <td className="px-3 py-2"><LeadStatusSelect id={l.id} value={l.status ?? 'new'} /></td>
                <td className="px-3 py-2"><Badge>{l.source || '—'}</Badge></td>
                <td className="px-3 py-2">{l.follow_up_date || '—'}</td>
                <td className="px-3 py-2">{l.follow_up_at ? new Date(l.follow_up_at).toLocaleString() : '—'}</td>
                <td className="px-3 py-2">{l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</td>
                <td className="px-3 py-2">
                  <details>
                    <summary className="cursor-pointer text-sm opacity-80">Aufklappen</summary>
                    <div className="mt-2 space-y-2 text-sm max-w-[520px]">
                      {l.notes ? (<div><div className="text-xs uppercase opacity-60 mb-1">Notizen</div><div className="whitespace-pre-wrap">{l.notes}</div></div>) : null}
                      {l.utm != null ? (<div><div className="text-xs uppercase opacity-60 mb-1">UTM</div><pre className="bg-gray-100 rounded p-2 overflow-auto">{pretty(l.utm)}</pre></div>) : null}
                      {l.extras != null ? (<div><div className="text-xs uppercase opacity-60 mb-1">Extras</div><pre className="bg-gray-100 rounded p-2 overflow-auto">{pretty(l.extras)}</pre></div>) : null}
                      {!l.notes && l.utm == null && l.extras == null ? <div className="opacity-50">Keine zusätzlichen Angaben</div> : null}
                    </div>
                  </details>
                </td>
                <td className="px-3 py-2"><LeadActions id={l.id} compact /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
