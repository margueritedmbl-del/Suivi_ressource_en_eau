# Déploiement PSORE V2.2 consolidée

## Variables Vercel requises

```txt
NEXT_PUBLIC_SUPABASE_URL=https://yoamoxmktztikxtgvjpq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=gire_toure_2026
```

Cocher au minimum `Production` et `Preview`, puis relancer un `Redeploy`.

## Initialisation admin

Après le redéploiement, ouvrir :

```txt
/api/admin/bootstrap
```

Résultat attendu :

```json
{"ok":true,"email":"gireexpert@gmail.com","message":"Administrateur créé/confirmé et rôle attribué."}
```

## Tests fonctionnels

- Page d’accueil : pas de bouton Dashboard.
- Pages publiques modules : pas de Dashboard, Observatoire, Rapports, Administration.
- Connexion Administrateur PTCS : accès total.
- DNH/DRHK : accès CSV/XLSX seulement, pas d’Observatoire ni gestion utilisateurs.
- Collecteur : consultation seulement.
