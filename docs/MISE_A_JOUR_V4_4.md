# PSORE V4.4.0 — mise à jour

## Objectifs
- intégrer les niveaux piézométriques initiaux 2025 comme référence du module Piézométrie et du SIG décisionnel ;
- rapprocher les observations Epicollect5 par code de piézomètre puis par nom de localité normalisé ;
- intégrer les quantités réellement exécutées des quatre micro-barrages à partir du rapport mensuel n°03 CEST ;
- rendre les certificats d'analyse et essais de pompage administrables depuis PSORE.

## Ordre de déploiement
1. Exécuter `database/14_piezometrie_reference_v4_4.sql` dans Supabase SQL Editor.
2. Exécuter `database/15_microbarrages_execution_v4_4.sql`.
3. Déployer le code V4.4.0 sur Render avec `Clear build cache & deploy`.
4. Dans PSORE, ouvrir `Administration > Documents techniques` et téléverser les PDF PZ-01.pdf à PZ-20.pdf pour les analyses puis les essais.
5. Dans `Piézométrie`, utiliser une fois `Re-synchroniser l’historique` pour rattacher les anciennes entrées Epicollect5 au référentiel PZ-01…PZ-20.
6. Exécuter `database/16_verification_v4_4.sql`.

## Résultats de contrôle attendus
- `piezometres_reference` = 20 ;
- `microbarrages_100_pct` = 4 ;
- `microbarrages_total_execute_fcfa` = 560259876 ;
- les documents ne sont accessibles que s'ils ont effectivement été téléversés dans le bucket privé `psore-documents`.

## Convention d'évolution piézométrique
Le niveau statique est traité comme une profondeur sous le repère de mesure :
- NS actuel > NS initial de plus de 0,10 m : **Baisse** de la nappe ;
- NS actuel < NS initial de plus de 0,10 m : **Hausse** ;
- écart absolu <= 0,10 m : **Stable**.
