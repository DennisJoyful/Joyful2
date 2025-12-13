// app/api/werber/update-pin/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, scrypt as _scrypt } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(_scrypt)

// Hash format: scrypt:<saltHex>:<hashHex>
async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scrypt(pin, salt, 32)) as Buffer
  return `scrypt:${salt}:${derived.toString('hex')}`
}

export async function POST(req: Request){
  try {
    const body = await req.json().catch(()=>null) as { id?: string, pin?: string }
    const id = body?.id
    const pin = (body?.pin || '').trim()
    if(!id || !pin) return NextResponse.json({ error: 'id und pin erforderlich' }, { status: 400 })

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(url, key)

    const { data: prof } = await admin.from('profiles').select('role, manager_id').eq('user_id', user.id).maybeSingle()
    if(!prof || prof.role!=='manager' || !prof.manager_id) return NextResponse.json({ error: 'Nur Manager dürfen PINs setzen' }, { status: 403 })

    // check that column pin_hash exists
    const { data: cols } = await admin
      .from('information_schema.columns' as any)
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'werber')
    const hasPinHash = Array.isArray(cols) && cols.some((c:any)=>c.column_name==='pin_hash')
    if (!hasPinHash) return NextResponse.json({ error: "Spalte 'pin_hash' fehlt in 'werber' (Migration ausführen)." }, { status: 400 })

    const pin_hash = await hashPin(pin)

    const { error: upErr } = await admin
      .from('werber')
      .update({ pin_hash })
      .eq('id', id)
      .eq('manager_id', prof.manager_id)

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
