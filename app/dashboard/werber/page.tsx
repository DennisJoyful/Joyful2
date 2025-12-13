// app/dashboard/werber/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Event = { id:string; rule_code:string; points:number; created_at:string; creator_id:string|null; period_month:string|null };
type Balance = { werber_id:string; points_total:number };
type Lead = { id:string; handle:string; status:string; source:string; created_at:string };

export default function Page(){
  const [balance,setBalance]=useState<Balance|null>(null);
  const [events,setEvents]=useState<Event[]>([]);
  const [leads,setLeads]=useState<Lead[]>([]);

  useEffect(()=>{
    (async()=>{
      const { data: bal } = await supabase.from('sws_balances_view').select('*').single();
      setBalance(bal as any);
      const { data: ev } = await supabase.from('sws_events').select('*').order('created_at',{ascending:false}).limit(30);
      setEvents((ev as any[])||[]);
      const { data: l } = await supabase.from('leads_view').select('*').order('created_at',{ascending:false}).limit(50);
      setLeads((l as any[])||[]);
    })();
  },[]);

  return (
    <main className="grid" style={{ gap:'1rem' }}>
      <div className="card">
        <div className="card-body">
          <h2 style={{ fontWeight: 600 }}>Mein Punktestand</h2>
          <div style={{ fontSize:'1.75rem', fontWeight:700 }}>{balance?.points_total ?? 0} Punkte</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ fontWeight: 600 }}>Meine Leads (neueste zuerst)</h3>
          <table className="table" style={{ width:'100%' }}>
            <thead>
              <tr><th>Handle</th><th>Quelle</th><th>Status</th><th>Erfasst</th></tr>
            </thead>
            <tbody>
              {leads.map(l=>(
                <tr key={l.id}><td>{l.handle}</td><td>{l.source}</td><td>{l.status}</td><td>{l.created_at?.slice(0,10)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ fontWeight: 600 }}>Punkteverlauf</h3>
          <ul style={{ display:'grid', gap:'.5rem' }}>
            {events.map(ev=>(
              <li key={ev.id} className="card">
                <div className="card-body" style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>{ev.rule_code} · {ev.period_month ? ev.period_month.slice(0,7) : ''}</span>
                  <strong>+{ev.points}</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
