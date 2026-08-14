# PSORE V2_3 — Note de mise à jour

## Objet
Cette version ajoute le module dynamique **Points d’eau** basé sur l’inventaire PTCS et prépare la même logique pour les modules **pluviométrie**, **piézométrie** et **limnimétrie**.

## Principales nouveautés

### 1. Dashboard Points d’eau
Page mise à jour : `/points-eau`

Fonctions ajoutées :
- KPI dynamiques : total, forages, puits, taux de fonctionnalité, non fonctionnels, à réhabiliter, sans GPS, alertes qualité.
- Filtres : commune, village, type, fonctionnalité, équipement, organe de gestion, priorité.
- Graphiques CSS : répartition par commune, fonctionnalité, équipement, priorité.
- Tableau détaillé filtrable.
- Exports CSV et Excel.
- Source de secours : `public/data/points-eau-inventaire.csv`.

### 2. Cartographie thématique Points d’eau
Page concernée : `/cartographie` et carte du module `/points-eau`.

Couches ajoutées :
- fonctionnalité ;
- type d’ouvrage ;
- priorité de réhabilitation ;
- équipement ;
- organe de gestion ;
- qualité de l’eau ;
- qualité des données.

Symbologie validée :
- vert : fonctionnel ;
- rouge : non fonctionnel / alerte ;
- orange : partiel / moyen ;
- noir : abandonné ;
- gris : non renseigné ;
- bleu : forage ;
- ocre : puits.

### 3. Scoring de réhabilitation
Score calculé automatiquement :
- forage non fonctionnel ou abandonné : +5 ;
- fonctionnalité partielle : +3 ;
- organe de gestion non fonctionnel : +3 ;
- absence d’organe de gestion : +2 ;
- besoin de réhabilitation renseigné : +3 ;
- problème ou dysfonctionnement signalé : +2 ;
- pH hors plage 6,5–8,5 : +2 ;
- température > 50 °C : +2 ;
- coordonnées GPS manquantes : +1.

Classes :
- priorité élevée : score >= 8 ;
- priorité moyenne : score 4 à 7 ;
- priorité faible : score 0 à 3.

### 4. Données personnelles
Les champs suivants sont prévus dans la table Supabase mais ne sont pas exposés dans les API publiques ni dans le CSV public :
- `nom_repondant` ;
- `contact_repondant` ;
- équivalents CSV `51_Nom_et_Prenom`, `52_Contact_tlphoniqu`.

### 5. Vues SQL ajoutées
Fichier : `database/views.sql`

Vues :
- `v_points_eau_dashboard` ;
- `v_pluviometrie_dashboard` ;
- `v_piezometrie_dashboard` ;
- `v_limnimetrie_dashboard` ;
- `v_carte_points` enrichie ;
- `dashboard_global` enrichie.

### 6. APIs ajoutées ou mises à jour
- `/api/dashboard/points-eau` ;
- `/api/dashboard/module?module=pluviometrie` ;
- `/api/dashboard/module?module=piezometrie` ;
- `/api/dashboard/module?module=limnimetrie` ;
- `/api/map/points?module=points_eau&theme=fonctionnalite` ;
- `/api/export/csv?module=points_eau` ;
- `/api/export/xlsx?module=points_eau`.

### 7. Données intégrées
Un fichier CSV de secours est ajouté :

`public/data/points-eau-inventaire.csv`

Il contient les 540 lignes utiles sans les champs personnels nom/contact.

## Déploiement

1. Exécuter les scripts SQL dans Supabase :
   - `database/schema.sql`
   - `database/views.sql`
   - `database/rls.sql` si nécessaire

2. Vérifier les variables Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Déployer :

```bash
npm install
npm run build
```

Le build local V2_3 a été vérifié avec succès.
