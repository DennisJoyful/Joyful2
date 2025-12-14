// app/dashboard/admin/layout.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function AdminLayout({ children }: { children: React.ReactNode }){
  const s = supabaseServer();
  const { data: userRes } = await s.auth.getUser();
  const uid = userRes?.user?.id;
  if (!uid) redirect('/auth/sign-in?next=/dashboard/admin');

  const { data: prof } = await s.from('profiles').select('role').eq('user_id', uid).single();
  if (!prof || prof.role !== 'admin') redirect('/');

  return <>{children}</>;
}
