import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request){
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (token !== process.env.DISCORD_SYNC_TOKEN) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = createServerComponentClient({ cookies });
  const { data: assignments } = await s.from('discord_assignments').select('*');
  const { data: links } = await s.from('discord_links').select('*');
  return NextResponse.json({ assignments: assignments||[], links: links||[] });
}
