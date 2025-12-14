// app/api/manager/leads/extra/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Deine feste manager_id (genau wie in deiner SQL)
  const managerId = '022c6670-84ed-46bb-84f1-b61286ea93f6';

  const { data, error } = await supabase
    .from('leads')
    .select('id, source, notes, utm, extras')
    .eq('manager_id', managerId);

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([]);
  }

  return NextResponse.json(data || []);
}