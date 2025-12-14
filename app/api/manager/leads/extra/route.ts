// app/api/manager/leads/extra/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Immer frisch, kein Cache

export async function GET() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  // Hole den aktuellen eingeloggten User
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Kein eingeloggter User:', userError);
    return NextResponse.json([], { status: 401 }); // Unauthorized
  }

  // Angenommen, manager_id ist in user.user_metadata.manager_id gespeichert (passe an deine Auth-Setup an!)
  // Alternativ: Hole aus einer 'profiles'-Tabelle: const { data: profile } = await supabase.from('profiles').select('manager_id').eq('id', user.id).single();
  const managerId = user.user_metadata?.manager_id || user.id; // Fallback auf user.id, falls nicht gesetzt

  console.log('Eingeloggter Manager ID:', managerId); // Debug in Vercel Logs

  const { data, error } = await supabase
    .from('leads')
    .select('id, source, notes, utm, extras')
    .eq('manager_id', managerId);

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([], { status: 500 });
  }

  console.log('Geladene Extras für Manager:', data); // Debug

  return NextResponse.json(data || []);
}