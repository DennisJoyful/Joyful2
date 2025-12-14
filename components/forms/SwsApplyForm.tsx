// components/forms/SwsApplyForm.tsx
'use client';
import { useEffect, useState } from 'react';

function cleanHandle(h: string){ return h.replace(/^@/, '').replace(/\s+/g, '').trim(); }
function validHandleFormat(h:string){ return /^[a-zA-Z0-9_.]{3,24}$/.test(h); }

export default function SwsApplyForm({ werberSlug }: { werberSlug: string }) {
  // Core fields
  const [handle,setHandle] = useState('');
  const [exists,setExists] = useState<boolean|null>(null);
  const [checking,setChecking] = useState(false);
  const [discord,setDiscord] = useState('');
  const [whats,setWhats] = useState('');
  const [consent,setConsent] = useState(false);
  const [err,setErr] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);
  const [utm,setUtm] = useState<Record<string,string>>({});

  // Extras + new ordering
  const [followers,setFollowers] = useState('');
  const [inAgency,setInAgency] = useState(''); // "ja" | "nein" | ""
  const [experience,setExperience] = useState('');
  const [hours,setHours] = useState('');
  const [goals,setGoals] = useState('');

  // UTM parse once
  useEffect(()=>{
    const p = new URLSearchParams(window.location.search);
    const u:Record<string,string> = {};
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(k=>{ const v=p.get(k); if(v) u[k]=v; });
    setUtm(u);
  },[]);

  // Debounced oEmbed check
  useEffect(()=>{
    const cleaned = cleanHandle(handle).toLowerCase();
    setExists(null);
    if(!cleaned || !validHandleFormat(cleaned)) return;
    const t = setTimeout(async()=>{
      setChecking(true);
      try {
        const r = await fetch(`/api/check-tiktok-handle?handle=${encodeURIComponent(cleaned)}`);
        const j = await r.json();
        setExists(!!j.exists);
      } catch {
        setExists(null);
      } finally {
        setChecking(false);
      }
    }, 450);
    return ()=>clearTimeout(t);
  }, [handle]);

  const hasContact = (discord.trim()!=='' || whats.trim()!=='');
  const validFormat = validHandleFormat(cleanHandle(handle));
  const formValid = validFormat && exists===true && hasContact && consent;

  async function submit(){
    setErr(null);
    if(!formValid) return;
    setLoading(true);
    try {
      const extras = {
        current_followers: followers || null,
        in_agency: inAgency || null,
        experience: experience || null,
        planned_hours_per_week: hours || null,
        goal: goals || null
      };
      const body = JSON.stringify({
        werberSlug,
        handle: '@'+cleanHandle(handle),
        contact: [discord && `Discord: ${discord}`, whats && `WhatsApp: ${whats}`].filter(Boolean).join(' · '),
        consent: true,
        utm,
        extras
      });
      const res = await fetch('/api/apply/sws', { method:'POST', headers:{'content-type':'application/json'}, body });
      const j = await res.json();
      if(!res.ok){ setErr(j.error || 'Fehler beim Absenden'); setLoading(false); return; }
      location.href = '/thanks';
    } catch {
      setErr('Netzwerkfehler.');
      setLoading(false);
    }
  }

  const Badge = () => {
    // Variant A, Option 2 (colored tag)
    const base = { padding: '4px 10px', borderRadius: '9999px', fontSize: 12, fontWeight: 800 as const, letterSpacing: '.3px', textTransform: 'uppercase' as const };
    if(checking) return <span style={{...base, background:'rgba(107,114,128,.15)', color:'#374151'}}>Prüfe…</span>;
    if(exists===true) return <span style={{...base, background:'rgba(16,185,129,.18)', color:'#065f46'}}>Existiert</span>;
    if(exists===false) return <span style={{...base, background:'rgba(239,68,68,.18)', color:'#991b1b'}}>Nicht gefunden</span>;
    return null;
  };

  return (<>
    <style jsx>{`
      .shell { position: relative; margin: 1.25rem; padding: 1.25rem; border-radius: 16px;
        background: rgba(255,255,255,.65); backdrop-filter: blur(8px);
        box-shadow: 0 10px 20px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.06);
        border: 1px solid rgba(0,0,0,.06); max-width: 860px; margin-left: auto; margin-right: auto; }
      .row { display: grid; gap: .5rem; }
      .row2 { display:grid; grid-template-columns: 1fr 1fr; gap:.9rem; }
      @media (max-width: 860px){ .row2{ grid-template-columns: 1fr; } }
      .labelLine { display:flex; align-items:center; justify-content: space-between; gap:.75rem; }
      .labelLine .left { display:flex; gap:.5rem; align-items:baseline; flex-wrap:wrap; }
      .labelTitle { font-size: .95rem; font-weight: 800; }
      .labelSub { font-size: .9rem; opacity:.7; font-weight: 600; }
      .field input, .field select, .field textarea {
        width: 100%; border: 1px solid #e5e7eb; border-radius: 10px; padding: .7rem .9rem; background: #fff; font-size:.95rem;
      }
      .hint { font-size: .85rem; opacity: .8; line-height: 1.35; margin-top: .15rem; }
      .consent { display: flex; gap: .6rem; align-items: flex-start; font-size: .9rem; margin-top:.8rem; }
      .btn { display: inline-flex; align-items: center; gap: .5rem; border: none; outline: none; cursor: pointer; border-radius: 12px;
        padding: .85rem 1.1rem; background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff; font-weight: 800; letter-spacing: .2px;
        box-shadow: 0 8px 16px rgba(37, 99, 235, .25); transition: transform .08s ease, box-shadow .15s ease, filter .2s ease; }
      .btn:disabled { opacity: .5; cursor: not-allowed; }
      .statusErr { color:#991b1b; font-size:.9rem; }
    `}</style>

    <div className="shell">
      {/* 1) HANDLE */}
      <div className="row">
        <div className="labelLine">
          <div className="left">
            <div className="labelTitle">TikTok-Handle</div>
            <div className="labelSub">(Name direkt nach dem @)</div>
          </div>
          <div><Badge/></div>
        </div>
        <div className="field">
          <input placeholder="@deinname" value={handle} onChange={e=>setHandle(e.target.value)} />
          <div className="hint">
            Dein Handle ist der Name direkt nach dem @ in deiner Profil-URL. Beispiel: Bei https://www.tiktok.com/@deinname ist „deinname“ das Handle.
          </div>
        </div>
      </div>

      {/* 2) DISCORD + WHATSAPP */}
      <div className="row2" style={{marginTop:'.9rem'}}>
        <div className="field">
          <label>Discord (optional)</label>
          <input value={discord} onChange={e=>setDiscord(e.target.value)} placeholder="z. B. Name#1234 oder @name" />
        </div>
        <div className="field">
          <label>WhatsApp (optional)</label>
          <input value={whats} onChange={e=>setWhats(e.target.value)} placeholder="z. B. +4917612345678" />
        </div>
      </div>
      {(!hasContact) && <div className="statusErr" style={{marginTop:'.25rem'}}>Mindestens Discord <strong>oder</strong> WhatsApp angeben.</div>}

      {/* 3) FOLLOWER + IN AGENCY */}
      <div className="row2" style={{marginTop:'.9rem'}}>
        <div className="field">
          <label>Aktuelle TikTok-Follower (optional)</label>
          <input value={followers} onChange={e=>setFollowers(e.target.value)} placeholder="nur Zahl" />
        </div>
        <div className="field">
          <label>Aktuell in Agentur?</label>
          <select value={inAgency} onChange={e=>setInAgency(e.target.value)}>
            <option value="">Bitte auswählen</option>
            <option value="ja">Ja</option>
            <option value="nein">Nein</option>
          </select>
        </div>
      </div>

      {/* 4) EXPERIENCE + HOURS */}
      <div className="row2" style={{marginTop:'.9rem'}}>
        <div className="field">
          <label>Streamerfahrung (optional)</label>
          <select value={experience} onChange={e=>setExperience(e.target.value)}>
            <option value="">Bitte auswählen</option>
            <option value="none">Keine</option>
            <option value="<1m">&lt;1 Monat</option>
            <option value="1-3m">1–3 Monate</option>
            <option value="3-12m">3–12 Monate</option>
            <option value=">1y">&gt;1 Jahr</option>
          </select>
        </div>
        <div className="field">
          <label>Geplante Streamdauer / Woche (optional)</label>
          <select value={hours} onChange={e=>setHours(e.target.value)}>
            <option value="">Bitte auswählen</option>
            <option value="<5h">&lt;5h</option>
            <option value="5–10h">5–10h</option>
            <option value="10–20h">10–20h</option>
            <option value="20–30h">20–30h</option>
            <option value="30+h">30+h</option>
          </select>
        </div>
      </div>

      {/* 5) GOALS FULL WIDTH */}
      <div className="row" style={{marginTop:'.9rem'}}>
        <div className="field">
          <label>Ziel mit TikTok Live (optional)</label>
          <textarea rows={3} value={goals} onChange={e=>setGoals(e.target.value)} placeholder="Kurz beschreiben…" />
        </div>
      </div>

      <label className="consent">
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
        <span>Ich willige ein, dass mich Joyful Agency zur Bearbeitung meiner Bewerbung kontaktieren darf. (<a href="/privacy" target="_blank" rel="noreferrer">Datenschutzhinweise</a>)</span>
      </label>

      <div style={{ marginTop: '1rem' }}>
        <button className="btn" onClick={submit} disabled={!formValid || loading}>{loading ? 'Sende…' : 'Jetzt bewerben'}</button>
      </div>

      {err && <div className="statusErr" style={{ marginTop: '.6rem' }}>{err}</div>}
    </div>
  </>);
}
