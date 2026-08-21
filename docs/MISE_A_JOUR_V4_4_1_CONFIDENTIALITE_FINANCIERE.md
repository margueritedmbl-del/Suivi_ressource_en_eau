# PSORE V4.4.1 — Confidentialité des montants

Les montants des travaux des micro-barrages sont désormais réservés exclusivement au rôle **Super administrateur**.

## Mesures appliquées
- suppression des montants des JSON/CSV publics ;
- suppression des montants de la carte pour tous les autres rôles ;
- affichage du KPI et des montants par site uniquement en session Super administrateur ;
- endpoint sécurisé `/api/ouvrages/microbarrages/finances` limité au rôle Super administrateur ;
- suppression de la politique RLS publique sur `microbarrages` ;
- vue `v_microbarrages_synthese` sans données financières ;
- vue publique technique `v_microbarrages_public` sans données financières.

## Déploiement
Exécuter `database/17_finances_microbarrages_superadmin_v4_4_1.sql`, puis `database/18_verification_finances_v4_4_1.sql`.
