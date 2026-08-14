# PSORE V4.1.4 — Correction JSON strict

Le build Render échouait sur `forages_exploitation_crr_pm.json` avec :

`Cannot parse JSON: Unexpected token 'N' ... "puissance_pompe_kw": NaN`

`NaN` n'est pas une valeur JSON valide. Les huit valeurs inconnues ont été remplacées par `null`.
Cette correction conserve explicitement l'absence d'information sans inventer de puissance de pompe.
