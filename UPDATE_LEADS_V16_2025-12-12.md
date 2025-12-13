# Update V16 – Alternative Route mit Live-Badge

Diese ZIP fügt **ohne bestehende Dateien zu ändern** eine neue Seite hinzu:
`/dashboard/manager/live` – hier ist die Leadliste **mit** Live-Badge sicher eingebaut.

- Keine SQL/ENV.
- Nutzt die bestehende Pages-API `/api/livecheck` aus V15.
- Lässt deine vorhandene `/dashboard/manager`-Seite unberührt.
- Die Badge-Komponente liegt unter `components/LeadLiveBadge.tsx` (idempotent).

Nach dem Deploy sofort testen:
1) `/api/livecheck?handle=DEIN_HANDLE` → sollte `{ ok:true, live:true|false }` liefern.
2) `/dashboard/manager/live` → Spalte **Live** sichtbar.

Wenn du mir den **exakten Dateipfad** deiner Leadliste nennst, integriere ich die Badge direkt dort in einer nächsten ZIP.