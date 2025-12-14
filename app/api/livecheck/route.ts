// app/api/livecheck/route.ts — App Router endpoint mirroring pages/api/livecheck.ts
import { NextResponse } from 'next/server'
import { TikTokLiveConnection } from 'tiktok-live-connector'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const handle = searchParams.get('handle')
    if (!handle || handle.trim() === '') {
      return NextResponse.json({ error: 'Handle erforderlich (z. B. ?handle=beispieluser)' }, { status: 400 })
    }
    const trimmed = handle.trim()
    let isLive = false
    let statusText: 'Live' | 'Offline' = 'Offline'
    try {
      const connection = new TikTokLiveConnection(trimmed)
      isLive = await connection.fetchIsLive()
      statusText = isLive ? 'Live' : 'Offline'
    } catch (err: any) {
      console.error('Livecheck Fehler:', err?.message || err)
      isLive = false
      statusText = 'Offline'
    }
    return NextResponse.json({ success: true, handle: trimmed, isLive, statusText }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'unexpected' }, { status: 500 })
  }
}
