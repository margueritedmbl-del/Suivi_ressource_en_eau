# PSORE V4.8.0 — déploiement

## Corrections principales
- Observatoire : séparation stricte stations physiques suivies / mesures.
- Rapports PDF, DOCX, XLSX, CSV : synthèse + détail des enregistrements par module.
- SIG décisionnel : analyse par sous-bassin, surface restaurée, PZ de référence, comparaison des écarts de niveau statique et cinq scénarios de décision.
- Les analyses d'impact restent descriptives tant que les facteurs pluie, saison, prélèvements et historique avant/après ne permettent pas une attribution robuste.

## Déploiement
1. Remplacer le dépôt GitHub par le contenu de cette archive (ne pas téléverser le dossier node_modules s'il existe localement).
2. Render : Manual Deploy > Clear build cache & deploy > Deploy latest commit.
3. Conserver/exécuter la migration corrigée `database/24A_MASTER_OPERATIONAL_READY_V4_7_1.sql` si elle n'a pas encore été appliquée.
4. Synchroniser les modules depuis PSORE.
5. Contrôler Observatoire, Rapports et SIG décisionnel.

## Contrôles attendus
L'Observatoire affiche séparément le nombre de stations disposant de mesures exploitables et le nombre de mesures. Les exports contiennent une feuille/table de détail. Le SIG affiche une table d'analyse par sous-bassin.


## Correctif V4.8.1
Correction de compilation Render dans `app/api/reports/export/route.ts`: la fonction locale du générateur PDF est désormais une fonction fléchée afin de rester compatible avec la cible ES5 en mode strict.
