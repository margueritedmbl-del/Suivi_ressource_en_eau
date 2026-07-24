# PSORE V3.1 à V3.5 — moteur SIG décisionnel

## Fonctions livrées

- géotraitements côté application : inclusion point/polygone, intersection approximée par centroïde, buffers de proximité, distances, agrégations ;
- analyses automatiques par bassin, sous-bassin et commune Enabel ;
- indicateurs de restauration, couverture des piézomètres et technologies ;
- analyse temporelle des niveaux piézométriques depuis Supabase ;
- classement multicritère indicatif des sous-bassins ;
- simulateur de surface et budget ;
- protocole méthodologique pour l’analyse d’impact.

## Limites scientifiques

L’attribution d’un effet aux restaurations ne doit pas reposer sur une simple corrélation. Une analyse robuste nécessite une période de référence, des zones témoins, une normalisation pluviométrique, la prise en compte du décalage temporel de recharge et un nombre suffisant de mesures.

## Évolutions recommandées

Pour les traitements lourds ou nationaux : activer PostGIS dans Supabase, stocker les géométries dans des colonnes `geometry`, créer des index GiST et exécuter les intersections côté base de données.
