-- Vérification PSORE V5.0.0
select module,count(*) filter(where actif) as stations_reseau from public.monitoring_network_registry group by module order by module;
select module,code,short_code,locality,commune from public.monitoring_network_registry where module='piezometrie' order by short_code;
select 'pluvio' controle,count(*) observations,count(distinct code_site) stations_avec_donnees from public.v_pluviometrie_dashboard_v50
union all select 'piezo',count(*),count(distinct code_site) from public.v_piezometrie_dashboard_v50
union all select 'limni',count(*),count(distinct code_site) from public.v_limnimetrie_dashboard_v50;
select module,count(*) cartographiables from public.v_carte_points_v50 where latitude is not null and longitude is not null group by module order by module;
select key,value from public.system_settings where key in('version_psore','operational_data_start_date','decision_scenario_weights') order by key;
