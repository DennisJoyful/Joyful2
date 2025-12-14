// app/api/manager/leads/extra/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Immer frisch, kein Cache

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Hole alle Leads für deinen Manager (passe manager_id an, wenn nötig)
  const managerId = '022c6670-84ed-46bb-84f1-b61286ea93f6'; // Deine ID aus SQL

  const { data, error } = await supabase
    .from('leads')
    .select('id, source, notes, utm, extras')
    .eq('manager_id', managerId);

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([], { status: 500 });
  }

  console.log('Geladene Extra-Daten:', data); // Sieht man in Vercel Logs

  return NextResponse.json(data || []);
}