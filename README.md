# PSORE V2.4 — Plateforme de Suivi et d'Observation des Ressources en Eau

Plateforme institutionnelle PTCS / DNH / DRHK / Enabel pour le suivi des ressources en eau à Koulikoro.

## Modules

- Points d'eau
- Piézométrie
- Pluviométrie
- Limnimétrie
- Cartographie publique et privée
- Dashboard institutionnel
- Administration
- Synchronisation Epicollect5

## Démarrage local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Production

Voir :

```text
docs/DEPLOIEMENT_FINAL_PRODUCTION.md
```

## Scripts importants

```bash
npm run verify:project
npm run typecheck
npm run build
```

## Supabase

Exécuter d'abord :

```text
database/00_migration_complete_v2_4.sql
```

Puis vérifier :

```text
database/99_verification.sql
```

## Variables obligatoires

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

## Bootstrap

Après déploiement :

```text
/api/admin/bootstrap
```

ou, si `BOOTSTRAP_SECRET` est défini :

```text
/api/admin/bootstrap?secret=VOTRE_SECRET_BOOTSTRAP
```

## Nouveau déploiement complet

Pour repartir avec un nouveau compte GitHub, un nouveau projet Vercel et un nouveau projet Supabase, suivre :

`docs/NOUVEAU_DEPLOIEMENT_COMPLET.md`

Le bootstrap vérifie désormais que `SUPABASE_SERVICE_ROLE_KEY` est bien une clé `service_role`. Si une clé `anon` ou une mauvaise clé est utilisée, l'API renvoie une erreur explicite avant toute opération SQL.

## Déploiement Render

Cette édition contient un fichier `render.yaml` et une route de santé `/api/health`.

Guide débutant : `docs/DEPLOIEMENT_RENDER_DEBUTANT.md`.

Migration depuis Vercel : `docs/MIGRATION_VERCEL_VERS_RENDER.md`.
