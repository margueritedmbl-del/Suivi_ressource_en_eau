-- PSORE V4.9.0 — Référentiel officiel des réseaux et vues analytiques strictes
-- Objectif : ne jamais confondre fiches Epicollect/test avec stations physiques du réseau PTCS.
begin;

create table if not exists public.monitoring_network_registry(
  module text not null,
  code text not null,
  actif boolean not null default true,
  primary key(module,code)
);

insert into public.monitoring_network_registry(module,code) values
('pluviometrie','PL-MGT-GOU-001'),('pluviometrie','PL-DMB-DOM-001'),('pluviometrie','PL-DMB-DIB-001'),('pluviometrie','PL-DMB-FAN-001'),('pluviometrie','PL-KLA-DKB-001'),('pluviometrie','PL-KLA-GKB-001'),('pluviometrie','PL-KLA-FEL-001'),('pluviometrie','PL-SRK-DLN-001'),('pluviometrie','PL-SRK-BRC-001'),('pluviometrie','PL-SRK-DTB-001'),
('piezometrie','PZ-DMB-FAN-001'),('piezometrie','PZ-DMB-DOM-001'),('piezometrie','PZ-DMB-SIN-001'),('piezometrie','PZ-KLA-NMCBG-001'),('piezometrie','PZ-KLA-DKB-001'),('piezometrie','PZ-KLA-WLK-001'),('piezometrie','PZ-KLA-NIO-001'),('piezometrie','PZ-KLA-FEL-001'),('piezometrie','PZ-SRK-MON-001'),('piezometrie','PZ-SRK-DLN-001'),('piezometrie','PZ-SRK-BRC-001'),('piezometrie','PZ-SRK-DTB-001'),('piezometrie','PZ-SRK-KOR-001'),('piezometrie','PZ-SRK-ZAN-001'),('piezometrie','PZ-SRK-O-001'),('piezometrie','PZ-MGT-GOU-001'),('piezometrie','PZ-MGT-FEG-001'),('piezometrie','PZ-MGT-DGB-001'),('piezometrie','PZ-MGT-STG-001'),('piezometrie','PZ-MGT-DLDJ-001'),
('limnimetrie','CE-KLK-001_B-FANI'),('limnimetrie','CE-KLK-002_B-WLKRDJI'),('limnimetrie','CE-KLK-003_B-BDO'),('limnimetrie','CE-KLK-004_B-SRMSNI'),('limnimetrie','CE-KLK-005_R-BBGOU-PNT'),('limnimetrie','CE-KLK-006_R-TNKA-PNT'),('limnimetrie','CE-KLK-007_R-DBNA'),('limnimetrie','CE-KLK-008_R-DLNA'),('limnimetrie','CE-KLK-009_R-DNTRBGOU'),('limnimetrie','CE-KLK-008_R-BRN-CSSE')
on conflict(module,code) do update set actif=true;

-- Ordre inverse des dépendances.
drop view if exists public.v_carte_points_v47;
drop view if exists public.v_pluviometrie_dashboard_v47;
drop view if exists public.v_piezometrie_dashboard_v47;
drop view if exists public.v_limnimetrie_dashboard_v47;
drop view if exists public.v_stations_pluvio_canonical_v47;
drop view if exists public.v_piezometres_canonical_v47;
drop view if exists public.v_stations_limni_canonical_v47;

create view public.v_stations_pluvio_canonical_v47 as
select distinct on (upper(trim(s.code_station))) s.*
from public.stations_pluvio s
join public.monitoring_network_registry r on r.module='pluviometrie' and r.actif and r.code=upper(trim(s.code_station))
order by upper(trim(s.code_station)),s.synced_at desc nulls last,s.id desc;

create view public.v_piezometres_canonical_v47 as
select distinct on (upper(trim(p.code_piezo))) p.*
from public.piezometres p
join public.monitoring_network_registry r on r.module='piezometrie' and r.actif and r.code=upper(trim(p.code_piezo))
order by upper(trim(p.code_piezo)),p.synced_at desc nulls last,p.id desc;

create view public.v_stations_limni_canonical_v47 as
select distinct on (upper(trim(s.code_station))) s.*
from public.stations_limni s
join public.monitoring_network_registry r on r.module='limnimetrie' and r.actif and r.code=upper(trim(s.code_station))
order by upper(trim(s.code_station)),s.synced_at desc nulls last,s.id desc;

