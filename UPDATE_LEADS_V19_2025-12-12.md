# Update V19 – LiveCheck via `connect()` + realistischer UA, schneller Refresh

**Warum V19?** Bei einigen Accounts (z. B. mit `_`) liefern einfache Checks häufig false negatives.
Daher prüft der Endpoint jetzt so:

1) `connect()` mit realistischem User-Agent (Budget ~6 s). Wenn Verbindung steht → **LIVE**.
2) Falls das scheitert: `check()`
3) Falls das auch scheitert: `getRoomInfo()` Heuristik

**Badge-Refresh**: alle **15 Sekunden**.

**Wichtig**: Weiterhin **nur Pages-API**: `pages/api/livecheck.ts`. Keine Änderungen an SQL oder ENV.