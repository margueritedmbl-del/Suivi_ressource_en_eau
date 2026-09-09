select module,count(*) filter(where actif) as stations_reseau from public.monitoring_network_registry group by module order by module;
select 'pluviometrie' module,count(*) observations,count(distinct code_site) stations_avec_donnees from public.v_pluviometrie_dashboard_v47
union all select 'piezometrie',count(*),count(distinct code_site) from public.v_piezometrie_dashboard_v47
union all select 'limnimetrie',count(*),count(distinct code_site) from public.v_limnimetrie_dashboard_v47;
select module,count(*) as points_cartographiques from public.v_carte_points_v47 group by module order by module;
