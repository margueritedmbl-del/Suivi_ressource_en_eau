# PSORE V2.7 — correction des dates d'import

Cette version normalise automatiquement les dates provenant des exports CSV/XLSX Epicollect5 avant insertion dans Supabase.

Formats pris en charge :

- `22/07/2025`
- `22-07-2025`
- `22.07.2025`
- `2025/07/22`
- `2025-07-22`
- `22/07/2025 08:30`
- dates Excel numériques ou objets Date

Les champs concernés sont notamment `date_collecte`, `date_mesure`, `date_observation`, `date_realisation_puits` et `date_realisation_forage`.

Les dates valides sont converties au format PostgreSQL `AAAA-MM-JJ`. Une date réellement invalide est remplacée par `null` et signalée dans les avertissements de la tâche d'import, sans bloquer les autres lignes.

## Mise à jour Render

1. Remplacer le contenu du dépôt GitHub par cette version.
2. Commit et push.
3. Dans Render, attendre l'Auto-Deploy ou utiliser **Manual Deploy → Clear build cache & deploy**.
4. Réimporter le même fichier de 540 points d'eau. L'upsert mettra à jour les lignes déjà présentes et ajoutera les lignes auparavant rejetées.

Aucune migration Supabase supplémentaire n'est nécessaire.
