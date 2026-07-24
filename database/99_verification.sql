-- PSORE V2.4 — Vérification après migration
select 'tables_public' as verification, count(*)::text as resultat
from information_schema.tables
where table_schema='public'
and table_name in (
  'roles','profils','configuration','regions','cercles','communes',
  'stations_pluvio','observations_pluvio','piezometres','observations_piezo',
  'stations_limni','observations_limni','points_eau','controles_points_eau',
  'epicollect_sources','sync_log','alertes','system_settings','logs'
);

select 'roles' as verification, string_agg(nom_role, ', ' order by nom_role) as resultat
from public.roles;

select 'sources_epicollect' as verification, count(*)::text as resultat
from public.epicollect_sources;

select 'vues_dashboard' as verification, count(*)::text as resultat
from information_schema.views
where table_schema='public'
and table_name in ('v_points_eau_dashboard','v_pluviometrie_dashboard','v_piezometrie_dashboard','v_limnimetrie_dashboard','v_carte_points','dashboard_global','v_alertes');

select 'dashboard_global' as verification, row_to_json(dashboard_global)::text as resultat
from public.dashboard_global;
