create or replace view dashboard_global as
select
  (select count(*) from stations_pluvio) as stations_pluvio,
  (select count(*) from observations_pluvio) as observations_pluvio,
  (select count(*) from piezometres) as piezometres,
  (select count(*) from observations_piezo) as observations_piezo,
  (select count(*) from stations_limni) as stations_limni,
  (select count(*) from observations_limni) as observations_limni,
  (select count(*) from points_eau) as points_eau,
  (select count(*) from points_eau where lower(coalesce(type_infrastructure,type_ouvrage,'')) like '%forage%') as points_eau_forages,
  (select count(*) from points_eau where lower(coalesce(type_infrastructure,type_ouvrage,'')) like '%puits%') as points_eau_puits,
  (select count(*) from points_eau where lower(coalesce(fonctionnalite_forage,etat,'')) like '%non fonctionnel%') as points_eau_non_fonctionnels,
  (select count(*) from points_eau where latitude is null or longitude is null) as points_eau_sans_gps;

create or replace view v_points_eau_dashboard as
select
  id,
  source_entry_id,
  synced_at,
  coalesce(code_pe, titre_source, source_entry_id) as code_pe,
  created_at_source,
  uploaded_at_source,
  titre_source,
  enqueteur_initial,
  date_collecte,
  heure_collecte,
  coalesce(commune, c.nom) as commune,
  village,
  localite,
  latitude,
  longitude,
  precision_gps,
  utm_northing,
  utm_easting,
  utm_zone,
  photo_infrastructure,
  photo_emprise,
  coalesce(type_infrastructure, type_ouvrage) as type_infrastructure,
  type_puits,
  equipement_puits,
  date_realisation_puits,
  hauteur_margelle,
  diametre_cm,
  commentaire_puits,
  type_forage,
  coalesce(fonctionnalite_forage, etat, 'Non renseigné') as fonctionnalite_forage,
  case
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%non fonctionnel%' then 'Non fonctionnel'
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%abandon%' then 'Abandonné'
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%partiel%' then 'Fonctionnalité partielle'
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%fonctionnel%' then 'Fonctionnel'
    else 'Non renseigné'
  end as statut_fonctionnalite,
  coalesce(equipement_forage, equipement_puits, 'Non renseigné') as equipement,
  equipement_forage,
  date_realisation_forage,
  nombre_total_bornes,
  nombre_bornes_fonctionnelles,
  coalesce(organe_gestion, 'Non renseigné') as organe_gestion,
  type_organe,
  coalesce(fonctionnalite_organe, 'Non renseigné') as fonctionnalite_organe,
  commentaire_gestion,
  date_mesure,
  niveau_eau,
  coalesce(profondeur_ouvrage, profondeur) as profondeur_ouvrage,
  commentaire_mesure,
  temperature_c,
  ph,
  conductivite,
  turbidite_ntu,
  tds,
  coalesce(presence_odeur, 'Non renseigné') as presence_odeur,
  commentaire_qualite,
  etat_apparent,
  problemes,
  besoin_rehabilitation,
  recommandation,
  (
    case when lower(coalesce(fonctionnalite_forage, etat, '')) like '%non fonctionnel%' or lower(coalesce(fonctionnalite_forage, etat, '')) like '%abandon%' then 5 else 0 end +
    case when lower(coalesce(fonctionnalite_forage, etat, '')) like '%partiel%' then 3 else 0 end +
    case when lower(coalesce(fonctionnalite_organe, '')) like '%non fonctionnel%' then 3 else 0 end +
    case when lower(coalesce(organe_gestion, '')) = 'non' then 2 else 0 end +
    case when besoin_rehabilitation is not null and besoin_rehabilitation <> '' then 3 else 0 end +
    case when problemes is not null and lower(problemes) not in ('ras','aucun','néant','neant') then 2 else 0 end +
    case when ph is not null and (ph < 6.5 or ph > 8.5) then 2 else 0 end +
    case when temperature_c is not null and temperature_c > 50 then 2 else 0 end +
    case when latitude is null or longitude is null then 1 else 0 end
  ) as score_priorite,
  case
    when (
      case when lower(coalesce(fonctionnalite_forage, etat, '')) like '%non fonctionnel%' or lower(coalesce(fonctionnalite_forage, etat, '')) like '%abandon%' then 5 else 0 end +
      case when lower(coalesce(fonctionnalite_forage, etat, '')) like '%partiel%' then 3 else 0 end +
      case when lower(coalesce(fonctionnalite_organe, '')) like '%non fonctionnel%' then 3 else 0 end +
      case when lower(coalesce(organe_gestion, '')) = 'non' then 2 else 0 end +
      case when besoin_rehabilitation is not null and besoin_rehabilitation <> '' then 3 else 0 end +
      case when problemes is not null and lower(problemes) not in ('ras','aucun','néant','neant') then 2 else 0 end +
      case when ph is not null and (ph < 6.5 or ph > 8.5) then 2 else 0 end +
      case when temperature_c is not null and temperature_c > 50 then 2 else 0 end +
      case when latitude is null or longitude is null then 1 else 0 end
    ) >= 8 then 'Élevée'
    when (
      case when lower(coalesce(fonctionnalite_forage, etat, '')) like '%non fonctionnel%' or lower(coalesce(fonctionnalite_forage, etat, '')) like '%abandon%' then 5 else 0 end +
      case when lower(coalesce(fonctionnalite_forage, etat, '')) like '%partiel%' then 3 else 0 end +
      case when lower(coalesce(fonctionnalite_organe, '')) like '%non fonctionnel%' then 3 else 0 end +
      case when lower(coalesce(organe_gestion, '')) = 'non' then 2 else 0 end +
      case when besoin_rehabilitation is not null and besoin_rehabilitation <> '' then 3 else 0 end +
      case when problemes is not null and lower(problemes) not in ('ras','aucun','néant','neant') then 2 else 0 end +
      case when ph is not null and (ph < 6.5 or ph > 8.5) then 2 else 0 end +
      case when temperature_c is not null and temperature_c > 50 then 2 else 0 end +
      case when latitude is null or longitude is null then 1 else 0 end
    ) >= 4 then 'Moyenne'
    else 'Faible'
  end as priorite_rehabilitation,
  (latitude is null or longitude is null) as alerte_gps,
  (temperature_c is not null and temperature_c > 50) as alerte_temperature,
  (ph is not null and (ph < 6.5 or ph > 8.5)) as alerte_ph,
  ((ph is not null and (ph < 6.5 or ph > 8.5)) or (temperature_c is not null and temperature_c > 50) or lower(coalesce(presence_odeur,'')) like '%oui%') as alerte_qualite_eau,
  case
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%non fonctionnel%' then '#dc2626'
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%abandon%' then '#111827'
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%partiel%' then '#f97316'
    when lower(coalesce(fonctionnalite_forage, etat, '')) like '%fonctionnel%' then '#16a34a'
    else '#64748b'
  end as couleur_statut
