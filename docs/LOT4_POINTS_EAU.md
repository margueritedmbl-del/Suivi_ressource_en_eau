# PSORE V2.4 — Lot 4 : Module Points d'eau

## Objectif
Transformer l'inventaire des points d'eau en module décisionnel complet pour l'analyse technique, territoriale, cartographique et de réhabilitation.

## Fonctionnalités implémentées

### Dashboard Points d'eau
- KPI enrichis : total, forages, puits, fonctionnalité, non fonctionnels, à réhabiliter, GPS, alertes qualité.
- Filtres dynamiques : commune, village, type, fonctionnalité, équipement, organe de gestion, priorité.
- Recherche libre : code, commune, village, localité, type, recommandation.
- Graphiques : commune, fonctionnalité, équipement, priorité, organe de gestion, qualité des données.
- Bloc priorités de réhabilitation avec score.
- Bloc contrôle qualité : GPS manquant, pH hors plage, température anormale, photos manquantes.
- Tableau détaillé optimisé avec affichage limité à 300 lignes et exports complets.

### Cartographie privée Points d'eau
- Maintien des couches analytiques réservées aux utilisateurs connectés :
  - fonctionnalité ;
  - type d'ouvrage ;
  - réhabilitation ;
  - équipement ;
  - organe de gestion ;
  - qualité de l'eau ;
  - qualité des données.
- Légendes thématiques détaillées selon la couche active.
- Pop-up complète côté module connecté.

### API
- `/api/dashboard/points-eau` : statistiques, graphiques, filtres, contrôles qualité et données normalisées.
- `/api/points-eau/export?format=csv|xlsx` : export filtré, sans données personnelles.
- `/api/points-eau/quality` : contrôle qualité centralisé.

### Données personnelles
Les champs sensibles restent retirés des API publiques et des exports : nom du répondant, contact, téléphone, email et champs assimilés.

### Base de données
- Ajout du script `database/04_lot4_points_eau_dashboard.sql`.
- Enrichissement de `database/00_migration_complete_v2_4.sql` avec les colonnes complémentaires et les vues décisionnelles.
- Réutilisation de `v_points_eau_dashboard` et `v_carte_points`.

## Fichiers principaux modifiés/ajoutés
- `components/dashboard/PointsEauDashboard.tsx`
- `components/map/LeafletMap.tsx`
- `app/api/dashboard/points-eau/route.ts`
- `app/api/points-eau/export/route.ts`
- `app/api/points-eau/quality/route.ts`
- `services/points-eau/analytics.ts`
- `database/04_lot4_points_eau_dashboard.sql`
- `database/00_migration_complete_v2_4.sql`
- `app/globals.css`

## Tests réalisés
```bash
npx tsc --noEmit
npm run build
```

Résultat :
- TypeScript : OK.
- Build Next.js : compilation et validation des types OK ; expiration locale pendant `Collecting page data`, comportement déjà observé dans les lots précédents.

## Déploiement
Si la base a déjà reçu la migration complète, exécuter seulement :

```sql
-- contenu de database/04_lot4_points_eau_dashboard.sql
```

Pour une installation neuve, exécuter :

```sql
-- contenu de database/00_migration_complete_v2_4.sql
```
