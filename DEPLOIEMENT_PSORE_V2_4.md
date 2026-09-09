# PSORE V2_4 — Déploiement et migration

## 1. Variables Vercel obligatoires

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL` : par défaut `gireexpert@gmail.com`
- `ADMIN_PASSWORD` : minimum 8 caractères

Après modification des variables : **Redeploy → Clear Build Cache**.

## 2. Migration Supabase

Dans Supabase → SQL Editor, exécuter dans cet ordre :

1. `database/schema.sql`
2. `database/seed.sql`
3. `database/views.sql`
4. `database/migration_v2_4.sql`

Si la base existe déjà, ces scripts utilisent `create table if not exists`, `alter table add column if not exists` et `on conflict`, donc ils conservent les données existantes.

## 3. Création/confirmation du Super administrateur

Ouvrir :

```txt
https://votre-domaine/api/admin/bootstrap
```

Le bootstrap V2_4 crée automatiquement les rôles manquants, force le rôle **Super administrateur** pour `ADMIN_EMAIL`, confirme l’e-mail et synchronise le mot de passe avec `ADMIN_PASSWORD`.

## 4. Connexion

Se connecter avec :

- Email : valeur de `ADMIN_EMAIL`
- Mot de passe : valeur de `ADMIN_PASSWORD`

Après connexion, le Super administrateur est redirigé vers `/admin`.

## 5. Cartographie publique

Par défaut, seule la couche **Points d’eau** est affichée. L’utilisateur peut activer :

- Point d’eau = bleu
- Piézomètre = turquoise
- Pluviomètre = violet
- Limnimètre = vert

Les popups publiques sont limitées. Les détails analytiques complets restent réservés aux modules connectés.

## 6. Synchronisation Epicollect5

Les synchronisations V2_4 suivent la pagination Epicollect5 afin de récupérer toutes les entrées et non uniquement les 50 premières.

Routes :

- `/api/sync/points-eau`
- `/api/sync/pluviometrie`
- `/api/sync/piezometrie`
- `/api/sync/limnimetrie`
- `/api/sync/all`
