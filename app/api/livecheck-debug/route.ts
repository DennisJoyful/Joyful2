// app/api/livecheck-debug/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

function jstr(x:any){ try { return JSON.stringify(x) } catch { return String(x) } }
function ua() {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
function cleanHandle(raw:string){ return (raw||'').trim().replace(/^@+/, '') }


export async function GET(req: NextRequest) { 
  const present = (name:string) => (process.env[name]?.length ? process.env[name]!.length : 0)
  const info = [
    ['TIKTOK_COOKIE', present('TIKTOK_COOKIE')],
    ['TIKTOK_MSTOKEN', present('TIKTOK_MSTOKEN')],
    ['TIKTOK_TTWID', present('TIKTOK_TTWID')],
    ['TIKTOK_ODINID', present('TIKTOK_ODINID')],
  ]
  return NextResponse.json({ now: new Date().toISOString(), env: info }, { status: 200 })
}
