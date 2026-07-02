# PSORE V2_3 PATCH1 — Notes de déploiement

## Corrections intégrées

- Accueil public : modules visibles, mais les pages détaillées redirigent vers `/login` si l’utilisateur n’est pas connecté.
- Menu public conservé : Cartographie, Pluviométrie, Piézométrie, Limnimétrie, Points d’eau.
- Cartographie publique limitée : par défaut seuls les points d’eau sont affichés.
- Filtres dynamiques de carte : Point d’eau, Piézomètre, Pluviomètre, Limnimètre, avec compteurs.
- Légendes intégrées : Point d’eau bleu, Piézomètre turquoise, Pluviomètre violet, Limnimètre vert.
- Pop-up publique limitée : emplacement et type d’ouvrage pour les points d’eau ; emplacement pour les autres dispositifs.
- Pop-up complète des points d’eau conservée dans le module connecté `/points-eau`.
- Anciennes couches analytiques des points d’eau conservées uniquement dans le module connecté : fonctionnalité, type d’ouvrage, réhabilitation, équipement, organe de gestion, qualité eau, qualité données.
- `gireexpert@gmail.com` est traité comme **Super administrateur** après `/api/admin/bootstrap`.
- Ajout de `/mon-compte` pour changer le mot de passe après déploiement.
- Logo et image d’accueil actualisés.
- Synchronisation Epicollect renforcée avec pagination pour éviter la limite de 50 entrées.

## Fichiers SQL à exécuter dans Supabase

1. `database/schema.sql`
2. `database/seed.sql`
3. `database/views.sql`
4. `database/admin_fix.sql`

## Après redéploiement Vercel

1. Vérifier les variables d’environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL=gireexpert@gmail.com`
   - `ADMIN_PASSWORD=mot_de_passe_temporaire`
2. Redéployer avec **Clear Build Cache**.
3. Ouvrir `/api/admin/bootstrap`.
4. Se connecter avec `gireexpert@gmail.com`.
5. Aller sur `/admin` puis `/mon-compte` pour modifier le mot de passe.

## Epicollect5

Les sources intégrées sont :

- Pluviométrie : référentiel pluviomètres + relevés pluviométriques.
- Piézométrie : référentiel piézomètres + campagnes de mesures.
- Limnimétrie : stations limnimétriques + informations de lecture.
- Points d’eau : fiche de collecte PE.

La fonction de synchronisation ajoute automatiquement `per_page=1000` et parcourt les pages disponibles afin de récupérer l’ensemble des entrées au lieu des 50 premières.
