// app/api/manager/leads/extra/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase Env-Vars fehlen!');
    return NextResponse.json([]);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Temporär ALLE Leads holen (ohne Filter) – um zu testen, ob Daten kommen
  const { data, error } = await supabase
    .from('leads')
    .select('id, source, notes, utm, extras');

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([]);
  }

  console.log('Geladene Extras (alle):', data); // Debug

  return NextResponse.json(data || []);
}