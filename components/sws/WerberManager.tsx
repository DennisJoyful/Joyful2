// components/sws/WerberManager.tsx
'use client';
import React from 'react';

type Werber = { id: string; slug?: string|null; name?: string|null; status?: string|null; pin_set?: boolean|null };

type ListResp = { items: Werber[] } | Werber[] | { error?: string };

function normSlug(v: string){
  return v.toLowerCase().trim().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const txt = await res.text();
    if (!txt) return `${res.status} ${res.statusText}`;
    try { const js = JSON.parse(txt); if (js?.error) return String(js.error); } catch {}
    return txt.slice(0,300);
  } catch { return `${res.status} ${res.statusText}`; }
}

export default function WerberManager(){
  const [list,setList]=React.useState<Werber[]>([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [pinById,setPinById]=React.useState<Record<string,string>>({});

  const [newName,setNewName]=React.useState('');
  const [newSlug,setNewSlug]=React.useState('');
  const [newPin,setNewPin]=React.useState('');

  async function refresh(){
    setLoading(true); setError('');
    try{
      const res = await fetch('/api/werber/list', { cache:'no-store', credentials:'include' });
      const data: ListResp = await res.json();
      const items = Array.isArray(data) ? data : (data as any).items;
      setList(items || []);
    }catch(e:any){ setError(String(e)); }
    setLoading(false);
  }
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
      setNewSlug(''); setNewName('');
      await refresh();
      // after create, if PIN provided, try to set
      if (newPin.trim()) {
        const created = (list || []).find(w => (w.slug === slug));
        const id = created?.id;
        if (id) {
          const r2 = await fetch('/api/werber/update-pin', {
            method:'POST', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ id, pin: newPin.trim() })
          });
          if (!r2.ok) setError('Werber angelegt, aber PIN-Setzen fehlgeschlagen: ' + await readErrorMessage(r2));
        }
        setNewPin('');
      }
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
        <div className="text-xs opacity-70">Slug: a–z, 0–9, „-“; max 40. PIN wird als Hash gespeichert.</div>
      </div>

      <div className="rounded-2xl border p-4">
        <div className="font-medium mb-2">Werber-Liste</div>
        {loading ? <div>Lade…</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map(w => (
              <div key={w.id} className="rounded-xl border p-4 space-y-3">
                <div>
                  <div className="font-medium">{w.name || '—'}</div>
                  <div className="text-xs opacity-70">Slug: {w.slug || '—'}</div>
                  <div className="text-xs opacity-70">Status: {w.status || '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="password" className="border rounded px-2 py-1 text-sm" placeholder="Neue PIN"
                    value={pinById[w.id] || ''} onChange={e=>setPinById(s=>({ ...s, [w.id]: e.target.value }))} />
                  <button className="px-3 py-1.5 border rounded text-sm" onClick={()=>setPin(w.id)}>PIN speichern</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
