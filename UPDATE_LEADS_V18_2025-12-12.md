# Update V18 – Live-Check Fix (Unterstrich), Auto-Refresh, Archiv-Ansicht

**Live-Check**
- Pages-API `/pages/api/livecheck.ts`: nutzt jetzt
  1) `check()`
  2) `getRoomInfo()` (erkennt LIVE auch bei schwierigen Handles, z. B. mit `_`)
  3) kurze Connect-Probe (~1,5s)
- Keine SQL/ENV nötig.

**Live-Badge Aktualisierung**
- Der Layout-Enhancer auf `/dashboard/manager` refresht die Badges **alle 30 Sekunden**.

**Archiv**
- `/dashboard/manager/archive` – listet archivierte Leads stabil (ohne `leads.name`).
- `/api/leads/unarchive` (POST `{ id }`) – setzt `archived_at` zurück.
- Button-Komponente `components/leads/UnarchiveButton.tsx` zum Wiederaktivieren.

Falls deine Archiv-Spalte/Buttons anders heißen sollen, sag Bescheid – ich passe die Texte an.