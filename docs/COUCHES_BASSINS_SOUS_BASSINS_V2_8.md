# PSORE V2.8 — couches bassins, sous-bassins et limites administratives

## Fonctionnalités intégrées

- Bassins activés par défaut.
- Sous-bassins désactivés par défaut.
- Limites administratives désactivées par défaut.
- Affichage public et privé, avec détails réduits sur la carte publique.
- Palette de style par couche : contour, remplissage, épaisseur, opacité et type de trait.
- Sauvegarde locale des styles dans le navigateur.
- Étiquettes des bassins à partir du niveau de zoom 7.
- Sous-bassins identifiés au clic.
- Pop-up contenant les attributs disponibles et les statistiques PSORE calculées spatialement.
- Filtre spatial automatique des points PSORE au clic sur « Filtrer les données sur cette zone ».
- Diffusion du filtre via l'évènement navigateur `psore:spatial-filter` et `localStorage` (`psore-spatial-filter`) pour raccordement aux tableaux, exports et tableaux de bord.
- Données GeoJSON servies localement dans `public/data`, donc disponibles avec l'application sans dépendance à un serveur SIG externe.

## Fichiers cartographiques

- `public/data/hydrographie/grand_bassin.geojson`
- `public/data/hydrographie/sous_bassins.geojson`
- `public/data/admin-boundaries.geojson`

## Déploiement Render

Aucune migration Supabase n'est requise pour cette version. Déployer le dépôt mis à jour, puis utiliser **Manual Deploy → Clear build cache & deploy** si l'auto-déploiement ne démarre pas.
