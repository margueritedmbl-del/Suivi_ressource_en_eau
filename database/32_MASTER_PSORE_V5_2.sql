-- Correctif consolidé V5.2 : référentiels officiels, vues analytiques et rechargement PostgREST.
-- Réexécutable ; aucune donnée brute Epicollect5 n’est supprimée.
-- PSORE V5.2.0 — Référentiel physique, harmonisation PZ, analyses et scénarios
-- Réexécutable. Ne supprime aucune donnée brute Epicollect5.
begin;

create table if not exists public.monitoring_network_registry(
  module text not null,
  code text not null,
  actif boolean not null default true,
  primary key(module,code)
);
alter table public.monitoring_network_registry add column if not exists short_code text;
alter table public.monitoring_network_registry add column if not exists locality text;
alter table public.monitoring_network_registry add column if not exists commune text;
alter table public.monitoring_network_registry add column if not exists aliases jsonb not null default '[]'::jsonb;
alter table public.monitoring_network_registry add column if not exists notes text;

-- Pluviométrie : réseau physique officiel de 10 stations.
insert into public.monitoring_network_registry(module,code,short_code,locality,commune,aliases,actif) values
('pluviometrie','PL-MGT-GOU-001',null,'Gouni','Meguetan','[]',true),
('pluviometrie','PL-DMB-DOM-001',null,'Dombana','Doumba','[]',true),
('pluviometrie','PL-DMB-DIB-001',null,'Dibaro','Doumba','[]',true),
('pluviometrie','PL-DMB-FAN-001',null,'Fani','Doumba','[]',true),
('pluviometrie','PL-KLA-DKB-001',null,'Dialakorobougou','Koula','[]',true),
('pluviometrie','PL-KLA-GKB-001',null,'Gnamakorobougou','Koula','["Niamakorobougou"]',true),
('pluviometrie','PL-KLA-FEL-001',null,'Félou','Koula','["Felou"]',true),
('pluviometrie','PL-SRK-DLN-001',null,'Dlana','Sirakorola','[]',true),
('pluviometrie','PL-SRK-BRC-001',null,'Boron Cissé','Sirakorola','["Boron Cisse"]',true),
('pluviometrie','PL-SRK-DTB-001',null,'Dontiérébougou','Sirakorola','["Dontierebougou","Dontérébougou"]',true)
on conflict(module,code) do update set short_code=excluded.short_code,locality=excluded.locality,commune=excluded.commune,aliases=excluded.aliases,actif=true;

