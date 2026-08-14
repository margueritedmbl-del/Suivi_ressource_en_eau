-- PSORE V4.4.2 — Correctif robuste confidentialité des montants des micro-barrages
-- À exécuter après les scripts 13 et 15. Ce correctif ajoute aussi les colonnes d'exécution
-- manquantes afin de fonctionner même si le script 15 n'a pas été exécuté complètement.

begin;

-- 1) Compléter le schéma attendu par les vues V4.4+
alter table public.microbarrages
  add column if not exists cout_execute_fcfa bigint,
  add column if not exists taux_execution_pct numeric,
  add column if not exists depots_evacues_m3 numeric,
  add column if not exists cordons_pierreux_ml numeric,
  add column if not exists digue_filtrante_gabion_m3 numeric,
  add column if not exists euphorbia_ml numeric,
  add column if not exists recalibrage_lit_mineur_ml numeric,
  add column if not exists date_reception_technique date,
  add column if not exists date_reception_provisoire_debut date,
  add column if not exists date_reception_provisoire_fin date,
  add column if not exists entreprise_execution text,
  add column if not exists bureau_controle text;

-- 2) RLS : la table complète (qui contient les montants) est réservée au Super administrateur
alter table public.microbarrages enable row level security;

drop policy if exists public_read_microbarrages on public.microbarrages;
drop policy if exists superadmin_read_microbarrages on public.microbarrages;

-- Le rôle DB "authenticated" doit avoir SELECT pour que RLS puisse ensuite filtrer.
revoke all on table public.microbarrages from anon;
grant select on table public.microbarrages to authenticated;

create policy superadmin_read_microbarrages
on public.microbarrages
for select
to authenticated
using (
  exists (
    select 1
    from public.profils p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and coalesce(p.actif, true) = true
      and r.nom_role = 'Super administrateur'
  )
);

-- 3) Vue de synthèse technique SANS aucun montant
drop view if exists public.v_microbarrages_synthese;
create view public.v_microbarrages_synthese as
select
  code,
  nom,
  commune,
  latitude,
  longitude,
  surface_bassin_versant_km2,
  surface_inondee_ha,
  curage_surface_ha,
  curage_volume_estime_m3,
  cordons_pierreux_ml,
  digue_filtrante_gabion_m3,
  euphorbia_ml,
  taux_execution_pct,
  statut_travaux,
  date_reception_technique,
  date_reception_provisoire_debut,
  date_reception_provisoire_fin
from public.microbarrages;

revoke all on public.v_microbarrages_synthese from public;
grant select on public.v_microbarrages_synthese to anon, authenticated;

-- 4) Vue publique/technique détaillée SANS aucun champ financier
drop view if exists public.v_microbarrages_public;
create view public.v_microbarrages_public as
select
  code,
  nom,
  commune,
  village,
  latitude,
  longitude,
  utm_x,
  utm_y,
  epsg,
  annee_construction,
  surface_bassin_versant_km2,
  surface_inondee_ha,
  surface_riziculture_ha,
  surface_maraichage_ha,
  nombre_exploitants,
  pluie_annuelle_mm,
  pluie_decennale_24h_mm,
  crue_projet_100ans_m3s,
  diagnostic_avant,
  travaux_realises,
  curage_surface_ha,
  curage_profondeur_m,
  curage_volume_estime_m3,
  lignes_cordons_pierreux,
  digue_filtrante_longueur_m,
  taux_execution_pct,
  depots_evacues_m3,
  cordons_pierreux_ml,
  digue_filtrante_gabion_m3,
  euphorbia_ml,
  recalibrage_lit_mineur_ml,
  date_reception_technique,
  date_reception_provisoire_debut,
  date_reception_provisoire_fin,
  entreprise_execution,
  bureau_controle,
  statut_travaux,
  source,
  created_at,
  updated_at
from public.microbarrages;

revoke all on public.v_microbarrages_public from public;
grant select on public.v_microbarrages_public to anon, authenticated;

commit;

-- 5) Vérifications à afficher immédiatement après exécution
select 'vue_synthese_sans_finances' as controle,
       count(*) filter (
         where column_name in ('cout_execute_fcfa','cout_rehabilitation_fcfa','cout_apd_fcfa','montant_contrat_fcfa','montant_execute_fcfa')
       ) as colonnes_financieres
from information_schema.columns
where table_schema='public' and table_name='v_microbarrages_synthese';

select 'vue_publique_sans_finances' as controle,
       count(*) filter (
         where column_name in ('cout_execute_fcfa','cout_rehabilitation_fcfa','cout_apd_fcfa','montant_contrat_fcfa','montant_execute_fcfa')
       ) as colonnes_financieres
from information_schema.columns
where table_schema='public' and table_name='v_microbarrages_public';

select policyname, roles, cmd
from pg_policies
where schemaname='public' and tablename='microbarrages'
order by policyname;
