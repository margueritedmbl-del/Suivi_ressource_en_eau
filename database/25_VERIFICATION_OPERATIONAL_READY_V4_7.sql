-- PSORE V4.7.0 — vérification après migration et première synchronisation complète
select 'version' controle,value from public.system_settings where key='version_psore';
select 'date_debut_operationnelle' controle,coalesce(value,'NON DEFINIE - MODE TEST') value from public.system_settings where key='operational_data_start_date';
select 'stations_pluvio_physiques' controle,count(*)::text value from public.v_stations_pluvio_canonical_v47
union all select 'piezometres_physiques',count(*)::text from public.v_piezometres_canonical_v47
union all select 'stations_limni_physiques',count(*)::text from public.v_stations_limni_canonical_v47
union all select 'points_eau',count(*)::text from public.points_eau
union all select 'releves_pluvio_operationnels',count(*)::text from public.v_pluviometrie_dashboard_v47
union all select 'mesures_piezo_operationnelles',count(*)::text from public.v_piezometrie_dashboard_v47
union all select 'lectures_limni_operationnelles',count(*)::text from public.v_limnimetrie_dashboard_v47;
select module,source,statut,nb_enregistrements,date_sync,message from public.sync_log order by date_sync desc limit 12;
select module,source,reason,count(*) from public.sync_rejects group by module,source,reason order by module,source,count(*) desc;
