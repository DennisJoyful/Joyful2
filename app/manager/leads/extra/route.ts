// app/api/manager/leads/extra/route.ts
import { createServerClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Kein Cache!

export async function GET(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Hole ALLE Leads für den Manager (ersetze '022c6670-84ed-46bb-84f1-b61286ea93f6' durch deine echte manager_id, oder mach es dynamisch via Headers/Auth)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json([], { status: 401 });
  }

  // Angenommen, manager_id aus User (passe an deine Auth an – z.B. user.user_metadata.manager_id)
  const managerId = '022c6670-84ed-46bb-84f1-b61286ea93f6'; // Deine feste ID aus SQL

  const { data, error } = await supabase
    .from('leads')
    .select('id, source, notes, utm, extras') // Explizit source inkludieren!
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([], { status: 500 });
  }

  console.log('API Extra Data:', data); // Debug-Log in Vercel Logs

  return NextResponse.json(data || []);
}