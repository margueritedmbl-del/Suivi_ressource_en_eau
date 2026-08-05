-- PSORE V2.4 — Lot 7 : Dashboard institutionnel global
-- Script réexécutable. Il crée des vues de synthèse utiles au pilotage PTCS / DNH / DRHK.

create or replace view public.v_dashboard_institutionnel_kpi as
select 'points_eau'::text as module, 'Points d’eau'::text as libelle, count(*)::integer as total
from public.points_eau
union all
select 'pluviometrie', 'Observations pluviométriques', count(*)::integer from public.observations_pluvio
union all
select 'piezometrie', 'Observations piézométriques', count(*)::integer from public.observations_piezo
union all
select 'limnimetrie', 'Observations limnimétriques', count(*)::integer from public.observations_limni
union all
select 'stations_pluvio', 'Stations pluviométriques', count(*)::integer from public.stations_pluvio
union all
select 'piezometres', 'Piézomètres', count(*)::integer from public.piezometres
union all
select 'stations_limni', 'Stations limnimétriques', count(*)::integer from public.stations_limni;

create or replace view public.v_dashboard_alertes_consolidees as
select
  'points_eau'::text as module,
  id::text as id,
  coalesce(commune, 'Non renseigné') as commune,
  coalesce(code_pe, village, 'Non renseigné') as site,
  null::date as date_observation,
  case
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%non fonctionnel%' then 'Élevée'
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%abandon%' then 'Élevée'
    when latitude is null or longitude is null then 'Moyenne'
    else 'Faible'
  end as niveau,
  coalesce(besoin_rehabilitation, problemes, etat, 'Contrôle qualité / réhabilitation') as message
from public.points_eau
where lower(coalesce(fonctionnalite_forage, etat, '')) like '%non fonctionnel%'
   or lower(coalesce(fonctionnalite_forage, etat, '')) like '%abandon%'
   or latitude is null
   or longitude is null
union all
select module, id::text, commune, code_site as site, date_observation, niveau_alerte as niveau, statut_qualite as message
from public.v_suivis_hydrologiques_dashboard
where alerte_valeur or alerte_crue or alerte_secheresse or alerte_gps or alerte_donnee;

create or replace view public.v_dashboard_derniers_releves as
select 'pluviometrie'::text as module, date_observation, code_site, commune, valeur_observee, 'mm'::text as unite
from public.v_pluviometrie_dashboard
union all
select 'piezometrie', date_observation, code_site, commune, valeur_observee, 'm'
from public.v_piezometrie_dashboard
union all
select 'limnimetrie', date_observation, code_site, commune, valeur_observee, 'm/cm'
from public.v_limnimetrie_dashboard;

create index if not exists idx_sync_log_module_date on public.sync_log(module, date_sync desc);
create index if not exists idx_alertes_module_date on public.alertes(module, created_at desc);

comment on view public.v_dashboard_institutionnel_kpi is 'KPI consolidés du dashboard institutionnel PSORE.';
comment on view public.v_dashboard_alertes_consolidees is 'Alertes consolidées pour points d’eau, piézométrie, pluviométrie et limnimétrie.';
comment on view public.v_dashboard_derniers_releves is 'Dernières observations hydrologiques consolidées.';
