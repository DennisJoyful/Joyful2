import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hashPin } from '@/lib/pinHash'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const id = body.id ? String(body.id).trim() : null
  const pin = body.pin ? String(body.pin).trim() : null
  if (!id || !pin) return NextResponse.json({ error: 'id und pin erforderlich' }, { status: 400 })

  const pin_hash = await hashPin(pin) // neues, eindeutiges Format inkl. N,r,p

  const { error } = await supabaseAdmin.from('werber').update({ pin_hash }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Update fehlgeschlagen', details: error.message }, { status: 500 })

  return NextResponse.json({ status: 'ok' })
}
