# PSORE V4.5.0 — Synchronisation Epicollect5 parent/enfant

## Correctifs majeurs

1. Points d'eau : suppression des collisions de `code_pe` basées sur le nom du village. Les 540 entrées Epicollect disposent désormais d'un code technique unique dérivé de l'UUID lorsque le formulaire ne fournit pas de code explicite.
2. Pluviométrie, piézométrie et limnimétrie : prise en charge des sous-formulaires fils via `parent_form_ref` et rattachement des mesures à la station par `parent_uuid`.
3. Les dates `jj/mm/aaaa` sont converties en `aaaa-mm-jj` avant insertion Supabase.
4. Les lignes de mesure sans date ou sans valeur sont classées comme rejets de synchronisation et ne polluent plus les analyses.
5. Les vues analytiques utilisent uniquement les observations exploitables.
6. Le dashboard ne retombe plus sur les tables brutes simplement parce qu'une vue validée est vide.
7. La première synchronisation V4.5 est automatiquement complète ; les suivantes redeviennent incrémentales.
8. Le résultat de synchronisation affiche chaque source séparément (référentiel parent / mesures enfants).
9. Les tableaux de bord se rafraîchissent automatiquement après une synchronisation réussie.
10. Correction de la comparaison piézométrique : l'absence de mesure n'est plus interprétée comme `0 m` et donc comme une fausse remontée de nappe.

## Déploiement

1. Déployer le code V4.5.0 sur GitHub/Render.
2. Dans Supabase SQL Editor, exécuter `database/19_sync_child_forms_v4_5.sql`.
3. Si la sécurisation financière V4.4.2 n'est pas encore passée avec succès, exécuter aussi `database/17A_correctif_finances_microbarrages_v4_4_2.sql`.
4. Dans PSORE > Administration > Synchronisation, lancer successivement : Points d'eau, Pluviométrie, Piézométrie, Limnimétrie. La première synchronisation V4.5 est forcée en mode complet.
5. Exécuter `database/20_verification_sync_v4_5.sql`.

## Contrôles attendus

- Points d'eau : 540 `source_entry_id` uniques et 540 `code_pe` uniques après synchronisation complète, sous réserve que les 540 entrées soient toujours présentes dans Epicollect5.
- Les sources de mesures (pluie, piézo, limni) doivent afficher un nombre d'entrées exploitables supérieur à 0 dès lors que les sous-formulaires fils contiennent des mesures avec date et valeur.
- Administration > Synchronisation affiche le moteur `v4.5.0` et distingue les formulaires principaux des sous-formulaires fils.
- `/api/sync/diagnostic?probe=1` permet au rôle autorisé de comparer le total annoncé par Epicollect5 et les données exploitables en base.
