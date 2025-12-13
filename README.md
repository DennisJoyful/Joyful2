# TikTok Live Agency – All-in-One

**Inhalt:** Auth + RLS, Admin/Manager/Werber Dashboards, Bewerbungsformulare, Excel-Import, SWS-Punkte-Recalc, Discord/Live-APIs.  
**Rookie 150k:** +3000 Punkte (Regel `ROOKIE_150K_MONTH`, initial deaktiviert).

## Setup
1. `.env.local` aus `.env.example` erstellen und Werte setzen.
2. Supabase → SQL Editor → `supabase/migrations/0001_schema.sql` ausführen → `supabase/seed.sql` ausführen.
3. Test-User anlegen (Service Role Key erforderlich):
   ```bash
   npm i
   npm run create:test-users
   ```
4. Dev starten:
   ```bash
   npm run dev
   ```
5. Deploy auf Vercel (Env Variablen setzen).

## Wichtige Routen
- Bewerbungen: `/apply/demo-manager`, `/sws/demo-werber`
- Dashboards: `/dashboard/manager`, `/dashboard/admin`, `/dashboard/werber`
- Import UI: `/dashboard/admin/import`
- APIs: `POST /api/imports/upload`, `POST /api/sws/recalc`
- Discord: `GET /api/discord/sync?token=DISCORD_SYNC_TOKEN`, `POST /api/discord/link`
- Live-Check: `GET /api/livecheck?handle=<handle>`

> Hinweis: Live-Check ist als leichter HTML-Check umgesetzt. Für höhere Zuverlässigkeit empfiehlt sich Playwright in einer Edge Function.
