# Déploiement Vercel — PSORE V2.4

1. Importer le dépôt GitHub dans Vercel.
2. Vérifier Node.js 20.x.
3. Ajouter les variables :
```env
NEXT_PUBLIC_SUPABASE_URL=https://yoamoxmktztikxtgvjpq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cle_anon_public
SUPABASE_SERVICE_ROLE_KEY=cle_service_role
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=mot_de_passe_admin
```
4. Cocher Production, Preview et Development.
5. Redéployer avec `Clear Build Cache`.
6. Ouvrir `/api/admin/bootstrap`.
7. Se connecter à `/login` avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`.
