# Configuration Supabase — PSORE V2.4

Dans Supabase → SQL Editor, exécuter :
```txt
database/00_migration_complete_v2_4.sql
```
Puis :
```txt
database/99_verification.sql
```

Rôles attendus : Super administrateur, Administrateur PTCS, DNH/DRHK, Collecteur, Observateur, Public.

La clé `service_role` reste strictement côté serveur et ne doit jamais être exposée publiquement.
