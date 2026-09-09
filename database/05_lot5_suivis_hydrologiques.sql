-- PSORE V2.4 — Lot 5 : tableaux de bord piézométrie, pluviométrie, limnimétrie
-- Script réexécutable. Il enrichit les vues de décision et ajoute des index utiles.

create index if not exists idx_observations_pluvio_date on public.observations_pluvio(date_observation);
create index if not exists idx_observations_piezo_date on public.observations_piezo(date_observation);
create index if not exists idx_observations_limni_date on public.observations_limni(date_observation);
create index if not exists idx_stations_pluvio_commune on public.stations_pluvio(commune_id);
create index if not exists idx_piezometres_commune on public.piezometres(commune_id);
create index if not exists idx_stations_limni_commune on public.stations_limni(commune_id);

create or replace view public.v_pluviometrie_dashboard as
select
  o.id,
  o.date_observation,
  s.id as station_id,
  s.code_station as code_site,
  s.nom_station as nom_site,
  c.nom as commune,
  s.latitude,
  s.longitude,
  s.altitude,
  o.pluie_24h_mm as valeur_observee,
  o.pluie_24h_mm,
  o.cumul_mensuel_mm,
  o.observateur,
  null::text as commentaire,
  o.photo_url,
  o.synced_at,
  case when o.pluie_24h_mm is null or o.pluie_24h_mm < 0 or o.pluie_24h_mm > 300 then true else false end as alerte_valeur,
  case when o.pluie_24h_mm is not null and o.pluie_24h_mm >= 100 then true else false end as alerte_crue,
  false as alerte_secheresse,
  case when s.latitude is null or s.longitude is null then true else false end as alerte_gps,
  case when o.date_observation is null or s.code_station is null then true else false end as alerte_donnee,
  case
    when o.pluie_24h_mm is null then 'Donnée manquante'
    when o.pluie_24h_mm < 0 then 'Valeur négative'
    when o.pluie_24h_mm > 300 then 'Valeur extrême à vérifier'
    when o.pluie_24h_mm >= 100 then 'Pluie exceptionnelle'
    else 'Normal'
  end as statut_qualite,
  case
    when o.pluie_24h_mm is null or o.pluie_24h_mm < 0 or o.pluie_24h_mm > 300 then 'Élevée'
    when o.pluie_24h_mm >= 100 or s.latitude is null or s.longitude is null then 'Moyenne'
    else 'Faible'
  end as niveau_alerte
from public.observations_pluvio o
left join public.stations_pluvio s on o.station_id = s.id
left join public.communes c on s.commune_id = c.id;

create or replace view public.v_piezometrie_dashboard as
select
  o.id,
  o.date_observation,
  p.id as piezometre_id,
  p.code_piezo as code_site,
  p.code_piezo as nom_site,
  c.nom as commune,
  p.latitude,
  p.longitude,
  o.niveau_statique as valeur_observee,
  o.niveau_statique,
  p.profondeur,
  p.aquifere,
  o.observateur,
  o.commentaire,
  o.photo_url,
  o.synced_at,
  case when o.niveau_statique is null or o.niveau_statique < 0 or (p.profondeur is not null and o.niveau_statique > p.profondeur) then true else false end as alerte_valeur,
  false as alerte_crue,
  case when p.profondeur is not null and o.niveau_statique is not null and o.niveau_statique >= p.profondeur * 0.85 then true else false end as alerte_secheresse,
  case when p.latitude is null or p.longitude is null then true else false end as alerte_gps,
  case when o.date_observation is null or p.code_piezo is null then true else false end as alerte_donnee,
  case
    when o.niveau_statique is null then 'Donnée manquante'
    when o.niveau_statique < 0 then 'Valeur négative'
    when p.profondeur is not null and o.niveau_statique > p.profondeur then 'Supérieur à la profondeur'
    when p.profondeur is not null and o.niveau_statique >= p.profondeur * 0.85 then 'Niveau critique bas'
    else 'Normal'
  end as statut_qualite,
  case
    when o.niveau_statique is null or o.niveau_statique < 0 or (p.profondeur is not null and o.niveau_statique > p.profondeur) then 'Élevée'
    when p.profondeur is not null and o.niveau_statique is not null and o.niveau_statique >= p.profondeur * 0.85 then 'Moyenne'
    when p.latitude is null or p.longitude is null then 'Moyenne'
    else 'Faible'
  end as niveau_alerte
