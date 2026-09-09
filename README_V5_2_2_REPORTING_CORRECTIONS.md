# PSORE V5.2.2 — Correctifs reporting collectivités

## Correctifs
- Cartographie des briefs collectivités : tous les points géolocalisés sont conservés ; dédoublonnage par code ; léger décalage graphique uniquement en cas de coordonnées identiques pour éviter qu’un point masque un autre.
- Centrage/emprise : marge dynamique augmentée et zone cartographique strictement réservée ; légendes et étiquettes restent dans la carte.
- Étiquettes hydrographiques : affichées uniquement lorsque leur nombre permet une lecture correcte ; suppression des étiquettes individuelles pour les 540 points d’eau afin de privilégier la lisibilité des points.
- Points d’eau : le brief collectivités dispose maintenant d’une vraie synthèse (total, fonctionnels, non fonctionnels, interventions signalées, répartition par commune) au lieu d’un graphique de répartition sans variable numérique.
- Filtre Commune : le module Rapports reprend la logique du Dashboard Points d’eau. La commune sélectionnée est transmise au générateur PDF/XLSX/CSV et le brief est calculé uniquement sur le périmètre choisi.
- Option « Toutes les communes » disponible par défaut.

## Vérification
Le dépôt ne contient pas les dépendances `node_modules` nécessaires à un build local complet. Le contrôle TypeScript a donc été tenté mais reste bloqué par l’absence des dépendances, indépendamment de ces modifications. Le build Render devra être utilisé comme validation finale.
