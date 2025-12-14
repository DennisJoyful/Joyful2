// app/api/werber/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Body = { slug?: string; name?: string };

function norm(v?: string) {
  if (!v) return undefined;
  const s = v.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 40) || undefined;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, key);

    // manager context
    const { data: prof, error: profErr } = await admin
      .from('profiles').select('user_id, role, manager_id').eq('user_id', user.id).maybeSingle();
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
    if (!prof || prof.role !== 'manager' || !prof.manager_id) {
      return NextResponse.json({ error: 'Nur Manager dürfen Werber anlegen' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const slug = norm(body.slug);
    if (!slug) return NextResponse.json({ error: 'slug erforderlich' }, { status: 400 });

    // unique check
    const { data: exists } = await admin.from('werber').select('id').eq('slug', slug).maybeSingle();
    if (exists) return NextResponse.json({ error: 'Slug ist bereits vergeben' }, { status: 409 });

    // Try insert WITH name first; on column error, retry without name
    const basePayload: any = { slug, manager_id: prof.manager_id, status: 'active' };
    let payload: any = { ...basePayload };
    if (body.name && body.name.trim()) payload.name = body.name.trim();

    async function tryInsert(p: any) {
      return await admin.from('werber').insert(p).select('id, slug, status, manager_id, name, created_at').single();
    }

    let inserted: any = null;
    let errMsg: string | null = null;

    {
      const { data, error } = await tryInsert(payload);
      if (!error) inserted = data;
      else errMsg = error.message;
    }

    if (!inserted && payload.name) {
      // Retry without name (DB might not have the column yet)
      const { name, ...noName } = payload;
      const { data, error } = await tryInsert(noName);
      if (!error) inserted = data;
      else errMsg = error.message;
    }

    if (!inserted) {
      return NextResponse.json({ error: errMsg || 'Werber DB-Anlage fehlgeschlagen' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, item: inserted }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