-- Piézométrie : code court historique PZ-01...20 ↔ code métier Epicollect.
insert into public.monitoring_network_registry(module,code,short_code,locality,commune,aliases,notes,actif) values
('piezometrie','PZ-DMB-FAN-001','PZ-01','Fani','Doumba','[]','Correspondance validée : PZ-01 = Fani.',true),
('piezometrie','PZ-DMB-DBN-001','PZ-02','Dombana','Doumba','["PZ-DMB-SIN-001","Sinzani"]','Code canonique validé V5.2 : PZ-02 = Dombana ; PZ-DMB-SIN-001 conservé comme alias historique.',true),
('piezometrie','PZ-DMB-DOM-001','PZ-03','Doumba','Doumba','[]','Correspondance harmonisée sur la localité Doumba.',true),
('piezometrie','PZ-KLA-DKB-001','PZ-04','Dialakorobougou','Koula','[]',null,true),
('piezometrie','PZ-KLA-WLK-001','PZ-05','Wolokorodji','Koula','["Wolokorodjie"]',null,true),
('piezometrie','PZ-KLA-NMCBG-001','PZ-06','Gnamakorobougou','Koula','["Niamakorobougou"]',null,true),
('piezometrie','PZ-KLA-FEL-001','PZ-07','Félou','Koula','["Felou"]',null,true),
('piezometrie','PZ-KLA-NIO-001','PZ-08','Niobougou','Koula','["Nioboubou"]',null,true),
('piezometrie','PZ-SRK-O-001','PZ-09','Sirakorola Ouest','Sirakorola','["Sirakorola"]',null,true),
('piezometrie','PZ-SRK-MON-001','PZ-10','Monzombala','Sirakorola','["Monzobala"]',null,true),
('piezometrie','PZ-SRK-DLN-001','PZ-11','Dlana','Sirakorola','[]',null,true),
('piezometrie','PZ-SRK-BRC-001','PZ-12','Boron Cissé','Sirakorola','["Boron Cisse"]',null,true),
('piezometrie','PZ-SRK-DTB-001','PZ-13','Dontérébougou','Sirakorola','["Dontierebougou","Dontiérébougou"]',null,true),
('piezometrie','PZ-SRK-KOR-001','PZ-14','Koroka','Sirakorola','[]',null,true),
('piezometrie','PZ-SRK-ZAN-001','PZ-15','Zana','Sirakorola','[]',null,true),
('piezometrie','PZ-MGT-GOU-001','PZ-16','Gouni','Méguétan','["Meguetan"]',null,true),
('piezometrie','PZ-MGT-FEG-001','PZ-17','Fégoun','Méguétan','["Fegoun"]',null,true),
('piezometrie','PZ-MGT-DGB-001','PZ-18','Diaguinébougou','Méguétan','["Dianguinebougou"]',null,true),
('piezometrie','PZ-MGT-STG-001','PZ-19','Siratiguila','Méguétan','[]',null,true),
('piezometrie','PZ-MGT-DLDJ-001','PZ-20','Diladjè','Méguétan','["Diladié","Dladie"]',null,true)
on conflict(module,code) do update set short_code=excluded.short_code,locality=excluded.locality,commune=excluded.commune,aliases=excluded.aliases,notes=excluded.notes,actif=true;

-- Limnimétrie : réseau physique officiel de 10 stations.
insert into public.monitoring_network_registry(module,code,short_code,locality,commune,aliases,actif) values
('limnimetrie','CE-KLK-001_B-FANI',null,'Fani','Doumba','[]',true),
('limnimetrie','CE-KLK-002_B-WLKRDJI',null,'Wolokorodji','Koula','[]',true),
('limnimetrie','CE-KLK-003_B-BDO',null,'Bodo','Koula','[]',true),
('limnimetrie','CE-KLK-004_B-SRMSNI',null,'Sirimansoni','Koula','[]',true),
('limnimetrie','CE-KLK-005_R-BBGOU-PNT',null,'Babougou','Doumba','[]',true),
('limnimetrie','CE-KLK-006_R-TNKA-PNT',null,'Tonga','Méguétan','["Tanaka"]',true),
('limnimetrie','CE-KLK-007_R-DBNA',null,'Dombana','Doumba','[]',true),
('limnimetrie','CE-KLK-008_R-DLNA',null,'Dlana','Sirakorola','[]',true),
('limnimetrie','CE-KLK-009_R-DNTRBGOU',null,'Dontiérébougou','Sirakorola','[]',true),
('limnimetrie','CE-KLK-008_R-BRN-CSSE',null,'Boron Cissé','Sirakorola','[]',true)
on conflict(module,code) do update set locality=excluded.locality,commune=excluded.commune,aliases=excluded.aliases,actif=true;

-- Corrections canoniques validées à partir des exports Epicollect du 18/08/2026.
update public.monitoring_network_registry set actif=false,notes='Ancien code erroné remplacé par PZ-DMB-DBN-001 en V5.2' where module='piezometrie' and code='PZ-DMB-SIN-001';
update public.piezometres set code_piezo='PZ-DMB-DBN-001' where upper(trim(coalesce(code_piezo,'')))='PZ-DMB-SIN-001';
update public.observations_piezo set code_piezo='PZ-DMB-DBN-001' where upper(trim(coalesce(code_piezo,'')))='PZ-DMB-SIN-001';

insert into public.system_settings(key,value,description) values
('operational_data_start_date','2026-08-16','Début des données opérationnelles après phase de test')
on conflict(key) do update set value=excluded.value,description=excluded.description,updated_at=now();

