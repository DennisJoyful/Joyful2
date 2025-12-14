// components/sws/WerberManager.tsx
'use client';
import React from 'react';

type Werber = { id: string; slug?: string|null; name?: string|null; status?: string|null; pin_set?: boolean|null; created_at?: string|null };
type ListShape = { items?: Werber[] } | { data?: Werber[] } | { rows?: Werber[] } | { error?: string } | Werber[];

function normSlug(v: string){
  return v.toLowerCase().trim().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
}
function titleFromSlug(slug?: string|null){
  if(!slug) return '—';
  return slug.split('-').map(s=>s ? s[0].toUpperCase()+s.slice(1) : s).join(' ');
}
function coerceItems(data: ListShape): Werber[] {
  if (Array.isArray(data)) return data as Werber[];
  const anyData = data as any;
  if (Array.isArray(anyData.items)) return anyData.items as Werber[];
  if (Array.isArray(anyData.data)) return anyData.data as Werber[];
  if (Array.isArray(anyData.rows)) return anyData.rows as Werber[];
  return [];
}
function originSafe(){ return typeof window==='undefined' ? '' : window.location.origin; }
function applyLink(slug?: string|null){ if(!slug) return ''; const base = process.env.NEXT_PUBLIC_APPLY_PATH || '/apply'; return originSafe() + `${base}?code=${encodeURIComponent(slug)}`; }
function loginLink(slug?: string|null){ if(!slug) return ''; const base = process.env.NEXT_PUBLIC_WERBER_LOGIN_PATH || '/auth/werber'; return originSafe() + `${base}?code=${encodeURIComponent(slug)}`; }

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const txt = await res.text();
    if (!txt) return `${res.status} ${res.statusText}`;
    try { const js = JSON.parse(txt); if ((js as any)?.error) return String((js as any).error); } catch {}
    return txt.slice(0,300);
  } catch { return `${res.status} ${res.statusText}`; }
}

async function fetchList(): Promise<Werber[]> {
  try { const res = await fetch('/api/werber/list?t='+Date.now(), { cache:'no-store', credentials:'include' }); if (res.ok) { const data: ListShape = await res.json(); const items = coerceItems(data); if (items.length) return items; } } catch {}
  try { const res = await fetch('/api/werber/list2?t='+Date.now(), { cache:'no-store', credentials:'include' }); if (res.ok) { const data: ListShape = await res.json(); const items = coerceItems(data); return items; } } catch {}
  return [];
}

function CopyBtn({ text }:{ text:string }){
  const [ok,setOk]=React.useState(false);
  return (<button className="px-2 py-1 border rounded text-xs" onClick={async()=>{await navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1200);}} title={text}>{ok?'Kopiert ✓':'Kopieren'}</button>);
}

