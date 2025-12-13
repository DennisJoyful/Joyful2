// components/auth/SignInForm.tsx
'use client';
import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Unified login form:
// - Field 1: email OR werber slug
// - Field 2: password OR PIN (4–6 digits)
// Detection rules:
//   contains '@' -> email+password
//   otherwise -> slug+PIN (numeric 4–6), login with synthetic email `${slug}@noemail.local`
// After login: fetch profile.role and redirect accordingly.

export default function SignInForm(){
  const [id, setId] = useState('');           // email or slug
  const [secret, setSecret] = useState('');   // password or PIN
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isEmailMode = useMemo(() => id.includes('@'), [id]);

  function validInputs(): string | null {
    if (!id || !secret) return 'Bitte beide Felder ausfüllen.';
    if (isEmailMode) {
      // very light email check
      if (!/.+@.+\..+/.test(id)) return 'Bitte eine gültige E-Mail eingeben.';
      if (secret.length < 4) return 'Bitte ein gültiges Passwort eingeben.';
      return null;
    } else {
      // slug + PIN (4–6 Ziffern)
      if (!/^[a-z0-9-]{3,}$/.test(id)) return 'Slug ungültig (min. 3 Zeichen, nur a–z, 0–9, -).';
      if (!/^\d{4,6}$/.test(secret)) return 'PIN muss aus 4–6 Ziffern bestehen.';
      return null;
    }
  }

  async function redirectByRole() {
    // Read role of current session user and redirect
    const { data, error } = await supabase.from('profiles').select('role').single();
    if (error) {
      // fallback: go home
      window.location.href = '/';
      return;
    }
    const role = (data as any)?.role;
    if (role === 'admin') window.location.href = '/dashboard/admin';
    else if (role === 'manager') window.location.href = '/dashboard/manager';
    else if (role === 'werber') window.location.href = '/dashboard/werber';
    else window.location.href = '/';
  }

  async function onSubmit(){
    const v = validInputs();
    if (v) { setErr(v); return; }

    setLoading(true);
    setErr(null);

    let emailToUse = id;
    let passwordToUse = secret;

    if (!isEmailMode) {
      // slug + PIN → convert to synthetic email
      emailToUse = `${id}@noemail.local`;
      passwordToUse = secret;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password: passwordToUse });
    setLoading(false);

    if (error) {
      setErr('Login fehlgeschlagen. Bitte Eingaben prüfen.');
      return;
    }

    await redirectByRole();
  }

  return (
    <div style={{ display:'grid', gap:'.5rem', maxWidth:360 }}>
      <label style={{ display:'grid', gap:'.25rem' }}>
        <span>E-Mail <span style={{ opacity:.6 }}>/ Werber-Slug</span></span>
        <input
          className="input"
          placeholder="admin@domain.de ODER z. B. promo-max"
          value={id}
          onChange={(e)=>setId(e.target.value.trim())}
        />
      </label>

      <label style={{ display:'grid', gap:'.25rem' }}>
        <span>{isEmailMode ? 'Passwort' : 'PIN (4–6 Ziffern)'}</span>
        <input
          className="input"
          type={isEmailMode ? 'password' : 'text'}
          inputMode={isEmailMode ? undefined : 'numeric'}
          pattern={isEmailMode ? undefined : '\\d{4,6}'}
          placeholder={isEmailMode ? '••••••••' : 'z. B. 4281'}
          value={secret}
          onChange={(e)=>setSecret(isEmailMode ? e.target.value : e.target.value.replace(/[^\d]/g,''))}
        />
      </label>

      <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>
        {loading ? 'Anmelden…' : 'Anmelden'}
      </button>

      {err && <div style={{ color:'#b91c1c', fontSize:12 }}>{err}</div>}
    </div>
  );
}
