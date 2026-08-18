-- Vérification PSORE V5.2 — référentiels, parent/enfant, seuil opérationnel et vues.
select module,count(*) filter(where actif) as stations_actives from public.monitoring_network_registry where module in ('pluviometrie','piezometrie','limnimetrie') group by module order by module;
select key,value from public.system_settings where key in ('operational_data_start_date','version_psore') order by key;
select code,short_code,locality,commune,actif from public.monitoring_network_registry where module='piezometrie' and short_code='PZ-02';
select code,locality,commune from public.monitoring_network_registry where module='limnimetrie' and code='CE-KLK-006_R-TNKA-PNT';
select 'pluvio_parents' controle,count(*) total,count(distinct code_station) codes from public.stations_pluvio
union all select 'piezo_parents',count(*),count(distinct code_piezo) from public.piezometres
union all select 'limni_parents',count(*),count(distinct code_station) from public.stations_limni;
select 'pluvio_enfants_lies' controle,count(*) total,count(*) filter(where p.id is not null) lies from public.observations_pluvio o left join public.stations_pluvio p on p.source_entry_id=o.source_parent_id
union all select 'piezo_enfants_lies',count(*),count(*) filter(where p.id is not null) from public.observations_piezo o left join public.piezometres p on p.source_entry_id=o.source_parent_id
union all select 'limni_enfants_lies',count(*),count(*) filter(where p.id is not null) from public.observations_limni o left join public.stations_limni p on p.source_entry_id=o.source_parent_id;
select 'pluvio_operationnel' controle,count(*) total from public.v_pluviometrie_dashboard_v50
union all select 'piezo_operationnel',count(*) from public.v_piezometrie_dashboard_v50
union all select 'limni_operationnel',count(*) from public.v_limnimetrie_dashboard_v50;
