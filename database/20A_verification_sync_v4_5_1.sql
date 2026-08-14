-- PSORE V4.5.1 — vérification après migration et synchronisation
select column_name
from information_schema.columns
where table_schema='public' and table_name='observations_pluvio' and column_name='source_parent_id'
union all
select column_name from information_schema.columns where table_schema='public' and table_name='observations_piezo' and column_name='source_parent_id'
union all
select column_name from information_schema.columns where table_schema='public' and table_name='observations_limni' and column_name='source_parent_id';

select 'points_eau' as jeu, count(*) as lignes, count(distinct source_entry_id) as sources_uniques, count(distinct code_pe) as codes_uniques from public.points_eau
union all select 'pluviometrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_station,source_parent_id)) from public.observations_pluvio
union all select 'piezometrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_piezo,source_parent_id)) from public.observations_piezo
union all select 'limnimetrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_station,source_parent_id)) from public.observations_limni;

select 'pluvio_vue_v451' as controle,count(*) from public.v_pluviometrie_dashboard_v451
union all select 'piezo_vue_v451',count(*) from public.v_piezometrie_dashboard_v451
union all select 'limni_vue_v451',count(*) from public.v_limnimetrie_dashboard_v451;

select module,source,count(*) as rejets,max(created_at) as dernier_rejet
from public.sync_rejects group by module,source order by module,source;

select module,source,statut,nb_enregistrements,fetched_count,mapped_count,skipped_count,upserted_count,page_count,date_sync,message
from public.sync_log order by date_sync desc limit 20;
