# Déploiement de PSORE sur Render — guide débutant

Ce guide déploie PSORE comme **Web Service Node.js** sur Render, avec Supabase comme base de données et authentification.

## 1. Prérequis

Préparer :

- un compte GitHub contenant le projet PSORE ;
- un projet Supabase opérationnel ;
- les variables suivantes :
  - `NEXT_PUBLIC_SUPABASE_URL` ;
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
  - `SUPABASE_SERVICE_ROLE_KEY` ;
  - `ADMIN_EMAIL` ;
  - `ADMIN_PASSWORD` ;
  - `BOOTSTRAP_SECRET` ;
  - `CRON_SECRET`.

Ne publiez jamais la clé `SUPABASE_SERVICE_ROLE_KEY` dans GitHub.

## 2. Mettre le projet sur GitHub

Décompresser le ZIP Render Ready, puis copier tous ses fichiers dans le dépôt GitHub.

En local :

```bash
git add .
git commit -m "PSORE - préparation déploiement Render"
git push
```

Vérifier à la racine du dépôt la présence de :

- `package.json` ;
- `render.yaml` ;
- `app/` ;
- `database/`.

## 3. Créer le compte Render

1. Ouvrir `https://render.com`.
2. Cliquer sur **Get Started**.
3. Choisir **GitHub**.
4. Autoriser Render à accéder au dépôt PSORE.

## 4. Créer le service avec le Blueprint

1. Dans le tableau de bord Render, cliquer sur **New +**.
2. Choisir **Blueprint**.
3. Sélectionner le dépôt GitHub PSORE.
4. Render détecte le fichier `render.yaml`.
5. Donner un nom au Blueprint, par exemple `psore-production`.
6. Cliquer sur **Apply**.

Le Blueprint crée un Web Service Node nommé `psore`.

## 5. Renseigner les variables d’environnement

Render demandera les valeurs marquées `sync: false`.

Renseigner :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=VOTRE_MOT_DE_PASSE_FORT
BOOTSTRAP_SECRET=VOTRE_SECRET_BOOTSTRAP
CRON_SECRET=VOTRE_SECRET_SYNCHRONISATION
NEXT_PUBLIC_APP_URL=https://psore.onrender.com
```

Règles :

- la clé publique commence généralement par `sb_publishable_` ;
- la clé serveur commence généralement par `sb_secret_` ;
- ne pas mettre de guillemets autour des valeurs ;
- utiliser deux secrets différents pour bootstrap et cron.

L’URL exacte `NEXT_PUBLIC_APP_URL` peut être corrigée après le premier déploiement, une fois l’adresse Render connue.

## 6. Paramètres du service

Le fichier `render.yaml` configure automatiquement :

```text
Runtime : Node
Build Command : npm ci --no-audit --no-fund && npm run build
Start Command : npm start
Health Check : /api/health
Region : Frankfurt
Plan : Free
```

PSORE doit être déployé comme **Web Service**, pas comme Static Site.

## 7. Suivre le premier déploiement

Ouvrir le service puis l’onglet **Logs**.

Attendre successivement :

```text
Installing dependencies
Creating an optimized production build
Starting service
Your service is live
```

Le premier build peut durer plusieurs minutes.

## 8. Vérifier la santé de PSORE

Ouvrir :

```text
https://VOTRE-SERVICE.onrender.com/api/health
```

Réponse attendue :

```json
{"ok":true,"service":"PSORE","runtime":"nodejs"}
```

## 9. Corriger NEXT_PUBLIC_APP_URL

Après avoir obtenu l’adresse Render :

1. ouvrir le service ;
2. aller dans **Environment** ;
3. modifier `NEXT_PUBLIC_APP_URL` ;
4. mettre l’adresse exacte, sans barre finale ;
5. enregistrer ;
6. lancer **Manual Deploy → Deploy latest commit**.

Exemple :

```env
NEXT_PUBLIC_APP_URL=https://psore.onrender.com
```

## 10. Initialiser le compte administrateur

Ouvrir une seule fois :

```text
https://VOTRE-SERVICE.onrender.com/api/admin/bootstrap?secret=VOTRE_SECRET_BOOTSTRAP
```

Résultat attendu :

```json
{"ok":true}
```

Puis vérifier dans Supabase :

```text
Authentication → Users
```

Le compte `ADMIN_EMAIL` doit être présent.

## 11. Tester la connexion

Ouvrir :

```text
https://VOTRE-SERVICE.onrender.com/login
```

Utiliser `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

Tester ensuite :

- `/admin` ;
- `/dashboard` ;
- `/cartographie` ;
- `/points-eau` ;
- `/admin/synchronisation`.

## 12. Tester l’import manuel

1. Ouvrir **Administration → Synchronisation**.
2. Sélectionner la fiche.
3. Choisir le CSV ou XLSX.
4. Lancer l’import.
5. Suivre la progression.

Render exécute l’application comme service Node, ce qui évite le modèle de fonction Vercel ayant produit `FUNCTION_INVOCATION_TIMEOUT`.

## 13. Tester la synchronisation Epicollect5

Pour une synchronisation protégée, privilégier l’en-tête Bearer :

```bash
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  https://VOTRE-SERVICE.onrender.com/api/sync/all
```

Éviter de partager le secret dans l’URL ou dans une capture d’écran.

Commencer par un seul module et attendre la fin avant d’en lancer un autre.

## 14. Limites de l’offre gratuite

Une instance gratuite peut se mettre en veille après une période d’inactivité. La première ouverture suivante peut être lente. Elle convient pour les tests et une utilisation modérée. Pour une exploitation institutionnelle continue et des synchronisations programmées fiables, passer ultérieurement à une instance payante.

## 15. Déploiements suivants

À chaque `git push` sur `main`, Render peut redéployer automatiquement.

Pour relancer manuellement :

```text
Service → Manual Deploy → Deploy latest commit
```

Pour déployer sans cache :

```text
Service → Manual Deploy → Clear build cache & deploy
```

## 16. Domaine personnalisé

Quand le service est stable :

1. ouvrir **Settings → Custom Domains** ;
2. ajouter `eau-ptcs-mali.org` ;
3. recopier les enregistrements DNS indiqués par Render chez le fournisseur du domaine ;
4. attendre la validation ;
5. mettre `NEXT_PUBLIC_APP_URL=https://eau-ptcs-mali.org` ;
6. redéployer.

Render fournit automatiquement le certificat HTTPS après validation DNS.

## 17. Dépannage rapide

### Build échoué

Consulter la première ligne rouge dans **Logs**, pas seulement les avertissements npm.

### Service inaccessible

Tester `/api/health` et vérifier que le service écoute le port fourni par Render.

### Connexion impossible

Vérifier les trois variables Supabase et relancer le bootstrap.

### RLS bloque les écritures

Vérifier que `SUPABASE_SERVICE_ROLE_KEY` utilise bien la Secret key du même projet Supabase.

### Import sans résultat

Consulter les logs du service pendant l’import et vérifier que la migration `import_jobs` et le bucket `manual-imports` existent.
