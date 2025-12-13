// app/api/admin/import-leads/route.ts (lead_source fix)
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = getAdminClient()
    const { managerId, handles } = await req.json()
    if (!managerId || !Array.isArray(handles)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }
    let inserted = 0
    for (const handle of handles) {
      const { error } = await supabase.from('leads').insert({
        manager_id: managerId,
        handle,
        lead_source: 'admin',
        status: 'new'
      } as any);
      if (!error) inserted++;
    }
    return NextResponse.json({ ok: true, inserted });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'import failed' }, { status: 500 })
  }
}
