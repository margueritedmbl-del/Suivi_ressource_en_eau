
## V4.7.0 — Operational Ready
- Correction définitive des formulaires enfants Epicollect5 (`form_ref` enfant + `parent_form_ref`).
- Liaison mesures/stations par `ec5_parent_uuid` → `ec5_uuid`.
- Référentiels physiques canoniques par code métier.
- Filtre global configurable de début des données opérationnelles.
- Vues analytiques/cartographiques V4.7 et Observatoire alignés.
- Extraction renforcée des clés EC5_AUTO préfixées/tronquées.
# PSORE V4.1 — Stockage documentaire externalisé

- Retrait des 40 PDF volumineux du dossier `public`.
- Bucket privé Supabase `psore-documents`.
- Registre `documents_ouvrages`.
- Ouverture sécurisée par URL signée après contrôle du rôle.
- Script de transfert automatique des documents.
- Correction des dates SQL des essais au format ISO.

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

## PSORE V2.4.1 — Compatibilité nouvelles clés Supabase

- Correction du bootstrap pour accepter les nouvelles clés Supabase `sb_secret_...`.
- Conservation de la compatibilité avec les anciennes clés JWT `service_role`.
- Rejet explicite des clés `sb_publishable_...`/anon pour `SUPABASE_SERVICE_ROLE_KEY`.
- Passage recommandé à Node.js 22.x pour les déploiements Vercel récents.


## 2.4.5 — Import manuel de secours
- Import CSV/XLSX depuis l’administration.
- Prise en charge des 7 sources métier PSORE.
- Upsert sans doublons et résolution des conflits sur codes métier.
- Journalisation des imports dans l’historique de synchronisation.
- Alimentation immédiate des cartes, dashboards et exports.

## 4.0.0 — Observatoire intégré des ouvrages
- Référentiel des 8 forages CRR et 8 forages PM.
- Conversion WGS 84 / UTM 29N vers longitude/latitude.
- Référentiel consolidé des 20 piézomètres.
- Intégration des 20 essais de pompage.
- Recensement et mise à disposition des 20 certificats d’analyse d’eau.
- Carte intégrée des 36 ouvrages.
- Migration Supabase pour les prélèvements, compteurs, essais et analyses.
