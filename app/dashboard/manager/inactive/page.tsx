// app/dashboard/manager/inactive/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Row = {
  creator_id: string;
  handle: string;
  months_7_15: number;
  months_below_7_15: number;
  last_month_hours: number;
  last_month_days: number;
  last_three_total_diamonds: number;
};

export default function Page(){
  const [rows, setRows] = useState<Row[]>([]);
  const [sort, setSort] = useState<'alpha'|'months_below'|'months_above'>('months_below');

  useEffect(() => {
    (async () => {
      // Fetch recent stats and reduce client-side (simplified for now)
      const today = new Date();
      const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const start = new Date(firstOfThisMonth.getFullYear(), firstOfThisMonth.getMonth()-3, 1).toISOString().slice(0,10);

      const { data: stats } = await supabase
        .from('stream_stats')
        .select('creator_id, period_month, days_streamed, hours_streamed, diamonds')
        .gte('period_month', start);

      const { data: streamers } = await supabase
        .from('streamer')
        .select('creator_id, handle');

      const byCreator = new Map<string, any[]>();
      (stats||[]).forEach(s => {
        const k = (s as any).creator_id as string;
        if(!byCreator.has(k)) byCreator.set(k, []);
        byCreator.get(k)!.push(s);
      });

      const out: Row[] = (streamers||[]).map(st => {
        const arr = (byCreator.get(st.creator_id) || []).sort((a,b)=> String(a.period_month).localeCompare(String(b.period_month)));
        const last = arr[arr.length-1];
        const last3 = arr.slice(-3);
        const months_7_15 = arr.filter(x => Number(x.days_streamed)>=7 && Number(x.hours_streamed)>=15).length;
        const months_below_7_15 = arr.filter(x => Number(x.days_streamed)<7 || Number(x.hours_streamed)<15).length;
        const last_month_hours = last ? Number(last.hours_streamed) : 0;
        const last_month_days = last ? Number(last.days_streamed) : 0;
        const last_three_total_diamonds = last3.reduce((a,b)=>a+Number(b.diamonds||0),0);
        return {
          creator_id: st.creator_id,
          handle: st.handle,
          months_7_15,
          months_below_7_15,
          last_month_hours,
          last_month_days,
          last_three_total_diamonds
        };
      });

      let sorted = out;
      if (sort === 'alpha') sorted = out.sort((a,b)=>a.handle.localeCompare(b.handle));
      if (sort === 'months_below') sorted = out.sort((a,b)=>b.months_below_7_15 - a.months_below_7_15);
      if (sort === 'months_above') sorted = out.sort((a,b)=>b.months_7_15 - a.months_7_15);

      setRows(sorted);
    })();
  }, [sort]);

  return (
    <main className="card">
      <div className="card-body">
        <h2 style={{ fontWeight: 600 }}>Inaktive / Unter 7/15</h2>
        <div style={{ display:'flex', gap:'.5rem', margin:'.5rem 0' }}>
          <label>Sortierung:</label>
          <select className="input" value={sort} onChange={e=>setSort(e.target.value as any)}>
            <option value="months_below">Monate unter 7/15 (desc)</option>
            <option value="months_above">Monate 7/15 erreicht (desc)</option>
            <option value="alpha">Alphabetisch</option>
          </select>
        </div>
        <table className="table" style={{ width:'100%' }}>
          <thead>
            <tr>
              <th>Handle</th>
              <th>Monate 7/15</th>
              <th>Monate darunter</th>
              <th>Letzter Monat (Tage / Stunden)</th>
              <th>Diamanten (letzte 3 Monate)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.creator_id}>
                <td>{r.handle}</td>
                <td>{r.months_7_15}</td>
                <td>{r.months_below_7_15}</td>
                <td>{r.last_month_days} / {r.last_month_hours}</td>
                <td>{r.last_three_total_diamonds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
