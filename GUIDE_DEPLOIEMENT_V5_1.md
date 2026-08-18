# PSORE V5.1.0 — Correctifs référentiels, exports, cartographie et sous-bassins

## Correctifs principaux
- Dashboard institutionnel : séparation stricte entre réseau physique (10 pluvio, 20 PZ, 10 limni) et observations.
- Les données hydrologiques sans code station reconnu sont conservées dans Supabase mais exclues des KPI, graphiques et rapports.
- Filtres communaux alimentés par les référentiels officiels, même si une vue analytique Supabase est indisponible.
- Cartographie générale : aucune couche ponctuelle activée par défaut ; chaque réseau/ouvrage apparaît uniquement après sélection.
- Exports des pages modules : téléchargement via session Supabase (Blob), sans ouverture d'une URL API non authentifiée.
- Cartes des rapports : emprise recalculée sur les stations, symbologie proportionnée, codes officiels affichés pour les réseaux hydrologiques.
- Fiches sous-bassins : surface absolue, extrait cartographique, technologies de restauration et répartition communale (sites/surface/part).
- Repli applicatif : si les vues V5 ne sont pas présentes dans le cache PostgREST, PSORE rapproche directement observations et référentiels parent via `source_parent_id`.

## Déploiement Render
1. Remplacer le contenu du dépôt GitHub par la V5.1.0.
2. Render → **Manual Deploy** → **Clear build cache & deploy**.
3. Vérifier `/api/version` : la réponse doit indiquer `5.1.0`.

## Supabase
Le code V5.1 fonctionne même si les vues V5 sont temporairement indisponibles. Pour remettre la base au schéma canonique, exécuter :

1. `database/30_MASTER_PSORE_V5_1.sql`
2. `database/31_VERIFY_PSORE_V5_1.sql`

Le contrôle attendu du référentiel est :
- pluviométrie : 10 stations ;
- piézométrie : 20 stations ;
- limnimétrie : 10 stations.

Aucune donnée brute Epicollect5 n'est supprimée par la migration.
