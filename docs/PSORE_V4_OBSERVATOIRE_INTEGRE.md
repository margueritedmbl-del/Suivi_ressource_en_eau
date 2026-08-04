# PSORE V4.0 — Observatoire intégré des ouvrages

## Référentiels intégrés

- 8 forages CRR ;
- 8 forages PM ;
- 20 forages piézométriques ;
- 20 essais de pompage ;
- disponibilité confirmée des 20 certificats d’analyse d’eau.

## Nomenclature harmonisée

- Wolokorodjie → Wolokorodji ;
- Nioboubou → Niobougou ;
- Sirakorola → Sirakorola Ouest ;
- Niamakorobougou → Gnamakorobougou ;
- Diladié → Diladjè ;
- Nadiobougou : second forage retenu F2.

## Référentiel géographique

WGS 84 / UTM zone 29 Nord — EPSG:32629. Les fichiers publics contiennent également les coordonnées converties en longitude/latitude WGS 84.

## Déploiement Supabase

Exécuter après la migration principale :

```text
database/10_observatoire_integre_ouvrages.sql
```

Le script crée les tables des forages d’exploitation, relevés de compteurs, essais de pompage et analyses d’eau. Il charge les référentiels et les 20 essais initiaux.

## Important

Les certificats d’analyse sont tous recensés. Les valeurs physico-chimiques et bactériologiques doivent être saisies et validées dans les colonnes prévues avant toute exploitation statistique. Aucun résultat analytique n’a été inventé.
