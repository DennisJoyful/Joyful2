// components/leads/LeadTable.tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import supabase from '@/lib/supabaseClient';

type Lead = {
  id: string;
  handle: string;
  source: 'manager_form' | 'werber_form' | 'manual' | 'admin_import';
  status: 'new' | 'invited' | 'no_response' | 'declined' | 'joined';
  created_at: string | null;
  contact_date: string | null;
  followup_date: string | null;
  extras?: any;
};

type SortKey = 'handle' | 'created_at' | 'followup_date';
type SortDir = 'asc' | 'desc';

export default function LeadTable() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [query, setQuery] = useState('');
  const [onlyDueFollowups, setOnlyDueFollowups] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [liveMap, setLiveMap] = useState<Record<string, boolean | null>>({});
  const [autoRunning, setAutoRunning] = useState(false);
  const [nextRunAt, setNextRunAt] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  async function load() {
    setLoading(true);
    let q = supabase.from('leads_view').select('*');
    if (status) q = q.eq('status', status);
    if (source) q = q.eq('source', source);
    const { data, error } = await q;
    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }
    let arr = (data || []) as Lead[];
    if (query) {
      const qq = query.toLowerCase();
      arr = arr.filter(x => x.handle?.toLowerCase().includes(qq));
    }
    if (onlyDueFollowups) {
      const today = new Date().toISOString().slice(0,10);
      arr = arr.filter(x => (x.followup_date || '') <= today && !!x.followup_date);
    }
    arr.sort((a, b) => {
      const ak = (a as any)[sortKey] || '';
      const bk = (b as any)[sortKey] || '';
      if (sortKey === 'handle') {
        const A = String(ak).toLowerCase();
        const B = String(bk).toLowerCase();
        if (A < B) return sortDir === 'asc' ? -1 : 1;
        if (A > B) return sortDir === 'asc' ? 1 : -1;
        return 0;
      } else {
        const A = ak ? new Date(ak).getTime() : 0;
        const B = bk ? new Date(bk).getTime() : 0;
        if (A < B) return sortDir === 'asc' ? -1 : 1;
        if (A > B) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }
    });
    setRows(arr);
  }

  useEffect(() => { load(); }, [status, source]);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [query, onlyDueFollowups, sortKey, sortDir]);

  async function markContact(id: string) {
    const today = new Date().toISOString().slice(0,10);
    await supabase.from('leads').update({ contact_date: today, followup_date: new Date(Date.now()+5*24*60*60*1000).toISOString().slice(0,10), status: 'invited' }).eq('id', id);
    load();
  }

  async function updateStatus(id: string, status: Lead['status']) {
    await supabase.from('leads').update({ status }).eq('id', id);
    load();
  }

  async function checkLiveRow(handle: string, id: string) {
    try {
      const r = await fetch(`/api/check-live?handle=${encodeURIComponent(handle.replace('@',''))}`);
      const j = await r.json();
      setLiveMap(m => ({ ...m, [id]: !!j.live }));
    } catch {
      setLiveMap(m => ({ ...m, [id]: null }));
    }
  }

  function startAutoCheck() {
    if (autoRunning) return;
    setAutoRunning(true);
    const PERIOD = 15 * 60 * 1000;
    const schedule = () => {
      const start = Date.now();
      setNextRunAt(start + PERIOD);
      (async () => {
        for (let i=0;i<rows.length;i++) {
          const r = rows[i];
          if (!r?.handle) continue;
          await checkLiveRow(r.handle, r.id);
          await new Promise(res => setTimeout(res, 1500));
        }
      })();
    };
    schedule();
    timerRef.current = setInterval(schedule, PERIOD);
  }

  function stopAutoCheck() {
    setAutoRunning(false);
    setNextRunAt(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const countdown = (() => {
    if (!nextRunAt) return '';
    const diff = Math.max(0, nextRunAt - Date.now());
    const mm = Math.floor(diff/60000).toString().padStart(2,'0');
    const ss = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
    return `${mm}:${ss}`;
  })();

  return (
    <div className="card">
      <style jsx>{`
        .toolbar { display:flex; flex-wrap: wrap; gap:.5rem; align-items:center; justify-content: space-between; margin-bottom:.75rem; }
        .filters { display:flex; flex-wrap: wrap; gap:.5rem; align-items:center; }
        .input, .select { border:1px solid #e5e7eb; border-radius:10px; padding:.5rem .6rem; min-height:38px; }
        table { width:100%; border-collapse: collapse; }
        th, td { padding:.55rem .6rem; border-bottom:1px solid #eee; text-align:left; }
        th { font-weight:700; font-size:.9rem; }
        .badge { font-size:.75rem; padding:.15rem .45rem; border-radius:9999px; background:#f3f4f6; }
        .live { color:#065f46; font-weight:700; }
        .offline { color:#6b7280; }
        .btn { border:1px solid #e5e7eb; border-radius:10px; padding:.45rem .6rem; background:#fff; }
        .btnPrimary { background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; border:none; }
        .tinyBtn { font-size:.8rem; padding:.25rem .5rem; border-radius:8px; border:1px solid #e5e7eb; background:#fff; }
        .sort { display:flex; gap:.4rem; align-items:center; }
        .profileLink { text-decoration:none; border:1px solid #e5e7eb; padding:.2rem .5rem; border-radius:8px; }
      `}</style>

      <div className="toolbar">
        <div className="filters">
          <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">Status: Alle</option>
            <option value="new">neu</option>
            <option value="invited">eingeladen</option>
            <option value="no_response">keine Reaktion</option>
            <option value="declined">abgesagt</option>
            <option value="joined">gejoint</option>
          </select>

          <select className="select" value={source} onChange={e=>setSource(e.target.value)}>
            <option value="">Quelle: Alle</option>
            <option value="manager_form">Manager-Formular</option>
            <option value="werber_form">Werber-Formular</option>
            <option value="manual">Manuell</option>
            <option value="admin_import">Admin-Import</option>
          </select>

          <input className="input" placeholder="Handle suchen…" value={query} onChange={e=>setQuery(e.target.value)} />
          <label style={{display:'flex',gap:'.35rem',alignItems:'center'}}>
            <input type="checkbox" checked={onlyDueFollowups} onChange={e=>setOnlyDueFollowups(e.target.checked)} />
            <span>Nur fällige Follow-Ups</span>
          </label>
        </div>

        <div className="sort">
          <span>Sortieren:</span>
          <select className="select" value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)}>
            <option value="handle">alphabetisch (Handle)</option>
            <option value="created_at">hinzugefügt am</option>
            <option value="followup_date">Follow-Up fällig am</option>
          </select>
          <select className="select" value={sortDir} onChange={e=>setSortDir(e.target.value as SortDir)}>
            <option value="asc">aufsteigend</option>
            <option value="desc">absteigend</option>
          </select>
        </div>
      </div>

      <div style={{display:'flex', gap:'.5rem', alignItems:'center', marginBottom:'.75rem'}}>
        <button className="btn" onClick={()=>load()}>Neu laden</button>
        {!autoRunning ? (
          <button className="btnPrimary" onClick={startAutoCheck}>Live-Check starten</button>
        ) : (
          <>
            <button className="btn" onClick={stopAutoCheck}>Stop</button>
            <span>Nächster Auto-Check in: <strong>{countdown || '15:00'}</strong></span>
          </>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>Handle</th>
            <th>Quelle</th>
            <th>Status</th>
            <th>Kontakt</th>
            <th>Follow-Up</th>
            <th>Live</th>
            <th>Profil</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const live = liveMap[r.id];
            return (
              <tr key={r.id}>
                <td>@{r.handle?.replace('@','')}</td>
                <td><span className="badge">{r.source}</span></td>
                <td>
                  <select className="select" value={r.status} onChange={e=>updateStatus(r.id, e.target.value as any)}>
                    <option value="new">neu</option>
                    <option value="invited">eingeladen</option>
                    <option value="no_response">keine Reaktion</option>
                    <option value="declined">abgesagt</option>
                    <option value="joined">gejoint</option>
                  </select>
                </td>
                <td>{r.contact_date ? String(r.contact_date).slice(0,10) : '-'}</td>
                <td>{r.followup_date ? String(r.followup_date).slice(0,10) : '-'}</td>
                <td>
                  <div style={{display:'flex', gap:'.5rem', alignItems:'center'}}>
                    <button className="tinyBtn" onClick={()=>checkLiveRow(r.handle, r.id)}>Check</button>
                    {live===true && <span className="live">LIVE</span>}
                    {live===false && <span className="offline">offline</span>}
                    {live==null && <span className="offline">—</span>}
                  </div>
                </td>
                <td>
                  <a className="profileLink" href={`https://www.tiktok.com/@${r.handle?.replace('@','')}`} target="_blank" rel="noreferrer">Profil</a>
                </td>
                <td>
                  <div style={{display:'flex', gap:'.5rem'}}>
                    <button className="tinyBtn" onClick={()=>markContact(r.id)}>Kontakt gesetzt</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length===0 && !loading && (
            <tr><td colSpan={8} style={{padding:'1rem', opacity:.6}}>Keine Leads gefunden.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
