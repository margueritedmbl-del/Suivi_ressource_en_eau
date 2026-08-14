# Déploiement PSORE V4.2.1

Cette archive est aplatie : `package.json`, `app`, `components` et `public` sont directement à la racine.

Après déploiement, la page `/ouvrages` doit afficher « Version 4.2.1 » et un badge « Référentiels intégrés au build ». Si ces marqueurs sont absents, Render compile encore un ancien commit ou un mauvais Root Directory.

Dans Render, Root Directory doit être vide lorsque les fichiers sont à la racine du dépôt. Lancer ensuite **Clear build cache & deploy** sur le dernier commit.
