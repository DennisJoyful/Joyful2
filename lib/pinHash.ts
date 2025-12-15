import { scrypt as scryptCb, randomBytes, timingSafeEqual } from 'crypto'

// Wir erzwingen eine zentrale Stelle für Hash/Verify.
// Neues, eindeutiges Format: scrypt:<N>:<r>:<p>:<saltHex>:<hashHex>

const DEFAULT_COST = { N: 32768, r: 8, p: 1 } // moderat, schnell genug für Vercel Node
const KEYLEN = 32 // 256-bit
const SALT_BYTES = 16

function scryptAsync(password: string, salt: Buffer, keylen: number, opts?: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // @ts-ignore - Node types variieren; opts ist optional
    scryptCb(password, salt, keylen, opts || undefined, (err: any, derivedKey: Buffer) => {
      if (err) return reject(err)
      resolve(derivedKey as Buffer)
    })
  })
}

export async function hashPin(pin: string, costs = DEFAULT_COST): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const key = await scryptAsync(pin, salt, KEYLEN, costs)
  return `scrypt:${costs.N}:${costs.r}:${costs.p}:${salt.toString('hex')}:${key.toString('hex')}`
}

export type VerifyResult = { ok: boolean; reason?: string }

const COST_PRESETS = [
  { N: 16384, r: 8, p: 1 },
  { N: 32768, r: 8, p: 1 },
  { N: 65536, r: 8, p: 1 },
  { N: 16384, r: 8, p: 2 },
]

export async function verifyPin(stored: string, pin: string): Promise<VerifyResult> {
  try {
    if (!stored || !stored.startsWith('scrypt:')) return { ok: false, reason: 'unsupported-prefix' }
    const parts = stored.split(':')
    if (parts.length === 3) {
      // Legacy: scrypt:<saltHex>:<hashHex>
      const [, saltHex, hashHex] = parts
      if (!saltHex || !hashHex) return { ok: false, reason: 'missing-parts' }
      const salt = Buffer.from(saltHex, 'hex')
      const expected = Buffer.from(hashHex, 'hex')
      // Presets probieren, weil Kosten unbekannt
      for (const preset of COST_PRESETS) {
        const key = await scryptAsync(pin, salt, expected.length, preset)
        if (key.length === expected.length && timingSafeEqual(key, expected)) return { ok: true }
      }
      return { ok: false, reason: 'no-preset-matched' }
    } else if (parts.length >= 6) {
      // Neues Format: scrypt:<N>:<r>:<p>:<saltHex>:<hashHex>
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
