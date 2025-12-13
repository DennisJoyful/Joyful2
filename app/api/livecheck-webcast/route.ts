// app/api/livecheck-webcast/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

function jstr(x:any){ try { return JSON.stringify(x) } catch { return String(x) } }
function ua() {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
function cleanHandle(raw:string){ return (raw||'').trim().replace(/^@+/, '') }


type Probe = { live: boolean|null, reason: string, state?: any, diag?: any }

function buildCookie() {
  const parts:string[] = []
  const used:string[] = []
  if (process.env.TIKTOK_COOKIE?.trim()) { parts.push(process.env.TIKTOK_COOKIE!.trim()); used.push('TIKTOK_COOKIE') }
  if (process.env.TIKTOK_MSTOKEN?.trim()) { parts.push(`msToken=${process.env.TIKTOK_MSTOKEN!.trim()}`); used.push('TIKTOK_MSTOKEN') }
  if (process.env.TIKTOK_TTWID?.trim()) { parts.push(`ttwid=${process.env.TIKTOK_TTWID!.trim()}`); used.push('TIKTOK_TTWID') }
  if (process.env.TIKTOK_ODINID?.trim()) { parts.push(`odin_tt=${process.env.TIKTOK_ODINID!.trim()}`); used.push('TIKTOK_ODINID') }
  return { cookie: parts.join('; '), used }
}

export async function GET(req: NextRequest) {
  const handle = cleanHandle(new URL(req.url).searchParams.get('handle')||'')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })
  try {
    const mod:any = await import('tiktok-live-connector').catch(()=>null)
    if (!mod) return NextResponse.json({ handle, live:null, reason:'connector-not-installed' }, { status: 200 })
    const WebcastPushConnection = mod.WebcastPushConnection || mod.default
    if (!WebcastPushConnection) return NextResponse.json({ handle, live:null, reason:'connector-missing' }, { status: 200 })
    const { cookie, used } = buildCookie()
    const conn = new WebcastPushConnection(handle, {
      enableWebsocketUpgrade: false,
      requestOptions: { timeout: 10000, headers: { 'user-agent': ua(), 'accept-language': 'de-DE,de;q=0.9', 'cookie': cookie, 'referer': `https://www.tiktok.com/@${handle}/live` } },
      clientParams: { app_language: 'de-DE', device_platform: 'web', region: 'DE' },
    })
    let info:any
    try { info = await conn.getRoomInfo() } catch(e:any) {
      const msg = String(e?.message||'error')
      const body = e?.data ?? null
      const low = msg.toLowerCase()
      if (low.includes('live_not_found') || low.includes('not found')) {
        return NextResponse.json({ handle, live:false, reason: 'webcast:not-found', diag: { cookieUsed: used, msg, body } }, { status: 200 })
      }
      return NextResponse.json({ handle, live:null, reason: 'webcast:error', diag: { cookieUsed: used, msg, body } }, { status: 200 })
    }
    const rid = info?.roomId || info?.data?.roomId || info?.room_id
    const status = Number(info?.status ?? info?.data?.status ?? info?.room_status)
    if (rid && String(rid) !== '0' && status === 1) return NextResponse.json({ handle, live:true, reason:'webcast:status:1', state: info, diag: { cookieUsed: used } }, { status: 200 })
    if (status === 0) return NextResponse.json({ handle, live:false, reason:'webcast:status:0', state: info, diag: { cookieUsed: used } }, { status: 200 })
    return NextResponse.json({ handle, live:null, reason:'webcast:unknown', state: info, diag: { cookieUsed: used } }, { status: 200 })
  } catch(e:any) {
    return NextResponse.json({ handle, live:null, reason:'webcast-exception', error: jstr(e) }, { status: 200 })
  }
}
