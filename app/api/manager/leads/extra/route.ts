// app/api/manager/leads/extra/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Fehlende Supabase Env-Vars');
    return NextResponse.json([]);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const managerId = '022c6670-84ed-46bb-84f1-b61286ea93f6';

  // NUR Spalten, die wirklich existieren!
  const { data, error } = await supabase
    .from('leads')
    .select('id, source') // notes ist null, also weglassen – reicht für Quelle
    .eq('manager_id', managerId);

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([]);
  }

  console.log('Extras geladen (id + source):', data);

  return NextResponse.json(data || []);
}