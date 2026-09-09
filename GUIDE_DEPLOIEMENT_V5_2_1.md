# PSORE V5.2.1 — réparation des relations Epicollect parents/enfants

## Diagnostic à l'origine de la correction
Les exports Epicollect du 18/08/2026 contiennent :
- Pluviométrie : 70 fiches parents et 117 relevés enfants ; 117/117 enfants ont un `ec5_parent_uuid`.
- Piézométrie : 104 fiches parents et 163 mesures enfants ; 163/163 enfants ont un `ec5_parent_uuid`.
- Limnimétrie : 104 fiches parents et 135 lectures enfants ; 135/135 enfants ont un `ec5_parent_uuid`.

Avant V5.2.1, Supabase ne retrouvait directement qu'une partie de ces parents. V5.2.1 introduit un registre UUID parent indépendant du référentiel physique et conserve l'historique.

## Ordre de déploiement
1. Déployer le code V5.2.1 sur GitHub / Render.
2. Dans Supabase SQL Editor, exécuter `database/34_REPAIR_PARENT_HISTORY_V5_2_1.sql`.
3. Dans PSORE > Administration > Synchronisation, cliquer **Réparer et resynchroniser tout**.
4. Attendre la fin des 7 sources.
5. Exécuter `database/35_VERIFY_PARENT_HISTORY_V5_2_1.sql`.

## Résultats attendus sur le snapshot du 18/08/2026
Le registre doit au minimum contenir les 278 parents du snapshot : 70 pluvio, 104 piezo, 104 limni. Les mesures enfants déjà présentes doivent pouvoir retrouver un parent par la liaison directe ou par le registre UUID.

Le seuil opérationnel reste le 16/08/2026. Les données antérieures sont conservées dans l'historique mais exclues des KPI opérationnels.

## Principe de données
Une fiche parent Epicollect n'est pas une station physique. Plusieurs fiches parents peuvent avoir le même code métier. La plateforme conserve donc tous les UUID parents et déduplique uniquement dans les vues analytiques par code officiel : 10 stations pluvio, 20 PZ, 10 stations limni.
