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
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log('Live API for', handle, ':', data); // Dein Log
        setStatus(data.isLive ? 'Live' : 'Offline');
      } catch {
        setStatus('Offline');
      }
    };

    check();
    const interval = setInterval(check, refreshMs);
    return () => clearInterval(interval);
  }, [handle, refreshMs]);

  // Feste Größe + immer sichtbar
  return (
    <span className="inline-block w-20 text-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100">
      {status === 'loading' && 'Prüfe...'}
      {status === 'Live' && <span className="text-white bg-green-600">● LIVE</span>}
      {status === 'Offline' && <span className="text-white bg-gray-600">○ Offline</span>}
    </span>
  );
}