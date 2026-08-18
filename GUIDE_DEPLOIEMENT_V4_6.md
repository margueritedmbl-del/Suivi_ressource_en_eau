# PSORE V4.6.0 — Déploiement de stabilisation

## 1. GitHub / Render
Remplacer le contenu du dépôt par cette version, commit/push, puis Render > Manual Deploy > Clear build cache & deploy.

## 2. Supabase — migration unique
Exécuter **une seule fois** `database/21_MASTER_REPAIR_V4_6.sql` dans SQL Editor.
Ce script est réexécutable et ajoute les colonnes manquantes, configure les URLs de branches Epicollect5, crée les vues V4.6, restaure le bucket documentaire et force le rechargement du cache PostgREST.

## 3. Vérifier la version
Ouvrir `/api/version` : attendu `4.6.0`.

## 4. Première synchronisation V4.6
Dans Administration > Synchronisation, lancer dans cet ordre :
1. Points d'eau
2. Pluviométrie
3. Piézométrie
4. Limnimétrie

Le moteur V4.6 forcera une passe complète car sa révision diffère de l'ancien moteur. La passe complète réconcilie les anciennes lignes fantômes et conserve ensuite le mode incrémental.

## 5. Vérification SQL
Exécuter `database/22_VERIFICATION_V4_6.sql`.
Contrôler notamment :
- points_eau : total et source_entry_id uniques ;
- vues pluvio/piezo/limni : observations exploitables > 0 si des relevés existent dans Epicollect5 ;
- URLs des mesures contenant `branch_ref=` ;
- rejets de synchronisation ;
- derniers logs.

## 6. Documents techniques
Administration > Documents techniques accepte désormais :
- `PZ-01.pdf` ... `PZ-20.pdf` ;
- ou un nom contenant la localité, par ex. `Fani analyse.pdf`, `Gouni.pdf`.
Le bucket `psore-documents` est privé et créé/vérifié par la migration.

## 7. Cartographie
Couches disponibles : Bassins, Sous-bassins, Communes du projet, Restaurations, Drainage, Points d'eau, Piézomètres, Pluviomètres, Limnimètres.
Bassins : activés par défaut. Sous-bassins : activables ou au clic sur un bassin.
