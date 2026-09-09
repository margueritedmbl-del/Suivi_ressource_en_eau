# PSORE V2.4 — Lot 7 : Dashboard institutionnel global

## Objectif

Créer une page de pilotage institutionnel consolidant les quatre modules PSORE : Points d’eau, Piézométrie, Pluviométrie et Limnimétrie.

## Fonctions ajoutées

- Nouveau dashboard `/dashboard` réservé aux rôles autorisés : Super administrateur, Administrateur PTCS, DNH/DRHK.
- API sécurisée `/api/dashboard/institutionnel`.
- Export sécurisé `/api/dashboard/institutionnel/export?format=csv|xlsx`.
- Synthèse exécutive avec indice de situation.
- KPI consolidés : points d’eau, forages, puits, piézomètres, pluviomètres, limnimètres, observations, alertes, GPS manquants.
- Supervision des synchronisations Epicollect5.
- Alertes consolidées multi-modules.
- Dernières observations hydrologiques.
- Recommandations automatiques de pilotage.
- Graphiques par module, par alerte et par couverture territoriale.

## Fichiers principaux

- `app/dashboard/page.tsx`
- `components/dashboard/InstitutionalDashboard.tsx`
- `app/api/dashboard/institutionnel/route.ts`
- `app/api/dashboard/institutionnel/export/route.ts`
- `services/dashboard/institutionnel.ts`
- `database/07_lot7_dashboard_institutionnel.sql`

## SQL à exécuter

Après les scripts des lots précédents, exécuter :

```sql
\i database/07_lot7_dashboard_institutionnel.sql
```

ou copier le contenu dans Supabase SQL Editor.

## Tests recommandés

1. Se connecter avec un rôle autorisé.
2. Ouvrir `/dashboard`.
3. Vérifier les KPI globaux.
4. Vérifier les alertes.
5. Vérifier l’état des synchronisations.
6. Tester l’export CSV.
7. Tester l’export Excel.

## Remarque

L’API utilise les vues disponibles lorsque Supabase est configuré et garde une tolérance aux données manquantes afin de ne pas bloquer l’interface pendant la mise en place progressive des modules.
