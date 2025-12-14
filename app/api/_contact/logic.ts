// app/api/_contact/logic.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function toISODate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth()+1).padStart(2,'0')
  const day = String(d.getUTCDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

async function getManagerId(userId: string) {
  const { data: mgr } = await supabaseAdmin
    .from('managers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return mgr?.id as string | undefined
}

export async function contactById(req: NextRequest, id: string) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const managerId = await getManagerId(user.id)
  if (!managerId) return NextResponse.json({ error: 'manager not found' }, { status: 403 })

  const { data: lead, error: findErr } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('id', id)
    .eq('manager_id', managerId)
    .maybeSingle()
  if (findErr || !lead?.id) return NextResponse.json({ error: 'lead not found' }, { status: 404 })

  const today = new Date()
  const contact_date = toISODate(today)
  const follow_up = toISODate(new Date(today.getTime() + 5*24*60*60*1000))

  const { data: updated, error: updErr } = await supabaseAdmin
    .from('leads')
    .update({ contact_date, follow_up_date: follow_up, follow_up: follow_up, status: 'no_response' })
    .eq('id', lead.id)
    .select()
    .single()
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  return NextResponse.json(updated, { status: 200 })
}

export async function contactByHandle(req: NextRequest, handle: string) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const managerId = await getManagerId(user.id)
  if (!managerId) return NextResponse.json({ error: 'manager not found' }, { status: 403 })

  const { data: lead, error: findErr } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('manager_id', managerId)
    .eq('handle', handle.toLowerCase())
    .maybeSingle()
  if (findErr || !lead?.id) return NextResponse.json({ error: 'lead not found' }, { status: 404 })

  const today = new Date()
  const contact_date = toISODate(today)
  const follow_up = toISODate(new Date(today.getTime() + 5*24*60*60*1000))

  const { data: updated, error: updErr } = await supabaseAdmin
    .from('leads')
    .update({ contact_date, follow_up_date: follow_up, follow_up: follow_up, status: 'no_response' })
    .eq('id', lead.id)
    .select()
    .single()
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  return NextResponse.json(updated, { status: 200 })
}
