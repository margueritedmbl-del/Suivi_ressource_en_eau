# PSORE V2.4.3 — Synchronisation Epicollect5 adaptative

## Correctif

Le moteur ne dépend plus d'une taille de page fixe.

Il commence avec `per_page=20` et, si Epicollect5 retourne l'erreur `ec5_335` (« Max allowed entries limit exceeded »), il réduit automatiquement la taille de page jusqu'à une valeur acceptée :

- 20
- 10
- 5

Le moteur force aussi la valeur acceptée dans tous les liens `next` retournés par Epicollect5 afin qu'une page suivante ne réintroduise pas une valeur trop élevée.

## Pagination

La synchronisation parcourt jusqu'à 2 000 pages, ce qui permet de récupérer l'intégralité des 540 points d'eau et les futures observations sans demander une page trop volumineuse.

## Vérification après déploiement

Lancer :

```text
/api/sync/all?secret=VOTRE_CRON_SECRET
```

Dans l'historique, chaque synchronisation réussie indique désormais :

- le nombre de pages ;
- le nombre d'enregistrements récupérés ;
- le nombre d'enregistrements synchronisés ;
- la valeur `per_page` finalement acceptée.

## Déploiement

1. Remplacer le code GitHub par cette version.
2. Faire un commit et pousser sur GitHub.
3. Dans Vercel, redéployer avec nettoyage du cache.
4. Relancer la synchronisation.

Aucune migration Supabase supplémentaire n'est requise.
