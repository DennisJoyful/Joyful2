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
        // Richtiger Endpoint (ohne -ws-only)
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

  return (
    <div className="w-24 h-8 flex items-center justify-center">
      {status === 'loading' && <span className="text-xs text-gray-500">Prüfe...</span>}
      {status === 'Live' && <span className="text-xs font-bold text-white bg-green-600 px-3 py-1 rounded-full animate-pulse">● LIVE</span>}
      {status === 'Offline' && <span className="text-xs font-bold text-white bg-gray-600 px-3 py-1 rounded-full">○ Offline</span>}
    </div>
  );
}