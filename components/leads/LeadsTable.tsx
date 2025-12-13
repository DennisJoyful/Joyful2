'use client';

import React from 'react';

export type LeadRow = {
  id: string;
  handle: string | null;
  status?: string | null;
  source?: string | null;
  notes?: string | null;
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

export default function LeadsTable({ rows }: Props) {
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<string>('');
  const [source, setSource] = React.useState<string>('');
  const [follow, setFollow] = React.useState<string>('');
  const [sort, setSort] = React.useState<string>('handle');

  const normalized = React.useMemo(() => rows.map(r => ({
    ...r,
    handle: r.handle ?? 'unknown',
    status: r.status ?? 'new',
    source: r.source ?? 'unknown',
  })), [rows]);

  const filtered = React.useMemo(() => normalized.filter(r => {
    const text = `${r.handle} ${r.status} ${r.source} ${r.notes ?? ''} ${JSON.stringify(r.utm ?? '')} ${JSON.stringify(r.extras ?? '')}`.toLowerCase();
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
    const by = (k: keyof LeadRow, dir: 1|-1 = 1) => arr.sort((a,b) => {
      const av = (a[k] ?? '').toString().toLowerCase();
      const bv = (b[k] ?? '').toString().toLowerCase();
      return av < bv ? -1*dir : av > bv ? 1*dir : 0;
    });
    if (sort === 'handle') return by('handle', 1);
    if (sort === 'status') return by('status', 1);
    if (sort === 'source') return by('source', 1);
    if (sort === 'follow') {
      return arr.sort((a,b) => {
        const ad = a.follow_up_at || a.follow_up_date || '';
        const bd = b.follow_up_at || b.follow_up_date || '';
        return (ad > bd) ? 1 : (ad < bd) ? -1 : 0;
      });
    }
    return arr;
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
          <button className={"px-2 py-1 border rounded " + (sort==='handle'?'bg-gray-100':'')} onClick={()=>setSort('handle')}>A–Z</button>
          <button className={"px-2 py-1 border rounded " + (sort==='status'?'bg-gray-100':'')} onClick={()=>setSort('status')}>Status</button>
          <button className={"px-2 py-1 border rounded " + (sort==='source'?'bg-gray-100':'')} onClick={()=>setSort('source')}>Quelle</button>
          <button className={"px-2 py-1 border rounded " + (sort==='follow'?'bg-gray-100':'')} onClick={()=>setSort('follow')}>Follow-Up</button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[1100px] w-full border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase opacity-70">
              <th className="border-b p-2">Handle</th>
              <th className="border-b p-2">Status</th>
              <th className="border-b p-2">Quelle</th>
              <th className="border-b p-2">Follow-Up</th>
              <th className="border-b p-2">Angelegt</th>
              <th className="border-b p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="border-b p-2 font-medium">{r.handle ?? '—'}</td>
                <td className="border-b p-2"><Badge>{r.status || '—'}</Badge></td>
                <td className="border-b p-2"><Badge>{r.source || '—'}</Badge></td>
                <td className="border-b p-2 text-sm">{r.follow_up_at || r.follow_up_date || '—'}</td>
                <td className="border-b p-2 text-sm">{r.created_at || '—'}</td>
                <td className="border-b p-2">
                  <details>
                    <summary className="cursor-pointer text-sm opacity-80">Aufklappen</summary>
                    <div className="mt-2 space-y-2 text-sm">
                      {r.notes ? (<div><div className="text-xs uppercase opacity-60 mb-1">Notizen</div><div className="whitespace-pre-wrap">{r.notes}</div></div>) : null}
                      {r.utm != null ? (<div><div className="text-xs uppercase opacity-60 mb-1">UTM</div><pre className="bg-gray-100 rounded p-2 overflow-auto">{pretty(r.utm)}</pre></div>) : null}
                      {r.extras != null ? (<div><div className="text-xs uppercase opacity-60 mb-1">Extras</div><pre className="bg-gray-100 rounded p-2 overflow-auto">{pretty(r.extras)}</pre></div>) : null}
                      {!r.notes && r.utm == null && r.extras == null ? <div className="opacity-50">Keine zusätzlichen Angaben</div> : null}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
