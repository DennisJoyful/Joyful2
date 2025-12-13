// app/api/manager/leads/[id]/followup-sent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(()=>({} as any))
  const sent = Boolean(body?.sent)

  const { data: mgr } = await supabaseAdmin
    .from('managers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!mgr?.id) return NextResponse.json({ error: 'manager not found' }, { status: 403 })

  const { data: updated, error } = await supabaseAdmin
    .from('leads')
    .update({ follow_up_sent: sent })
    .eq('id', params.id)
    .eq('manager_id', mgr.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated, { status: 200 })
}
