# PSORE V2.4.1 — Correction Supabase Secret Keys

Cette version corrige le bootstrap pour les nouveaux projets Supabase qui utilisent les clés :

- `sb_publishable_...` pour `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
- `sb_secret_...` pour `SUPABASE_SERVICE_ROLE_KEY`.

## Variables Vercel attendues

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=mot_de_passe_admin
BOOTSTRAP_SECRET=PSOREBOOTSTRAP2026
CRON_SECRET=PSORECRON2026
NEXT_PUBLIC_APP_URL=https://votre-site.vercel.app
```

Après modification des variables, relancer Vercel avec **Redeploy → Clear Build Cache**.

## Bootstrap

Ouvrir :

```txt
https://votre-site.vercel.app/api/admin/bootstrap?secret=PSOREBOOTSTRAP2026
```

La réponse attendue est `ok:true`.
