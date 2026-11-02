# Corrections PSORE préparées le 2 novembre 2026

Base : branche main, commit d7a7e85. Hébergement cible : Render. Aucun changement distant ni déploiement effectué.

## Changements

- Carte Leaflet : chargement des points après initialisation, annulation des requêtes périmées, observation des changements de dimensions ; confinement des couches dans le contexte visuel de chaque carte.
- Points d’eau : suppression du filtre temporel dans le rapport et les actions du module ; conservation des fiches sans code et de l’infrastructure même si une mesure de pH est invalide. Les alertes restent dans les exports sources.
- CSV : colonnes issues de toutes les lignes, en-têtes échappés.
- CSV/XLSX des modules : source normalisée commune pour les points d’eau et filtre multicommunal ; accès Observateur et Collecteur, champs personnels retirés. Rapports décisionnels et administration conservent leurs restrictions.
- Ancien endpoint d’export points d’eau : authentification et rôle désormais requis.
- Interface : actualisation du rôle lors des événements de session.
- Contrôle projet : vérification des fichiers Render au lieu de fichiers Vercel absents.
- Correctifs existants des scripts prebuild matérialisés dans les sources : découpage des cartes PDF, cadrage des points d’eau, mise en page Word, indicateurs hydro et règles qualité.

## Vérifications réalisées

- npm run build : réussi après les modifications fonctionnelles.
- npm run verify:project : réussi.
- node scripts/test-export-regressions.cjs : réussi avec données et authentification simulées ; génération CSV/XLSX/DOCX/PDF, refus anonyme, inventaire indépendant des dates, conservation des fiches sans code et sélection de la dernière fiche.
- git diff --check : réussi.
- GET public https://suivi-ressource-en-eau.onrender.com/api/version : HTTP 200, version annoncée 5.2.2. Cet endpoint contient une date de construction fixe : il ne prouve pas le commit déployé.

## Validation restante et autorisation demandée

Confirmer l’espace Render « My Workspace » (tea-d9cec5eq1p3s73dccou0), puis vérifier le service, sa branche, son commit et son déploiement automatique. Publier les corrections sur une branche GitHub et ouvrir une PR, puis fusionner et déployer uniquement après autorisation explicite. Aucun changement de configuration ou de données Supabase prévu. Ne pas modifier Vercel.

La recette sur les données et comptes réels, les fonds OSM/Esri, les superpositions dans un navigateur et le contrôle du commit effectivement déployé restent à effectuer. Les tests locaux ont utilisé Node 24/npm 11 ; le projet déclare Node 22/npm 10. Les tests simulés ne valident pas les droits réels ni les politiques de la base.
