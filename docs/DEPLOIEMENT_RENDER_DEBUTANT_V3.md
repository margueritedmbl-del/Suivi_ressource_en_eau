# Déploiement PSORE sur Render — guide débutant

## 1. Préparer GitHub
Décompresser le ZIP, puis envoyer **tout le contenu** à la racine du dépôt. Vérifier sur GitHub la présence de :
- `components/DashboardShell.tsx`
- `components/auth/RequireAuth.tsx`
- `lib/permissions.ts`
- `tsconfig.json`
- `Dockerfile`
- `render.yaml`

Ne pas envoyer le dossier parent seul : `package.json` doit être visible à la racine du dépôt.

## 2. Créer le service Render
1. Créer un compte sur Render et connecter GitHub.
2. Cliquer `New +` puis `Blueprint`.
3. Choisir le dépôt PSORE.
4. Render détecte `render.yaml` et crée un service Docker.
5. Cliquer `Apply`.

## 3. Renseigner les variables
Dans le service : `Environment` → ajouter les valeurs suivantes :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `BOOTSTRAP_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL` (URL Render obtenue, sans slash final)

Enregistrer puis lancer `Manual Deploy` → `Deploy latest commit`.

## 4. Contrôler le build
Le journal doit contenir :
`Vérification Render OK : 9 fichiers indispensables présents.`

Si le build indique qu'un fichier est absent, le dépôt GitHub a été téléversé partiellement. Ne corriger aucun import : remettre le contenu complet du ZIP à la racine.

## 5. Vérifier le service
Ouvrir :
`https://VOTRE-SERVICE.onrender.com/api/health`

Puis initialiser :
`https://VOTRE-SERVICE.onrender.com/api/admin/bootstrap?secret=VOTRE_BOOTSTRAP_SECRET`

## 6. Connexion
Ouvrir `/login` et utiliser `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## 7. Offre gratuite
Le service gratuit peut se mettre en veille. La première ouverture après une période d'inactivité peut prendre plusieurs dizaines de secondes.
