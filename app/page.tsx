// app/page.tsx
import { supabaseServer } from '@/lib/supabaseServer';
import { adminSupabase } from '@/lib/adminSupabase';
import { redirect } from 'next/navigation';

async function getRoleSafe(userId: string): Promise<string | null> {
  // try RLS first
  const s = supabaseServer();
  const { data } = await s.from('profiles').select('role').eq('user_id', userId).single();
  if (data?.role) return data.role as string;
  // fallback service
  const admin = adminSupabase();
  const { data: p } = await admin.from('profiles').select('role').eq('user_id', userId).single();
  return (p as any)?.role ?? null;
}

export default async function Page(){
  const s = supabaseServer();
  const { data: userRes } = await s.auth.getUser();
  const uid = userRes?.user?.id;

  if (uid) {
    const role = await getRoleSafe(uid);
    if (role === 'admin') redirect('/dashboard/admin');
    if (role === 'manager') redirect('/dashboard/manager');
    if (role === 'werber') redirect('/dashboard/werber');
    // logged in but no role → show neutral dashboard links (no Login button)
    return (
      <main style={{ display:'grid', placeItems:'center', minHeight:'65vh' }}>
        <div className="card" style={{ width:'100%', maxWidth:520 }}>
          <div className="card-body" style={{ display:'grid', gap:'.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Willkommen</h2>
            <p>Du bist eingeloggt, aber es ist noch keine Rolle zugewiesen.</p>
            <div style={{ display:'grid', gap:'.5rem' }}>
              <a className="btn" href="/dashboard/admin">Zum Admin-Bereich</a>
              <a className="btn" href="/dashboard/manager">Zum Manager-Bereich</a>
              <a className="btn" href="/dashboard/werber">Zum Werber-Bereich</a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Not logged in: show single login button
  return (
    <main style={{ display:'grid', placeItems:'center', minHeight:'65vh' }}>
      <div className="card" style={{ width:'100%', maxWidth:520 }}>
        <div className="card-body" style={{ display:'grid', gap:'.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Willkommen</h2>
          <p>Bitte melden Sie sich an, um fortzufahren.</p>
          <div style={{ display:'grid', gap:'.5rem' }}>
            <a className="btn btn-primary" href="/auth/sign-in">Login</a>
          </div>
        </div>
      </div>
    </main>
  );
}
