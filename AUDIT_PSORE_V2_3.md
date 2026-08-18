# Audit PSORE V2_3

## Résultat de build
Commande exécutée :

```bash
npm run build
```

Résultat : compilation Next.js réussie, contrôle TypeScript réussi, génération des pages réussie.

## Points livrés
- Dashboard Points d’eau enrichi.
- Cartographie thématique Points d’eau.
- Export CSV et Excel.
- Vues SQL pour points d’eau, pluviométrie, piézométrie et limnimétrie.
- CSV de secours intégré, sans nom ni téléphone des répondants.
- Préparation Vercel conservée.

## Points d’attention
- Le fichier CSV public est volontairement anonymisé.
- Les données personnelles peuvent rester dans Supabase mais doivent être contrôlées par RLS et vues dédiées administrateur.
- Les données des modules pluviométrie, piézométrie et limnimétrie dépendent de la synchronisation Supabase/Epicollect.
- Après exécution SQL, vérifier que les noms de colonnes de Supabase correspondent bien au schéma V2_3.
