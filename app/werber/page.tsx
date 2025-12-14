// app/werber/page.tsx
'use client';
import React from 'react';

type RecalcResp = any;

export default function WerberPortal(){
  const [code, setCode] = React.useState<string>('');
  const [pin, setPin] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<RecalcResp | null>(null);
  const [err, setErr] = React.useState<string>('');

  React.useEffect(()=>{
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get('code') || '';
    if (c) setCode(c);
  }, []);

  async function fetchData(){
    setLoading(true); setErr(''); setData(null);
    try{
      // Try GET with query params first
      const url = `/api/sws/recalc?code=${encodeURIComponent(code)}&pin=${encodeURIComponent(pin)}`;
      let res = await fetch(url, { cache:'no-store' });
      if (!res.ok) {
        // Fallback: POST body (in case the route expects POST)
        res = await fetch('/api/sws/recalc', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ code, pin })
        });
      }
      if (!res.ok) throw new Error('Keine Daten gefunden oder ungültige PIN.');
      const js = await res.json();
      setData(js);
    }catch(e:any){ setErr(String(e.message || e)); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Werber-Portal</h1>
        </header>

        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="border rounded px-3 py-2" placeholder="Werber-Code" value={code} onChange={e=>setCode(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="PIN" type="password" value={pin} onChange={e=>setPin(e.target.value)} />
            <button className="px-3 py-2 border rounded" onClick={fetchData} disabled={loading}>
              {loading ? 'Lade…' : 'Anzeigen'}
            </button>
          </div>
          {err && <div className="text-red-600 text-sm">{err}</div>}
        </div>

        {data && (
          <div className="rounded-2xl border bg-white p-4 space-y-4">
            <h2 className="text-lg font-semibold">Übersicht</h2>
            <pre className="bg-gray-100 rounded p-3 overflow-auto text-xs">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}

        {!data && !loading && !err && (
          <div className="text-sm opacity-70">Gib deinen Code & PIN ein, um Punkte, Verlauf und Geworbene zu sehen.</div>
        )}
      </div>
    </div>
  );
}
