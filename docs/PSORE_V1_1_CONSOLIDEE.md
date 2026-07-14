# PSORE V1.1 consolidée

Arbitrages validés :
- Public : statistiques agrégées non sensibles.
- Observateur : consultation + rapports, sans export ni synchronisation.
- DNH/DRHK : consultation + rapports + export + synchronisation.
- Administrateur PTCS : droits complets + gestion utilisateurs.
- Cartographie : OpenStreetMap + satellite + Mali/Koulikoro + points Epicollect.
- Exports : PDF, Word, Excel, CSV.
- Rapports : globaux et par module, période personnalisée.
- Synchronisation : manuelle + automatique toutes les 6 heures.
- Alertes : visuelles + préparation email.

Après déploiement :
1. Exécuter database/alerts.sql dans Supabase.
2. Tester /api/cron/sync.
3. Tester /api/alerts/check.
