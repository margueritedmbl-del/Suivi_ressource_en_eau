-- PSORE V4.4.1 — confidentialité des montants des micro-barrages
-- Objectif : les montants ne sont accessibles qu'au rôle « Super administrateur ».

alter table public.microbarrages enable row level security;

-- Supprime la politique historique qui exposait toute la ligne, y compris les montants.
drop policy if exists public_read_microbarrages on public.microbarrages;
drop policy if exists superadmin_read_microbarrages on public.microbarrages;

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
      and coalesce(p.actif,true) = true
      and r.nom_role = 'Super administrateur'
  )
);

-- La vue de synthèse historique ne doit plus contenir de champs financiers.
drop view if exists public.v_microbarrages_synthese;
create view public.v_microbarrages_synthese as
select code,nom,commune,latitude,longitude,surface_bassin_versant_km2,surface_inondee_ha,
       curage_surface_ha,curage_volume_estime_m3,cordons_pierreux_ml,digue_filtrante_gabion_m3,euphorbia_ml,
       taux_execution_pct,statut_travaux,date_reception_technique,date_reception_provisoire_debut,date_reception_provisoire_fin
from public.microbarrages;

-- Vue publique non financière pour les usages cartographiques/techniques futurs.
drop view if exists public.v_microbarrages_public;
create view public.v_microbarrages_public as
select code,nom,commune,village,latitude,longitude,utm_x,utm_y,epsg,annee_construction,
       surface_bassin_versant_km2,surface_inondee_ha,surface_riziculture_ha,surface_maraichage_ha,nombre_exploitants,
       pluie_annuelle_mm,pluie_decennale_24h_mm,crue_projet_100ans_m3s,diagnostic_avant,travaux_realises,
       curage_surface_ha,curage_profondeur_m,curage_volume_estime_m3,lignes_cordons_pierreux,digue_filtrante_longueur_m,
       taux_execution_pct,depots_evacues_m3,cordons_pierreux_ml,digue_filtrante_gabion_m3,euphorbia_ml,recalibrage_lit_mineur_ml,
       date_reception_technique,date_reception_provisoire_debut,date_reception_provisoire_fin,entreprise_execution,bureau_controle,
       statut_travaux,source,created_at,updated_at
from public.microbarrages;

grant select on public.v_microbarrages_public to anon, authenticated;
