// app/api/admin/managers/create/route.ts (patched to also upsert profiles.manager_id)
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
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  const user = (data?.users || []).find(u => String(u.email).toLowerCase() === email.toLowerCase());
  return user?.id || null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const email = body.email?.trim();
    const name = body.name?.trim() || email?.split('@')[0];
    const slug = body.slug?.trim();
    const password = body.password?.trim();
    if (!email || !slug) return NextResponse.json({ error: 'email & slug required' }, { status: 400 });

    // 1) ensure user
    let userId = await findUserIdByEmail(email);
    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: password || Math.random().toString(36).slice(2) + 'A!1',
        email_confirm: true,
      });
      if (error || !data?.user) return NextResponse.json({ error: error?.message || 'create user failed' }, { status: 400 });
      userId = data.user.id;
    }

    // 2) upsert manager
    const { data: mgr, error: mErr } = await supabase
      .from('managers')
      .upsert({ user_id: userId, name, slug } as any, { onConflict: 'user_id' } as any)
      .select('id,user_id')
      .single();
    if (mErr || !mgr) return NextResponse.json({ error: 'Manager upsert failed: ' + (mErr?.message || 'unknown') }, { status: 400 });

    // 3) ensure profiles row with role=manager and manager_id set
    const { data: prof, error: pErr } = await supabase
      .from('profiles')
      .select('user_id, role, manager_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (pErr) return NextResponse.json({ error: 'Profiles read failed: ' + pErr.message }, { status: 400 });

    if (!prof) {
      const { error: insErr } = await supabase.from('profiles').insert({ user_id: userId, role: 'manager', manager_id: mgr.id } as any);
      if (insErr) return NextResponse.json({ error: 'Profiles insert failed: ' + insErr.message }, { status: 400 });
    } else {
      const updates: any = {};
      if (prof.role !== 'manager') updates.role = 'manager';
      if (!prof.manager_id) updates.manager_id = mgr.id;
      if (Object.keys(updates).length) {
        const { error: upErr } = await supabase.from('profiles').update(updates).eq('user_id', userId);
        if (upErr) return NextResponse.json({ error: 'Profiles update failed: ' + upErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, user_id: userId, email, name, slug, manager_id: mgr.id });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'unexpected' }, { status: 500 });
  }
}
