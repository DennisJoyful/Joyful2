import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export default async function WerberLayout({ children }: { children: ReactNode }) {
  // 1) PIN-Cookie vorhanden?
  const cookieStore = cookies()
  const werberCookie = cookieStore.get('werber_id')?.value || null
  if (werberCookie) {
    // optional: check existence
    const w = await supabaseAdmin.from('werber').select('id,status').eq('id', werberCookie).maybeSingle()
    if (!w.error && w.data && (!w.data.status || w.data.status === 'active')) {
      return <>{children}</>
    }
  }

  // 2) Fallback: Supabase-Session mit role='werber'
  const supa = createServerComponentClient({ cookies: () => cookieStore })
  const { data: { user } } = await supa.auth.getUser()
  if (user?.id) {
    const prof = await supa.from('profiles').select('role').eq('user_id', user.id).maybeSingle()
    if (prof.data?.role === 'werber') {
      return <>{children}</>
    }
  }

  // 3) Kein Zugriff: zur PIN-Login-Einstiegsseite weiterleiten
  redirect('/sws')
}
