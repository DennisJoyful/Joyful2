import type { NextApiRequest, NextApiResponse } from 'next';
import { TikTokLiveConnection } from 'tiktok-live-connector';

// Response-Typ
type ResponseData =
  | {
      success: boolean;
      handle: string;
      isLive: boolean;
      statusText: 'Live' | 'Offline';
    }
  | {
      error: string;
      details?: string;
    };

// GET /api/livecheck?handle=username
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { handle } = req.query;

  if (!handle || typeof handle !== 'string' || handle.trim() === '') {
    return res.status(400).json({ error: 'Handle erforderlich (z. B. ?handle=beispieluser)' });
  }

  const trimmedHandle = handle.trim();

  let isLive = false;
  let statusText: 'Live' | 'Offline' = 'Offline';

  try {
    const connection = new TikTokLiveConnection(trimmedHandle);

    // Live-Status prüfen
    isLive = await connection.fetchIsLive();

    if (isLive) {
      statusText = 'Live';
    }
  } catch (error: any) {
    console.error('Livecheck Fehler:', error.message);
    // Bei jedem Fehler → Offline als sicherer Default
    isLive = false;
    statusText = 'Offline';
  }

  const response: ResponseData = {
    success: true,
    handle: trimmedHandle,
    isLive,
    statusText,
  };

  res.status(200).json(response);
}