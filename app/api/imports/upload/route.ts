import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request){
  const body = await req.json();
  const { filename, contentBase64 } = body;
  const buf = Buffer.from(contentBase64, 'base64');
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });

  const supabase = createServerComponentClient({ cookies });
  let inserted = 0;
  for (const r of rows) {
    const creator_id = String(r['creator_id'] || r['Creator ID'] || r['id'] || '').trim();
    const handle = String(r['handle'] || r['Handle'] || '').trim();
    const period_month = r['period_month'] || r['Month'] || null;
    const days = Number(r['days'] || r['Days'] || 0);
    const hours = Number(r['hours'] || r['Hours'] || 0);
    const diamonds = Number(r['diamonds'] || r['Diamonds'] || 0);
    if (!creator_id || !handle) continue;
    await supabase.from('streamer').upsert({ creator_id, handle }, { onConflict: 'creator_id' });
    if (period_month) {
      await supabase.from('stream_stats').insert({ creator_id, period_month, days_streamed: days, hours_streamed: hours, diamonds, rookie_flag: false });
    }
    inserted++;
  }
  return NextResponse.json({ ok: true, rows: inserted, filename });
}
