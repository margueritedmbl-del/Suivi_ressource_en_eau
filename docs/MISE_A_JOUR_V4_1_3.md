# PSORE V4.1.3 — correctif référentiel complet

Le build V4.1.2 échouait car la route `app/api/ouvrages/reference/route.ts` importait quatre JSON qui n'avaient pas été inclus dans le correctif incrémental.

Cette mise à jour ajoute les quatre fichiers requis dans `public/data/referentiels/` et utilise des imports relatifs explicites.

## Vérification GitHub

Les fichiers suivants doivent exister :

- `public/data/referentiels/referentiel_resume.json`
- `public/data/referentiels/forages_exploitation_crr_pm.json`
- `public/data/referentiels/piezometres_reference.json`
- `public/data/referentiels/analyses_eau_piezometres_manifest.json`

## Contrôle après déploiement

Ouvrir `/api/ouvrages/reference`. La réponse doit contenir `"ok": true`.
