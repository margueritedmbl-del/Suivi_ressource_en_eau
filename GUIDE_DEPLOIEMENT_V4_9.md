# PSORE V4.9.0 — Rapports professionnels, observatoire corrigé et SIG décisionnel dynamique

## 1. Déploiement Render
1. Remplacer le contenu du dépôt GitHub par cette version.
2. Render → Manual Deploy → Clear build cache & deploy → Deploy latest commit.
3. Vérifier `/api/version` : `4.9.0`.

## 2. Migration Supabase indispensable
Après le déploiement, exécuter dans SQL Editor :

`database/26_NETWORK_REGISTRY_AND_ANALYTICS_V4_9.sql`

Cette migration crée le référentiel officiel des réseaux :
- 10 stations pluviométriques ;
- 20 piézomètres ;
- 10 stations limnimétriques.

Elle reconstruit les vues analytiques afin que les fiches de test Epicollect5 ne soient plus comptées comme de nouveaux ouvrages physiques.

## 3. Vérification
Exécuter ensuite :

`database/27_VERIFY_V4_9.sql`

Résultats attendus pour le référentiel :
- pluviométrie : 10 ;
- piézométrie : 20 ;
- limnimétrie : 10.

Le nombre de `stations_avec_donnees` dépend des mesures réellement synchronisées.

## 4. Rapports
L'export PDF comprend :
- bandeau institutionnel et logos ;
- KPI en couleur ;
- courbe d'évolution temporelle ;
- graphique de volume de mesures par station ;
- carte synthétique des points GPS ;
- lecture automatique et commentaires terrain ;
- tableau détaillé des enregistrements.

DOCX : résumé, analyse/commentaires et tableau détaillé avec mise en forme institutionnelle.
XLSX : feuilles Synthèse, Analyse, Evolution et Détail des données.
CSV : détail brut filtré.

## 5. SIG décisionnel
Le moteur travaille désormais par sous-bassin et croise :
- surface et densité de restauration ;
- évolution piézométrique par rapport à la référence 2025 ;
- pluviométrie disponible ;
- limnimétrie disponible ;
- présence de micro-barrages ;
- couverture du réseau de suivi.

Les scénarios produisent des résultats calculés, des priorités et un niveau de confiance. Ils ne sont pas interprétés automatiquement comme preuve de causalité.
