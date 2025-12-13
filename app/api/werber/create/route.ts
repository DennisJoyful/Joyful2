// app/api/werber/create/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

function randomPin(){
  // 6-digit random PIN by default
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export async function POST(req: Request){
  const body = await req.json();
  const { slug, passcode } = body as { slug?: string; passcode?: string };

  if(!slug || !/^[a-z0-9-]{3,}$/.test(slug)){
    return NextResponse.json({ error: 'Ungültiger Slug (min. 3 Zeichen, nur a-z, 0-9, -)' }, { status: 400 });
  }
  const pin = passcode && /^\d{4,6}$/.test(passcode) ? passcode : randomPin();

  // Check manager session
  const sc = createServerComponentClient({ cookies });
  const { data: me } = await sc.auth.getUser();
  if(!me?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // verify role=manager in profiles
  const { data: prof, error: pe } = await sc.from('profiles').select('role, manager_id').eq('user_id', me.user.id).single();
  if(pe || !prof || prof.role !== 'manager' || !prof.manager_id){
    return NextResponse.json({ error: 'Nur Manager dürfen Werber anlegen' }, { status: 403 });
  }

  // Admin client with service role (server-side only)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if(!url || !service) return NextResponse.json({ error: 'Server-Misconfig: SUPABASE keys' }, { status: 500 });
  const admin = createClient(url, service);

  // Create auth user with synthetic email and PIN as password
  const email = `${slug}@noemail.local`;
  const { data: createdUser, error: ce } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true
  });
  if(ce && !String(ce.message||'').includes('already registered')){
    return NextResponse.json({ error: 'Auth-Anlage fehlgeschlagen: ' + ce.message }, { status: 500 });
  }

  // lookup user id if existed
  const userId = createdUser?.user?.id || (await (async()=>{
    const { data } = await admin.auth.admin.listUsers();
    return data.users.find(u=>u.email===email)?.id;
  })());

  if(!userId) return NextResponse.json({ error: 'Konnte User-ID nicht ermitteln' }, { status: 500 });

  // Insert werber row & profile
  const { error: werr } = await admin.from('werber').insert({
    slug,
    status: 'active',
    manager_id: prof.manager_id,
    pin: pin
  });
  if(werr && !String(werr.message).includes('duplicate key')){
    return NextResponse.json({ error: 'Werber DB-Anlage fehlgeschlagen: ' + werr.message }, { status: 500 });
  }

  await admin.from('profiles').upsert({ user_id: userId, role: 'werber', manager_id: prof.manager_id }, { onConflict: 'user_id' });

  return NextResponse.json({
    ok: true,
    slug,
    passcode: pin
  });
}
