// app/api/apply/manager/route.ts (lead_source fix)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request){
  const { managerSlug, handle, contact, consent, utm, extras } = await req.json();

  if(!managerSlug || !handle || !contact) return NextResponse.json({ error:'Bad request' }, { status:400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, service);

  const { data: man } = await sb.from('managers').select('id').eq('slug', managerSlug).single();
  if(!man) return NextResponse.json({ error:'Manager nicht gefunden' }, { status:404 });

  const norm = handle.replace(/^@+/, '').trim();

  const payload = {
    manager_id: man.id,
    lead_source: 'manager',
    handle: norm,
    status: 'new',
    notes: `Kontakt: ${contact}`,
    utm: utm || null,
    extras: extras || null,
  } as any;

  const { error } = await sb.from('leads').insert(payload);
  if(error) return NextResponse.json({ error: error.message }, { status:400 });

  return NextResponse.json({ ok:true });
}
