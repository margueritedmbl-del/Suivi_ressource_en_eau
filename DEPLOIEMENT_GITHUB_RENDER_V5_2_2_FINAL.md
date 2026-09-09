# PSORE V5.2.2 — Version finale à déployer

## Ordre de déploiement

1. Pousser l'ensemble du projet sur GitHub.
2. Dans Supabase, appliquer `database/36_MASTER_PSORE_V5_2_2.sql` si nécessaire, puis `database/38_PATCH_POINTS_EAU_DASHBOARD_V5_2_2.sql`.
3. Déployer le commit GitHub sur Render.
4. Configurer les variables d'environnement Supabase déjà prévues par le projet.
5. Tester l'application en production avant toute synchronisation Epicollect.
6. Vérifier ensuite les synchronisations et les rapports.

## Version validée

La base de référence validée pour les Points d'eau est de 540 enregistrements.

- 101 alertes qualité
- 98 alertes pH
- 0 alerte température
- 56 alertes GPS
- 220 priorités élevées
- 192 priorités moyennes
- 128 priorités faibles
- score moyen : 6,92

## Important

Ne pas supprimer les migrations historiques. Ne pas supprimer les données de test/historiques. Le correctif SQL est non destructif.
