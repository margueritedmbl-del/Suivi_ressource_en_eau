# PSORE V3.0 — Plateforme SIG décisionnelle

## Couches intégrées
- Bassins hydrographiques (activés par défaut)
- Sous-bassins
- Communes du projet Enabel (remplace la couche administrative générique)
- 494 polygones de restauration des terres
- 20 piézomètres PTCS issus du shapefile de référence

## Fonctions
- activation/désactivation indépendante ;
- palette complète de styles ;
- filtrage spatial des données PSORE ;
- statistiques spatiales des équipements ;
- calcul du nombre de sites restaurés, de la superficie restaurée et des technologies dans la zone sélectionnée ;
- détail public limité et détail privé étendu ;
- GeoJSON WGS84 optimisés et disponibles hors ligne avec les autres ressources statiques.

## Cadre d'analyse d'impact
La V3 prépare les analyses avant/après, buffers 100 m à 5 km, comparaison par technologie, corrélations pluie–piézométrie, tendances par bassin/sous-bassin et sélection de zones témoins. Une attribution causale exige des séries piézométriques et pluviométriques suffisamment longues, des dates de réalisation fiables et des zones témoins comparables.

## Déploiement
Aucune migration Supabase obligatoire pour les couches statiques. Remplacer les fichiers du dépôt, pousser sur GitHub puis lancer un déploiement Render avec vidage du cache si nécessaire.
