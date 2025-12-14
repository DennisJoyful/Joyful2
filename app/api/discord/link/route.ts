import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request){
  const body = await req.json();
  const { creator_id, discord_id } = body;
  const s = createServerComponentClient({ cookies });
  const { data: existing } = await s.from('discord_links').select('*').eq('creator_id', creator_id).single();
  if (existing && existing.locked) return NextResponse.json({ ok: false, reason: 'locked' });
  await s.from('discord_links').upsert({ creator_id, discord_id, locked: true });
  return NextResponse.json({ ok: true });
}
