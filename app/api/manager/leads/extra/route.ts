import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

async function getCurrentManagerId(): Promise<string | null> {
  const supa = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supa.auth.getUser()
  const uid = user?.id
  if (!uid) return null

  // 1) profiles.manager_id bevorzugt
  const { data: prof } = await supabaseAdmin
    .from('profiles').select('manager_id')
    .eq('user_id', uid).maybeSingle()
  if (prof?.manager_id) return String(prof.manager_id)

  // 2) Fallback: managers.id via user_id
  const { data: mgr } = await supabaseAdmin
    .from('managers').select('id')
    .eq('user_id', uid).maybeSingle()
  return (mgr?.id as string) ?? null
}

export async function GET() {
  const managerId = await getCurrentManagerId()
  if (!managerId) return NextResponse.json([])

  const { data } = await supabaseAdmin
    .from('leads')
    .select('id, source')
    .eq('manager_id', managerId)

  return NextResponse.json(data ?? [])
}
