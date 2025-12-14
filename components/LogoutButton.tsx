// components/LogoutButton.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutButton(){
  async function out(){
    await supabase.auth.signOut();
    window.location.href = '/';
  }
  return <button className="btn" onClick={out}>Logout</button>;
}
