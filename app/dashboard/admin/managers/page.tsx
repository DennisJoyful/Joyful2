// app/dashboard/admin/managers/page.tsx
'use client';
import { useState } from 'react';

export default function Page(){
  const [email,setEmail] = useState('');
  const [name,setName] = useState('');
  const [slug,setSlug] = useState('');
  const [password,setPassword] = useState('');
  const [msg,setMsg] = useState<string>('');

  async function submit(){
    setMsg('');
    const payload:any = { email };
    if (name) payload.name = name;
    if (slug) payload.slug = slug;
    if (password) payload.password = password;

    const res = await fetch('/api/admin/managers/create', {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (!res.ok) {
      setMsg('Fehler: '+(j.error || 'unbekannt'));
      return;
    }
    setMsg('Manager angelegt / verknüpft: '+j.email+' (user_id: '+j.user_id+')');
    setEmail(''); setName(''); setSlug(''); setPassword('');
  }

  return (
    <main className="card">
      <div className="card-body">
        <h2 style={{fontWeight:600, fontSize:'1.25rem'}}>Admin: Manager anlegen / verknüpfen</h2>
        <p style={{opacity:.75, marginBottom:'.75rem'}}>Legt zuerst den Auth-User an (oder verknüpft, falls bereits vorhanden) und erstellt/aktualisiert anschließend den Manager-Datensatz – ohne FK-Fehler.</p>
        <div style={{display:'grid', gap:'.6rem', maxWidth: 520}}>
          <label>E-Mail *</label>
          <input className="input" placeholder="manager@beispiel.de" value={email} onChange={e=>setEmail(e.target.value)} />

          <label>Name</label>
          <input className="input" placeholder="Anzeigename (optional)" value={name} onChange={e=>setName(e.target.value)} />

          <label>Slug</label>
          <input className="input" placeholder="z. B. vorname (für Bewerbungslink)" value={slug} onChange={e=>setSlug(e.target.value)} />

          <label>Passwort (optional)</label>
          <input className="input" placeholder="leer lassen = Autogeneriert" value={password} onChange={e=>setPassword(e.target.value)} />

          <div style={{display:'flex', gap:'.5rem', marginTop:'.5rem'}}>
            <button className="btn" onClick={submit}>Manager anlegen</button>
          </div>
          {msg && <div style={{marginTop:'.5rem'}}>{msg}</div>}
        </div>
      </div>
    </main>
  );
}
