// app/api/livecheck/route.ts
import { NextResponse } from 'next/server';
import { TikTokLiveConnection } from 'tiktok-live-connector';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  if (!handle || handle.trim() === '') {
    return NextResponse.json({ error: 'Handle erforderlich' }, { status: 400 });
  }

  const trimmedHandle = handle.trim();

  let isLive = false;
  let statusText: 'Live' | 'Offline' = 'Offline';

  try {
    const connection = new TikTokLiveConnection(trimmedHandle);
    isLive = await connection.fetchIsLive();
    if (isLive) statusText = 'Live';
  } catch (error: any) {
    console.error('Livecheck Fehler:', error.message);
    isLive = false;
    statusText = 'Offline';
  }

  return NextResponse.json({
    isLive,
    statusText,
  });
}