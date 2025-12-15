// app/api/manager/leads/extra/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Hole den aktuell eingeloggten User
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Kein eingeloggter User oder Auth-Fehler:', userError);
    return NextResponse.json([], { status: 401 });
  }

  // manager_id aus user_metadata holen (Standard bei Supabase, wenn du sie beim Signup setzt)
  // Falls du die manager_id in einer separaten Tabelle speicherst, sag Bescheid – dann passen wir es an
  let managerId = user.user_metadata?.manager_id;

  // Fallback: Falls nicht in metadata, nimm user.id (für Testzwecke oder wenn 1:1)
  if (!managerId) {
    managerId = user.id;
    console.log('Fallback: manager_id = user.id verwendet:', managerId);
  }

  console.log('Manager ID des eingeloggten Users:', managerId);

  const { data, error } = await supabase
    .from('leads')
    .select('id, source')
    .eq('manager_id', managerId);

  if (error) {
    console.error('Supabase Error:', error);
    return NextResponse.json([]);
  }

  console.log('Geladene Leads für diesen Manager:', data);

  return NextResponse.json(data || []);
}