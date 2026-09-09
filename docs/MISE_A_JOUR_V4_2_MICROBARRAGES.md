# PSORE V4.2 — micro-barrages réhabilités

Cette version intègre Bodo, Fani, Sirimansoni et Wolokorodji dans le module Ouvrages intégrés et sur la carte.

## Convention validée
Les travaux prescrits dans l’APD de décembre 2024 sont enregistrés comme **réalisés intégralement**, conformément à la validation du maître d’ouvrage. La source reste explicitement affichée dans chaque fiche.

## Déploiement
1. Remplacer le code GitHub par cette version.
2. Déployer sur Render avec vidage du cache.
3. Exécuter `database/13_microbarrages_v4_2.sql` dans Supabase.

La page `/ouvrages` fonctionne avec le référentiel JSON intégré même avant l’exécution du SQL. La migration SQL prépare les usages futurs : formulaires de suivi, niveaux de retenue, entretien, envasement et analyses d’impact.
