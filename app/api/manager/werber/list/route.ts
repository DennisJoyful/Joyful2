import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

// GET /api/manager/werber/list  — listet alle Werber des eingeloggten Managers
export async function GET() {
  const supa = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const prof = await supa.from('profiles').select('manager_id').eq('user_id', user.id).maybeSingle()
  if (prof.error) return NextResponse.json({ error: 'Failed to read profile', details: prof.error.message }, { status: 500 })
  const manager_id = prof.data?.manager_id as string | undefined
  if (!manager_id) return NextResponse.json({ error: 'No manager context' }, { status: 403 })

  const res = await supabaseAdmin
    .from('werber')
    .select('id, slug, name, status, pin_hash, created_at')
    .eq('manager_id', manager_id)
    .order('created_at', { ascending: false })

  if (res.error) return NextResponse.json({ error: 'Failed to list werber', details: res.error.message }, { status: 500 })

  const items = (res.data ?? []).map((w: any) => ({
    id: w.id,
    slug: w.slug,
    name: w.name,
    status: w.status,
    created_at: w.created_at,
    pin_set: !!w.pin_hash
  }))

  return NextResponse.json({ items })
}
