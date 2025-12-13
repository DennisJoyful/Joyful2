// app/dashboard/admin/import/page.tsx
'use client';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function Page(){
  const [managers,setManagers] = useState<any[]>([]);
  const [managerId,setManagerId] = useState('');
  const [file,setFile] = useState<File|null>(null);
  const [msg,setMsg] = useState<string>('');

  useEffect(()=>{
    supabase.from('managers').select('id,name').then(({data})=>setManagers(data||[]));
  },[]);

  async function upload(){
    setMsg('');
    if(!managerId || !file){ setMsg('Bitte Manager und Datei wählen.'); return; }
    const form = new FormData();
    form.append('manager_id', managerId);
    form.append('file', file);
    const res = await fetch('/api/admin/import-leads', { method:'POST', body: form });
    const j = await res.json();
    if(!res.ok){ setMsg(j.error || 'Fehler'); return; }
    setMsg('Import OK: '+j.inserted+' Leads angelegt');
  }

  return (
    <main className="card">
      <div className="card-body">
        <h2 style={{fontWeight:600, fontSize:'1.25rem'}}>Admin: Leads importieren (nur Handle)</h2>
        <p style={{opacity:.75}}>CSV/XLSX als CSV gespeichert: erste Spalte = Handle (ohne @). Je Zeile ein Handle.</p>
        <div style={{display:'grid', gap:'.6rem', maxWidth: 540}}>
          <label>Manager</label>
          <select className="input" value={managerId} onChange={e=>setManagerId(e.target.value)}>
            <option value="">Bitte auswählen</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name||m.id}</option>)}
          </select>

          <label>Datei wählen</label>
          <input className="input" type="file" accept=".csv,.txt" onChange={e=>setFile(e.target.files?.[0]||null)} />

          <div style={{display:'flex', gap:'.5rem'}}>
            <button className="btn" onClick={upload}>Import starten</button>
          </div>
          {msg && <div style={{marginTop:'.5rem'}}>{msg}</div>}
        </div>
      </div>
    </main>
  );
}
