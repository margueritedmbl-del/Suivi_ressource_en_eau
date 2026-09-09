# Installation locale — PSORE V2.4

## Prérequis
- Node.js 20.x
- npm 10.x
- Projet Supabase actif
- Compte Vercel

## Installation
```bash
npm ci --no-audit --no-fund
cp .env.example .env.local
npm run typecheck
npm run verify:project
npm run dev
```

Ouvrir `http://localhost:3000`.

## Variables obligatoires
```env
NEXT_PUBLIC_SUPABASE_URL=https://yoamoxmktztikxtgvjpq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cle_anon_public
SUPABASE_SERVICE_ROLE_KEY=cle_service_role
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=mot_de_passe_admin
```
