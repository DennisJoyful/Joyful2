// app/api/livecheck/route.ts
import { NextResponse } from 'next/server';
import { detectTikTokLive } from '@/lib/livecheck';

export const dynamic = 'force-dynamic'; // Immer frisch, kein Cache

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  if (!handle || handle.trim() === '') {
    return NextResponse.json({ error: 'Handle erforderlich' }, { status: 400 });
  }

  const result = await detectTikTokLive(handle);

  return NextResponse.json({
    isLive: result.live === true,
    statusText: result.live === true ? 'Live' : 'Offline',
    reason: result.reason // Hilft beim Debuggen, kannst du später entfernen
  });
}