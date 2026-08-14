# PSORE V2.4 — Lot 6 : Cartographie publique / privée

## Objectif

Le Lot 6 sépare clairement la cartographie publique et la cartographie privée afin de respecter les règles de sécurité validées.

## Réalisé

- Carte publique `/cartographie` : affichage limité, avec **Points d'eau activés par défaut**.
- Filtres dynamiques avec compteurs : Point d'eau, Piézomètre, Pluviomètre, Limnimètre.
- Légende dynamique :
  - Point d'eau : bleu ;
  - Piézomètre : turquoise ;
  - Pluviomètre : violet ;
  - Limnimètre : vert.
- Pop-up publique limitée : emplacement et type d’ouvrage.
- Carte privée `/cartographie/privee` protégée par authentification.
- Pop-up privée Points d’eau : fonctionnalité, équipement, organe, priorité, qualité eau et recommandation.
- API cartographiques :
  - `/api/map/points`
  - `/api/map/public`
  - `/api/map/private`
  - `/api/map/legend`
  - `/api/map/search`
  - `/api/map/stats`
- Protection serveur : le mode `detail=connected` ne retourne des détails privés que si un jeton Supabase valide est transmis.

## Scripts SQL

Exécuter si nécessaire :

```sql
\i database/06_lot6_cartographie.sql
```

Sur Supabase, copier-coller le contenu du fichier `database/06_lot6_cartographie.sql` dans SQL Editor.

## Test fonctionnel

1. Ouvrir `/cartographie` sans connexion.
2. Vérifier que seuls les Points d’eau sont actifs par défaut.
3. Activer les autres couches avec les boutons.
4. Vérifier que les pop-up publiques ne montrent pas de données sensibles.
5. Se connecter, puis ouvrir `/cartographie/privee`.
6. Vérifier les détails privés et les légendes thématiques Points d’eau.
