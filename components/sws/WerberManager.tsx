// components/sws/WerberManager.tsx
'use client';

import React from 'react';

type Werber = {
  id: string;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  pin_set?: boolean | null;
};

type ListResp = Werber[] | { error?: string };

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

async function tryCreate(payloads: any[], endpoints: string[]): Promise<{ok:boolean, msg?:string}>{
  for (const ep of endpoints) {
    for (const p of payloads) {
      try {
        const res = await fetch(ep, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          credentials:'include',
          body: JSON.stringify(p),
        });
        if (res.ok) return { ok:true };
        // try to read server error
        try {
          const js = await res.json();
          if (js?.error) return { ok:false, msg: String(js.error) };
        } catch {
          try {
            const tx = await res.text();
            if (tx) return { ok:false, msg: tx.slice(0,200) };
          } catch {}
        }
      } catch (e:any) {
        // continue trying other combos
      }
    }
  }
  return { ok:false, msg:'Unbekannter Fehler (Route oder Payload nicht akzeptiert).' };
}

export default function WerberManager(){
  const [list, setList] = React.useState<Werber[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pinById, setPinById] = React.useState<Record<string,string>>({});
  const [error, setError] = React.useState<string>('');

  // create inputs
  const [newName, setNewName] = React.useState('');
  const [newSlug, setNewSlug] = React.useState('');
  const [newPin, setNewPin] = React.useState('');

  async function refresh(){
    setLoading(true);
    setError('');
    try{
      const res = await fetch('/api/werber/list', { cache: 'no-store', credentials:'include' });
      const data: ListResp = await res.json();
      if (Array.isArray(data)) setList(data);
      else setError((data as any)?.error || 'Konnte Werber nicht laden.');
    }catch(e:any){ setError(String(e)); }
    setLoading(false);
  }

  React.useEffect(()=>{ refresh(); }, []);

  async function ensureManager(){
    // ensures a managers-row exists for the current user (idempotent)
    await fetch('/api/manager/ensure', { method:'POST', credentials:'include' });
  }

  async function create(){
    setError('');
    const slug = normSlug(newSlug || newName || 'werber');
    const pin = newPin.trim();

    await ensureManager(); // important before create

    // Build multiple payload variants to maximize compatibility
    const payloads: any[] = [
      { slug, passcode: pin || undefined, name: newName || undefined },
      { code: slug, passcode: pin || undefined, name: newName || undefined },
      { slug, code: slug, passcode: pin || undefined, name: newName || undefined },
      { slug },
      { code: slug },
    ];

    const endpoints = [
      '/api/werber/create',
      '/api/werber/create/route',
      '/api/sws/werber/create',
      '/api/sws/werber/create/route',
    ];

    try{
      const result = await tryCreate(payloads, endpoints);
      if (!result.ok) {
        setError(result.msg || 'Werber konnte nicht angelegt werden.');
        return;
      }
      setNewName('');
      setNewSlug('');
      setNewPin('');
      await refresh();
    }catch(e:any){
      setError(String(e.message || e));
    }
  }

  async function setPin(id:string){
    setError('');
    const pin = pinById[id] || '';
    try{
      const res = await fetch('/api/werber/update-pin', {
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        credentials:'include',
        body: JSON.stringify({ id, pin })
      });
      if (res.ok) await refresh();
      else {
        let msg = 'PIN konnte nicht gesetzt werden.';
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        setError(msg);
      }
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

      <Section title="Werber anlegen">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Name (optional)"
            value={newName}
            onChange={e=>setNewName(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Slug/Code (z. B. max-muster)"
            value={newSlug}
            onChange={e=>setNewSlug(e.target.value)}
            onBlur={e=>setNewSlug(normSlug(e.target.value))}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="PIN (optional)"
            value={newPin}
            onChange={e=>setNewPin(e.target.value)}
          />
          <button className="px-3 py-2 border rounded" onClick={create}>Anlegen</button>
          <div className="text-xs opacity-70">Slug: a–z, 0–9, „-“; max 40. PIN leer lassen → zufällig.</div>
        </div>
      </Section>

      <Section title="Werber-Liste">
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
                    <input
                      type="password"
                      placeholder="Neue PIN"
                      className="border rounded px-2 py-1 text-sm"
                      value={pinById[w.id] || ''}
                      onChange={e => setPinById(s => ({ ...s, [w.id]: e.target.value }))}
                    />
                    <button className="px-3 py-1.5 border rounded text-sm" onClick={()=>setPin(w.id)}>PIN speichern</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}