-- Vues V5 nouvelles : aucun conflit avec les vues V4.x.
drop view if exists public.v_carte_points_v50;
drop view if exists public.v_pluviometrie_dashboard_v50;
drop view if exists public.v_piezometrie_dashboard_v50;
drop view if exists public.v_limnimetrie_dashboard_v50;
drop view if exists public.v_stations_pluvio_canonical_v50;
drop view if exists public.v_piezometres_canonical_v50;
drop view if exists public.v_stations_limni_canonical_v50;

create view public.v_stations_pluvio_canonical_v50 as
select distinct on (upper(trim(s.code_station))) s.*,r.locality localite_officielle,r.commune commune_officielle
from public.stations_pluvio s join public.monitoring_network_registry r on r.module='pluviometrie' and r.actif and r.code=upper(trim(s.code_station))
order by upper(trim(s.code_station)),s.synced_at desc nulls last,s.id desc;

create view public.v_piezometres_canonical_v50 as
select distinct on (upper(trim(p.code_piezo))) p.*,r.short_code code_court,r.locality localite_officielle,r.commune commune_officielle,r.aliases aliases_officiels
from public.piezometres p join public.monitoring_network_registry r on r.module='piezometrie' and r.actif and r.code=upper(trim(p.code_piezo))
order by upper(trim(p.code_piezo)),p.synced_at desc nulls last,p.id desc;

create view public.v_stations_limni_canonical_v50 as
select distinct on (upper(trim(s.code_station))) s.*,r.locality localite_officielle,r.commune commune_officielle
from public.stations_limni s join public.monitoring_network_registry r on r.module='limnimetrie' and r.actif and r.code=upper(trim(s.code_station))
order by upper(trim(s.code_station)),s.synced_at desc nulls last,s.id desc;

