import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { scrypt as scryptCb, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function scryptAsync(password: string, salt: Buffer, keylen: number, opts?: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // @ts-ignore - Node types vary across versions; opts is optional
      scryptCb(password, salt, keylen, opts || undefined, (err: any, derivedKey: Buffer) => {
        if (err) return reject(err)
        resolve(derivedKey as Buffer)
      })
    } catch (e) {
      reject(e)
    }
  })
}

type VerifyResult = { ok: boolean; reason?: string }

async function verifyScrypt(stored: string, pin: string): Promise<VerifyResult> {
  try {
    if (!stored || !stored.startsWith('scrypt:')) {
      return { ok: false, reason: 'unsupported-prefix' }
    }
    const parts = stored.split(':')
    // 1) scrypt:<saltHex>:<hashHex>
    // 2) scrypt:<N>:<r>:<p>:<saltHex>:<hashHex>
    if (parts.length === 3) {
      const [, saltHex, hashHex] = parts
      if (!saltHex || !hashHex) return { ok: false, reason: 'missing-parts' }
      const salt = Buffer.from(saltHex, 'hex')
      const expected = Buffer.from(hashHex, 'hex')
      const key = await scryptAsync(pin, salt, expected.length)
      if (key.length !== expected.length) return { ok: false, reason: 'length-mismatch' }
      return { ok: timingSafeEqual(key, expected) }
    } else if (parts.length >= 6) {
      const [, nStr, rStr, pStr, saltHex, hashHex] = parts
      const N = Number(nStr), r = Number(rStr), p = Number(pStr)
      if (!N || !r || !p) return { ok: false, reason: 'invalid-costs' }
      const salt = Buffer.from(saltHex, 'hex')
      const expected = Buffer.from(hashHex, 'hex')
      const key = await scryptAsync(pin, salt, expected.length, { N, r, p })
      if (key.length !== expected.length) return { ok: false, reason: 'length-mismatch' }
      return { ok: timingSafeEqual(key, expected) }
    } else {
      return { ok: false, reason: 'unknown-format' }
    }
  } catch (e:any) {
    return { ok: false, reason: 'exception:' + (e?.message || String(e)) }
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

  const q = supabaseAdmin.from('werber').select('id, slug, pin_hash, status').limit(1)
  const res = id ? await q.eq('id', id) : await q.eq('slug', slug!)

  if (res.error) return NextResponse.json({ error: 'Fehler beim Lesen', details: res.error.message }, { status: 500 })
  const row = (res.data ?? [])[0]
  if (!row) return NextResponse.json({ error: 'Werber nicht gefunden' }, { status: 404 })
  if (!row.pin_hash) return NextResponse.json({ error: 'Kein PIN gesetzt' }, { status: 400 })
  if (row.status && row.status !== 'active') return NextResponse.json({ error: 'Werber inaktiv' }, { status: 403 })

  const vr = await verifyScrypt(row.pin_hash as string, pin)
  if (!vr.ok) {
    const dbgHeader = headers().get('x-admin-debug')
    if (dbgHeader && process.env.ALLOW_PIN_DEBUG === '1') {
      return NextResponse.json({ error: 'verify-failed', reason: vr.reason, format: String(row.pin_hash).split(':').slice(0,2).join(':') }, { status: 401 })
    }
    return NextResponse.json({ error: 'Login fehlgeschlagen. Bitte Eingaben prüfen.' }, { status: 401 })
  }

  const isProd = process.env.NODE_ENV === 'production'
  cookies().set('werber_id', row.id as string, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })

  return NextResponse.json({ status: 'ok', werber_id: row.id, slug: row.slug })
}
