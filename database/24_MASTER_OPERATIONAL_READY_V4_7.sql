-- PSORE V4.7.0 — migration maître "Operational Ready"
-- Corrige définitivement la structure Epicollect5 hiérarchique, consolide les stations physiques
-- et ajoute un seuil configurable pour exclure les données de formation des analyses officielles.
begin;

create table if not exists public.sync_rejects (
  id bigserial primary key,module text not null,source text not null,target_table text,
  source_entry_id text,reason text not null,raw_payload jsonb,created_at timestamptz not null default now()
);
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),key text unique not null,value text,description text,updated_at timestamptz not null default now()
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
create index if not exists idx_stations_pluvio_code on public.stations_pluvio(code_station);
create index if not exists idx_piezometres_code on public.piezometres(code_piezo);
create index if not exists idx_stations_limni_code on public.stations_limni(code_station);
create index if not exists idx_points_eau_source on public.points_eau(source_entry_id);

insert into public.system_settings(key,value,description) values
('operational_data_start_date',null,'Date à partir de laquelle les mesures Epicollect5 sont considérées comme opérationnelles')
on conflict(key) do nothing;

-- Sources réelles : les mesures sont des formulaires enfants hierarchy et non des Branches.
insert into public.epicollect_sources(module,type_source,libelle,project_slug,api_url,form_url,actif) values
('pluviometrie','stations','Référentiel des pluviomètres','suivi-pluviometrique-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a047a461c0c4','https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs',true),
('pluviometrie','releves','Relevés pluviométriques — formulaire enfant','suivi-pluviometrique-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a05a7178bf71&parent_form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a047a461c0c4','https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs',true),
('piezometrie','referentiel','Référentiel piézomètres','suivi-piezo-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a047a461c0c4','https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs',true),
('piezometrie','mesures','Campagnes de mesures — formulaire enfant','suivi-piezo-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a05a7178bf71&parent_form_ref=6144ed6ab3d646baa82de06e13b4f051_6a047a461c0c4','https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs',true),
('limnimetrie','stations','Stations limnimétriques','suivi-limnimetrique-ce-koulikoro','https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a047a461c0c4','https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro',true),
('limnimetrie','lectures','Lectures limnimétriques — formulaire enfant','suivi-limnimetrique-ce-koulikoro','https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a05a7178bf71&parent_form_ref=bd5f4213890945cfb0d4976cd8768332_6a047a461c0c4','https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro',true),
('points_eau','inventaire','Inventaire points d’eau','etat-des-lieux-pe-ptcs','https://five.epicollect.net/api/export/entries/etat-des-lieux-pe-ptcs?form_ref=9365afaa5ef642ffb8ed24b8b51bf93a_5db097aea78d5','https://five.epicollect.net/project/etat-des-lieux-pe-ptcs',true)
on conflict(module,type_source) do update set libelle=excluded.libelle,project_slug=excluded.project_slug,api_url=excluded.api_url,form_url=excluded.form_url,actif=true,updated_at=now();

-- Référentiels canoniques : une station physique = un code métier, quelle que soit la quantité de fiches de test Epicollect.
drop view if exists public.v_stations_pluvio_canonical_v47;
create view public.v_stations_pluvio_canonical_v47 as
select distinct on (code_station) * from public.stations_pluvio
where nullif(trim(code_station),'') is not null
order by code_station, synced_at desc nulls last, id desc;

drop view if exists public.v_piezometres_canonical_v47;
create view public.v_piezometres_canonical_v47 as
select distinct on (code_piezo) * from public.piezometres
where nullif(trim(code_piezo),'') is not null and lower(trim(code_piezo)) <> 'i am a placeholder answer'
order by code_piezo, synced_at desc nulls last, id desc;

drop view if exists public.v_stations_limni_canonical_v47;
create view public.v_stations_limni_canonical_v47 as
select distinct on (code_station) * from public.stations_limni
where nullif(trim(code_station),'') is not null and lower(trim(code_station)) <> 'i am a placeholder answer'
order by code_station, synced_at desc nulls last, id desc;

-- Seuil opérationnel : valeur vide = mode test, toutes les mesures sont visibles.
-- Une fois la date renseignée, seules les mesures à partir de cette date alimentent KPI/graphes/exports/SIG.
drop view if exists public.v_pluviometrie_dashboard_v47;
create view public.v_pluviometrie_dashboard_v47 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,coalesce(px.code_station,c.code_station,o.code_station,o.source_parent_id) code_site,
 coalesce(px.nom_station,px.village,c.nom_station,c.village,px.code_station,c.code_station,o.code_station) nom_site,
 coalesce(px.commune,c.commune,'Non renseignée') commune,coalesce(px.village,c.village) village,
 coalesce(px.latitude,c.latitude) latitude,coalesce(px.longitude,c.longitude) longitude,
 o.date_observation,o.pluie_24h_mm,o.cumul_mensuel_mm,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,
 o.pluie_24h_mm valeur_observee,(o.pluie_24h_mm is null or o.pluie_24h_mm<0) alerte_valeur,
 (coalesce(px.latitude,c.latitude) is null or coalesce(px.longitude,c.longitude) is null) alerte_gps,
 false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_pluvio o
left join public.stations_pluvio px on o.source_parent_id=px.source_entry_id
left join public.v_stations_pluvio_canonical_v47 c on c.code_station=coalesce(px.code_station,o.code_station)
where o.date_observation is not null and o.pluie_24h_mm is not null
and o.date_observation >= coalesce((select d from cutoff),date '1900-01-01');