create view public.v_pluviometrie_dashboard_v50 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,c.code_station code_site,coalesce(nullif(c.localite_officielle,''),nullif(c.nom_station,''),nullif(c.village,''),c.code_station) nom_site,coalesce(nullif(c.commune_officielle,''),c.commune,'Non renseignée') commune,c.village,c.latitude,c.longitude,o.date_observation,o.pluie_24h_mm,o.cumul_mensuel_mm,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,o.pluie_24h_mm valeur_observee,(o.pluie_24h_mm is null or o.pluie_24h_mm<0) alerte_valeur,(c.latitude is null or c.longitude is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_pluvio o left join public.stations_pluvio px on o.source_parent_id=px.source_entry_id join public.v_stations_pluvio_canonical_v50 c on upper(trim(c.code_station))=upper(trim(coalesce(px.code_station,o.code_station,'')))
where o.date_observation is not null and o.pluie_24h_mm is not null and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01') and o.date_observation<=current_date;

create view public.v_piezometrie_dashboard_v50 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,c.code_piezo code_site,c.code_court,coalesce(nullif(c.localite_officielle,''),nullif(c.localite,''),nullif(c.village,''),c.code_piezo) nom_site,coalesce(nullif(c.commune_officielle,''),c.commune,'Non renseignée') commune,c.village,c.latitude,c.longitude,o.date_observation,o.niveau_statique,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,o.niveau_statique valeur_observee,(o.niveau_statique is null or o.niveau_statique<0) alerte_valeur,(c.latitude is null or c.longitude is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_piezo o left join public.piezometres px on o.source_parent_id=px.source_entry_id join public.v_piezometres_canonical_v50 c on upper(trim(c.code_piezo))=upper(trim(coalesce(px.code_piezo,o.code_piezo,'')))
where o.date_observation is not null and o.niveau_statique is not null and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01') and o.date_observation<=current_date;

create view public.v_limnimetrie_dashboard_v50 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,c.code_station code_site,coalesce(nullif(c.localite_officielle,''),nullif(c.cours_eau,''),nullif(c.localite,''),nullif(c.village,''),c.code_station) nom_site,coalesce(nullif(c.commune_officielle,''),c.commune,'Non renseignée') commune,c.village,c.cours_eau,c.latitude,c.longitude,o.date_observation,o.periode,o.hauteur_eau,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,o.hauteur_eau valeur_observee,(o.hauteur_eau is null or o.hauteur_eau<0) alerte_valeur,(c.latitude is null or c.longitude is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_limni o left join public.stations_limni px on o.source_parent_id=px.source_entry_id join public.v_stations_limni_canonical_v50 c on upper(trim(c.code_station))=upper(trim(coalesce(px.code_station,o.code_station,'')))
where o.date_observation is not null and o.hauteur_eau is not null and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01') and o.date_observation<=current_date;

create view public.v_carte_points_v50 as
select 'pluviometrie'::text module,s.code_station code,coalesce(nullif(s.localite_officielle,''),nullif(s.nom_station,''),nullif(s.village,''),s.code_station) libelle,s.latitude,s.longitude,s.synced_at,null::text statut_fonctionnalite,null::text type_infrastructure,coalesce(s.commune_officielle,s.commune) commune,s.village,null::text priorite_rehabilitation,null::text equipement,null::text organe_gestion,null::numeric ph,null::numeric conductivite,null::numeric tds,false alerte_qualite_eau,(s.latitude is null or s.longitude is null) alerte_gps,'#7C3AED'::text couleur from public.v_stations_pluvio_canonical_v50 s
union all select 'piezometrie',p.code_piezo,concat_ws(' · ',p.code_court,coalesce(nullif(p.localite_officielle,''),nullif(p.localite,''),nullif(p.village,''),p.code_piezo)),p.latitude,p.longitude,p.synced_at,null,null,coalesce(p.commune_officielle,p.commune),p.village,null,null,null,null,null,null,false,(p.latitude is null or p.longitude is null),'#48CAE4' from public.v_piezometres_canonical_v50 p
union all select 'limnimetrie',s.code_station,coalesce(nullif(s.localite_officielle,''),nullif(s.cours_eau,''),nullif(s.localite,''),nullif(s.village,''),s.code_station),s.latitude,s.longitude,s.synced_at,null,null,coalesce(s.commune_officielle,s.commune),s.village,null,null,null,null,null,null,false,(s.latitude is null or s.longitude is null),'#16A34A' from public.v_stations_limni_canonical_v50 s
union all select 'points_eau',pe.code_pe,coalesce(nullif(pe.localite,''),nullif(pe.village,''),pe.code_pe),pe.latitude,pe.longitude,pe.synced_at,coalesce(pe.fonctionnalite_forage,pe.etat),coalesce(pe.type_infrastructure,pe.type_ouvrage),pe.commune,pe.village,case when lower(coalesce(pe.fonctionnalite_forage,pe.etat,'')) like '%non fonctionnel%' then 'Élevée' when coalesce(pe.besoin_rehabilitation,'')<>'' then 'Moyenne' else 'Faible' end,coalesce(pe.equipement_forage,pe.equipement_puits),pe.organe_gestion,pe.ph,pe.conductivite,pe.tds,(pe.ph is not null and (pe.ph<6.5 or pe.ph>8.5)) or lower(coalesce(pe.presence_odeur,'')) like '%oui%',(pe.latitude is null or pe.longitude is null),'#0077B6' from public.points_eau pe;

grant select on public.monitoring_network_registry,public.v_stations_pluvio_canonical_v50,public.v_piezometres_canonical_v50,public.v_stations_limni_canonical_v50,public.v_pluviometrie_dashboard_v50,public.v_piezometrie_dashboard_v50,public.v_limnimetrie_dashboard_v50,public.v_carte_points_v50 to anon,authenticated;

insert into public.system_settings(key,value,description) values
('decision_scenario_weights','{"restauration":25,"piezometrie":25,"pluie":15,"microbarrages":15,"prelevements":10,"deficit_suivi":10}','Pondérations (%) du scénario combiné optimal'),
('version_psore','5.2.0','Version applicative PSORE')
on conflict(key) do nothing;
update public.system_settings set value='5.2.0',updated_at=now() where key='version_psore';
notify pgrst,'reload schema';
commit;
