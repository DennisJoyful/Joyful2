'use client';

import React from 'react';
import LeadsTable, { LeadRow } from './LeadsTable';

type FetchState = { status: 'idle'|'loading'|'ok'|'empty'|'error', msg?: string };

const CANDIDATE_ENDPOINTS = [
  '/api/manager/leads',
  '/api/leads',
  '/api/manager/leads/list',
  '/api/manager/leads?limit=500',
  '/api/leads?limit=500',
];

function normalizeRow(anyRow: any, idx: number): LeadRow {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (anyRow && anyRow[k] != null) return anyRow[k];
    }
    return undefined as any;
  };

  const id = pick('id', 'lead_id', '_id', 'uuid') ?? String(idx);
  const handle = pick('handle', 'twitch_handle', 'name', 'username', 'streamer', 'display_name') ?? 'unknown';
  const status = pick('status', 'lead_status') ?? 'new';
  const source = pick('source', 'lead_source', 'origin') ?? 'unknown';
  const notes = pick('notes', 'note', 'comment', 'comments') ?? '';
  const utm = pick('utm', 'utm_params', 'utm_data') ?? null;
  const extras = pick('extras', 'extra', 'metadata', 'data') ?? null;

  const created_at = pick('created_at', 'createdAt', 'created', 'inserted_at', 'created_on') ?? null;
  const follow_up_at = pick('follow_up_at', 'followUpAt', 'follow_up', 'followup_at') ?? null;
  const follow_up_date = pick('follow_up_date', 'followUpDate') ?? null;

  return { id, handle, status, source, notes, utm, extras, created_at, follow_up_at, follow_up_date } as LeadRow;
}

async function tryFetch(url: string): Promise<LeadRow[] | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : data?.items ?? []);
    if (!Array.isArray(rows)) return null;
    return rows.map(normalizeRow);
  } catch {
    return null;
  }
}

export default function LeadsFetcher() {
  const [state, setState] = React.useState<FetchState>({ status: 'idle' });
  const [rows, setRows] = React.useState<LeadRow[]>([]);
  const [endpoint, setEndpoint] = React.useState<string>('');

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      setState({ status: 'loading' });
      for (const url of CANDIDATE_ENDPOINTS) {
        const out = await tryFetch(url);
        if (out && out.length > 0) {
          if (!isMounted) return;
          setRows(out);
          setEndpoint(url);
          setState({ status: 'ok' });
          return;
        } else if (out && out.length === 0) {
          // keep trying other endpoints, but remember emptiness in case all are empty
          if (!isMounted) continue;
        }
      }
      // None worked or all empty
      if (!isMounted) return;
      setState({ status: 'empty', msg: 'Keine Leads erhalten. Prüfe API-Route oder RLS/Scopes.' });
    })();
    return () => { isMounted = false; };
  }, []);

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Leads</h1>
        <p className="text-sm opacity-70">Lade Leads…</p>
      </div>
    );
  }

  if (state.status === 'empty') {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm">Es wurden keine Leads geladen.</p>
        <ul className="list-disc pl-6 text-sm opacity-80">
          <li>Öffne die alte Seite und prüfe, welche API-Route sie nutzt (z. B. <code>/api/manager/leads</code>).</li>
          <li>Stelle sicher, dass die Route auch hier erreichbar ist und keine Caching-Header setzt.</li>
          <li>Falls RLS aktiv ist: Dieser View ist clientseitig und sendet deine Session-Cookies automatisch mit.</li>
        </ul>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-red-600">{state.msg ?? 'Unbekannter Fehler'}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Leads</h1>
        {endpoint ? <span className="text-xs opacity-60">Quelle: {endpoint}</span> : null}
      </div>
      <LeadsTable rows={rows} />
    </div>
  );
}
