# PSORE V2_4 — Guide de déploiement propre

## 1. Remplacement GitHub

1. Décompresser `PSORE_V2_4.zip`.
2. Copier tout le contenu dans le dépôt GitHub local.
3. Ne pas supprimer `.git` si le dépôt est déjà cloné localement.
4. Exécuter :

```bash
git add .
git commit -m "Déploiement propre PSORE V2.4"
git push
```

## 2. Variables d’environnement Vercel

Dans Vercel → Project → Settings → Environment Variables, créer ou vérifier :

```env
NEXT_PUBLIC_SUPABASE_URL=https://yoamoxmktztikxtgvjpq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=clé_anon_public_supabase
SUPABASE_SERVICE_ROLE_KEY=clé_service_role_supabase
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=mot_de_passe_admin_minimum_8_caracteres
NEXT_PUBLIC_APP_URL=https://eau-ptcs-mali.org
```

Cocher Production, Preview et Development.

## 3. Migration Supabase

Dans Supabase → SQL Editor, exécuter d’abord :

```sql
-- fichier à copier/coller : database/00_migration_complete_v2_4.sql
```

Puis exécuter :

```sql
-- database/views.sql
-- database/rls.sql si besoin d’activer les politiques
```

## 4. Redéploiement Vercel

Dans Vercel → Deployments :

- Redeploy
- cocher Clear Build Cache

## 5. Initialisation administrateur

Après déploiement, ouvrir :

```txt
https://eau-ptcs-mali.org/api/admin/bootstrap
```

La réponse attendue contient :

```json
{"ok":true,"role":"Super administrateur"}
```

## 6. Connexion

Ouvrir :

```txt
/login
```

Compte :

```txt
Email : gireexpert@gmail.com
Mot de passe : valeur de ADMIN_PASSWORD
```

Après connexion, l’utilisateur doit accéder à `/admin`.

## 7. Synchronisation Epicollect5

Depuis l’administration ou directement :

```txt
/api/sync/all
```

La synchronisation suit automatiquement la pagination Epicollect5 pour récupérer toutes les pages, notamment les 540 points d’eau.

## 8. Vérification fonctionnelle

Tester :

```txt
/
/cartographie
/login
/admin
/mon-compte
/dashboard
/points-eau
/pluviometrie
/piezometrie
/limnimetrie
```

Règles attendues :

- accueil public visible ;
- modules visibles mais détails réservés ;
- cartographie publique limitée ;
- points d’eau affichés par défaut ;
- Super administrateur autorisé à gérer les rôles et utilisateurs.
