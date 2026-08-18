# Audit Epicollect5 — PSORE V4.7.0

## Relation hiérarchique confirmée
Les exports CSV réels montrent que les formulaires de mesures sont des formulaires enfants. La relation est portée par les métadonnées Epicollect5 :

`formulaire_enfant.ec5_parent_uuid = formulaire_parent.ec5_uuid`

Cette relation a été vérifiée pour les trois modules : pluviométrie, piézométrie et limnimétrie.

## Structure utilisée
- Pluviométrie : `Referentiel_Pluviometres` → `Releves_Pluviometriques`
- Piézométrie : `Referentiel_Piezometres` → `Campagnes_Mesures`
- Limnimétrie : `Stations_Limnimetriques` → `Informations de lecture`

La synchronisation V4.7 utilise `form_ref` du formulaire enfant et `parent_form_ref` du formulaire parent. Les anciennes URL `branch_ref` sont supprimées.

## Données de formation
Les saisies réalisées pendant la formation restent conservées en base. Les cartes et compteurs de stations utilisent une seule station physique par code métier. Une date de début des données opérationnelles, configurable par le Super administrateur, permet d'exclure les mesures de test des analyses sans les supprimer.

## Principe de consolidation
1. Synchroniser toutes les fiches parent Epicollect5.
2. Synchroniser toutes les mesures enfants.
3. Rattacher chaque mesure à son parent par UUID.
4. Récupérer le code métier de la station parent.
5. Consolider les cartes/KPI par code métier et non par nombre de fiches Epicollect5.
