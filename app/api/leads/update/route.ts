// app/api/leads/update/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request){
  const body = await req.json();
  const { id, status, werber_id } = body as { id: string; status?: string; werber_id?: string | null };

  const s = createServerComponentClient({ cookies });
  const { data: me } = await s.auth.getUser();
  if(!me?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Check manager role and ownership via profiles.manager_id vs leads.manager_id
  const { data: prof } = await s.from('profiles').select('role, manager_id').eq('user_id', me.user.id).single();
  if(!prof || prof.role!=='manager') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: lead } = await s.from('leads').select('id, manager_id').eq('id', id).single();
  if(!lead || lead.manager_id !== prof.manager_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const patch: any = {};
  if (status) patch.status = status;
  if (typeof werber_id !== 'undefined') patch.werber_id = werber_id || null;

  if (Object.keys(patch).length===0) return NextResponse.json({ ok:true, noop:true });

  const { error } = await s.from('leads').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
