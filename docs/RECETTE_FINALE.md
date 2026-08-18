# Recette finale — PSORE V2.4

## Environnement
- [ ] Variables Vercel configurées
- [ ] Migration Supabase exécutée
- [ ] `99_verification.sql` exécuté
- [ ] `/api/admin/bootstrap` retourne `ok: true`

## Authentification
- [ ] Connexion avec `ADMIN_EMAIL`
- [ ] Accès à `/admin`
- [ ] Création utilisateur
- [ ] Modification rôle
- [ ] Désactivation compte
- [ ] Changement mot de passe via `/mon-compte`

## Synchronisation
- [ ] `/api/sync/points-eau`
- [ ] `/api/sync/pluviometrie`
- [ ] `/api/sync/piezometrie`
- [ ] `/api/sync/limnimetrie`
- [ ] Vérification `sync_log`

## Cartographie
- [ ] `/cartographie` publique accessible
- [ ] Points d'eau affichés par défaut
- [ ] Filtres avec compteurs
- [ ] Popup publique limitée
- [ ] `/cartographie/privee` protégée

## Modules
- [ ] `/points-eau`
- [ ] `/pluviometrie`
- [ ] `/piezometrie`
- [ ] `/limnimetrie`
- [ ] Filtres, graphiques et exports OK

## Dashboard
- [ ] `/dashboard` protégé
- [ ] KPI consolidés
- [ ] Alertes consolidées
- [ ] État des synchronisations

## Critère final
La V2.4 est validée si l'administration fonctionne, les imports Epicollect5 se synchronisent, les quatre modules affichent les données, les cartes respectent les droits et aucune donnée personnelle n'est visible publiquement.
