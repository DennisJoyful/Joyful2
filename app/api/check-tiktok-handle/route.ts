// app/api/check-tiktok-handle/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get('handle') || '').trim();
  const handle = raw.replace(/^@/, '').toLowerCase();
  if (!handle) return NextResponse.json({ exists: false, reason: 'missing' }, { status: 200 });

  const oembed = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${encodeURIComponent(handle)}`;

  try {
    const res = await fetch(oembed, { method: 'GET', headers: { 'accept': 'application/json' } });
    if (!res.ok) {
      return NextResponse.json({ exists: false, status: res.status }, { status: 200 });
    }
    const data = await res.json();
    const embedType = String((data as any)?.embed_type || (data as any)?.type || '').toLowerCase();
    const product = String((data as any)?.embed_product_id || '').toLowerCase();
    const authorUrl = String((data as any)?.author_url || '').toLowerCase();
    const html = String((data as any)?.html || '').toLowerCase();

    const authorMatch = authorUrl.includes(`/@${handle}`);
    const productMatch = product === handle;
    const htmlMatch = html.includes(`data-unique-id=\"${handle}\"`) || html.includes(`data-unique-id="${handle}"`);

    const exists = (embedType === 'profile' || authorMatch || productMatch || htmlMatch);

    return NextResponse.json({ exists, embedType, authorMatch, productMatch, htmlMatch }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ exists: false, error: 'network' }, { status: 200 });
  }
}
