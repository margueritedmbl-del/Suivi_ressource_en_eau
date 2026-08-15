# Migration PSORE de Vercel vers Render

## À conserver

- GitHub ;
- Supabase ;
- les tables, vues, utilisateurs et buckets Supabase ;
- les variables applicatives existantes.

## À modifier

- créer un Web Service Render ;
- remplacer l’URL publique Vercel par l’URL Render dans `NEXT_PUBLIC_APP_URL` ;
- mettre à jour les URL autorisées dans Supabase Auth ;
- ne plus dépendre de `vercel.json` pour l’hébergement principal.

## URL Configuration Supabase

Dans Supabase :

```text
Authentication → URL Configuration
```

Définir :

```text
Site URL : https://VOTRE-SERVICE.onrender.com
```

Ajouter dans les Redirect URLs :

```text
https://VOTRE-SERVICE.onrender.com/**
http://localhost:3000/**
```

Ajouter le domaine officiel lorsqu’il sera connecté.

## Arrêt de Vercel

Ne supprimez pas immédiatement le projet Vercel. Gardez-le quelques jours comme solution de retour arrière, puis désactivez son domaine personnalisé lorsque Render est validé.
