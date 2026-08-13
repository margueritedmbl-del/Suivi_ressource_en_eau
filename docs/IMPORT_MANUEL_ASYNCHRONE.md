# Import manuel asynchrone — PSORE V2.4.7

## Objectif
Éviter les erreurs Vercel `FUNCTION_INVOCATION_TIMEOUT` lors de l'import de fichiers comportant plusieurs centaines de lignes.

## Architecture
1. Le fichier CSV/XLSX est validé puis placé temporairement dans le bucket privé `manual-imports`.
2. Une ligne est créée dans `import_jobs`.
3. Le navigateur appelle l'API de traitement par lots de 20 lignes.
4. Chaque appel met à jour la progression.
5. À la fin, le fichier temporaire est supprimé et le journal de synchronisation est alimenté.

## Reprise
Si l'utilisateur ferme la page, la tâche reste enregistrée. Le bouton **Reprendre** continue à partir de `processed_rows`.

## Installation Supabase
Exécuter une seule fois :

```sql
database/09_import_manuel_asynchrone.sql
```

## Routes
- `GET/POST /api/admin/import-jobs`
- `GET /api/admin/import-jobs/:id`
- `POST /api/admin/import-jobs/:id/process`

## Limites
- 4 Mo par fichier.
- Le navigateur doit rester ouvert pendant le traitement automatique ; sinon utiliser **Reprendre**.
- Les opérations serveur utilisent la clé `service_role`, jamais exposée au navigateur.
