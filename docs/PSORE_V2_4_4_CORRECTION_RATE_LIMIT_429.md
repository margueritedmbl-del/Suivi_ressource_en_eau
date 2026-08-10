# PSORE V2.4.4 — Correction Epicollect5 HTTP 429

## Problème corrigé

Epicollect5 pouvait répondre `429 Too Many Requests` (`ec5_255`) lorsque plusieurs synchronisations étaient lancées rapidement ou lorsque les pages étaient récupérées sans temporisation.

## Protections ajoutées

- délai minimum de 1,5 seconde entre les requêtes Epicollect5 ;
- respect de l'en-tête HTTP `Retry-After` lorsqu'il est fourni ;
- nouvelles tentatives avec attente exponentielle et aléatoire ;
- maximum de quatre nouvelles tentatives par page ;
- pause de trois secondes entre les sources d'un même module ;
- pause de cinq secondes entre les sources lors de « Synchroniser Tout » ;
- verrou local empêchant deux synchronisations simultanées sur la même instance Vercel ;
- message clair lorsqu'Epicollect5 maintient temporairement la limitation.

## Après déploiement

Attendre au moins 5 à 10 minutes après les derniers essais ayant retourné 429, puis lancer un seul module, de préférence `Points d'eau`. Ne pas cliquer plusieurs fois sur le bouton.

Aucune migration Supabase n'est nécessaire.
