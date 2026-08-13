# PSORE V2.4.2 — Correction synchronisation Epicollect5

## Correction appliquée

L’API Epicollect5 refuse les requêtes dont `per_page` dépasse la limite autorisée (`ec5_335`).

Le moteur de synchronisation utilise désormais :

```txt
per_page=100
maxPages=1000
```

Ainsi, la synchronisation récupère les données page par page jusqu’à la fin, au lieu de demander trop d’entrées en une seule requête.

## Routes à tester

```txt
/api/sync/all?secret=VOTRE_CRON_SECRET
/api/sync/points-eau?secret=VOTRE_CRON_SECRET
/api/sync/pluviometrie?secret=VOTRE_CRON_SECRET
/api/sync/piezometrie?secret=VOTRE_CRON_SECRET
/api/sync/limnimetrie?secret=VOTRE_CRON_SECRET
```

## Résultat attendu

Les réponses ne doivent plus contenir :

```txt
Max allowed entries limit exceeded! Use a lower `per_page` value.
```

Les champs `fetched`, `mapped`, `upserted` et `pages` doivent afficher des valeurs supérieures à 0 lorsque les formulaires contiennent des données.
