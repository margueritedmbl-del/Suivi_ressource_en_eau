# Actualisation préparée le 3 novembre 2026

Aucune publication effectuée. Source de restauration : ZIP SHP de restauration oct 2026 PTCS, version du 29 octobre 2026.

## Restauration

Remplacement des fichiers restaurations.geojson, restaurations_data.json et restaurations_resume.json depuis la couche polygonale. 634 lignes source, 633 parcelles après suppression de la seconde occurrence strictement identique de l’ID 375. Géométries valides et non vides en EPSG:4326. Surface déclarée cumulée après dédoublonnage : 8108,79 ha (champ Surf_ha). Cette somme n’est pas une union spatiale des polygones.

Les points correspondant aux polygones ne sont pas additionnés. La synthèse villageoise et les 68 observations de fumure organique ne contribuent pas à ce total. Leur intégration distincte reste à décider après vérification du recouvrement. La synthèse villageoise contient un point 0,0.

Accents décodés en UTF-8; dates normalisées en ISO 8601; identifiants source conservés; attributs personnels exclus des fichiers publics. Une parcelle reste attribuée à Koulikoro/Katibougou conformément à la source (ID 637). Le script de préparation refuse les IDs conflictuels et les géométries invalides.

## Infrastructures complémentaires

Rapport final AGR CEST du 14 août 2026, pages PDF 9–10 et 30–33 (pagination imprimée 8–9 et 29–32). 12 sites : 9 périmètres maraîchers, 1 site piscicole, 1 unité d’aliment bétail et 1 boutique d’intrants. Codes AGR internes générés, source et pagination indiquées par ligne. Les 16 forages du référentiel existant restent inchangés. Les sites et les forages ne sont pas additionnés en un indicateur unique.

Coordonnées non validées : champs latitude et longitude nuls, aucun marqueur artificiel sur la carte. Certaines annexes scannées comportent des coordonnées; leur lecture, leur référentiel et le rattachement exact à chaque infrastructure restent à valider. Pas de montants financiers dans le complément public.

## Contrôles

Contrôle de cohérence des 633 IDs, surfaces et résumés; contrôle de conservation des 16 forages; typecheck; compilation Next.js; tests de régression des exports avec données et accès simulés. Validation en session authentifiée et géolocalisation AGR restent à effectuer.

## Contrôle du classeur PTCS

Base de données du PTCS (1).xlsx : 44 positions d’activités AGR rapprochées des 12 sites, dont 25 avec X/Y inversés. Ces positions ne sont pas assimilées aux coordonnées des ouvrages. Boutique de Kossaba : position de suivi de chantier retenue depuis la feuille « Suivi réalisat- Infrastructures », ligne 53, longitude Q53 = -7,5963933, latitude P53 = 13,14391. Les 11 autres sites restent sans position d’ouvrage validée. La carte AGR inclut seulement ce point; aucun ajout de parcelles de restauration depuis ce classeur.

## Fichier GPS final des 20 AGRs

Le fichier « les coordonnées GPS des 20 AGRs VF.xlsx », feuille champs_ajouts, lignes 2 à 21, fournit 20 positions distinctes. Les colonnes K et L correspondent respectivement à la longitude et à la latitude en degrés. Les 12 compléments ont désormais une position. Les 8 autres sites sont associés aux 16 forages existants, conservés à l’identique, et ne créent pas de doublons sur la carte. Les positions provisoires issues du classeur général PTCS sont remplacées pour les sites AGR.

Normalisation documentée : CCR devient CRR pour les quatre sites concernés; les libellés source sont conservés. Fèya, Dogoni (Méguétan) et Tanabougou portent Réceptionné = Non dans le fichier, sans assimiler l’exécution à 100 % à une réception. Capacités et nombres de forages présents aussi sur les sites commerciaux : valeurs conservées dans un objet à confirmer, exclues des indicateurs hydrauliques.

## Instruction complémentaire

À la demande de l’utilisateur, les mentions de réception du fichier GPS sont ignorées : aucun champ de réception dans les nouvelles fiches publiques, les tableaux, les infobulles ou le CSV AGR. Aucun statut « réceptionné » n’est déduit. Le classeur source reste inchangé.
