# Update V20 – TypeScript Fix im ManagerLiveEnhancer

- Behebt den Buildfehler: *'table' is possibly 'null'*.
- Guard innerhalb `updateAll()` stellt sicher, dass der Table-Node vorhanden ist.
- Refresh bleibt bei **15 Sekunden**.
- Keine Änderungen am Livecheck-API oder Archiv gegenüber V19/V18.