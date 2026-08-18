# PSORE V5.2.0 — tests de stabilisation parent/enfant

## Base de vérification
Les contrôles de la V5.2 ont été effectués à partir des trois exports CSV Epicollect5 fournis le 18/08/2026. Les données nominatives ne sont pas intégrées au paquet applicatif.

| Module | Fiches parents | Mesures enfants | Codes parents distincts | Enfants reliés par `ec5_parent_uuid` |
|---|---:|---:|---:|---:|
| Pluviométrie | 70 | 117 | 10 | 117/117 |
| Piézométrie | 104 | 163 | 19 codes actuellement saisis | 163/163 |
| Limnimétrie | 104 | 135 | 10 | 135/135 |

À la date de contrôle (18/08/2026) et avec le seuil opérationnel validé au 16/08/2026 :
- pluviométrie : 1 mesure opérationnelle non future ; 1 date future à vérifier (19/08/2026) ;
- piézométrie : 41 mesures opérationnelles non futures ; 1 date future à vérifier (22/09/2026) ;
- limnimétrie : 17 lectures opérationnelles non futures.

## Corrections vérifiées
- PZ-02 : code canonique `PZ-DMB-DBN-001` = Dombana ; ancien `PZ-DMB-SIN-001` traité comme alias historique.
- `CE-KLK-006_R-TNKA-PNT` : localité Tonga, commune Méguétan.
- Rapprochement prioritaire : mesure enfant → `ec5_parent_uuid` → `source_entry_id` parent → code métier canonique.
- Les données avant le 16/08/2026 restent dans l’historique, mais ne pilotent pas les KPI opérationnels.
- Les dates futures restent stockées et sont exclues provisoirement des calculs.
- Points d’eau : un pH hors domaine physique 0–14 est classé « À vérifier », sans supprimer l’ouvrage.

## Contrôles statiques
- `node scripts/verify-v5-2.mjs` : OK.
- transpilation syntaxique des fichiers TS/TSX modifiés via TypeScript : 0 diagnostic de syntaxe.
- contrôle des trois CSV : tous les enfants disposent d’un parent présent dans leur export.

## Limite du test local
Le build Next.js complet exige les dépendances npm. Dans l’environnement de préparation, elles ne sont pas installées dans `node_modules`; Render reste le contrôle final de compilation et d’intégration Supabase.