export default function WerberManager(){
  const [list,setList]=React.useState<Werber[]>([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [pinById,setPinById]=React.useState<Record<string,string>>({});

  const [newName,setNewName]=React.useState('');
  const [newSlug,setNewSlug]=React.useState('');
  const [newPin,setNewPin]=React.useState('');

  const [sortKey, setSortKey] = React.useState<'name'|'slug'|'created_at'>('created_at');
  const [asc, setAsc] = React.useState(false);

  function sortedRows(rows: Werber[]){
    const r = [...rows];
    r.sort((a,b)=>{
      const ka = (sortKey==='name' ? (a.name || titleFromSlug(a.slug)) :
                 sortKey==='slug' ? (a.slug || '') :
                 (a.created_at || ''));
      const kb = (sortKey==='name' ? (b.name || titleFromSlug(b.slug)) :
                 sortKey==='slug' ? (b.slug || '') :
                 (b.created_at || ''));
      return (ka>kb?1:ka<kb?-1:0) * (asc?1:-1);
    });
    return r;
  }

  async function refresh(){ setLoading(true); setError(''); try{ const items = await fetchList(); setList(items||[]); }catch(e:any){ setError(String(e)); } setLoading(false); }
  React.useEffect(()=>{ refresh(); }, []);

  async function create(){
    setError('');
    const slug = normSlug(newSlug || newName || 'werber');
    try{
      const res = await fetch('/api/werber/create', {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ slug, name: newName || undefined })
      });
      if (!res.ok) { setError(await readErrorMessage(res)); return; }
      const js = await res.json().catch(()=>null) as any;
      const createdId = js?.item?.id as string | undefined;

      // Set PIN immediately using returned id (no race with list state)
      if (createdId && newPin.trim()) {
        const r2 = await fetch('/api/werber/update-pin', {
          method:'POST', credentials:'include',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ id: createdId, pin: newPin.trim() })
        });
        if (!r2.ok) setError('Werber angelegt, aber PIN-Setzen fehlgeschlagen: ' + await readErrorMessage(r2));
      }

      setNewSlug(''); setNewName(''); setNewPin('');
      await refresh();
    }catch(e:any){ setError(String(e.message || e)); }
  }

  async function setPin(id:string){
    setError('');
    try{
      const res = await fetch('/api/werber/update-pin', {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id, pin: pinById[id] || '' })
      });
      if (!res.ok) { setError(await readErrorMessage(res)); return; }
      await refresh();
    }catch(e:any){ setError(String(e)); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">SWS – Werber</h1>
        <button className="px-3 py-2 border rounded" onClick={refresh}>Aktualisieren</button>
      </div>
      {error && <div className="text-red-600 text-sm whitespace-pre-wrap">{error}</div>}

      {/* Creator */}
      <div className="rounded-2xl border p-4 space-y-2">
        <div className="font-medium">Werber anlegen</div>
        <div className="flex flex-wrap gap-2 items-center">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Name (optional)"
            value={newName} onChange={e=>setNewName(e.target.value)} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Slug (z. B. max-muster)"
            value={newSlug} onChange={e=>setNewSlug(e.target.value)} onBlur={e=>setNewSlug(normSlug(e.target.value))} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="PIN (optional)"
            value={newPin} onChange={e=>setNewPin(e.target.value)} />
          <button className="px-3 py-2 border rounded" onClick={create}>Anlegen</button>
        </div>
        <div className="text-xs opacity-70">Slug: a–z, 0–9, „-“; max 40.</div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2 cursor-pointer" onClick={()=>{setSortKey('name'); setAsc(k=>sortKey==='name'?!k:false)}}>Name</th>
              <th className="px-3 py-2 cursor-pointer" onClick={()=>{setSortKey('slug'); setAsc(k=>sortKey==='slug'?!k:false)}}>Slug</th>
              <th className="px-3 py-2">Bewerbungslink</th>
              <th className="px-3 py-2">Werber‑Login</th>
              <th className="px-3 py-2">PIN</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 cursor-pointer" onClick={()=>{setSortKey('created_at'); setAsc(k=>sortKey==='created_at'?!k:false)}}>Erstellt</th>
              <th className="px-3 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows(list).map((w) => {
              const nm = w.name || titleFromSlug(w.slug);
              const ap = applyLink(w.slug);
              const lg = loginLink(w.slug);
              return (
                <tr key={w.id} className="border-t">
                  <td className="px-3 py-2">{nm}</td>
                  <td className="px-3 py-2 font-mono">{w.slug || '—'}</td>
                  <td className="px-3 py-2">{ap ? (<div className="flex items-center gap-2"><a className="underline hover:no-underline" href={ap} target="_blank" rel="noreferrer">Öffnen</a><CopyBtn text={ap} /></div>) : '—'}</td>
                  <td className="px-3 py-2">{lg ? (<div className="flex items-center gap-2"><a className="underline hover:no-underline" href={lg} target="_blank" rel="noreferrer">Öffnen</a><CopyBtn text={lg} /></div>) : '—'}</td>
                  <td className="px-3 py-2"><span className={"text-xs px-2 py-0.5 rounded-full border " + (w.pin_set ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50")}>{w.pin_set ? "gesetzt" : "—"}</span></td>
                  <td className="px-3 py-2">{w.status || '—'}</td>
                  <td className="px-3 py-2">{w.created_at ? new Date(w.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><input type="password" className="border rounded px-2 py-1 text-xs" placeholder="Neue PIN" value={pinById[w.id] || ''} onChange={e=>setPinById(s=>({ ...s, [w.id]: e.target.value }))} /><button className="px-3 py-1.5 border rounded text-xs" onClick={()=>setPin(w.id)}>Speichern</button></div></td>
                </tr>
              );
            })}
            {!list.length && (<tr><td className="px-3 py-4 text-sm opacity-70" colSpan={8}>Noch keine Werber vorhanden.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
