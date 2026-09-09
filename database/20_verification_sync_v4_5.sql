-- Vérification après synchronisation V4.5
select 'points_eau' as jeu, count(*) as lignes, count(distinct source_entry_id) as sources_uniques, count(distinct code_pe) as codes_uniques from public.points_eau
union all select 'pluviometrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_station,source_parent_id)) from public.observations_pluvio
union all select 'piezometrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_piezo,source_parent_id)) from public.observations_piezo
union all select 'limnimetrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_station,source_parent_id)) from public.observations_limni;

select 'pluvio_exploitables' as controle,count(*) from public.observations_pluvio where date_observation is not null and pluie_24h_mm is not null
union all select 'piezo_exploitables',count(*) from public.observations_piezo where date_observation is not null and niveau_statique is not null
union all select 'limni_exploitables',count(*) from public.observations_limni where date_observation is not null and hauteur_eau is not null;

select module,source,count(*) as rejets,max(created_at) as dernier_rejet
from public.sync_rejects group by module,source order by module,source;

select module,source,statut,nb_enregistrements,fetched_count,mapped_count,skipped_count,upserted_count,page_count,date_sync,message
from public.sync_log order by date_sync desc limit 20;
