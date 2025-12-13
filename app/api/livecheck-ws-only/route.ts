// app/api/livecheck-ws-only/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { NextResponse as NR } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const handle = (url.searchParams.get('handle') || '').replace(/^@+/, '')
  if (!handle) return NR.json({ error: 'handle required' }, { status: 400 })
  const r = await fetch(`${url.origin}/api/livecheck-ws?handle=${encodeURIComponent(handle)}`, { cache: 'no-store' })
  const j = await r.json().catch(()=>({}))
  return NR.json(j, { status: 200 })
}
