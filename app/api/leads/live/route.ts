// app/api/leads/live/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { detectTikTokLive } from '@/lib/livecheck'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get('handle') || '').trim()
  if (!raw) return NextResponse.json({ error: 'handle required' }, { status: 400 })
  const result = await detectTikTokLive(raw)
  return NextResponse.json(result, { status: 200 })
}
