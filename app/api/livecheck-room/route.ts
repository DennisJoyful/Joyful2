// app/api/livecheck-room/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

function jstr(x: any) {
  try { return JSON.stringify(x) } catch { return String(x) }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get('handle') || '').trim()
  const handle = raw.replace(/^@+/, '')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })
  try {
    const mod = await import('tiktok-live-connector').catch(() => null as any)
    if (!mod) return NextResponse.json({ handle, live: null, reason: 'connector-not-installed' }, { status: 200 })
    const WebcastPushConnection = (mod as any).WebcastPushConnection || (mod as any).default
    if (!WebcastPushConnection) return NextResponse.json({ handle, live: null, reason: 'connector-missing-WebcastPushConnection' }, { status: 200 })

    const conn = new WebcastPushConnection(handle, {
      requestOptions: { timeout: 6000 },
      enableExtendedGiftInfo: false,
    })
    const info = await (conn as any).getRoomInfo?.().catch((e:any) => ({ error: jstr(e) }))
    const rid = info?.roomId || info?.data?.roomId || info?.room_id
    const status = Number(info?.status ?? info?.data?.status ?? info?.room_status)
    let live: boolean | null = null
    if (rid && String(rid) !== '0' && status === 1) live = true
    else if (status === 0) live = false
    return NextResponse.json({ handle, live, info }, { status: 200 })
  } catch (e:any) {
    return NextResponse.json({ handle, live: null, reason: 'room-exception:' + jstr(e) }, { status: 200 })
  }
}