drop view if exists public.v_piezometrie_dashboard_v47;
create view public.v_piezometrie_dashboard_v47 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,coalesce(px.code_piezo,c.code_piezo,o.code_piezo,o.source_parent_id) code_site,
 coalesce(px.localite,px.village,c.localite,c.village,px.code_piezo,c.code_piezo,o.code_piezo) nom_site,
 coalesce(px.commune,c.commune,'Non renseignée') commune,coalesce(px.village,c.village) village,
 coalesce(px.latitude,c.latitude) latitude,coalesce(px.longitude,c.longitude) longitude,
 o.date_observation,o.niveau_statique,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,
 o.niveau_statique valeur_observee,(o.niveau_statique is null or o.niveau_statique<0) alerte_valeur,
 (coalesce(px.latitude,c.latitude) is null or coalesce(px.longitude,c.longitude) is null) alerte_gps,
 false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_piezo o
left join public.piezometres px on o.source_parent_id=px.source_entry_id
left join public.v_piezometres_canonical_v47 c on c.code_piezo=coalesce(px.code_piezo,o.code_piezo)
where o.date_observation is not null and o.niveau_statique is not null
and o.date_observation >= coalesce((select d from cutoff),date '1900-01-01');

drop view if exists public.v_limnimetrie_dashboard_v47;
create view public.v_limnimetrie_dashboard_v47 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,coalesce(px.code_station,c.code_station,o.code_station,o.source_parent_id) code_site,
 coalesce(px.cours_eau,px.localite,px.village,c.cours_eau,c.localite,c.village,px.code_station,c.code_station,o.code_station) nom_site,
 coalesce(px.commune,c.commune,'Non renseignée') commune,coalesce(px.village,c.village) village,coalesce(px.cours_eau,c.cours_eau) cours_eau,
 coalesce(px.latitude,c.latitude) latitude,coalesce(px.longitude,c.longitude) longitude,
 o.date_observation,o.periode,o.hauteur_eau,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,
 o.hauteur_eau valeur_observee,(o.hauteur_eau is null or o.hauteur_eau<0) alerte_valeur,
 (coalesce(px.latitude,c.latitude) is null or coalesce(px.longitude,c.longitude) is null) alerte_gps,
 false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_limni o
left join public.stations_limni px on o.source_parent_id=px.source_entry_id
left join public.v_stations_limni_canonical_v47 c on c.code_station=coalesce(px.code_station,o.code_station)
where o.date_observation is not null and o.hauteur_eau is not null
and o.date_observation >= coalesce((select d from cutoff),date '1900-01-01');

-- Carte : uniquement les stations physiques canoniques.
drop view if exists public.v_carte_points_v47;
create view public.v_carte_points_v47 as
select 'pluviometrie'::text module,s.code_station code,coalesce(nullif(s.nom_station,''),nullif(s.village,''),s.code_station) libelle,s.latitude,s.longitude,s.synced_at,
 null::text statut_fonctionnalite,null::text type_infrastructure,s.commune,s.village,null::text priorite_rehabilitation,null::text equipement,null::text organe_gestion,null::numeric ph,null::numeric conductivite,null::numeric tds,false alerte_qualite_eau,(s.latitude is null or s.longitude is null) alerte_gps,'#7C3AED'::text couleur
from public.v_stations_pluvio_canonical_v47 s
union all
select 'piezometrie',p.code_piezo,coalesce(nullif(p.localite,''),nullif(p.village,''),p.code_piezo),p.latitude,p.longitude,p.synced_at,null,null,p.commune,p.village,null,null,null,null,null,null,false,(p.latitude is null or p.longitude is null),'#48CAE4'
from public.v_piezometres_canonical_v47 p
union all
select 'limnimetrie',s.code_station,coalesce(nullif(s.cours_eau,''),nullif(s.localite,''),nullif(s.village,''),s.code_station),s.latitude,s.longitude,s.synced_at,null,null,s.commune,s.village,null,null,null,null,null,null,false,(s.latitude is null or s.longitude is null),'#16A34A'
from public.v_stations_limni_canonical_v47 s
union all
select 'points_eau',pe.code_pe,coalesce(nullif(pe.localite,''),nullif(pe.village,''),pe.code_pe),pe.latitude,pe.longitude,pe.synced_at,
 coalesce(pe.fonctionnalite_forage,pe.etat),coalesce(pe.type_infrastructure,pe.type_ouvrage),pe.commune,pe.village,
 case when lower(coalesce(pe.fonctionnalite_forage,pe.etat,'')) like '%non fonctionnel%' then 'Élevée' when coalesce(pe.besoin_rehabilitation,'')<>'' then 'Moyenne' else 'Faible' end,
 coalesce(pe.equipement_forage,pe.equipement_puits),pe.organe_gestion,pe.ph,pe.conductivite,pe.tds,
 (pe.ph is not null and (pe.ph<6.5 or pe.ph>8.5)) or lower(coalesce(pe.presence_odeur,'')) like '%oui%',(pe.latitude is null or pe.longitude is null),'#0077B6'
from public.points_eau pe;

grant select on public.v_stations_pluvio_canonical_v47,public.v_piezometres_canonical_v47,public.v_stations_limni_canonical_v47,
 public.v_pluviometrie_dashboard_v47,public.v_piezometrie_dashboard_v47,public.v_limnimetrie_dashboard_v47,public.v_carte_points_v47 to anon,authenticated;

insert into public.system_settings(key,value,description) values('version_psore','4.7.0','Version applicative PSORE')
on conflict(key) do update set value='4.7.0',updated_at=now();

notify pgrst,'reload schema';
commit;
