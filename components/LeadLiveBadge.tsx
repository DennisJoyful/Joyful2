'use client';

import React from 'react';

type Props = {
  handle: string;
  refreshMs?: number;
};

export default function LeadLiveBadge({ handle, refreshMs = 15000 }: Props) {
  const [status, setStatus] = React.useState<'loading' | 'Live' | 'Offline'>('loading');

  React.useEffect(() => {
    if (!handle || handle === '') {
      console.log('No handle for badge:', handle); // Debug
      setStatus('Offline');
      return;
    }

    let cancelled = false;

    const checkLive = async () => {
      console.log('Checking live for:', handle); // Debug
      try {
        const res = await fetch(`/api/livecheck?handle=${encodeURIComponent(handle)}`, { cache: 'no-store' });
        console.log('API Response for', handle, ':', res.status); // Debug
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        console.log('API Data for', handle, ':', data); // Debug
        if (!cancelled) {
          setStatus(data.isLive ? 'Live' : 'Offline');
        }
      } catch (err) {
        console.error('Live check error for', handle, ':', err);
        if (!cancelled) setStatus('Offline');
      }
    };

    checkLive();
    const interval = setInterval(checkLive, refreshMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [handle, refreshMs]);

  console.log('Rendering badge for', handle, 'with status:', status); // Debug

  return (
    <div className="w-24 h-9 flex items-center justify-center whitespace-nowrap">
      {status === 'loading' && (
        <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">Prüfe...</span>
      )}
      {status === 'Live' && (
        <span className="text-xs px-3 py-1 rounded-full bg-green-600 text-white font-bold animate-pulse">● LIVE</span>
      )}
      {status === 'Offline' && (
        <span className="text-xs px-3 py-1 rounded-full bg-gray-500 text-white">○ Offline</span>
      )}
    </div>
  );
}