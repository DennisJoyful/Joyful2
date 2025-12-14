// app/api/admin/managers/create/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

type Payload = {
  email: string;
  name?: string;
  slug?: string;
  password?: string;
};

async function findUserIdByEmail(email: string): Promise<string | null> {
  let page = 1;
  const perPage = 1000;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) break;
    const found = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < perPage) break;
    page++;
  }
  return null;
}

function genPassword(len=14){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*?-_';
  let out = '';
  for (let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Payload;
    const email = (body.email||'').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'E-Mail erforderlich' }, { status: 400 });

    const name = (body.name||'').trim() || email.split('@')[0];
    const slug = (body.slug||'').trim().toLowerCase() || email.split('@')[0].replace(/[^a-z0-9-]/g,'-');
    const password = (body.password||'').trim() || genPassword();

    // 1) Create/find auth user and set role metadata
    let userId: string | null = null;
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'manager' },
      app_metadata: { role: 'manager' }
    });

    if (created.error) {
      const existingId = await findUserIdByEmail(email);
      if (!existingId) {
        return NextResponse.json({ error: 'Auth-User konnte nicht angelegt oder gefunden werden: '+created.error.message }, { status: 400 });
      }
      userId = existingId;
      await supabase.auth.admin.updateUserById(userId, { app_metadata: { role: 'manager' }, user_metadata: { name } });
    } else {
      userId = created.data.user?.id || null;
    }
    if (!userId) return NextResponse.json({ error: 'Keine user_id erhalten' }, { status: 400 });

    // 2) Ensure profiles row exists (profiles: user_id, role, manager_id, created_at)
    //    - upsert on user_id if possible; otherwise try insert then update
    // Try select
    const { data: profSel } = await supabase.from('profiles').select('user_id, role, manager_id').eq('user_id', userId).maybeSingle();
    if (!profSel) {
      const { error: profInsErr } = await supabase.from('profiles').insert({ user_id: userId, role: 'manager', manager_id: null });
      if (profInsErr) {
        // If insert fails due to constraint mismatch, try update fallback
        const { error: profUpErr } = await supabase.from('profiles').update({ role: 'manager' }).eq('user_id', userId);
        if (profUpErr) {
          return NextResponse.json({ error: 'Profiles-Anlage fehlgeschlagen: '+(profInsErr.message || profUpErr.message) }, { status: 400 });
        }
      }
    } else {
      // ensure role is manager
      if (profSel.role !== 'manager') {
        await supabase.from('profiles').update({ role: 'manager' }).eq('user_id', userId);
      }
    }

    // 3) Upsert into managers (requires user_id PK/UNIQUE; ensure via DB schema)
    const { error: mErr } = await supabase.from('managers').upsert(
      { user_id: userId, name, slug } as any,
      { onConflict: 'user_id' } as any
    );
    if (mErr) return NextResponse.json({ error: 'Manager-DB-Anlage fehlgeschlagen: '+mErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, user_id: userId, email, name, slug });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'unexpected' }, { status: 500 });
  }
}
