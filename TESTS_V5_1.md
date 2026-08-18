# PSORE V5.1.0 — Contrôles réalisés

- `node scripts/verify-render-files.mjs` : OK.
- `node scripts/verify-v5-1.mjs` : OK.
- Analyse syntaxique TypeScript/TSX de l'ensemble du projet via `typescript.transpileModule` : 0 erreur de syntaxe.
- Référentiels vérifiés : 10 stations pluviométriques, 20 piézomètres, 10 stations limnimétriques.
- Données SIG embarquées : 201 sous-bassins, 494 restaurations ; superficies de sous-bassins converties en valeurs absolues.
- Référentiel points d'eau vérifié par le contrôle projet : 540 identifiants uniques.

Le build Next.js complet doit être exécuté dans l'environnement de déploiement ou après installation complète des dépendances npm. Le script `prebuild` exécute désormais les contrôles V5.1 avant `next build`.
- Tentative de `npm ci --offline` : impossible dans cet environnement car le paquet `yocto-queue@0.1.0` n'est pas présent dans le cache npm local. Le build Next.js complet ne peut donc pas être reproduit hors ligne ici ; Render doit exécuter le contrôle final avec `npm ci && npm run build`.
