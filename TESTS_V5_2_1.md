# Tests PSORE V5.2.1

## Contrôles exécutés lors de la préparation
- `node scripts/verify-render-files.mjs` : OK — 35 fichiers critiques, 540 points d'eau uniques.
- `node scripts/verify-v5-2.mjs` : OK — réseaux 10/20/10, migration 34/35, registre UUID parent, snapshot 278 parents.
- Vérification des trois ZIP Epicollect : 70/117 pluvio, 104/163 piezo, 104/135 limni ; chaque enfant possède un `ec5_parent_uuid` présent dans le CSV parent correspondant.
- TypeScript global non exécutable complètement sans `node_modules` ; le parseur `tsc` global n'a signalé aucune erreur de syntaxe spécifique dans les fichiers V5.2.1 modifiés, mais de nombreuses erreurs de résolution de modules sont attendues sans les dépendances npm.

## Validation finale à faire sur Render/Supabase
- Build Render.
- Migration 34 sans erreur.
- Synchronisation complète.
- Migration 35 : `non_resolues = 0` via registre pour le stock exporté du 18/08/2026.
- Contrôle des vues opérationnelles et des KPI par module.
