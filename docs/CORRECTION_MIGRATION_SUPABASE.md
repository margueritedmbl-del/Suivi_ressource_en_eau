# Correction migration Supabase — PSORE V2.4

Cette livraison remplace la migration SQL précédente qui échouait avec l'erreur :

```text
ERROR: column reference "id" is ambiguous
```

La nouvelle migration :

- crée les tables avant les vues ;
- qualifie les colonnes ambiguës (`pe.id`, `o.id`, etc.) ;
- ajoute toutes les colonnes attendues par les vues Points d'eau ;
- crée les sources Epicollect5 validées ;
- crée les vues dashboard et cartographie ;
- fournit un script de vérification.

## Ordre d'exécution dans Supabase

1. `database/00_migration_complete_v2_4.sql`
2. `database/99_verification.sql`

Sur un nouveau projet Supabase vide, le premier script doit se terminer par :

```text
PSORE V2.4 database migration completed successfully
```

Ensuite, configurer les variables Vercel et lancer `/api/admin/bootstrap`.
