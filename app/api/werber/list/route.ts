// app/api/werber/list/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function GET(){
  const sc = createServerComponentClient({ cookies });
  const { data: me } = await sc.auth.getUser();
  if(!me?.user) return NextResponse.json({ items: [] });

  const { data: prof } = await sc.from('profiles').select('role, manager_id').eq('user_id', me.user.id).single();
  if(!prof || prof.role!=='manager' || !prof.manager_id) return NextResponse.json({ items: [] });

  const { data: items } = await sc.from('werber').select('id, slug').eq('manager_id', prof.manager_id).order('slug');
  return NextResponse.json({ items: items || [] });
}