create view public.v_pluviometrie_dashboard_v47 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,c.code_station code_site,coalesce(nullif(c.nom_station,''),nullif(c.village,''),c.code_station) nom_site,
 coalesce(c.commune,'Non renseignée') commune,c.village,c.latitude,c.longitude,o.date_observation,o.pluie_24h_mm,o.cumul_mensuel_mm,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,
 o.pluie_24h_mm valeur_observee,(o.pluie_24h_mm is null or o.pluie_24h_mm<0) alerte_valeur,(c.latitude is null or c.longitude is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_pluvio o
left join public.stations_pluvio px on o.source_parent_id=px.source_entry_id
join public.v_stations_pluvio_canonical_v47 c on upper(trim(c.code_station))=upper(trim(coalesce(px.code_station,o.code_station,'')))
where o.date_observation is not null and o.pluie_24h_mm is not null and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01');

create view public.v_piezometrie_dashboard_v47 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,c.code_piezo code_site,coalesce(nullif(c.localite,''),nullif(c.village,''),c.code_piezo) nom_site,
 coalesce(c.commune,'Non renseignée') commune,c.village,c.latitude,c.longitude,o.date_observation,o.niveau_statique,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,
 o.niveau_statique valeur_observee,(o.niveau_statique is null or o.niveau_statique<0) alerte_valeur,(c.latitude is null or c.longitude is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_piezo o
left join public.piezometres px on o.source_parent_id=px.source_entry_id
join public.v_piezometres_canonical_v47 c on upper(trim(c.code_piezo))=upper(trim(coalesce(px.code_piezo,o.code_piezo,'')))
where o.date_observation is not null and o.niveau_statique is not null and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01');

create view public.v_limnimetrie_dashboard_v47 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,c.code_station code_site,coalesce(nullif(c.cours_eau,''),nullif(c.localite,''),nullif(c.village,''),c.code_station) nom_site,
 coalesce(c.commune,'Non renseignée') commune,c.village,c.cours_eau,c.latitude,c.longitude,o.date_observation,o.periode,o.hauteur_eau,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,
 o.hauteur_eau valeur_observee,(o.hauteur_eau is null or o.hauteur_eau<0) alerte_valeur,(c.latitude is null or c.longitude is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_limni o
left join public.stations_limni px on o.source_parent_id=px.source_entry_id
join public.v_stations_limni_canonical_v47 c on upper(trim(c.code_station))=upper(trim(coalesce(px.code_station,o.code_station,'')))
where o.date_observation is not null and o.hauteur_eau is not null and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01');

create view public.v_carte_points_v47 as
select 'pluviometrie'::text module,s.code_station code,coalesce(nullif(s.nom_station,''),nullif(s.village,''),s.code_station) libelle,s.latitude,s.longitude,s.synced_at,null::text statut_fonctionnalite,null::text type_infrastructure,s.commune,s.village,null::text priorite_rehabilitation,null::text equipement,null::text organe_gestion,null::numeric ph,null::numeric conductivite,null::numeric tds,false alerte_qualite_eau,(s.latitude is null or s.longitude is null) alerte_gps,'#7C3AED'::text couleur from public.v_stations_pluvio_canonical_v47 s
union all select 'piezometrie',p.code_piezo,coalesce(nullif(p.localite,''),nullif(p.village,''),p.code_piezo),p.latitude,p.longitude,p.synced_at,null,null,p.commune,p.village,null,null,null,null,null,null,false,(p.latitude is null or p.longitude is null),'#48CAE4' from public.v_piezometres_canonical_v47 p
union all select 'limnimetrie',s.code_station,coalesce(nullif(s.cours_eau,''),nullif(s.localite,''),nullif(s.village,''),s.code_station),s.latitude,s.longitude,s.synced_at,null,null,s.commune,s.village,null,null,null,null,null,null,false,(s.latitude is null or s.longitude is null),'#16A34A' from public.v_stations_limni_canonical_v47 s
union all select 'points_eau',pe.code_pe,coalesce(nullif(pe.localite,''),nullif(pe.village,''),pe.code_pe),pe.latitude,pe.longitude,pe.synced_at,coalesce(pe.fonctionnalite_forage,pe.etat),coalesce(pe.type_infrastructure,pe.type_ouvrage),pe.commune,pe.village,case when lower(coalesce(pe.fonctionnalite_forage,pe.etat,'')) like '%non fonctionnel%' then 'Élevée' when coalesce(pe.besoin_rehabilitation,'')<>'' then 'Moyenne' else 'Faible' end,coalesce(pe.equipement_forage,pe.equipement_puits),pe.organe_gestion,pe.ph,pe.conductivite,pe.tds,(pe.ph is not null and (pe.ph<6.5 or pe.ph>8.5)) or lower(coalesce(pe.presence_odeur,'')) like '%oui%',(pe.latitude is null or pe.longitude is null),'#0077B6' from public.points_eau pe;

grant select on public.monitoring_network_registry,public.v_stations_pluvio_canonical_v47,public.v_piezometres_canonical_v47,public.v_stations_limni_canonical_v47,public.v_pluviometrie_dashboard_v47,public.v_piezometrie_dashboard_v47,public.v_limnimetrie_dashboard_v47,public.v_carte_points_v47 to anon,authenticated;
insert into public.system_settings(key,value,description) values('version_psore','4.9.0','Version applicative PSORE') on conflict(key) do update set value='4.9.0',updated_at=now();
notify pgrst,'reload schema';
commit;
