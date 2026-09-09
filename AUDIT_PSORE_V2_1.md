# Audit technique PSORE V2.1

## Points vérifiés

- Recherche de `Buffer.from` : aucun usage bloquant restant dans les routes API.
- Route d'export : `app/api/reports/export/route.ts` utilise `Response` avec texte, `ArrayBuffer` ou `Uint8Array`.
- Authentification : dépend de `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` côté client.
- Administration Supabase : dépend de `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` côté serveur.
- Bootstrap administrateur : dépend de `ADMIN_EMAIL`, `ADMIN_PASSWORD`, et du rôle `Administrateur PTCS` dans la table `roles`.

## Variables requises

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Tests après déploiement

1. `/api/health`
2. `/api/auth/client-health`
3. `/api/admin/bootstrap`
4. `/login`
5. `/api/reports/export?module=points_eau&format=csv`
6. `/api/reports/export?module=points_eau&format=xlsx`
7. `/api/reports/export?module=points_eau&format=docx`
8. `/api/reports/export?module=points_eau&format=pdf`
