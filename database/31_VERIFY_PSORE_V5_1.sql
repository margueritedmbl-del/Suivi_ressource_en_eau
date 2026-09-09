-- Vérification PSORE V5.1
select module,count(*) as stations_officielles from public.monitoring_network_registry where actif is true group by module order by module;
select 'pluviometrie' as module,count(*) as observations,count(distinct code_site) as stations_avec_donnees from public.v_pluviometrie_dashboard_v50
union all select 'piezometrie',count(*),count(distinct code_site) from public.v_piezometrie_dashboard_v50
union all select 'limnimetrie',count(*),count(distinct code_site) from public.v_limnimetrie_dashboard_v50;
select key,value from public.system_settings where key in ('version_psore','operational_data_start_date','decision_scenario_weights') order by key;
