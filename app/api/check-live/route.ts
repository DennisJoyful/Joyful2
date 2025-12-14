// app/api/check-live/route.ts
import { NextResponse } from 'next/server';

async function probe(url: string) {
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'user-agent': 'Mozilla/5.0' } });
    const text = await res.text();
    return { ok: res.ok, text };
  } catch {
    return { ok: false, text: '' };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get('handle') || '').trim();
  const handle = raw.replace(/^@/, '').toLowerCase();
  if (!handle) return NextResponse.json({ live: false, reason: 'missing' }, { status: 200 });

  const urls = [
    `https://www.tiktok.com/@${handle}/live`,
    `https://www.tiktok.com/@${handle}`,
  ];

  for (const u of urls) {
    const r = await probe(u);
    if (!r.ok) continue;
    const html = r.text.toLowerCase();
    const liveTokens = ['"isLive":true', 'live-room', 'data-e2e="live"'];
    const isLive = liveTokens.some(t => html.includes(t));
    if (isLive) return NextResponse.json({ live: true, url: u }, { status: 200 });
  }
  return NextResponse.json({ live: false }, { status: 200 });
}
