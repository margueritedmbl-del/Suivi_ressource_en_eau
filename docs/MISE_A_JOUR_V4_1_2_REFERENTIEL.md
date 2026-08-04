# Mise à jour PSORE V4.1.2 — référentiel ouvrages

## Correction

La route `/api/ouvrages/reference` n'utilise plus `process.cwd()` ni la lecture du système de fichiers au moment de l'exécution. Les quatre référentiels JSON sont importés au moment du build Next.js et intégrés au bundle serveur.

## Installation incrémentale

Copier les fichiers du présent correctif à la racine du dépôt en conservant l'arborescence, puis remplacer les fichiers existants.

```bash
git add app/api/ouvrages/reference/route.ts package.json docs/MISE_A_JOUR_V4_1_2_REFERENTIEL.md
git commit -m "PSORE V4.1.2 - correction chargement référentiel ouvrages"
git push
```

Sur Render : **Manual Deploy → Clear build cache & deploy**.

## Contrôle

Ouvrir :

`https://VOTRE-SITE.onrender.com/api/ouvrages/reference`

La réponse doit contenir `"ok": true`.
