-- PSORE V5.2.2 - Correctif final dashboard Points d'eau
-- Non destructif : aucune donnée source n'est modifiée ou supprimée.
-- Objectifs :
--   1) normaliser les champs texte avec TRIM/lower ;
--   2) reconnaître correctement les 141 organe_gestion = Non ;
--   3) éviter le cumul organe absent + organe non fonctionnel ;
--   4) conserver la logique qualité validée (101 alertes, 98 pH, 0 température) ;
--   5) exclure les températures physiquement non exploitables du score/alerte.

BEGIN;

CREATE OR REPLACE VIEW public.v_points_eau_dashboard AS
SELECT
    pe.id,
    pe.source_entry_id,
    pe.synced_at,
    COALESCE(NULLIF(trim(pe.code_pe), ''), pe.titre_source, pe.source_entry_id) AS code_pe,
    pe.created_at_source,
    pe.uploaded_at_source,
    pe.titre_source,
    pe.enqueteur_initial,
    pe.date_collecte,
    pe.heure_collecte,
    COALESCE(pe.commune, c.nom) AS commune,
    pe.village,
    pe.localite,
    pe.latitude,
    pe.longitude,
    pe.precision_gps,
    pe.utm_northing,
    pe.utm_easting,
    pe.utm_zone,
    pe.photo_infrastructure,
    pe.photo_emprise,
    COALESCE(pe.type_infrastructure, pe.type_ouvrage) AS type_infrastructure,
    pe.type_puits,
    pe.equipement_puits,
    pe.date_realisation_puits,
    pe.hauteur_margelle,
    pe.diametre_cm,
    pe.commentaire_puits,
    pe.type_forage,
    COALESCE(NULLIF(trim(pe.fonctionnalite_forage), ''), pe.etat, 'Non renseigné') AS fonctionnalite_forage,
    CASE
        WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%non fonctionnel%' THEN 'Non fonctionnel'
        WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%abandon%' THEN 'Abandonné'
        WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%partiel%' THEN 'Fonctionnalité partielle'
        WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%fonctionnel%' THEN 'Fonctionnel'
        ELSE 'Non renseigné'
    END AS statut_fonctionnalite,
    COALESCE(pe.equipement_forage, pe.equipement_puits, 'Non renseigné') AS equipement,
    pe.equipement_forage,
    pe.date_realisation_forage,
    pe.nombre_total_bornes,
    pe.nombre_bornes_fonctionnelles,
    COALESCE(NULLIF(trim(pe.organe_gestion), ''), 'Non renseigné') AS organe_gestion,
    pe.type_organe,
    COALESCE(NULLIF(trim(pe.fonctionnalite_organe), ''), 'Non renseigné') AS fonctionnalite_organe,
    pe.commentaire_gestion,
    pe.date_mesure,
    pe.niveau_eau,
    COALESCE(pe.profondeur_ouvrage, pe.profondeur) AS profondeur_ouvrage,
    pe.commentaire_mesure,
    pe.temperature_c,
    pe.ph,
    pe.conductivite,
    pe.turbidite_ntu,
    pe.tds,
    COALESCE(NULLIF(trim(pe.presence_odeur), ''), 'Non renseigné') AS presence_odeur,
    pe.commentaire_qualite,
    pe.etat_apparent,
    pe.problemes,
    pe.besoin_rehabilitation,
    pe.recommandation,
    (
        CASE
            WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%non fonctionnel%'
              OR lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%abandon%'
            THEN 5 ELSE 0
        END
        + CASE
            WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%partiel%'
            THEN 3 ELSE 0
          END
        + CASE
            WHEN lower(trim(COALESCE(pe.fonctionnalite_organe, ''))) LIKE '%non fonctionnel%'
            THEN 3
            WHEN lower(trim(COALESCE(pe.organe_gestion, ''))) = 'non'
            THEN 2
            ELSE 0
          END
        + CASE
            WHEN pe.besoin_rehabilitation IS NOT NULL AND trim(pe.besoin_rehabilitation) <> ''
            THEN 3 ELSE 0
          END
        + CASE
            WHEN pe.problemes IS NOT NULL
             AND lower(trim(pe.problemes)) NOT IN ('', 'ras', 'aucun', 'néant', 'neant')
            THEN 2 ELSE 0
          END
        + CASE
            WHEN q.ph_physiquement_exploitable IS NOT NULL AND q.alerte_ph_qualite = true
            THEN 2 ELSE 0
          END
        + CASE
            WHEN q.temperature_physiquement_exploitable IS NOT NULL AND q.temperature_physiquement_exploitable > 50
            THEN 2 ELSE 0
          END
        + CASE
            WHEN pe.latitude IS NULL OR pe.longitude IS NULL
            THEN 1 ELSE 0
          END
    )::integer AS score_priorite,
    CASE
        WHEN (
            CASE WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%non fonctionnel%'
                   OR lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%abandon%' THEN 5 ELSE 0 END
            + CASE WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%partiel%' THEN 3 ELSE 0 END
            + CASE WHEN lower(trim(COALESCE(pe.fonctionnalite_organe, ''))) LIKE '%non fonctionnel%' THEN 3
                   WHEN lower(trim(COALESCE(pe.organe_gestion, ''))) = 'non' THEN 2 ELSE 0 END
            + CASE WHEN pe.besoin_rehabilitation IS NOT NULL AND trim(pe.besoin_rehabilitation) <> '' THEN 3 ELSE 0 END
            + CASE WHEN pe.problemes IS NOT NULL AND lower(trim(pe.problemes)) NOT IN ('', 'ras', 'aucun', 'néant', 'neant') THEN 2 ELSE 0 END
            + CASE WHEN q.ph_physiquement_exploitable IS NOT NULL AND q.alerte_ph_qualite = true THEN 2 ELSE 0 END
            + CASE WHEN q.temperature_physiquement_exploitable IS NOT NULL AND q.temperature_physiquement_exploitable > 50 THEN 2 ELSE 0 END
            + CASE WHEN pe.latitude IS NULL OR pe.longitude IS NULL THEN 1 ELSE 0 END
        ) >= 8 THEN 'Élevée'
        WHEN (
            CASE WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%non fonctionnel%'
                   OR lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%abandon%' THEN 5 ELSE 0 END
            + CASE WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%partiel%' THEN 3 ELSE 0 END
            + CASE WHEN lower(trim(COALESCE(pe.fonctionnalite_organe, ''))) LIKE '%non fonctionnel%' THEN 3
                   WHEN lower(trim(COALESCE(pe.organe_gestion, ''))) = 'non' THEN 2 ELSE 0 END
            + CASE WHEN pe.besoin_rehabilitation IS NOT NULL AND trim(pe.besoin_rehabilitation) <> '' THEN 3 ELSE 0 END
            + CASE WHEN pe.problemes IS NOT NULL AND lower(trim(pe.problemes)) NOT IN ('', 'ras', 'aucun', 'néant', 'neant') THEN 2 ELSE 0 END
            + CASE WHEN q.ph_physiquement_exploitable IS NOT NULL AND q.alerte_ph_qualite = true THEN 2 ELSE 0 END
            + CASE WHEN q.temperature_physiquement_exploitable IS NOT NULL AND q.temperature_physiquement_exploitable > 50 THEN 2 ELSE 0 END
            + CASE WHEN pe.latitude IS NULL OR pe.longitude IS NULL THEN 1 ELSE 0 END
        ) >= 4 THEN 'Moyenne'
        ELSE 'Faible'
    END AS priorite_rehabilitation,
    (pe.latitude IS NULL OR pe.longitude IS NULL) AS alerte_gps,
    (q.temperature_physiquement_exploitable IS NOT NULL AND q.temperature_physiquement_exploitable > 50) AS alerte_temperature,
    (q.alerte_ph_qualite = true) AS alerte_ph,
    (
        q.alerte_ph_qualite = true
        OR (q.temperature_physiquement_exploitable IS NOT NULL AND q.temperature_physiquement_exploitable > 50)
        OR lower(trim(COALESCE(pe.presence_odeur, ''))) LIKE '%oui%'
    ) AS alerte_qualite_eau,
    CASE
        WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%non fonctionnel%' THEN '#dc2626'
        WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%abandon%' THEN '#111827'
        WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%partiel%' THEN '#f97316'
        WHEN lower(trim(COALESCE(pe.fonctionnalite_forage, pe.etat, ''))) LIKE '%fonctionnel%' THEN '#16a34a'
        ELSE '#64748b'
    END AS couleur_statut
FROM public.points_eau pe
LEFT JOIN public.communes c ON pe.commune_id = c.id
LEFT JOIN public.v_points_eau_quality_v522 q ON q.id = pe.id;

GRANT SELECT ON public.v_points_eau_dashboard TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
