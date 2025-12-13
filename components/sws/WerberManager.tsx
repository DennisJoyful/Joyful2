// components/sws/WerberManager.tsx
'use client';

import React from 'react';

type Werber = {
  id: string;
  slug?: string | null;
  code?: string | null;
  name?: string | null;
  pin_set?: boolean | null;
};

type ListResp = { items: Werber[] } | Werber[] | { error?: string };

function Section({title, children}:{title:string, children:React.ReactNode}){
  return (
    <div className="space-y-2 mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="rounded-2xl border p-4">{children}</div>
    </div>
  )
}

function Copy({ text }:{ text:string }){
  const [ok,setOk]=React.useState(false);
  return (
    <button
      className="px-2 py-1 border rounded text-sm"
      onClick={async ()=>{ await navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1500);}}
    >
      {ok ? 'Kopiert ✓' : 'Link kopieren'}
    </button>
  )
}

function QR({ url }:{ url:string }){
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="inline-block">
      <img src={src} alt="QR" className="rounded border" width={180} height={180} />
    </a>
  );
}

function normSlug(v: string){
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const txt = await res.text();
    if (!txt) return `${res.status} ${res.statusText}`;
    try {
      const js = JSON.parse(txt);
      if (js && typeof js === 'object' && 'error' in js) return String((js as any).error);
      return txt.slice(0, 300);
    } catch {
      return txt.slice(0, 300);
    }
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

async function ensureManagerRole(){
  try { await fetch('/api/manager/ensure', { method:'POST', credentials:'include' }); } catch {}
}

export default function WerberManager(){
  const [list, setList] = React.useState<Werber[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pinById, setPinById] = React.useState<Record<string,string>>({});
  const [error, setError] = React.useState<string>('');

  const [newName, setNewName] = React.useState('');
  const [newSlug, setNewSlug] = React.useState('');
  const [newPin, setNewPin] = React.useState('');

  async function refresh(){
    setLoading(true);
    setError('');
    try{
      await ensureManagerRole();
      const res = await fetch('/api/werber/list', { cache: 'no-store', credentials:'include' });
      const data: ListResp = await res.json();
      const items = Array.isArray(data) ? data : (data as any).items;
      setList(items || []);
    }catch(e:any){ setError(String(e)); }
    setLoading(false);
  }

  React.useEffect(()=>{ refresh(); }, []);

  async function create(){
    setError('');
    await ensureManagerRole();
    const slug = normSlug(newSlug || newName || 'werber');

    // 1) CREATE OHNE PIN (weil 'pin' Spalte in DB nicht existiert)
    const payloads: any[] = [
      { slug, name: newName || undefined },
      { code: slug, name: newName || undefined },
      { slug, code: slug, name: newName || undefined },
      { slug },
      { code: slug },
    ];
    const endpoints = [
      '/api/werber/create',
      '/api/werber/create/route',
    ];
    let ok = false, lastMsg = '';
    for (const ep of endpoints) {
      for (const p of payloads) {
        try{
          const res = await fetch(ep, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(p) });
          if (res.ok) { ok = true; break; }
          lastMsg = await readErrorMessage(res);
        }catch(e:any){ lastMsg = String(e.message || e); }
      }
      if (ok) break;
    }
    if (!ok) { setError(lastMsg || 'Werber konnte nicht angelegt werden.'); return; }

    // 2) Falls Benutzer eine PIN wünscht: nachträglich setzen über update-pin
    if (newPin.trim()) {
      try {
        // Liste aktualisieren und dann passenden Eintrag finden
        await refresh();
        const key = slug;
        const found = (list || []).find(w => (w.slug || w.code) === key) || null;
        if (!found) {
          // erneuter Versuch nach minimalem Delay
          await new Promise(r => setTimeout(r, 250));
          await refresh();
        }
        const again = (list || []).find(w => (w.slug || w.code) === key) || null;
        const target = found || again;
        if (target?.id) {
          const res2 = await fetch('/api/werber/update-pin', {
            method:'POST',
            credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ id: target.id, pin: newPin.trim() })
          });
          if (!res2.ok) {
            const msg = await readErrorMessage(res2);
            setError('Werber angelegt, aber PIN-Setzen fehlgeschlagen: ' + (msg || ''));
          }
        } else {
          setError('Werber angelegt, aber ID für PIN-Setzen nicht gefunden.');
        }
      } catch (e:any) {
        setError('Werber angelegt, aber PIN-Setzen fehlgeschlagen: ' + String(e.message || e));
      }
    }

    setNewName(''); setNewSlug(''); setNewPin('');
    await refresh();
  }

  async function setPin(id:string){
    setError('');
    try{
      const res = await fetch('/api/werber/update-pin', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, pin: pinById[id] || '' }) });
      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setError(msg || 'PIN konnte nicht gesetzt werden.');
        return;
      }
      await refresh();
    }catch(e:any){ setError(String(e)); }
  }

  const linkFrom = (w: Werber) => {
    const key = (w.slug || w.code || '').trim();
    if (!key) return '';
    return `${window.location.origin}/auth/werber?code=${encodeURIComponent(key)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">SWS – Werber</h1>
        <button className="px-3 py-2 border rounded" onClick={refresh}>Aktualisieren</button>
      </div>

      {error && <div className="text-red-600 text-sm whitespace-pre-wrap">{error}</div>}

      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Werber anlegen</h2>
        <div className="rounded-2xl border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input className="border rounded px-3 py-2 text-sm" placeholder="Name (optional)" value={newName} onChange={e=>setNewName(e.target.value)} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Slug/Code (z. B. max-muster)" value={newSlug} onChange={e=>setNewSlug(e.target.value)} onBlur={e=>setNewSlug(normSlug(e.target.value))} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="PIN (optional)" value={newPin} onChange={e=>setNewPin(e.target.value)} />
            <button className="px-3 py-2 border rounded" onClick={create}>Anlegen</button>
            <div className="text-xs opacity-70">Slug: a–z, 0–9, „-“; max 40. PIN wird jetzt erst NACH dem Anlegen gesetzt.</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Werber-Liste</h2>
        <div className="rounded-2xl border p-4">
          {loading ? <div>Lade…</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {list.map(w => {
                const url = linkFrom(w);
                return (
                  <div key={w.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{w.name || '—'}</div>
                        <div className="text-xs opacity-70">Code/Slug: {w.slug || w.code || '—'}</div>
                      </div>
                      <span className={"text-xs px-2 py-0.5 rounded-full border " + (w.pin_set ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50")}>
                        {w.pin_set ? "PIN gesetzt" : "Keine PIN"}
                      </span>
                    </div>
                    {url ? (
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <input readOnly className="border rounded px-2 py-1 text-sm w-full" value={url} />
                          <Copy text={url} />
                        </div>
                        <div className="flex items-center gap-3">
                          <QR url={url} />
                          <div className="text-xs opacity-70">Klick auf den QR öffnet das Bild in groß (zum Download).</div>
                        </div>
                      </div>
                    ) : <div className="text-sm opacity-70">Kein Code/Slug vorhanden.</div>}
                    <div className="flex items-center gap-2">
                      <input type="password" placeholder="Neue PIN" className="border rounded px-2 py-1 text-sm" value={pinById[w.id] || ''} onChange={e => setPinById(s => ({ ...s, [w.id]: e.target.value }))} />
                      <button className="px-3 py-1.5 border rounded text-sm" onClick={()=>setPin(w.id)}>PIN speichern</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
