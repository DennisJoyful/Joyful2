// app/api/apply/sws/route.ts (lead_source fix)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request){
  const { werberCode, handle, contact, consent, utm, extras } = await req.json();

  if(!werberCode || !handle || !contact) return NextResponse.json({ error:'Bad request' }, { status:400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, service);

  const norm = handle.replace(/^@+/, '').trim();

  const { data: w } = await sb.from('werber').select('id').eq('code', werberCode).single();
  if(!w) return NextResponse.json({ error:'Werber nicht gefunden' }, { status:404 });

  const payload = {
    werber_id: w.id,
    lead_source: 'sws',
    handle: norm,
    status: 'invited',
    notes: `Kontakt: ${contact}`,
    utm: utm || null,
    extras: extras || null,
  } as any;

  const { error } = await sb.from('leads').insert(payload);
  if(error) return NextResponse.json({ error: error.message }, { status:400 });

  return NextResponse.json({ ok:true });
}