from points_eau pe
left join communes c on pe.commune_id = c.id;

create or replace view v_pluviometrie_dashboard as
select
  o.id,
  o.date_observation,
  s.code_station as code_site,
  s.nom_station as nom_site,
  c.nom as commune,
  s.latitude,
  s.longitude,
  o.pluie_24h_mm as valeur_observee,
  o.pluie_24h_mm,
  o.cumul_mensuel_mm,
  o.observateur,
  o.photo_url,
  o.synced_at,
  case when o.pluie_24h_mm is null or o.pluie_24h_mm < 0 or o.pluie_24h_mm > 300 then true else false end as alerte_valeur,
  case when s.latitude is null or s.longitude is null then true else false end as alerte_gps
from observations_pluvio o
left join stations_pluvio s on o.station_id = s.id
left join communes c on s.commune_id = c.id;

create or replace view v_piezometrie_dashboard as
select
  o.id,
  o.date_observation,
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
  case when p.latitude is null or p.longitude is null then true else false end as alerte_gps
from observations_piezo o
left join piezometres p on o.piezometre_id = p.id
left join communes c on p.commune_id = c.id;

create or replace view v_limnimetrie_dashboard as
select
  o.id,
  o.date_observation,
  s.code_station as code_site,
  s.cours_eau as nom_site,
  c.nom as commune,
  s.latitude,
  s.longitude,
  o.hauteur_eau as valeur_observee,
  o.hauteur_eau,
  o.periode,
  o.commentaire,
  o.photo_url,
  o.synced_at,
  case when o.hauteur_eau is null or o.hauteur_eau < 0 then true else false end as alerte_valeur,
  case when s.latitude is null or s.longitude is null then true else false end as alerte_gps
from observations_limni o
left join stations_limni s on o.station_id = s.id
left join communes c on s.commune_id = c.id;

create or replace view v_carte_points as
select 'pluviometrie' as module, code_station as code, nom_station as libelle, latitude, longitude, synced_at, null::text as statut_fonctionnalite, null::text as type_infrastructure, null::text as commune, null::text as village, null::text as priorite_rehabilitation, null::text as equipement, null::text as organe_gestion, null::numeric as ph, null::numeric as conductivite, null::numeric as tds, false as alerte_qualite_eau, false as alerte_gps, '#7C3AED'::text as couleur from stations_pluvio where latitude is not null and longitude is not null
union all select 'piezometrie', code_piezo, code_piezo, latitude, longitude, synced_at, null, null, null, null, null, null, null, null, null, null, false, false, '#48CAE4' from piezometres where latitude is not null and longitude is not null
union all select 'limnimetrie', code_station, cours_eau, latitude, longitude, synced_at, null, null, null, null, null, null, null, null, null, null, false, false, '#16A34A' from stations_limni where latitude is not null and longitude is not null
union all select 'points_eau', code_pe, coalesce(localite, village, type_infrastructure), latitude, longitude, synced_at, statut_fonctionnalite, type_infrastructure, commune, village, priorite_rehabilitation, equipement, organe_gestion, ph, conductivite, tds, alerte_qualite_eau, alerte_gps, '#0077B6' from v_points_eau_dashboard where latitude is not null and longitude is not null;
