# Déploiement PSORE V2_3

## 1. Mettre à jour le code
Uploader le contenu de `PSORE_V2_3_Consolidee.zip` dans GitHub, puis pousser un commit.

## 2. Appliquer la base de données
Dans Supabase > SQL Editor :

1. Exécuter `database/schema.sql`.
2. Exécuter `database/views.sql`.
3. Exécuter `database/rls.sql` si les politiques doivent être réinitialisées.

## 3. Vérifier Vercel
Variables nécessaires :

```env
NEXT_PUBLIC_SUPABASE_URL=https://yoamoxmktztikxtgvjpq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 4. Tester après déploiement
Pages à vérifier :

- `/dashboard`
- `/points-eau`
- `/cartographie`
- `/pluviometrie`
- `/piezometrie`
- `/limnimetrie`

Exports :

- `/api/export/csv?module=points_eau`
- `/api/export/xlsx?module=points_eau`

## 5. Priorités après mise en ligne
- Importer ou synchroniser les données Points d’eau dans Supabase.
- Contrôler les 56 points sans GPS.
- Corriger l’anomalie de température à 312 °C.
- Vérifier les politiques d’accès administrateur pour les champs personnels.
