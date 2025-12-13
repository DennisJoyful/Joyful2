// app/dashboard/werber/layout.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function WerberLayout({ children }: { children: React.ReactNode }){
  const s = supabaseServer();
  const { data: userRes } = await s.auth.getUser();
  const uid = userRes?.user?.id;
  if (!uid) redirect('/auth/werber');

  const { data: prof } = await s.from('profiles').select('role').eq('user_id', uid).single();
  if (!prof || prof.role !== 'werber') redirect('/auth/werber');

  return <>{children}</>;
}
