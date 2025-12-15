import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { scrypt as _scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(_scrypt)

export const dynamic = 'force-dynamic'

/**
 * Verifiziert den in /api/werber/update-pin gesetzten Hash.
 * Hashformat: "scrypt:<saltHex>:<hashHex>"
 */
async function verifyHash(stored: string, pin: string): Promise<boolean> {
  try {
    if (!stored || !stored.startsWith('scrypt:')) return false
    const [, saltHex, hashHex] = stored.split(':')
    if (!saltHex || !hashHex) return false
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const derived = (await scrypt(pin, salt, expected.length)) as Buffer
    if (derived.length !== expected.length) return false
    return timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const slug = (body.slug ? String(body.slug).trim().toLowerCase() : null)
  const id = body.id ? String(body.id).trim() : null
  const pin = body.pin ? String(body.pin).trim() : ''

  if (!pin || (!slug && !id)) {
    return NextResponse.json({ error: 'slug oder id und pin erforderlich' }, { status: 400 })
  }

  const q = supabaseAdmin
    .from('werber')
    .select('id, slug, pin_hash, status')
    .limit(1)

  const res = id
    ? await q.eq('id', id)
    : await q.eq('slug', slug!)

  if (res.error) return NextResponse.json({ error: 'Fehler beim Lesen', details: res.error.message }, { status: 500 })
  const row = (res.data ?? [])[0]
  if (!row) return NextResponse.json({ error: 'Werber nicht gefunden' }, { status: 404 })
  if (!row.pin_hash) return NextResponse.json({ error: 'Kein PIN gesetzt' }, { status: 400 })
  if (row.status && row.status !== 'active') return NextResponse.json({ error: 'Werber inaktiv' }, { status: 403 })

  const ok = await verifyHash(row.pin_hash as string, pin)
  if (!ok) return NextResponse.json({ error: 'Login fehlgeschlagen. Bitte Eingaben prüfen.' }, { status: 401 })

  // Set httpOnly cookie to mark werber session
  cookies().set('werber_id', row.id as string, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 Tage
  })

  return NextResponse.json({ status: 'ok', werber_id: row.id, slug: row.slug })
}
