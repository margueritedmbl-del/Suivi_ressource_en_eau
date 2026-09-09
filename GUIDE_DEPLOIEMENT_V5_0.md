# PSORE V5.0.0 — Déploiement

## 1. Contenu majeur
- rapports techniques institutionnels : PDF A4 paysage, contrôles qualité, graphiques, carte OSM, tableau détaillé ;
- rapports publics non sensibles séparés des rapports internes ;
- référentiel physique strict : 10 pluviomètres, 20 piézomètres, 10 stations limnimétriques ;
- harmonisation PZ-01…PZ-20 ↔ codes métier Epicollect5 ;
- cartographie : total réseau vs objets cartographiables ;
- SIG décisionnel dynamique par sous-bassin, carte cliquable, fiche SB et scénarios ;
- scénario combiné optimal avec pondérations réglables par Super administrateur ;
- matrice de droits centralisée.

## 2. Déploiement Render
1. Copier le contenu décompressé à la racine du dépôt GitHub.
2. Commit/push.
3. Render > Manual Deploy > Clear build cache & deploy > Deploy latest commit.
4. Vérifier `/api/version` : `5.0.0`.

## 3. Migration Supabase
Après que Render est au vert, exécuter :
1. `database/28_MASTER_PSORE_V5_0.sql`
2. `database/29_VERIFY_PSORE_V5_0.sql`

Résultats réseau attendus :
- pluviometrie = 10
- piezometrie = 20
- limnimetrie = 10

La migration conserve toutes les données brutes/test. Le seuil `operational_data_start_date` continue de contrôler les données utilisées dans les analyses officielles.

## 4. Contrôles fonctionnels
- Cartographie : les boutons doivent afficher le réseau physique officiel et le nombre cartographiable séparément.
- Piézométrie : afficher le code court et le code Epicollect harmonisé.
- Observatoire : réseau physique et nombre de mesures séparés.
- Rapports internes : DNH/DRHK, Administrateur PTCS, Super administrateur.
- Rapports publics : `/rapports-publics`, données non sensibles uniquement.
- SIG décisionnel : cliquer sur un SB, vérifier le zoom/la fiche, générer une fiche PDF.
- Super administrateur : modifier les pondérations et enregistrer.
