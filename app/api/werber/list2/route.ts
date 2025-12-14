// app/api/werber/list2/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function titleFromSlug(slug?: string|null){
  if(!slug) return null
  return slug.split('-').map(s=>s ? s[0].toUpperCase()+s.slice(1) : s).join(' ')
}

export async function GET(){
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(url, key)

    const { data: prof, error: profErr } = await admin
      .from('profiles')
      .select('manager_id, role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })
    if (!prof || prof.role !== 'manager' || !prof.manager_id) {
      return NextResponse.json({ error: 'Nur Manager dürfen Werber sehen' }, { status: 403 })
    }

    const { data, error } = await admin
      .from('werber')
      .select('id, slug, status, pin_hash, created_at, name')
      .eq('manager_id', prof.manager_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const items = (data || []).map(w => ({
      id: w.id,
      slug: w.slug,
      name: (w as any).name ?? titleFromSlug(w.slug),
      status: w.status ?? null,
      pin_set: !!(w as any).pin_hash,
      created_at: w.created_at
    }))

    return NextResponse.json({ items })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
