// components/sws/WerberManager.tsx
'use client';

import React from 'react';

type Werber = {
  id: string;
  name?: string | null;
  code?: string | null;
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

export default function WerberManager(){
  const [list, setList] = React.useState<Werber[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pinById, setPinById] = React.useState<Record<string,string>>({});
  const [error, setError] = React.useState<string>('');

  async function refresh(){
    setLoading(true);
    setError('');
    try{
      const res = await fetch('/api/werber/list', { cache: 'no-store' });
      const data: ListResp = await res.json();
      if (Array.isArray(data)) setList(data);
      else setError((data as any)?.error || 'Konnte Werber nicht laden.');
    }catch(e:any){ setError(String(e)); }
    setLoading(false);
  }

  React.useEffect(()=>{ refresh(); }, []);

  async function create(){
    setError('');
    try{
      // try canonical create endpoint
      let res = await fetch('/api/werber/create', { method:'POST' });
      if (!res.ok) {
        // fallback: some repos use /create/route
        res = await fetch('/api/werber/create/route', { method:'POST' });
      }
      if (!res.ok) throw new Error('Werber konnte nicht angelegt werden.');
      await refresh();
    }catch(e:any){ setError(String(e.message || e)); }
  }

  async function setPin(id:string){
    setError('');
    const pin = pinById[id] || '';
    try{
      const res = await fetch('/api/werber/update-pin', {
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ id, pin })
      });
      if (res.ok) await refresh();
      else setError('PIN konnte nicht gesetzt werden.');
    }catch(e:any){ setError(String(e)); }
  }

  const baseApply = (code?:string|null) => code ? `${window.location.origin}/auth/werber?code=${encodeURIComponent(code)}` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">SWS – Werber</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={refresh}>Aktualisieren</button>
          <button className="px-3 py-2 border rounded" onClick={create}>Werber anlegen</button>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Section title="Werber-Liste">
        {loading ? <div>Lade…</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map(w => {
              const url = baseApply(w.code);
              return (
                <div key={w.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{w.name || '—'}</div>
                      <div className="text-xs opacity-70">Code: {w.code || '—'}</div>
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
                  ) : <div className="text-sm opacity-70">Kein Code vorhanden.</div>}
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
