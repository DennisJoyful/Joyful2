'use client';

import React from 'react';

type Props = {
  handle: string;
  refreshMs?: number;
};

export default function LeadLiveBadge({ handle, refreshMs = 20000 }: Props) {
  const [status, setStatus] = React.useState<'loading' | 'Live' | 'Offline'>('loading');

  React.useEffect(() => {
    if (!handle) {
      setStatus('Offline');
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(`/api/livecheck?handle=${encodeURIComponent(handle)}`, { cache: 'no-store' });
        const data = await res.json();
        console.log('Live API for', handle, ':', data); // Siehst du in Browser Console (F12)
        setStatus(data.isLive ? 'Live' : 'Offline');
      } catch {
        setStatus('Offline');
      }
    };

    check();
    const interval = setInterval(check, refreshMs);

    return () => clearInterval(interval);
  }, [handle, refreshMs]);

  return (
    <div className="min-w-[100px] h-10 flex items-center justify-center bg-gray-100 rounded">
      {status === 'loading' && <span className="text-sm">Prüfe...</span>}
      {status === 'Live' && <span className="text-sm font-bold text-green-600">● LIVE</span>}
      {status === 'Offline' && <span className="text-sm text-gray-600">○ Offline</span>}
    </div>
  );
}