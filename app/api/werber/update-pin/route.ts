// app/api/werber/update-pin/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request){
  const body = await req.json();
  const { werber_id, pin } = body as { werber_id?: string; pin?: string };

  if(!werber_id || !pin || !/^\d{4,6}$/.test(pin)){
    return NextResponse.json({ error: 'werber_id & PIN (4–6) erforderlich' }, { status: 400 });
  }

  const sc = createServerComponentClient({ cookies });
  const { data: me } = await sc.auth.getUser();
  if(!me?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: prof } = await sc.from('profiles').select('role, manager_id').eq('user_id', me.user.id).single();
  if(!prof || prof.role!=='manager' || !prof.manager_id) return NextResponse.json({ error:'forbidden' }, { status: 403 });

  // get werber data (must belong to this manager)
  const { data: w } = await sc.from('werber').select('id, slug, manager_id').eq('id', werber_id).single();
  if(!w || w.manager_id !== prof.manager_id) return NextResponse.json({ error:'forbidden' }, { status: 403 });

  // service client to update auth password
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, service);

  // find auth user by synthetic email
  const email = `${w.slug}@noemail.local`;
  const { data: list } = await admin.auth.admin.listUsers();
  const user = list.users.find(u=>u.email===email);
  if(!user) return NextResponse.json({ error:'Auth-User nicht gefunden' }, { status: 404 });

  // update password
  const { error: up } = await admin.auth.admin.updateUserById(user.id, { password: pin });
  if(up) return NextResponse.json({ error: 'PIN-Update fehlgeschlagen: ' + up.message }, { status: 500 });

  // update werber table
  const { error: wu } = await admin.from('werber').update({ pin }).eq('id', werber_id);
  if(wu) return NextResponse.json({ error: wu.message }, { status: 500 });

  return NextResponse.json({ ok:true });
}
