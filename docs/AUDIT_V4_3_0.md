# PSORE V4.3.0 — audit de stabilisation

## Corrections prioritaires
- Synchronisation manuelle : suppression des liens directs GET vers `/api/sync/*`; les boutons utilisent désormais le JWT Supabase de la session via `authFetch`.
- Renouvellement automatique du JWT sur HTTP 401 puis nouvelle tentative unique.
- Synchronisation Epicollect5 incrémentale : `filter_by=uploaded_at`, `filter_from` basé sur la dernière synchronisation réussie, marge de 10 minutes, `per_page=500` avec repli adaptatif.
- Synchronisation complète toujours possible avec `?full=1` depuis une requête authentifiée.
- Route `/api/sync/diagnostic` pour contrôler l'environnement, les sources et l'authentification.
- Route cron protégée par la même logique d'autorisation que les synchronisations manuelles.
- Rétablissement de `/sig-decisionnel` et du menu SIG décisionnel pour DNH/DRHK, Administrateur PTCS et Super administrateur.
- Réintégration des données de restauration (494 objets) et communes Enabel comme ressources SIG décisionnelles.

## Interprétation du HTTP 401
Ouvrir directement `/api/sync/piezometrie` dans la barre d'adresse ne transmet pas le JWT Supabase stocké côté client. Un HTTP 401 est donc le comportement de sécurité attendu. La synchronisation doit être lancée depuis les boutons PSORE ou par CRON_SECRET pour l'automatisation.

## Limites du test
Le contrôle structurel, JSON et navigation est exécuté par `npm run verify:render`. Le build npm complet dépend de l'accès au registre npm de l'environnement de déploiement.
