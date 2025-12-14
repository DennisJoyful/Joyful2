// app/api/manager/leads/live/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const handle = (searchParams.get('handle') || '').trim()
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const url = `https://www.tiktok.com/@${handle}/live`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'user-agent': 'Mozilla/5.0' },
      cache: 'no-store',
      redirect: 'manual',
    })
    // Heuristics:
    // - 200 (OK) without redirect -> live very likely
    // - 301/302/303 -> usually redirected away -> offline
    // - others -> unknown
    let live: boolean | null = null
    if (res.status === 200) live = true
    else if ([301,302,303,307,308].includes(res.status)) live = false
    else live = null

    return NextResponse.json({ handle, live, url, status: res.status }, { status: 200 })
  } catch (e:any) {
    return NextResponse.json({ handle, live: null, url, error: String(e?.message || e) }, { status: 200 })
  }
}
