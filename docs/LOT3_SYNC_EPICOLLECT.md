# PSORE V2.4 — Lot 3 : Synchronisation Epicollect5

## Objectif

Ce lot remplace la synchronisation partielle par un moteur unique qui récupère toutes les pages de l'API Epicollect5. Il corrige notamment le cas où seuls les 50 premiers points d'eau étaient synchronisés alors que le fichier complet contient 540 points.

## Sources synchronisées

- Points d'eau : `etat-des-lieux-pe-ptcs`
- Pluviométrie : référentiel + relevés
- Piézométrie : référentiel + campagnes de mesures
- Limnimétrie : stations + lectures

Les URLs sont stockées dans la table `epicollect_sources`. Le code utilise cette table en priorité et garde un fallback interne si la base n'est pas encore migrée.

## Fonctionnement

1. Lecture des sources actives dans `epicollect_sources`.
2. Appel de l'API Epicollect5 avec `per_page=1000`.
3. Suivi automatique de `links.next`, `meta.next_page_url`, `next_page_url` ou `current_page/last_page`.
4. Mapping vers les tables PSORE.
5. Upsert par `source_entry_id` pour éviter les doublons.
6. Journalisation dans `sync_log` avec nombre de pages, données récupérées, données synchronisées et durée.

## Routes disponibles

Les routes acceptent `POST` depuis l'interface d'administration. Elles acceptent aussi `GET` avec `CRON_SECRET` pour Vercel Cron.

- `/api/sync/all`
- `/api/sync/points-eau`
- `/api/sync/pluviometrie`
- `/api/sync/piezometrie`
- `/api/sync/limnimetrie`

## Sécurité

Les routes sont réservées aux rôles :

- Super administrateur
- Administrateur PTCS
- DNH/DRHK

Pour un cron Vercel, définir `CRON_SECRET` puis appeler :

```txt
/api/sync/all?secret=VALEUR_DU_CRON_SECRET
```

## Migration SQL

Réexécuter :

```txt
database/00_migration_complete_v2_4.sql
```

Cette migration ajoute les colonnes détaillées du journal de synchronisation sans supprimer les données existantes.

## Test attendu

Après déploiement :

1. Aller dans `/admin/synchronisation`.
2. Cliquer sur `Synchroniser Points d'eau`.
3. Vérifier dans l'historique :
   - `pages` supérieur à 1 si l'API pagine ;
   - `récupérés` proche du total attendu ;
   - `synchronisés` égal aux lignes mappées.
4. Vérifier `/points-eau` et `/cartographie`.
