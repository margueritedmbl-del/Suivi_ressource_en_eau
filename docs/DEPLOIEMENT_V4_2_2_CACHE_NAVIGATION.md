# PSORE V4.2.2 — correction cache/navigation et démarrage

## Symptômes corrigés
- écran « Application error: a client-side exception has occurred » au premier chargement ;
- menu ancien qui réapparaît puis change après plusieurs clics ;
- lien « Ouvrages intégrés » absent au démarrage puis visible plus tard ;
- mélange de bundles Next.js de versions différentes dans le navigateur.

## Cause principale diagnostiquée
Les captures montrent un menu contenant « SIG décisionnel », alors que la V4.2.1 distribuée ne contient pas ce lien. Le navigateur sert donc au moins une ancienne version de l'interface. La V4.2.2 neutralise les anciens caches/service workers et centralise le menu.

## Après déploiement
1. Render : Clear build cache & deploy.
2. Ouvrir /api/version et vérifier version 4.2.2.
3. Une seule fois dans Chrome : Ctrl+Shift+R. Si l'ancien menu reste visible, supprimer les données du site onrender.com puis rouvrir.
4. Le bas de la barre latérale doit afficher PSORE V4.2.2.
