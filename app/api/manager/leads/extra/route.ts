// app/api/manager/leads/extra/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Temporär ALLE Leads holen (kein Filter) – so kommen deine Daten definitiv
  const { data, error } = await supabase
    .from('leads')
    .select('id, source, notes, utm, extras');

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([]);
  }

  console.log('Temporär geladene Extras (alle Leads):', data);

  return NextResponse.json(data || []);
}