# Déploiement PSORE V4.1 — documents dans Supabase Storage

## Objectif

Les 40 PDF des piézomètres ne sont plus inclus dans `public/`. Le dépôt GitHub contient uniquement le code et les petits référentiels. Les documents sont placés dans un bucket privé Supabase et ouverts par des URL signées de 5 minutes après contrôle de l'authentification.

## Étape 1 — base et bucket Supabase

Dans **Supabase → SQL Editor**, exécuter dans cet ordre :

1. `database/10_observatoire_integre_ouvrages.sql` si ce script n'a pas déjà été exécuté ;
2. `database/11_storage_documents_v4_1.sql`.

Le second script crée :

- le bucket privé `psore-documents` ;
- la table `documents_ouvrages` ;
- les 40 références documentaires.

## Étape 2 — transférer les 40 PDF

Décompresser `PSORE_V4_1_STORAGE_ASSETS.zip` à côté du projet.

Dans PowerShell, depuis le dossier du projet :

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://VOTRE-PROJET.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="VOTRE_CLE_SECRET_SERVICE_ROLE"
node scripts/upload-storage-assets.mjs "C:\CHEMIN\PSORE_V4_1_STORAGE_ASSETS"
```

Résultat attendu : `40 fichier(s) transféré(s), 0 échec(s)`.

La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être publiée dans GitHub ni utilisée côté navigateur.

## Étape 3 — GitHub et Render

Le ZIP applicatif est suffisamment léger pour être téléversé dans GitHub. Après le commit, Render redéploie automatiquement. En cas de doute : **Manual Deploy → Clear build cache & deploy**.

Les variables Render restent :

- `NEXT_PUBLIC_SUPABASE_URL` ;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
- `SUPABASE_SERVICE_ROLE_KEY` ;
- `ADMIN_EMAIL` ;
- `ADMIN_PASSWORD` ;
- `BOOTSTRAP_SECRET` ;
- `CRON_SECRET` ;
- `NEXT_PUBLIC_APP_URL`.

## Étape 4 — vérification

Dans PSORE : **Ouvrages intégrés → Piézomètres et essais**.

Cliquer sur **Essai** ou **Analyse**. L'utilisateur doit être connecté. Une URL temporaire est générée par l'API.

## Vérification SQL

```sql
select type_document, count(*)
from public.documents_ouvrages
where actif = true
group by type_document;
```

Résultat attendu : 20 analyses d'eau et 20 essais de pompage.
