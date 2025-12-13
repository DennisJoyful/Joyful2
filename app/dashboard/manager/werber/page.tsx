// app/dashboard/manager/werber/page.tsx
'use client';
import { useEffect, useState } from 'react';

type Werber = { id: string; slug: string };

export default function Page(){
  const [slug, setSlug] = useState('');
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [list, setList] = useState<Werber[]>([]);
  const [sel, setSel] = useState<string>('');
  const [newPin, setNewPin] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string>('');

  function isValidPin(v: string){ return /^\d{4,6}$/.test(v); }

  async function createWerber(){
    setResult(null);
    if(!slug || !isValidPin(pin)){ alert('Bitte Slug und PIN (4–6 Ziffern) angeben.'); return; }
    setLoading(true);
    const res = await fetch('/api/werber/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, passcode: pin })
    });
    const j = await res.json();
    setLoading(false);
    if(!res.ok){ alert(j.error || 'Fehler'); return; }
    setResult(j);
    setSlug(''); setPin('');
    await loadList();
  }

  async function loadList(){
    const r = await fetch('/api/werber/list', { method:'GET' }).catch(()=>null);
    if(!r || !r.ok){ setList([]); return; }
    const j = await r.json();
    setList(j.items||[]);
  }

  async function updatePin(){
    setUpdateMsg('');
    if(!sel || !isValidPin(newPin)){ setUpdateMsg('Bitte Werber wählen und gültige PIN (4–6) eingeben.'); return; }
    setUpdating(true);
    const r = await fetch('/api/werber/update-pin', {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({ werber_id: sel, pin: newPin })
    });
    const j = await r.json();
    setUpdating(false);
    if(!r.ok){ setUpdateMsg(j.error || 'Fehler'); return; }
    setUpdateMsg('PIN aktualisiert');
    setNewPin('');
  }

  useEffect(()=>{ loadList(); },[]);

  return (
    <main className="grid" style={{ gap:'1rem' }}>
      <div className="card">
        <div className="card-body" style={{ display:'grid', gap:'.75rem', maxWidth:520 }}>
          <h2 style={{ fontWeight: 600 }}>Werber anlegen (PIN-Login)</h2>
          <label style={{ display:'grid', gap:'.25rem' }}>
            <span>Werber-Slug</span>
            <input className="input" value={slug} onChange={e=>setSlug(e.target.value.trim())} placeholder="promo-max" />
          </label>
          <label style={{ display:'grid', gap:'.25rem' }}>
            <span>PIN (4–6 Ziffern)</span>
            <input className="input" value={pin} onChange={e=>setPin(e.target.value.replace(/[^\d]/g,''))} placeholder="z. B. 4281" inputMode="numeric" pattern="\d{4,6}" />
          </label>
          <button className="btn btn-primary" disabled={!slug || !isValidPin(pin) || loading} onClick={createWerber}>
            {loading ? 'Wird erstellt…' : 'Erstellen'}
          </button>

          {result && (
            <div className="card" style={{ borderColor:'#e5e7eb' }}>
              <div className="card-body" style={{ display:'grid', gap:'.5rem' }}>
                <div><strong>Werber:</strong> {result.slug}</div>
                <div><strong>Login:</strong> Seite <code>/auth/werber</code> nutzen</div>
                <div><strong>PIN:</strong> <code>{result.passcode}</code></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ display:'grid', gap:'.75rem', maxWidth:520 }}>
          <h3 style={{ fontWeight: 600 }}>PIN ändern</h3>
          <label style={{ display:'grid', gap:'.25rem' }}>
            <span>Werber wählen</span>
            <select className="input" value={sel} onChange={e=>setSel(e.target.value)}>
              <option value="">–</option>
              {list.map(w => <option key={w.id} value={w.id}>{w.slug}</option>)}
            </select>
          </label>
          <label style={{ display:'grid', gap:'.25rem' }}>
            <span>Neue PIN (4–6 Ziffern)</span>
            <input className="input" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/[^\d]/g,''))} placeholder="z. B. 7351" inputMode="numeric" pattern="\d{4,6}" />
          </label>
          <button className="btn" disabled={!sel || !isValidPin(newPin) || updating} onClick={updatePin}>
            {updating ? 'Aktualisiere…' : 'PIN aktualisieren'}
          </button>
          {updateMsg && <div style={{ fontSize:12, opacity:.8 }}>{updateMsg}</div>}
        </div>
      </div>
    </main>
  );
}
