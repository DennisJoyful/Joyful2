// app/api/leads/for-dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(url, key)

    const { data: prof, error: profErr } = await admin
      .from('profiles')
      .select('role, manager_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })
    if (!prof) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const searchParams = req.nextUrl.searchParams
    const qpManager = searchParams.get('manager_id')

    let query = admin.from('leads').select('*').order('created_at', { ascending: false })

    if (prof.role === 'manager') {
      if (!prof.manager_id) return NextResponse.json({ items: [] })
      query = query.eq('manager_id', prof.manager_id)
    } else if (prof.role === 'admin') {
      if (qpManager) query = query.eq('manager_id', qpManager)
    } else {
      return NextResponse.json({ items: [] })
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ items: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
