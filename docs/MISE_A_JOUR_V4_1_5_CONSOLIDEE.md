# PSORE V4.1.5 — version consolidée

Cette version fusionne les corrections V4.1.1 à V4.1.4 et supprime la dépendance de la page **Ouvrages intégrés** à la route `/api/ouvrages/reference`.

Les référentiels légers sont importés directement lors du build Next.js :

- forages CRR/PM ;
- piézomètres ;
- manifeste des analyses d’eau ;
- résumé des indicateurs.

La page et la carte ne dépendent donc plus d’un appel réseau local susceptible d’échouer sur Render. Les fichiers JSON ont été validés en JSON strict et les valeurs non numériques inconnues sont représentées par `null`.

Aucune migration Supabase supplémentaire n’est requise si les scripts V4.1.1 ont déjà été exécutés.
