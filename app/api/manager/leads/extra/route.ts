// app/api/manager/leads/extra/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY fehlt!');
    return NextResponse.json([]);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey // Bypass RLS – liest alles
  );

  const managerId = '022c6670-84ed-46bb-84f1-b61286ea93f6';

  const { data, error } = await supabase
    .from('leads')
    .select('id, source, notes, utm, extras')
    .eq('manager_id', managerId);

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([]);
  }

  console.log('Extras mit service_role_key:', data); // In Vercel Logs sichtbar

  return NextResponse.json(data || []);
}