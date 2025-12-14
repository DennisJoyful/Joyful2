// app/dashboard/admin/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type SwsRule = {
  id: string;
  code: string;
  description: string | null;
  active: boolean;
  points: number;
};

export default function Page(){ 
  const [rules, setRules] = useState<SwsRule[]>([]);
  const [slug, setSlug] = useState('');
  const [points, setPoints] = useState<number>(0);
  const [recalcState, setRecalcState] = useState<string>('');

  useEffect(()=>{
    supabase.from('sws_rules').select('*').then(({data})=>setRules((data as SwsRule[])||[]));
  },[]);

  async function toggle(id: string, val: boolean){
    await supabase.from('sws_rules').update({active:val}).eq('id',id);
    const { data } = await supabase.from('sws_rules').select('*');
    setRules((data as SwsRule[])||[]);
  }

  async function book(){
    const { data: w } = await supabase.from('werber').select('id').eq('slug', slug).single();
    if(!w){ alert('Werber nicht gefunden'); return; }
    await supabase.from('ledger_entries').insert({ werber_id: (w as any).id, type: points>=0?'manual_credit':'manual_debit', amount_points: Math.abs(points), memo: 'Admin Buchung' });
    alert('OK');
  }

  async function recalc(){
    setRecalcState('rechne…');
    try{
      const res = await fetch('/api/sws/recalc', { method:'POST' });
      const j = await res.json();
      setRecalcState(`OK: ${j.created} Events`);
    }catch(e:any){
      setRecalcState('Fehler beim Recalc');
    }
  }

  return (
    <main className="grid" style={{ gap:'1rem' }}>
      <div className="card">
        <div className="card-body">
          <h2 style={{ fontWeight: 600 }}>SWS-Regeln</h2>
          <button className="btn" onClick={recalc} style={{ margin:'0.5rem 0' }}>
            SWS neu berechnen
          </button>
          {recalcState && <div style={{ fontSize:12, opacity:.8 }}>{recalcState}</div>}
          <ul>
            {rules.map(r=> (
              <li key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.5rem 0', borderBottom:'1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.code}</div>
                  <div style={{ fontSize:12, opacity:.7 }}>{r.description}</div>
                </div>
                <label style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
                  <input type="checkbox" checked={!!r.active} onChange={e=>toggle(r.id, e.target.checked)} /> aktiv
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 style={{ fontWeight: 600 }}>Manuelle Buchung</h2>
          <div style={{ display:'flex', gap:'.5rem' }}>
            <input className="input" placeholder="werber slug" value={slug} onChange={e=>setSlug(e.target.value)} />
            <input className="input" type="number" value={points} onChange={e=>setPoints(parseInt(e.target.value||'0', 10))} />
            <button className="btn btn-primary" onClick={book}>Buchen</button>
          </div>
        </div>
      </div>
    </main>
  );
}
