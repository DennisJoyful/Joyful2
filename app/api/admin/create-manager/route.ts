// app/api/admin/create-manager/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function toSlug(s: string){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

export async function POST(req: Request){
  try {
    const body = await req.json();
    const { email, password, name } = body || {};
    if(!email || !password){
      return NextResponse.json({ error: 'email und password erforderlich' }, { status: 400 });
    }

    // 1) find or create auth user
    // listUsers pagination note: we fetch first 200; for larger sets, switch to Admin API getUserByEmail when available.
    const { data: usersPage, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if(listErr){
      return NextResponse.json({ error: 'Admin listUsers fehlgeschlagen: '+listErr.message }, { status: 500 });
    }
    let userId: string | null = null;
    const found = usersPage.users.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
    if(found){
      userId = found.id;
    }else{
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      if(createErr || !created?.user){
        return NextResponse.json({ error: 'Auth-User anlegen fehlgeschlagen: '+(createErr?.message||'unbekannt') }, { status: 500 });
      }
      userId = created.user.id;
    }

    // 2) upsert managers row by user_id
    const slug = toSlug(name || email.split('@')[0]);
    const { error: upsertErr } = await supabaseAdmin.from('managers').upsert({
      user_id: userId,
      email,
      name: name || null,
      slug
    }, { onConflict: 'user_id' });
    if(upsertErr){
      return NextResponse.json({ error: 'Manager-DB-Anlage fehlgeschlagen: '+upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user_id: userId, slug });
  } catch(e:any){
    return NextResponse.json({ error: e?.message || 'unbekannter Fehler' }, { status: 500 });
  }
}
