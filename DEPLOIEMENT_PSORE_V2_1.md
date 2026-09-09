# PSORE V2.1 consolidée — déploiement Vercel

## 1. Variables obligatoires dans Vercel

Dans **Vercel > Project > Settings > Environment Variables**, ajouter en **Production** :

```txt
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre clé anon/public Supabase
SUPABASE_SERVICE_ROLE_KEY=votre clé service_role Supabase
NEXT_PUBLIC_APP_URL=https://votre-site.vercel.app
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=votre mot de passe fort
```

Variables optionnelles :

```txt
BOOTSTRAP_SECRET=un_secret_long
CRON_SECRET=un_secret_long
```

Important : les variables `NEXT_PUBLIC_*` sont intégrées au moment du build. Après modification dans Vercel, il faut obligatoirement faire **Redeploy**.

## 2. Ordre recommandé

1. Téléverser cette V2.1 dans GitHub.
2. Faire **Commit changes**.
3. Vérifier les variables d'environnement dans Vercel.
4. Faire **Redeploy**.
5. Ouvrir `/api/health`.
6. Ouvrir `/api/auth/client-health`.
7. Exécuter les scripts SQL Supabase : `database/schema.sql`, `database/seed.sql`, puis selon besoin `database/rls.sql`, `database/views.sql`, `database/alerts.sql`.
8. Créer/confirmer l'administrateur avec `/api/admin/bootstrap`.
   - Si `BOOTSTRAP_SECRET` est vide : `/api/admin/bootstrap`
   - Si `BOOTSTRAP_SECRET` est défini : `/api/admin/bootstrap?secret=VOTRE_SECRET`
9. Tester `/login` avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

## 3. Résultats attendus

`/api/health` doit indiquer :

```json
{
  "app": "ok",
  "supabase_env": "configured",
  "supabase": "ok"
}
```

`/api/auth/client-health` doit indiquer :

```json
{
  "app": "ok",
  "supabase_client_env": "configured"
}
```

## 4. Corrections intégrées

- Export CSV/XLSX/DOCX/PDF compatible Next.js/Vercel, sans `NextResponse(Buffer...)`.
- Diagnostic Supabase admin dans `/api/health`.
- Diagnostic Supabase client dans `/api/auth/client-health`.
- `.env.example` complet.
- Route `/api/admin/bootstrap` renforcée avec `BOOTSTRAP_SECRET` optionnel.
- Message d'erreur de connexion plus explicite.
- Correction des avertissements CSS Autoprefixer `end` vers `flex-end`.

## 5. Cause la plus probable de l'échec d'authentification

Si `/api/health` affiche `supabase_env: "missing"`, Vercel ne reçoit pas `NEXT_PUBLIC_SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY`.

Si `/api/auth/client-health` affiche `supabase_client_env: "missing"`, la page de connexion ne reçoit pas `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Dans les deux cas : ajouter les variables dans Vercel, puis faire **Redeploy**.
