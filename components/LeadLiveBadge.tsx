'use client';

import React from 'react';

type Props = {
  handle: string;
  refreshMs?: number;
};

export default function LeadLiveBadge({ handle, refreshMs = 20000 }: Props) { // Alle 20 Sekunden checken
  const [status, setStatus] = React.useState<'loading' | 'Live' | 'Offline'>('loading');

  React.useEffect(() => {
    if (!handle) {
      setStatus('Offline');
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/api/livecheck?handle=${encodeURIComponent(handle)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setStatus(data.isLive ? 'Live' : 'Offline');
        }
      } catch {
        if (!cancelled) setStatus('Offline');
      }
    };

    check();
    const interval = setInterval(check, refreshMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [handle, refreshMs]);

  // FESTE GRÖSSE = KEIN VERRUTSCHEN MEHR!
  return (
    <div className="w-24 min-w-[96px] h-9 flex items-center justify-center">
      {status === 'loading' && (
        <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
          Prüfe...
        </span>
      )}
      {status === 'Live' && (
        <span className="text-xs px-3 py-1 rounded-full bg-green-600 text-white font-bold animate-pulse">
          ● LIVE
        </span>
      )}
      {status === 'Offline' && (
        <span className="text-xs px-3 py-1 rounded-full bg-gray-500 text-white">
          ○ Offline
        </span>
      )}
    </div>
  );
}