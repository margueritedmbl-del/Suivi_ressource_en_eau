# PSORE V4.7.0 — Operational Ready

## Objectif
Cette version corrige la synchronisation des formulaires hiérarchiques Epicollect5 à partir de la structure réelle vérifiée dans les exports CSV : `ec5_parent_uuid` des mesures pointe vers `ec5_uuid` de la fiche station parent.

## Déploiement
1. Remplacer le code du dépôt GitHub par cette version.
2. Render : **Manual Deploy → Clear build cache & deploy**.
3. Supabase SQL Editor : exécuter `database/24_MASTER_OPERATIONAL_READY_V4_7.sql`.
4. Vérifier `/api/version` → `4.7.0`.
5. Administration → Synchronisation : lancer une synchronisation complète des 4 modules. Le changement de moteur vers v4.7 force automatiquement une première remise à niveau complète.
6. Exécuter `database/25_VERIFICATION_OPERATIONAL_READY_V4_7.sql`.

## Fin de phase test
Dans **Administration → Synchronisation**, le Super administrateur renseigne la **Date de début des données opérationnelles**. Tant que le champ est vide, toutes les données restent visibles pour tester la chaîne. Une fois la date renseignée, les KPI, graphiques, exports et analyses ne prennent en compte que les mesures dont la date métier est supérieure ou égale au seuil. Les données antérieures restent conservées dans Supabase.

## Référentiels physiques
Les cartes et compteurs utilisent désormais une seule station par code métier, même si plusieurs fiches parent Epicollect ont été créées pendant la formation. Les UUID restent stockés afin de préserver la relation avec les mesures enfants et la traçabilité.
