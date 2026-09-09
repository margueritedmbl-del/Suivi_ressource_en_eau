# PSORE V2.4 — Nouveau déploiement complet

Ce guide est prévu pour repartir proprement avec :

- un nouveau compte ou dépôt GitHub ;
- un nouveau projet Vercel ;
- un nouveau projet Supabase dédié à PSORE V2.4.

## 1. Créer le nouveau projet Supabase

1. Aller sur Supabase.
2. Créer un projet : `PSORE_V2_4_Production`.
3. Conserver le mot de passe de la base.
4. Aller dans **Project Settings → API Keys**.
5. Copier :
   - `Project URL` ;
   - `anon public key` ;
   - `service_role key`.

Important : `service_role key` est privée. Ne jamais la mettre dans GitHub ni dans le navigateur.

## 2. Exécuter la migration

Dans Supabase → SQL Editor → New query :

1. Copier tout le contenu de :
   `database/00_migration_complete_v2_4.sql`
2. Cliquer sur **Run**.
3. Puis exécuter :
   `database/99_verification.sql`

La vérification doit afficher les tables principales, les rôles et les vues.

## 3. Créer un nouveau dépôt GitHub

1. Créer un dépôt, par exemple : `psore-v2-4-production`.
2. Décompresser le ZIP PSORE.
3. Envoyer tous les fichiers dans le dépôt.
4. Vérifier que les fichiers suivants ne contiennent pas de secrets :
   - `.env.local`
   - `.env`
   - captures d'écran contenant des clés.

## 4. Créer le projet Vercel

1. Vercel → Add New Project.
2. Importer le dépôt GitHub.
3. Framework : Next.js.
4. Build Command : `npm run build`.
5. Install Command : laisser par défaut ou `npm install --no-audit --no-fund`.

## 5. Variables d'environnement Vercel obligatoires

Créer exactement ces variables dans **Project → Settings → Environment Variables** :

```env
NEXT_PUBLIC_SUPABASE_URL=https://NOUVEAU_PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=COLLER_LA_CLE_ANON_PUBLIC_DU_NOUVEAU_PROJET
SUPABASE_SERVICE_ROLE_KEY=COLLER_LA_CLE_SERVICE_ROLE_DU_NOUVEAU_PROJET
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=UN_MOT_DE_PASSE_ADMIN_FORT
BOOTSTRAP_SECRET=UNE_VALEUR_LONGUE_ET_SECRETE
CRON_SECRET=UNE_AUTRE_VALEUR_LONGUE_ET_SECRETE
NEXT_PUBLIC_APP_URL=https://VOTRE_PROJET.vercel.app
```

Cocher : Production, Preview et Development.

### Erreurs fréquentes

- Ne pas mettre la clé `anon` dans `SUPABASE_SERVICE_ROLE_KEY`.
- Ne pas mettre une clé Stripe ou autre clé `sk_live...` dans `ADMIN_PASSWORD`.
- Après ajout/modification des variables, toujours faire **Redeploy → Clear Build Cache**.

## 6. Déployer Vercel

Après avoir ajouté les variables :

1. Aller dans **Deployments**.
2. Cliquer **Redeploy**.
3. Choisir **Clear Build Cache**.

## 7. Lancer le bootstrap admin

Ouvrir :

```text
https://VOTRE_PROJET.vercel.app/api/admin/bootstrap?secret=VOTRE_BOOTSTRAP_SECRET
```

Résultat attendu :

```json
{"ok":true}
```

Si vous voyez une erreur RLS, cela veut dire que `SUPABASE_SERVICE_ROLE_KEY` n'est pas la clé `service_role` du projet Supabase utilisé par Vercel, ou que Vercel n'a pas été redéployé après modification des variables.

## 8. Connexion

Aller sur :

```text
/login
```

Utiliser :

- Email : valeur de `ADMIN_EMAIL` ;
- Mot de passe : valeur de `ADMIN_PASSWORD`.

## 9. Synchronisation Epicollect5

Depuis l'administration, lancer les synchronisations.

À vérifier :

- Points d'eau : récupération de toutes les pages ;
- Pluviométrie ;
- Piézométrie ;
- Limnimétrie.

## 10. Recette rapide

Tester :

- `/`
- `/login`
- `/admin`
- `/dashboard`
- `/cartographie`
- `/points-eau`
- `/pluviometrie`
- `/piezometrie`
- `/limnimetrie`
