# PSORE V5.2.2 - Correctifs intégrés

## Synchronisation Points d'eau
- Lecture exacte des clés Epicollect pour température, pH, conductivité, turbidité et TDS.
- Conversion numérique stricte : une chaîne UUID/technique n'est plus transformée en nombre.
- Les valeurs sources restent conservées dans `raw_payload`.

## Qualité / alertes
- pH physiquement impossible (<0 ou >14) = donnée à vérifier.
- Alerte pH de qualité uniquement pour un pH physiquement exploitable (0-14) et hors 6,5-8,5.
- Le score de priorité n'ajoute plus automatiquement un besoin pour RAS/Aucun/Non/Réparé/Réhabilité.

## Dashboard
- Couverture des réseaux présentée en pourcentage.
- KPI « Non fonctionnels » séparé des interventions explicites.
- KPI « Données à vérifier » distinct des alertes de qualité eau.
- Unité limnimétrique corrigée en cm.

## Rapports PDF
- Mise en page de synthèse conservée : KPI en haut, graphique à gauche, carte à droite, analyse et contrôles sous la carte.
- Carte recentrée sur les stations/ouvrages de la sélection.
- Conservation du ratio cartographique pour éviter l'étirement.
- Padding autour de l'emprise.
- Tuiles OSM limitées au cadre de la carte (clipping).
- Flèche nord, échelle, légende et symbologie rééquilibrées.
- Étiquettes des réseaux hydrologiques conservées ; elles sont masquées pour les inventaires très denses de points d'eau afin de garder la carte lisible.
- Extraits de sous-bassins recentrés et proportions conservées.

## Déploiement
Voir `GUIDE_DEPLOIEMENT_V5_2_2.md` et exécuter les scripts SQL 36 puis 37.
