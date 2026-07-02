# Manifeste PSORE V2_3

## Fichiers principaux ajoutés

- `components/dashboard/PointsEauDashboard.tsx`
- `components/dashboard/ThematicModuleDashboard.tsx`
- `components/dashboard/MiniBarChart.tsx`
- `app/api/dashboard/points-eau/route.ts`
- `app/api/dashboard/module/route.ts`
- `app/api/export/xlsx/route.ts`
- `public/data/points-eau-inventaire.csv`
- `public/data/points-eau-inventaire.json`
- `docs/PSORE_V2_3_NOTE_MISE_A_JOUR.md`
- `DEPLOIEMENT_PSORE_V2_3.md`
- `AUDIT_PSORE_V2_3.md`

## Fichiers principaux modifiés

- `app/points-eau/page.tsx`
- `app/pluviometrie/page.tsx`
- `app/piezometrie/page.tsx`
- `app/limnimetrie/page.tsx`
- `app/cartographie/page.tsx`
- `app/dashboard/page.tsx`
- `components/map/LeafletMap.tsx`
- `app/api/map/points/route.ts`
- `app/api/export/csv/route.ts`
- `services/mappers/points-eau.ts`
- `database/schema.sql`
- `database/views.sql`
- `app/globals.css`
- `next.config.js`
- `README.md`

## Vérifications réalisées

- `npm install` exécuté.
- `npm run build` exécuté avec succès.
- API `/api/dashboard/points-eau` testée : 540 points, 56 sans GPS, 4 communes, 116 villages.
- API `/api/map/points?module=points_eau&theme=fonctionnalite` testée.
- Export CSV points d’eau testé.
- Export Excel points d’eau testé.
