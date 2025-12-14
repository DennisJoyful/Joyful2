// app/api/admin/tools/backfill-profiles-manager-id/route.ts
// One-off admin tool: set profiles.manager_id based on managers.user_id where missing.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export async function POST() {
  const s = createServerComponentClient({ cookies });
  const { data: me } = await s.auth.getUser();
  if (!me?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: prof } = await s.from('profiles').select('role').eq('user_id', me.user.id).single();
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, service);

  // 1) Fetch all managers with their owner user_id
  const { data: managers, error: mErr } = await admin.from('managers').select('id, user_id');
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });

  // 2) For each, ensure a profiles row with manager_id set
  let fixed = 0, already = 0;
  for (const m of managers || []) {
    if (!m?.user_id || !m?.id) continue;
    const { data: p } = await admin.from('profiles').select('user_id, manager_id, role').eq('user_id', m.user_id).maybeSingle();
    if (!p) {
      const { error: insErr } = await admin.from('profiles').insert({ user_id: m.user_id, role: 'manager', manager_id: m.id } as any);
      if (!insErr) fixed++;
    } else if (!p.manager_id || p.role !== 'manager') {
      const updates: any = {};
      if (!p.manager_id) updates.manager_id = m.id;
      if (p.role !== 'manager') updates.role = 'manager';
      const { error: upErr } = await admin.from('profiles').update(updates).eq('user_id', m.user_id);
      if (!upErr) fixed++; else already++;
    } else {
      already++;
    }
  }

  return NextResponse.json({ ok: true, fixed, already });
}
