-- PSORE V4.1.1 — correctif de compatibilité du schéma essais de pompage
-- À exécuter si database/10_observatoire_integre_ouvrages.sql a échoué
-- avec : column "q1_m3h" ... does not exist.

DO $$
BEGIN
  IF to_regclass('public.essais_pompage_piezometres') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='debit_palier_1_m3h'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='q1_m3h'
  ) THEN
    ALTER TABLE public.essais_pompage_piezometres
      RENAME COLUMN debit_palier_1_m3h TO q1_m3h;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='debit_palier_2_m3h'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='q2_m3h'
  ) THEN
    ALTER TABLE public.essais_pompage_piezometres
      RENAME COLUMN debit_palier_2_m3h TO q2_m3h;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='debit_palier_3_m3h'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='q3_m3h'
  ) THEN
    ALTER TABLE public.essais_pompage_piezometres
      RENAME COLUMN debit_palier_3_m3h TO q3_m3h;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='crepine_superieure_m'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='crepine_sup_m'
  ) THEN
    ALTER TABLE public.essais_pompage_piezometres
      RENAME COLUMN crepine_superieure_m TO crepine_sup_m;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='niveau_etiage_estime_m'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='essais_pompage_piezometres'
      AND column_name='niveau_etiage_m'
  ) THEN
    ALTER TABLE public.essais_pompage_piezometres
      RENAME COLUMN niveau_etiage_estime_m TO niveau_etiage_m;
  END IF;
END $$;

-- Ajout de sécurité si la table existante ne possédait aucune de ces colonnes.
ALTER TABLE public.essais_pompage_piezometres
  ADD COLUMN IF NOT EXISTS q1_m3h double precision,
  ADD COLUMN IF NOT EXISTS q2_m3h double precision,
  ADD COLUMN IF NOT EXISTS q3_m3h double precision,
  ADD COLUMN IF NOT EXISTS crepine_sup_m double precision,
  ADD COLUMN IF NOT EXISTS niveau_etiage_m double precision;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='essais_pompage_piezometres'
ORDER BY ordinal_position;
