// app/api/werber/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Body = {
  slug?: string
  code?: string
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
    const want = norm(body.slug) || norm(body.code)
    if (!want) {
      return NextResponse.json({ error: 'slug oder code erforderlich' }, { status: 400 })
    }
    const name = body.name?.trim() || null

    async function nextFreeSlug(base: string): Promise<string> {
      let candidate = base
      for (let i = 1; i < 1000; i++) {
        const { data: exists } = await admin.from('werber').select('id').or(`slug.eq.${candidate},code.eq.${candidate}`).maybeSingle()
        if (!exists) return candidate
        candidate = `${base}-${i}`.slice(0, 40)
      }
      return `${base}-${Date.now().toString().slice(-4)}`.slice(0, 40)
    }

    const free = await nextFreeSlug(want)

    async function tryInsert(payload: Record<string, any>) {
      return await admin.from('werber').insert(payload).select('id, slug, code, name').single()
    }

    let inserted: any = null
    let lastErr: string | null = null

    {
      const { data, error } = await tryInsert({ slug: free, name, manager_id: prof.manager_id })
      if (!error) inserted = data
      else lastErr = error.message
    }

    if (!inserted) {
      const { data, error } = await tryInsert({ code: free, name, manager_id: prof.manager_id })
      if (!error) inserted = data
      else lastErr = error.message
    }

    if (!inserted) {
      const { data, error } = await tryInsert({ slug: free, code: free, name, manager_id: prof.manager_id })
      if (!error) inserted = data
      else lastErr = error.message
    }

    if (!inserted) {
      return NextResponse.json({ error: lastErr || 'Werber DB-Anlage fehlgeschlagen' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, item: inserted }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
