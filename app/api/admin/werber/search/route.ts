import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

// GET /api/admin/werber/search?q=term  (Admin only)
export async function GET(req: Request) {
  const supa = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supa.auth.getUser()

  const { data: prof } = await supa.from('profiles').select('role').eq('user_id', user?.id ?? '').maybeSingle()
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const url = new URL(req.url)
  const q = String(url.searchParams.get('q') ?? '').trim()

  let query = supabaseAdmin.from('werber').select('id, slug, name, status').order('created_at', { ascending: false }).limit(50)
  if (q) {
    // simple ilike on slug or name
    query = supabaseAdmin.from('werber')
      .select('id, slug, name, status')
      .ilike('slug', `%${q}%`)
      .order('slug')
      .limit(50)
  }

  const res = await query
  if (res.error) return NextResponse.json({ error: 'Failed to search werber', details: res.error.message }, { status: 500 })

  return NextResponse.json({ items: res.data })
}
