// app/api/apply/sws/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request){
  const { werberSlug, handle, contact, consent, utm, extras } = await req.json();

  if(!werberSlug || !handle || !contact) return NextResponse.json({ error:'Bad request' }, { status:400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, service);

  const { data: w } = await sb.from('werber').select('id, manager_id').eq('slug', werberSlug).single();
  if(!w) return NextResponse.json({ error:'Werber nicht gefunden' }, { status:404 });

  const norm = '@' + String(handle).replace(/^@/,'').trim();
  const payload: any = {
    manager_id: w.manager_id,
    werber_id: w.id,
    source: 'sws',
    handle: norm,
    status: 'invited',
    notes: `Kontakt: ${contact}`,
    utm: utm || null,
    extras: extras || null,
  };

  const { error } = await sb.from('leads').insert(payload);
  if(error) return NextResponse.json({ error: error.message }, { status:400 });

  return NextResponse.json({ ok:true });
}
