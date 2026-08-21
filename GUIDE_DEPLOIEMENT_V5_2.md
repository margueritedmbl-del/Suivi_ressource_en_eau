# Déploiement PSORE V5.2.0

1. Mettre à jour le dépôt GitHub avec le contenu de l’archive V5.2.0.
2. Dans Render : **Manual Deploy → Clear build cache & deploy → Deploy latest commit**.
3. Vérifier `/api/version` : version attendue `5.2.0`.
4. Dans Supabase SQL Editor, exécuter dans l’ordre :
   - `database/32_MASTER_PSORE_V5_2.sql`
   - `database/33_VERIFY_PSORE_V5_2.sql`
5. Dans PSORE, Administration → Synchronisation : lancer une synchronisation complète des modules hydrologiques. Le changement d’engine vers V5.2 force automatiquement une première synchronisation complète.
6. Contrôler le diagnostic de synchronisation : tous les enfants doivent être liés à leur parent ; `parents_non_resolus` doit tendre vers 0.
7. Contrôler les KPI opérationnels après seuil du 16/08/2026 et les compteurs historiques séparés.

Ne pas supprimer les données de test : elles restent disponibles dans l’historique mais sont exclues des KPI opérationnels par le seuil.
