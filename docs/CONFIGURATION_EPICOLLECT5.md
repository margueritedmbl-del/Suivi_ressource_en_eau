# Configuration Epicollect5 — PSORE V2.4

Les sources sont centralisées dans `epicollect_sources`.

Modules synchronisés :
- Points d'eau : `etat-des-lieux-pe-ptcs`
- Pluviométrie : `suivi-pluviometrique-koulikoro-ptcs`
- Piézométrie : `suivi-piezo-koulikoro-ptcs`
- Limnimétrie : `suivi-limnimetrique-ce-koulikoro`

Routes :
```txt
/api/sync/all
/api/sync/points-eau
/api/sync/pluviometrie
/api/sync/piezometrie
/api/sync/limnimetrie
/api/cron/sync
```

La pagination Epicollect5 est suivie automatiquement afin d'éviter la limite des 50 premières entrées.
