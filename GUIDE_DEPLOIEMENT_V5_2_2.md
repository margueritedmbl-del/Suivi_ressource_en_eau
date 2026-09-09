# PSORE V5.2.2 - Déploiement

Cette version corrige le mapping des mesures physico-chimiques des points d'eau, sépare les anomalies de données des alertes de qualité d'eau, fiabilise les KPI institutionnels et recentre les extraits cartographiques des rapports.

1. Sauvegarder Supabase.
2. Exécuter `database/36_MASTER_PSORE_V5_2_2.sql`.
3. Déployer le contenu complet du ZIP sur GitHub/Render.
4. Vérifier que le build Render est vert.
5. Dans Administration > Synchronisation, lancer **Synchroniser Points d'eau**. Si nécessaire, utiliser **Réparer et resynchroniser tout** pour réconcilier aussi l'historique hydrologique.
6. Exécuter `database/37_VERIFY_PSORE_V5_2_2.sql`.
7. Contrôler le Dashboard et générer un PDF pluvio, piézo, limni et points d'eau.

Important : aucune valeur historique n'est inventée. Le `raw_payload` reste la trace source. Les mesures physico-chimiques utilisent maintenant des clés Epicollect exactes et une conversion numérique stricte. Un pH hors 0-14 est une **donnée à vérifier**, pas une alerte de qualité d'eau.
