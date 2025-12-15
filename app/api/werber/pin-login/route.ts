import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyPin } from '@/lib/pinHash'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const wantDebug = url.searchParams.get('debug') === '1' || headers().get('x-admin-debug') === '1'
  const body = await req.json().catch(() => null) as any
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const slug = (body.slug ? String(body.slug).trim().toLowerCase() : null)
  const id = body.id ? String(body.id).trim() : null
  const pin = body.pin ? String(body.pin).trim() : ''

  if (!pin || (!slug && !id)) {
    return NextResponse.json({ error: 'slug oder id und pin erforderlich' }, { status: 400 })
  }

  const q = supabaseAdmin.from('werber').select('id, slug, pin_hash, status').limit(1)
  const res = id ? await q.eq('id', id) : await q.eq('slug', slug!)

  if (res.error) return NextResponse.json({ error: 'Fehler beim Lesen', details: res.error.message }, { status: 500 })
  const row = (res.data ?? [])[0]
  if (!row) return NextResponse.json({ error: 'Werber nicht gefunden' }, { status: 404 })
  if (!row.pin_hash) return NextResponse.json({ error: 'Kein PIN gesetzt' }, { status: 400 })
  if (row.status && row.status !== 'active') return NextResponse.json({ error: 'Werber inaktiv' }, { status: 403 })

  const vr = await verifyPin(String(row.pin_hash), pin)
  if (!vr.ok) {
    if (wantDebug && process.env.ALLOW_PIN_DEBUG === '1') {
      return NextResponse.json({ error: 'verify-failed', reason: vr.reason, format: String(row.pin_hash).split(':').slice(0,2).join(':') }, { status: 401 })
    }
    return NextResponse.json({ error: 'Login fehlgeschlagen. Bitte Eingaben prüfen.' }, { status: 401 })
  }

  const isProd = process.env.NODE_ENV === 'production'
  cookies().set('werber_id', String(row.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })

  return NextResponse.json({ status: 'ok', werber_id: row.id, slug: row.slug })
}
