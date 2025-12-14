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
        setStatus(data.isLive ? 'Live' : 'Offline');
      } catch {
        setStatus('Offline');
      }
    };

    check();
    const interval = setInterval(check, refreshMs);
    return () => clearInterval(interval);
  }, [handle, refreshMs]);

  // Immer sichtbar + feste Größe gegen Hydration-Probleme
  return (
    <span className="inline-block min-w-[80px] text-center px-2 py-1 rounded-full text-xs font-bold">
      {status === 'loading' && <span className="text-yellow-600">Prüfe...</span>}
      {status === 'Live' && <span className="text-white bg-green-600">● LIVE</span>}
      {status === 'Offline' && <span className="text-white bg-gray-600">○ Offline</span>}
    </span>
  );
}