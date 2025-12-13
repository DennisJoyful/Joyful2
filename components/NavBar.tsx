// components/NavBar.tsx
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { supabaseServer } from '@/lib/supabaseServer';
import { adminSupabase } from '@/lib/adminSupabase';

async function getRoleSafe(userId: string): Promise<string | null> {
  // Try with normal server client (RLS)
  const s = supabaseServer();
  const { data, error } = await s.from('profiles').select('role').eq('user_id', userId).single();
  if (data?.role) return data.role as string;

  // Fallback via service role (server-only)
  try{
    const admin = adminSupabase();
    const { data: p } = await admin.from('profiles').select('role').eq('user_id', userId).single();
    return (p as any)?.role ?? null;
  }catch{
    return null;
  }
}

export default async function NavBar() {
  const s = supabaseServer();
  const { data: userRes } = await s.auth.getUser();
  const user = userRes?.user;
  if (!user) return null;

  const role = await getRoleSafe(user.id);

  if (role === 'admin') {
    return (
      <nav style={{ display: 'flex', gap: '1rem', fontSize: '.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/">Home</Link>
        <Link href="/dashboard/admin">Admin</Link>
        <Link href="/dashboard/admin/managers">Admin · Manager anlegen</Link>
        <Link href="/dashboard/manager">Manager</Link>
        <Link href="/dashboard/werber">Werber</Link>
        <LogoutButton />
      </nav>
    );
  }

  if (role === 'manager') {
    return (
      <nav style={{ display: 'flex', gap: '1rem', fontSize: '.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/">Home</Link>
        <Link href="/dashboard/manager">Manager</Link>
        <Link href="/dashboard/manager/werber">Werber anlegen</Link>
        <Link href="/dashboard/manager/inactive">Inaktive</Link>
        <LogoutButton />
      </nav>
    );
  }

  if (role === 'werber') {
    return (
      <nav style={{ display: 'flex', gap: '1rem', fontSize: '.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/">Home</Link>
        <Link href="/dashboard/werber">Werber</Link>
        <LogoutButton />
      </nav>
    );
  }

  // Unknown role: minimal
  return (
    <nav style={{ display: 'flex', gap: '1rem', fontSize: '.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Link href="/">Home</Link>
      <LogoutButton />
    </nav>
  );
}