from public.observations_piezo o
left join public.piezometres p on o.piezometre_id = p.id
left join public.communes c on p.commune_id = c.id;

create or replace view public.v_limnimetrie_dashboard as
select
  o.id,
  o.date_observation,
  s.id as station_id,
  s.code_station as code_site,
  s.cours_eau as nom_site,
  c.nom as commune,
  s.latitude,
  s.longitude,
  o.hauteur_eau as valeur_observee,
  o.hauteur_eau,
  o.periode,
  null::text as observateur,
  o.commentaire,
  o.photo_url,
  o.synced_at,
  case when o.hauteur_eau is null or o.hauteur_eau < 0 or o.hauteur_eau > 2000 then true else false end as alerte_valeur,
  case when o.hauteur_eau is not null and o.hauteur_eau >= 500 then true else false end as alerte_crue,
  case when o.hauteur_eau is not null and o.hauteur_eau <= 5 then true else false end as alerte_secheresse,
  case when s.latitude is null or s.longitude is null then true else false end as alerte_gps,
  case when o.date_observation is null or s.code_station is null then true else false end as alerte_donnee,
  case
    when o.hauteur_eau is null then 'Donnée manquante'
    when o.hauteur_eau < 0 then 'Valeur négative'
    when o.hauteur_eau > 2000 then 'Valeur extrême à vérifier'
    when o.hauteur_eau >= 500 then 'Niveau haut / crue potentielle'
    when o.hauteur_eau <= 5 then 'Niveau très bas'
    else 'Normal'
  end as statut_qualite,
  case
    when o.hauteur_eau is null or o.hauteur_eau < 0 or o.hauteur_eau > 2000 then 'Élevée'
    when o.hauteur_eau >= 500 or o.hauteur_eau <= 5 or s.latitude is null or s.longitude is null then 'Moyenne'
    else 'Faible'
  end as niveau_alerte
from public.observations_limni o
left join public.stations_limni s on o.station_id = s.id
left join public.communes c on s.commune_id = c.id;

create or replace view public.v_suivis_hydrologiques_dashboard as
select
  'pluviometrie'::text as module,
  id,
  date_observation,
  code_site,
  nom_site,
  commune,
  latitude,
  longitude,
  valeur_observee,
  pluie_24h_mm::numeric as pluie_24h_mm,
  null::numeric as niveau_statique,
  null::numeric as hauteur_eau,
  observateur,
  commentaire,
  photo_url,
  synced_at,
  alerte_valeur,
  alerte_crue,
  alerte_secheresse,
  alerte_gps,
  alerte_donnee,
  statut_qualite,
  niveau_alerte
from public.v_pluviometrie_dashboard
union all
select
  'piezometrie'::text as module,
  id,
  date_observation,
  code_site,
  nom_site,
  commune,
  latitude,
  longitude,
  valeur_observee,
  null::numeric as pluie_24h_mm,
  niveau_statique::numeric,
  null::numeric as hauteur_eau,
  observateur,
  commentaire,
  photo_url,
  synced_at,
  alerte_valeur,
  alerte_crue,
  alerte_secheresse,
  alerte_gps,
  alerte_donnee,
  statut_qualite,
  niveau_alerte
from public.v_piezometrie_dashboard
union all
select
  'limnimetrie'::text as module,
  id,
  date_observation,
  code_site,
  nom_site,
  commune,
  latitude,
  longitude,
  valeur_observee,
  null::numeric as pluie_24h_mm,
  null::numeric as niveau_statique,
  hauteur_eau::numeric,
  observateur,
  commentaire,
  photo_url,
  synced_at,
  alerte_valeur,
  alerte_crue,
  alerte_secheresse,
  alerte_gps,
  alerte_donnee,
  statut_qualite,
  niveau_alerte
from public.v_limnimetrie_dashboard;
