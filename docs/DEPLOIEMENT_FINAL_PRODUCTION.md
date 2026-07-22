# PSORE V2.4 — Guide final de mise en production

## 1. Préparer GitHub

1. Décompresser `PSORE_V2_4_FINAL_PRODUCTION.zip`.
2. Copier tout le contenu dans le dépôt GitHub cible.
3. Ne pas envoyer `node_modules` ni `.next`.
4. Commit recommandé :

```bash
git add .
git commit -m "Production PSORE V2.4"
git push
```

## 2. Préparer Supabase

Dans Supabase → SQL Editor :

1. Ouvrir `database/00_migration_complete_v2_4.sql`.
2. Copier tout le contenu.
3. Cliquer sur **Run**.
4. Exécuter ensuite `database/99_verification.sql` pour contrôler les objets créés.

La migration est conçue pour être réexécutable : elle crée ou complète les tables, rôles, vues et sources Epicollect nécessaires.

## 3. Variables Vercel obligatoires

Dans Vercel → Project → Settings → Environment Variables, créer :

```env
NEXT_PUBLIC_SUPABASE_URL=https://yoamoxmktztikxtgvjpq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=COLLER_LA_CLE_ANON_PUBLIC
SUPABASE_SERVICE_ROLE_KEY=COLLER_LA_CLE_SERVICE_ROLE
ADMIN_EMAIL=gireexpert@gmail.com
ADMIN_PASSWORD=UN_MOT_DE_PASSE_FORT_MINIMUM_8_CARACTERES
```

Optionnel mais recommandé :

```env
BOOTSTRAP_SECRET=UNE_VALEUR_SECRETE_LONGUE
CRON_SECRET=UNE_VALEUR_SECRETE_LONGUE
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

Cochez **Production**, **Preview** et **Development**.

## 4. Déployer sur Vercel

1. Dans Vercel, connecter le dépôt GitHub.
2. Node.js : 20.x.
3. Install command : `npm ci --no-audit --no-fund`.
4. Build command : `npm run build`.
5. Redéployer avec **Clear Build Cache** après chaque changement important de variables.

## 5. Initialiser l'administrateur

Après déploiement réussi, ouvrir :

```text
https://votre-domaine.vercel.app/api/admin/bootstrap
```

Si `BOOTSTRAP_SECRET` est défini :

```text
https://votre-domaine.vercel.app/api/admin/bootstrap?secret=VOTRE_SECRET_BOOTSTRAP
```

Réponse attendue :

```json
{"ok":true}
```

Le bootstrap confirme ou crée :

- Super administrateur ;
- Administrateur PTCS ;
- DNH/DRHK ;
- Collecteur ;
- Observateur ;
- Public ;
- profil administrateur initial.

Il met aussi à jour le mot de passe Supabase Auth de `ADMIN_EMAIL` avec `ADMIN_PASSWORD`.

## 6. Connexion initiale

Aller sur :

```text
/login
```

Identifiants :

```text
Email : valeur de ADMIN_EMAIL
Mot de passe : valeur de ADMIN_PASSWORD
```

Après connexion, vérifier :

```text
/admin
/mon-compte
/dashboard
/cartographie
/cartographie/privee
/points-eau
/pluviometrie
/piezometrie
/limnimetrie
```

## 7. Synchronisation Epicollect5

Depuis `/admin/synchronisation`, lancer la synchronisation des modules.

Routes disponibles :

```text
/api/sync/all
/api/sync/points-eau
/api/sync/pluviometrie
/api/sync/piezometrie
/api/sync/limnimetrie
```

Le moteur suit la pagination Epicollect5 pour éviter le blocage aux 50 premières entrées.

## 8. Recette rapide

Contrôles à effectuer :

- Accueil public visible.
- Modules visibles mais détails protégés.
- Cartographie publique : points d'eau affichés par défaut.
- Cartographie privée accessible après connexion.
- Dashboard institutionnel accessible aux rôles autorisés.
- Exports CSV/Excel fonctionnels.
- Aucun numéro de téléphone ou nom répondant visible côté public.
- `gireexpert@gmail.com` ou `ADMIN_EMAIL` a le rôle Super administrateur.

## 9. En cas de problème

### Erreur `Invalid login credentials`
Relancer `/api/admin/bootstrap`, vérifier `ADMIN_PASSWORD`, puis tester à nouveau.

### Erreur Supabase table/colonne manquante
Réexécuter `database/00_migration_complete_v2_4.sql`, puis `database/99_verification.sql`.

### Build Vercel échoue à l'installation
Vérifier que `.npmrc`, `package-lock.json`, `package.json` et `vercel.json` sont bien présents. Redéployer avec Clear Build Cache.

