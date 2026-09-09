-- PSORE V4.6.0 — vérification fonctionnelle après migration + synchronisation
select 'version_schema' controle, 'V4.6.0' valeur;
select table_name,column_name from information_schema.columns where table_schema='public' and column_name in ('raw_payload','source_parent_id') and table_name in ('points_eau','observations_pluvio','observations_piezo','observations_limni') order by table_name,column_name;
select module,type_source,api_url from public.epicollect_sources where actif=true order by module,type_source;
select 'points_eau' module,count(*) total,count(distinct source_entry_id) sources_uniques,count(distinct code_pe) codes_uniques from public.points_eau
union all select 'pluviometrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_station,source_parent_id)) from public.observations_pluvio
union all select 'piezometrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_piezo,source_parent_id)) from public.observations_piezo
union all select 'limnimetrie',count(*),count(distinct source_entry_id),count(distinct coalesce(code_station,source_parent_id)) from public.observations_limni;
select 'pluvio_exploitables' controle,count(*) n from public.v_pluviometrie_dashboard_v46
union all select 'piezo_exploitables',count(*) from public.v_piezometrie_dashboard_v46
union all select 'limni_exploitables',count(*) from public.v_limnimetrie_dashboard_v46
union all select 'carte_points',count(*) from public.v_carte_points_v46;
select module,source,count(*) rejets,max(created_at) dernier_rejet from public.sync_rejects group by module,source order by module,source;
select module,source,statut,fetched_count,mapped_count,skipped_count,upserted_count,page_count,date_sync,message from public.sync_log order by date_sync desc limit 20;
select 'documents_db' controle,count(*) total from public.documents_ouvrages where actif=true
union all select 'storage_objets',count(*) from storage.objects where bucket_id='psore-documents';
