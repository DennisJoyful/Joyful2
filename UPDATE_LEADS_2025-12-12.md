# Update – Leads: Kontakt, Follow‑Up, Archiv (2025‑12‑12)

**Neue Funktionen**
- Button **Kontakt**: setzt `contact_set_at=now()`, `status='keine reaktion'` und plant `follow_up_at=+5 Tage`.
- Button **Follow‑Up**: erhöht `follow_up_count` und setzt `last_follow_up_at=now()`.
- Button **Archivieren**: setzt `archived_at=now()`; Wiederherstellen via **Wieder aktivieren** unter `/dashboard/manager/archive`.
- Admin-Report: `/dashboard/admin/reports/followups` zeigt die Summe der gesendeten Follow‑Ups.

**Duplikatprüfung**
- Einzigartigkeit für `email` und `handle` (falls vorhanden) über normalisierte UNIQUE Indizes (über alle Leads inkl. Archiv).

**Migration**
- Dateien: `db/sql/2025-12-12_leads_followup_archive.sql`, `db/sql/2025-12-12_function_increment_follow_up.sql`
- In Supabase SQL Editor ausführen (oder über eure bestehende Migration-Pipeline).

**Konfiguration**
- Server benötigt `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` für die neuen Route-Handler.

**Integration im UI**
- Reusable Komponente: `components/leads/LeadActions.tsx`.
  Binde sie an jeder Stelle ein, wo ein Lead gelistet wird: `<LeadActions id={lead.id} />`.
- Archiv-Ansicht: `/dashboard/manager/archive`
- Obsolete Buttons: über `lib/featureFlags.ts` sind `liveCheck` und `reloadButton` standardmäßig **deaktiviert**.