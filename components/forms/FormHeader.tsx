// components/forms/FormHeader.tsx
'use client';
import { useMemo } from 'react';

export default function FormHeader({
  title,
  subtitle,
  brandColor = '#111111',
}: { title: string; subtitle?: string; brandColor?: string }) {

  const gradient = useMemo(()=>{
    // generate a soft gradient based on brand color
    // fallback if brandColor is very dark: add a lighter secondary stop
    const secondary = '#7c3aed'; // violet
    return `linear-gradient(135deg, ${brandColor} 0%, ${secondary} 100%)`;
  }, [brandColor]);

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      <style jsx>{`
        .hero-wrap {
          position: relative;
          background: ${gradient};
          padding: 2.25rem 1.5rem;
          color: #fff;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          isolation: isolate;
        }
        .blob {
          position: absolute;
          width: 260px;
          height: 260px;
          background: radial-gradient(closest-side, rgba(255,255,255,0.25), rgba(255,255,255,0) 70%);
          filter: blur(6px);
          animation: float 12s ease-in-out infinite;
          opacity: .8;
          z-index: 0;
        }
        .blob.b2 { top: -40px; right: -40px; animation-delay: -3s; }
        .blob.b1 { bottom: -60px; left: -60px; animation-delay: -7s; }
        @keyframes float {
          0%   { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50%  { transform: translateY(-12px) translateX(6px) rotate(5deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        }
        .content {
          position: relative;
          z-index: 1;
          display: flex;
          gap: .9rem;
          align-items: center;
        }
        .logo {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: rgba(255,255,255,.12);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.2);
        }
        .title { font-weight: 800; letter-spacing: .2px; font-size: 1.1rem; }
        .subtitle { opacity: .85; font-size: .8rem; }
      `}</style>

      <div className="hero-wrap">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="content">
          <img src="/joyful.png" alt="Joyful Agency" className="logo" />
          <div>
            <div className="title">{title}</div>
            {subtitle && <div className="subtitle">{subtitle}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
