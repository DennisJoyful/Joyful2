// components/LiveDot.tsx
'use client';
import { useEffect, useState } from 'react';

export default function LiveDot({ handle }: { handle: string }){
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(()=>{
    let cancel=false;
    (async()=>{
      try{
        const r = await fetch(`/api/livecheck?handle=${encodeURIComponent(handle)}`);
        const j = await r.json();
        if(!cancel) setLive(!!j.live);
      }catch{ if(!cancel) setLive(false); }
    })();
    return ()=>{ cancel=true; }
  },[handle]);
  if(live===null) return <span style={{ width:10,height:10,display:'inline-block',borderRadius:999,background:'#e5e7eb' }} />;
  return <span title={live?'live':'offline'} style={{ width:10,height:10,display:'inline-block',borderRadius:999,background: live ? '#22c55e' : '#9ca3af' }} />;
}
