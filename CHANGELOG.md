# Changelog PSORE V2.4 FINAL PRODUCTION

## V2.4 Final Production

Consolidation des lots 1 à 8 :

- Fondations Next.js / Supabase / Vercel.
- Migration SQL complète `database/00_migration_complete_v2_4.sql`.
- Vérification SQL `database/99_verification.sql`.
- Authentification Supabase Auth.
- Bootstrap administrateur robuste.
- Gestion des rôles : Super administrateur, Administrateur PTCS, DNH/DRHK, Collecteur, Observateur, Public.
- Administration utilisateurs et rôles.
- Page Mon compte.
- Synchronisation Epicollect5 avec pagination complète.
- Sources Epicollect5 centralisées dans `epicollect_sources`.
- Dashboard Points d'eau.
- Dashboards Piézométrie, Pluviométrie, Limnimétrie.
- Cartographie publique limitée.
- Cartographie privée protégée.
- Dashboard institutionnel global.
- Exports CSV / Excel.
- Documentation de déploiement, Supabase, Vercel, Epicollect5, administrateur et utilisateur.

## Notes de production

- Exécuter la migration Supabase avant `/api/admin/bootstrap`.
- Définir les variables Vercel obligatoires.
- Utiliser Node.js 20.x sur Vercel.
- Le bootstrap peut être protégé par `BOOTSTRAP_SECRET`.
