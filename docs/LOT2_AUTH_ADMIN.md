# PSORE V2.4 — Lot 2 : Authentification et Administration

## Objectif
Sécuriser l'accès à l'administration et stabiliser la gestion des utilisateurs PSORE.

## Corrections livrées

### Authentification serveur
- Ajout de `lib/auth-server.ts`.
- Vérification serveur du jeton Supabase transmis dans l'en-tête `Authorization: Bearer <token>`.
- Lecture du profil applicatif dans `public.profils` et du rôle associé dans `public.roles`.
- Rejet automatique des comptes désactivés.

### Authentification client
- Ajout de `lib/auth-client.ts`.
- Ajout d'un helper `authFetch()` qui ajoute automatiquement le jeton Supabase aux appels API protégés.

### API d'administration protégées
Les routes suivantes ne sont plus accessibles publiquement :

- `/api/admin/users`
- `/api/admin/users/create`
- `/api/admin/users/update-role`
- `/api/admin/users/reset-password`
- `/api/admin/forms`
- `/api/admin/sync-logs`

Accès autorisé uniquement aux rôles :

- Super administrateur
- Administrateur PTCS

### Gestion des utilisateurs
- Création directe d'utilisateur avec mot de passe.
- Invitation Supabase par email.
- Attribution du rôle.
- Activation/désactivation d'un compte.
- Réinitialisation du mot de passe par l'administrateur.
- Mise à jour d'un profil existant par email, sans recréer de doublon.

## Fichiers ajoutés
- `lib/auth-server.ts`
- `lib/auth-client.ts`
- `app/api/admin/users/reset-password/route.ts`
- `docs/LOT2_AUTH_ADMIN.md`

## Fichiers modifiés
- `app/api/admin/users/route.ts`
- `app/api/admin/users/create/route.ts`
- `app/api/admin/users/update-role/route.ts`
- `app/api/admin/forms/route.ts`
- `app/api/admin/sync-logs/route.ts`
- `components/admin/UserCreateForm.tsx`
- `components/admin/UserRoleManager.tsx`
- `components/admin/FormsManager.tsx`
- `components/admin/SyncLogs.tsx`

## Tests réalisés

```bash
npm install --no-audit --no-fund
npx tsc --noEmit
npm run build
```

Résultats :
- TypeScript : OK.
- Build Next.js : compilation OK, types OK ; expiration locale pendant `Collecting page data`, comme sur les versions précédentes. À tester sur Vercel avec `Clear Build Cache`.

## Test fonctionnel après déploiement
1. Exécuter la migration SQL si nécessaire.
2. Vérifier les variables Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
3. Ouvrir `/api/admin/bootstrap`.
4. Se connecter avec le compte administrateur.
5. Tester `/admin/roles` :
   - création d'utilisateur ;
   - modification de rôle ;
   - désactivation/réactivation ;
   - réinitialisation du mot de passe.
