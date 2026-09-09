-- PSORE V4.6.0 — MIGRATION MAÎTRE DE RÉPARATION
-- Réexécutable. Corrige synchronisation Epicollect BRANCH, vues analytiques, cartographie et cache PostgREST.
begin;

create table if not exists public.sync_rejects (
  id bigserial primary key,
  module text not null,
  source text not null,
  target_table text,
  source_entry_id text,
  reason text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.points_eau add column if not exists raw_payload jsonb;
alter table if exists public.observations_pluvio add column if not exists source_parent_id text;
alter table if exists public.observations_pluvio add column if not exists raw_payload jsonb;
alter table if exists public.observations_piezo add column if not exists source_parent_id text;
alter table if exists public.observations_piezo add column if not exists raw_payload jsonb;
alter table if exists public.observations_limni add column if not exists source_parent_id text;
alter table if exists public.observations_limni add column if not exists raw_payload jsonb;

create index if not exists idx_obs_pluvio_parent on public.observations_pluvio(source_parent_id);
create index if not exists idx_obs_piezo_parent on public.observations_piezo(source_parent_id);
create index if not exists idx_obs_limni_parent on public.observations_limni(source_parent_id);
create index if not exists idx_points_eau_source on public.points_eau(source_entry_id);
create index if not exists idx_sync_rejects_mod_date on public.sync_rejects(module,created_at desc);

-- Les relevés PTCS sont des BRANCHES imbriquées dans le formulaire station.
insert into public.epicollect_sources(module,type_source,libelle,project_slug,api_url,form_url,actif) values
('pluviometrie','stations','Référentiel des pluviomètres','suivi-pluviometrique-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a047a461c0c4','https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs',true),
('pluviometrie','releves','Relevés pluviométriques — branche','suivi-pluviometrique-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a047a461c0c4&branch_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a05a7178bf71','https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs',true),
('piezometrie','referentiel','Référentiel piézomètres','suivi-piezo-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a047a461c0c4','https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs',true),
('piezometrie','mesures','Mesures piézométriques — branche','suivi-piezo-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a047a461c0c4&branch_ref=6144ed6ab3d646baa82de06e13b4f051_6a05a7178bf71','https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs',true),
('limnimetrie','stations','Stations limnimétriques','suivi-limnimetrique-ce-koulikoro','https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a047a461c0c4','https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro',true),
('limnimetrie','lectures','Lectures limnimétriques — branche','suivi-limnimetrique-ce-koulikoro','https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a047a461c0c4&branch_ref=bd5f4213890945cfb0d4976cd8768332_6a05a7178bf71','https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro',true),
('points_eau','inventaire','Inventaire points d’eau','etat-des-lieux-pe-ptcs','https://five.epicollect.net/api/export/entries/etat-des-lieux-pe-ptcs?form_ref=9365afaa5ef642ffb8ed24b8b51bf93a_5db097aea78d5','https://five.epicollect.net/project/etat-des-lieux-pe-ptcs',true)
on conflict(module,type_source) do update set libelle=excluded.libelle,project_slug=excluded.project_slug,api_url=excluded.api_url,form_url=excluded.form_url,actif=true,updated_at=now();

-- Vues neuves : aucun CREATE OR REPLACE sur anciennes vues, évite conflit de colonnes.
drop view if exists public.v_pluviometrie_dashboard_v46;
create view public.v_pluviometrie_dashboard_v46 as
select
 o.id, coalesce(s.code_station,o.code_station,o.source_parent_id) as code_site,
 coalesce(s.nom_station,s.village,o.code_station,o.source_parent_id) as nom_site,
 coalesce(s.commune,'Non renseignée') as commune, s.village,
 s.latitude,s.longitude,o.date_observation,o.pluie_24h_mm,o.cumul_mensuel_mm,
 o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,
 o.pluie_24h_mm as valeur_observee,
 (o.pluie_24h_mm is null or o.pluie_24h_mm < 0) as alerte_valeur,
 (s.latitude is null or s.longitude is null) as alerte_gps,
 false as alerte_donnee,false as alerte_secheresse,false as alerte_crue
from public.observations_pluvio o
left join public.stations_pluvio s on (o.source_parent_id is not null and o.source_parent_id=s.source_entry_id)
 or (o.code_station is not null and o.code_station=s.code_station)
where o.date_observation is not null and o.pluie_24h_mm is not null;

drop view if exists public.v_piezometrie_dashboard_v46;
create view public.v_piezometrie_dashboard_v46 as
select
 o.id, coalesce(p.code_piezo,o.code_piezo,o.source_parent_id) as code_site,
 coalesce(p.localite,p.village,p.code_piezo,o.code_piezo,o.source_parent_id) as nom_site,
 coalesce(p.commune,'Non renseignée') as commune,p.village,p.latitude,p.longitude,
 o.date_observation,o.niveau_statique,o.observateur,o.commentaire,o.photo_url,
 o.source_entry_id,o.source_parent_id,o.synced_at,o.niveau_statique as valeur_observee,
 (o.niveau_statique is null or o.niveau_statique < 0) as alerte_valeur,
 (p.latitude is null or p.longitude is null) as alerte_gps,
 false as alerte_donnee,false as alerte_secheresse,false as alerte_crue
from public.observations_piezo o
left join public.piezometres p on (o.source_parent_id is not null and o.source_parent_id=p.source_entry_id)
 or (o.code_piezo is not null and o.code_piezo=p.code_piezo)
where o.date_observation is not null and o.niveau_statique is not null;

drop view if exists public.v_limnimetrie_dashboard_v46;
create view public.v_limnimetrie_dashboard_v46 as
select
 o.id, coalesce(s.code_station,o.code_station,o.source_parent_id) as code_site,
 coalesce(s.cours_eau,s.localite,s.village,s.code_station,o.code_station,o.source_parent_id) as nom_site,
 coalesce(s.commune,'Non renseignée') as commune,s.village,s.cours_eau,s.latitude,s.longitude,
 o.date_observation,o.periode,o.hauteur_eau,o.observateur,o.commentaire,o.photo_url,
 o.source_entry_id,o.source_parent_id,o.synced_at,o.hauteur_eau as valeur_observee,
 (o.hauteur_eau is null or o.hauteur_eau < 0) as alerte_valeur,
 (s.latitude is null or s.longitude is null) as alerte_gps,
 false as alerte_donnee,false as alerte_secheresse,false as alerte_crue
from public.observations_limni o
left join public.stations_limni s on (o.source_parent_id is not null and o.source_parent_id=s.source_entry_id)
 or (o.code_station is not null and o.code_station=s.code_station)
where o.date_observation is not null and o.hauteur_eau is not null;

-- Vue cartographique stable avec libellés métier, pas UUID lorsqu'un libellé existe.
drop view if exists public.v_carte_points_v46;
create view public.v_carte_points_v46 as
select 'pluviometrie'::text module,sp.code_station code,coalesce(nullif(sp.nom_station,''),nullif(sp.village,''),sp.code_station) libelle,sp.latitude,sp.longitude,sp.synced_at,
 null::text statut_fonctionnalite,null::text type_infrastructure,sp.commune,sp.village,null::text priorite_rehabilitation,null::text equipement,null::text organe_gestion,null::numeric ph,null::numeric conductivite,null::numeric tds,false alerte_qualite_eau,(sp.latitude is null or sp.longitude is null) alerte_gps,'#7C3AED'::text couleur
from public.stations_pluvio sp
union all
select 'piezometrie',p.code_piezo,coalesce(nullif(p.localite,''),nullif(p.village,''),p.code_piezo),p.latitude,p.longitude,p.synced_at,null,null,p.commune,p.village,null,null,null,null,null,null,false,(p.latitude is null or p.longitude is null),'#48CAE4'
from public.piezometres p
union all
select 'limnimetrie',s.code_station,coalesce(nullif(s.cours_eau,''),nullif(s.localite,''),nullif(s.village,''),s.code_station),s.latitude,s.longitude,s.synced_at,null,null,s.commune,s.village,null,null,null,null,null,null,false,(s.latitude is null or s.longitude is null),'#16A34A'
from public.stations_limni s
union all
select 'points_eau',pe.code_pe,coalesce(nullif(pe.localite,''),nullif(pe.village,''),pe.code_pe),pe.latitude,pe.longitude,pe.synced_at,
 coalesce(pe.fonctionnalite_forage,pe.etat),coalesce(pe.type_infrastructure,pe.type_ouvrage),pe.commune,pe.village,
 case when lower(coalesce(pe.fonctionnalite_forage,pe.etat,'')) like '%non fonctionnel%' then 'Élevée' when coalesce(pe.besoin_rehabilitation,'')<>'' then 'Moyenne' else 'Faible' end,
 coalesce(pe.equipement_forage,pe.equipement_puits),pe.organe_gestion,pe.ph,pe.conductivite,pe.tds,
 (pe.ph is not null and (pe.ph<6.5 or pe.ph>8.5)) or lower(coalesce(pe.presence_odeur,'')) like '%oui%',(pe.latitude is null or pe.longitude is null),'#0077B6'
from public.points_eau pe;

grant select on public.v_pluviometrie_dashboard_v46,public.v_piezometrie_dashboard_v46,public.v_limnimetrie_dashboard_v46,public.v_carte_points_v46 to anon,authenticated;

-- Supabase Storage / documents : bucket privé présent.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('psore-documents','psore-documents',false,15728640,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=15728640,allowed_mime_types=array['application/pdf'];

-- Nettoyage journal technique ancien.
delete from public.sync_rejects where created_at < now() - interval '90 days';
commit;

-- Force le rafraîchissement du cache PostgREST après ajout de colonnes/vues.
notify pgrst, 'reload schema';
