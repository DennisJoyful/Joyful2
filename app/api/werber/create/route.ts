// app/api/werber/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Body = {
  slug?: string
  name?: string
}

function norm(v?: string) {
  if (!v) return undefined
  const s = v.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return s.slice(0, 40) || undefined
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(url, key)

    // find manager context
    const { data: prof, error: profErr } = await admin
      .from('profiles')
      .select('user_id, role, manager_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })
    if (!prof || prof.role !== 'manager' || !prof.manager_id) {
      return NextResponse.json({ error: 'Nur Manager dürfen Werber anlegen' }, { status: 403 })
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const want = norm(body.slug)
    if (!want) return NextResponse.json({ error: 'slug erforderlich' }, { status: 400 })

    // ensure slug is free
    const { data: exists } = await admin.from('werber').select('id').eq('slug', want).maybeSingle()
    if (exists) return NextResponse.json({ error: 'Slug ist bereits vergeben' }, { status: 409 })

    // insert minimal columns (NO pin anywhere)
    const payload: any = {
      slug: want,
      manager_id: prof.manager_id,
      status: 'active',
    }
    // include name only if column exists
    const { data: cols } = await admin
      .from('information_schema.columns' as any)
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'werber')
    const hasName = Array.isArray(cols) && cols.some((c:any)=>c.column_name==='name')
    if (hasName && body.name) payload.name = body.name.trim()

    const { data: inserted, error: insErr } = await admin.from('werber').insert(payload).select('id, slug, status, manager_id, name').single()
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })
    return NextResponse.json({ ok: true, item: inserted }, { status: 200 })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
