// app/api/admin/managers/create/route.ts (patched: ensure PROFILE first, then MANAGER)
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
  // NOTE: listUsers is paginated; for simplicity we fetch first 1000 and filter.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 } as any);
  if (error) throw new Error(error.message);
  const user = (data?.users || []).find(u => String(u.email).toLowerCase() === email.toLowerCase());
  return user?.id || null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const email = body.email?.trim();
    const name = (body.name ?? '').trim() || email?.split('@')[0];
    const slug = body.slug?.trim();
    const password = body.password?.trim();
    if (!email || !slug) return NextResponse.json({ error: 'email & slug required' }, { status: 400 });

    // 1) ensure auth user
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

    // 2) ensure profiles row EXISTS BEFORE inserting manager (FK managers.user_id -> profiles.user_id)
    const { data: prof, error: pErr } = await supabase
      .from('profiles')
      .select('user_id, role, manager_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (pErr) return NextResponse.json({ error: 'profiles read failed: ' + pErr.message }, { status: 400 });

    if (!prof) {
      const { error: insErr } = await supabase
        .from('profiles')
        .insert({ user_id: userId, role: 'manager' } as any);
      if (insErr) return NextResponse.json({ error: 'profiles insert failed: ' + insErr.message }, { status: 400 });
    } else if (prof.role !== 'manager') {
      const { error: upErr } = await supabase.from('profiles').update({ role: 'manager' }).eq('user_id', userId);
      if (upErr) return NextResponse.json({ error: 'profiles update failed: ' + upErr.message }, { status: 400 });
    }

    // 3) upsert manager (FK is now satisfied because profiles row exists)
    const { data: mgr, error: mErr } = await supabase
      .from('managers')
      .upsert({ user_id: userId, name, slug } as any, { onConflict: 'user_id' } as any)
      .select('id,user_id,slug')
      .single();
    if (mErr || !mgr) return NextResponse.json({ error: 'Manager upsert failed: ' + (mErr?.message || 'unknown') }, { status: 400 });

    // 4) set profiles.manager_id to this manager (id) if missing
    const { data: prof2 } = await supabase
      .from('profiles')
      .select('manager_id')
      .eq('user_id', userId)
      .single();
    if (!prof2?.manager_id) {
      const { error: setMgrErr } = await supabase
        .from('profiles')
        .update({ manager_id: mgr.id })
        .eq('user_id', userId);
      if (setMgrErr) return NextResponse.json({ error: 'profiles set manager_id failed: ' + setMgrErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user_id: userId, email, name, slug: mgr.slug, manager_id: mgr.id });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'unexpected' }, { status: 500 });
  }
}
