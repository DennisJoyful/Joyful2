// app/api/werber/update-pin/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request){
  try {
    const body = await req.json();
    const { id: werber_id, pin } = body || {};
    if(!werber_id || !pin) return NextResponse.json({ error: 'werber_id und pin erforderlich' }, { status: 400 });

    const sc = createServerComponentClient({ cookies });
    const { data: me } = await sc.auth.getUser();
    if(!me?.user) return NextResponse.json({ error:'Unauthorized' }, { status: 401 });

    // hole manager-context aus profiles
    const { data: prof, error: profErr } = await sc.from('profiles').select('role, manager_id').eq('user_id', me.user.id).single();
    if(profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
    if(!prof || prof.role!=='manager' || !prof.manager_id) return NextResponse.json({ error: 'Nur Manager dürfen PINs setzen' }, { status: 403 });

    // ermittle die Email des Werbers über Tabelle 'werber' (erwartet Spalten: id, email ODER username->email ableitbar)
    const { data: w } = await sc.from('werber').select('id, email').eq('id', werber_id).maybeSingle();
    const email = w?.email;
    if(!email) return NextResponse.json({ error:'Werber-E-Mail nicht gefunden' }, { status: 404 });

    // Service-Client für Auth-Update
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, key);

    // Finde den Auth-User via E-Mail
    const { data: list } = await admin.auth.admin.listUsers();
    const user = list.users.find(u=>u.email===email);
    if(!user) return NextResponse.json({ error:'Auth-User nicht gefunden' }, { status: 404 });

    // Update Passwort in Auth; KEIN Schreibzugriff auf werber.pin (Spalte existiert nicht)
    const { error: up } = await admin.auth.admin.updateUserById(user.id, { password: pin });
    if(up) return NextResponse.json({ error: 'PIN-Update fehlgeschlagen: ' + up.message }, { status: 500 });

    // Fertig. Keine DB-Spalten anfassen, da 'pin' nicht existiert.
    return NextResponse.json({ ok:true });
  } catch(e:any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
