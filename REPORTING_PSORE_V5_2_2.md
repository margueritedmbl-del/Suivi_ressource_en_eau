# PSORE V5.2.2 — Charte de reporting consolidée

## Deux sorties PDF

- **Brief collectivités** : `brief=1`, une page A4 paysage, 5 KPI, graphique principal, carte OSM centrée, messages clés et qualité des données.
- **Rapport technique** : 3 pages A4 paysage : synthèse, analyse spatiale/temporelle, synthèse par station. Les observations brutes restent dans XLSX/CSV.

## Pluviométrie

Le graphique principal est le **cumul par station**. Les cumuls de stations différentes ne sont jamais additionnés comme un cumul territorial. La synthèse communale utilise le **cumul médian des stations**.

Le « jour de pluie » est centralisé dans `system_settings` :
- `rainy_day_threshold_mm`
- `rainy_day_definition`
- `rainy_day_reference_source`
- `rainy_day_reference_url`

La migration V5.2.2 initialise le seuil à **0,1 mm**, sur la base du tableau stationnel du bulletin officiel MALI-METEO GTPA de la 1re décade d’août 2025, où les jours comportant 0,1 mm sont comptés dans le nombre de jours de pluie. Cette valeur reste paramétrable pour permettre une mise à jour si MALI-METEO publie une définition normative plus explicite.

## Qualité

Seules les observations classées `Validé` entrent dans les KPI officiels et les graphiques de synthèse. Les valeurs atypiques, lignes incomplètes et doublons potentiels restent conservés et sont signalés dans le bloc de contrôle qualité.

## Cartographie des rapports

- fond OpenStreetMap ;
- emprise calculée sur les stations affichées ;
- marge de 12 % ;
- correction du rapport largeur/hauteur ;
- étiquettes des stations hydrologiques ;
- symboles proportionnels au cumul pour la pluviométrie ;
- stations sans données en gris ;
- données à vérifier en rouge.

## Exports

- PDF : brief ou rapport technique ;
- DOCX : synthèse et tableau par station ;
- XLSX : synthèse, synthèse par station, synthèse par commune, analyse, données détaillées ;
- CSV : données détaillées.
