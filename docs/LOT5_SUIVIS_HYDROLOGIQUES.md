# PSORE V2.4 — Lot 5 : Piézométrie, Pluviométrie et Limnimétrie

## Objectif

Le Lot 5 homogénéise les trois modules de suivi hydrologique afin qu'ils disposent du même niveau fonctionnel que le module Points d'eau : filtres, KPI, graphiques, alertes, carte, tableau et exports filtrés.

## Modules concernés

- `/pluviometrie`
- `/piezometrie`
- `/limnimetrie`

## Fonctionnalités ajoutées

### 1. Tableau de bord enrichi

Chaque module dispose maintenant de :

- nombre total d'observations ;
- nombre de sites/stations ;
- moyenne ;
- minimum ;
- maximum ;
- nombre d'alertes ;
- nombre de sites sans coordonnées GPS ;
- date de la dernière observation.

### 2. Filtres dynamiques

Filtres disponibles :

- commune ;
- site/station ;
- alerte ;
- date de début ;
- date de fin.

### 3. Graphiques

Graphiques intégrés :

- répartition par commune ;
- évolution récente ;
- top sites/stations ;
- alertes par type.

### 4. Contrôles qualité

Les vues SQL signalent automatiquement :

- valeurs manquantes ;
- valeurs négatives ;
- valeurs extrêmes ;
- coordonnées GPS manquantes ;
- date ou site manquant.

Règles indicatives :

- Pluviométrie : pluie négative ou supérieure à 300 mm = alerte ; pluie ≥ 100 mm = événement exceptionnel.
- Piézométrie : niveau négatif ou supérieur à la profondeur du piézomètre = alerte ; niveau proche du fond = alerte de sécheresse potentielle.
- Limnimétrie : hauteur négative ou supérieure à 2000 = alerte ; niveau haut/bas = surveillance.

Ces seuils sont indicatifs et pourront être rendus configurables dans une version suivante.

### 5. Exports filtrés

Les exports CSV et Excel prennent maintenant en compte les filtres envoyés depuis les dashboards :

- module ;
- commune ;
- site ;
- dates ;
- alerte.

### 6. Vue consolidée

Le script SQL ajoute :

- `v_pluviometrie_dashboard`
- `v_piezometrie_dashboard`
- `v_limnimetrie_dashboard`
- `v_suivis_hydrologiques_dashboard`

## Fichiers modifiés

- `components/dashboard/ThematicModuleDashboard.tsx`
- `app/api/dashboard/module/route.ts`
- `app/api/export/csv/route.ts`
- `app/api/export/xlsx/route.ts`
- `app/globals.css`

## Fichiers ajoutés

- `database/05_lot5_suivis_hydrologiques.sql`
- `docs/LOT5_SUIVIS_HYDROLOGIQUES.md`

## Migration Supabase

Exécuter dans Supabase SQL Editor :

```sql
-- Copier le contenu de :
database/05_lot5_suivis_hydrologiques.sql
```

## Tests effectués

```bash
npm install --no-audit --no-fund
npx tsc --noEmit
npm run build
```

Résultats :

- TypeScript : OK.
- Build Next.js : compilation OK ; expiration locale pendant `Collecting page data`, comportement déjà observé sur les lots précédents.

## Validation fonctionnelle recommandée

Après déploiement :

1. Exécuter la migration SQL du Lot 5.
2. Synchroniser les données Epicollect5.
3. Tester :
   - `/pluviometrie`
   - `/piezometrie`
   - `/limnimetrie`
4. Vérifier les filtres.
5. Tester les exports CSV/Excel.
6. Vérifier la carte de chaque module.
