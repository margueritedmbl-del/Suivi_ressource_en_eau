-- PSORE V2.4 — Migration complète corrigée
-- Version: 2026-07-01
-- Usage: exécuter ce fichier en une seule fois dans Supabase SQL Editor sur un projet Supabase vide.
-- Objectif: créer les tables, rôles, sources Epicollect5, vues dashboard/cartographie et vérifications de base.

create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- =========================================================
-- 1. Tables système, rôles et profils
-- =========================================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  nom_role text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.profils (
  id uuid primary key,
  nom text,
  prenom text,
  email text not null unique,
  telephone text,
  role_id uuid references public.roles(id) on delete set null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.configuration (
  id uuid primary key default gen_random_uuid(),
  cle text unique not null,
  valeur text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  niveau text default 'info',
  module text,
  message text,
  details jsonb,
  created_at timestamptz not null default now()
);

insert into public.roles (nom_role, description) values
('Super administrateur','Accès total : administration, utilisateurs, sécurité et paramétrage'),
('Administrateur PTCS','Gestion complète de la plateforme'),
('DNH/DRHK','Consultation, validation et export'),
('Collecteur','Collecte, synchronisation terrain et mise à jour autorisée'),
('Observateur','Consultation simple des données autorisées'),
('Public','Accès limité')
on conflict (nom_role) do update set description = excluded.description;

insert into public.configuration (cle, valeur) values
('version_psore','V2_4'),
('nom_plateforme','PSORE – Plateforme de Suivi et d’Observation des Ressources en Eau'),
('organisation','PTCS – Enabel – DNH/DRHK'),
('domaine','eau-ptcs-mali.org'),
('bootstrap_done','false')
on conflict (cle) do update set valeur = excluded.valeur, updated_at = now();

insert into public.system_settings (key, value, description) values
('version_psore','V2_4','Version applicative PSORE'),
('public_map_default_layers','points_eau','Couches affichées par défaut sur la carte publique'),
('institution','PTCS – Enabel – DNH/DRHK','Institution propriétaire')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

-- =========================================================
-- 2. Référentiels territoriaux
-- =========================================================
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  nom text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cercles (
  id uuid primary key default gen_random_uuid(),
  region_id uuid references public.regions(id) on delete set null,
  nom text not null,
  created_at timestamptz not null default now(),
  unique(region_id, nom)
);

create table if not exists public.communes (
  id uuid primary key default gen_random_uuid(),
  cercle_id uuid references public.cercles(id) on delete set null,
  nom text not null,
  created_at timestamptz not null default now(),
  unique(cercle_id, nom)
);

insert into public.regions (nom) values ('Koulikoro') on conflict (nom) do nothing;

-- =========================================================
-- 3. Tables métier — Pluviométrie
-- =========================================================
create table if not exists public.stations_pluvio (
  id uuid primary key default gen_random_uuid(),
  code_station text unique,
  nom_station text,
  commune_id uuid references public.communes(id) on delete set null,
  commune text,
  village text,
  latitude numeric,
  longitude numeric,
  geom geography(Point,4326),
  altitude numeric,
  actif boolean not null default true,
  source_entry_id text unique,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.observations_pluvio (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references public.stations_pluvio(id) on delete set null,
  code_station text,
  date_observation date,
  pluie_24h_mm numeric,
  cumul_mensuel_mm numeric,
  observateur text,
  commentaire text,
  photo_url text,
  source_entry_id text unique,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 4. Tables métier — Piézométrie
-- =========================================================
create table if not exists public.piezometres (
  id uuid primary key default gen_random_uuid(),
  code_piezo text unique,
  commune_id uuid references public.communes(id) on delete set null,
  commune text,
  village text,
  localite text,
  latitude numeric,
  longitude numeric,
  geom geography(Point,4326),
  profondeur numeric,
  aquifere text,
  actif boolean not null default true,
  source_entry_id text unique,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.observations_piezo (
  id uuid primary key default gen_random_uuid(),
  piezometre_id uuid references public.piezometres(id) on delete set null,
  code_piezo text,
  date_observation date,
  niveau_statique numeric,
  observateur text,
  commentaire text,
  photo_url text,
  source_entry_id text unique,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 5. Tables métier — Limnimétrie
-- =========================================================
create table if not exists public.stations_limni (
  id uuid primary key default gen_random_uuid(),
  code_station text unique,
  cours_eau text,
  commune_id uuid references public.communes(id) on delete set null,
  commune text,
  village text,
  localite text,
  latitude numeric,
  longitude numeric,
  geom geography(Point,4326),
  actif boolean not null default true,
  source_entry_id text unique,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.observations_limni (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references public.stations_limni(id) on delete set null,
  code_station text,
  date_observation date,
  periode text,
  hauteur_eau numeric,
  observateur text,
  commentaire text,
  photo_url text,
  source_entry_id text unique,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 6. Tables métier — Points d'eau
-- =========================================================
create table if not exists public.points_eau (
  id uuid primary key default gen_random_uuid(),
  code_pe text unique,
  source_entry_id text unique,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Champs source Epicollect5
  created_at_source timestamptz,
  uploaded_at_source timestamptz,
  titre_source text,
  enqueteur_initial text,
  date_collecte date,
  heure_collecte text,

  -- Localisation
  commune_id uuid references public.communes(id) on delete set null,
  commune text,
  village text,
  localite text,
  latitude numeric,
  longitude numeric,
  geom geography(Point,4326),
  precision_gps numeric,
  utm_northing numeric,
  utm_easting numeric,
  utm_zone text,

  -- Photos
  photo_infrastructure text,
  photo_emprise text,

  -- Type / ouvrage
  type_ouvrage text,
  type_infrastructure text,
  type_puits text,
  equipement_puits text,
  date_realisation_puits text,
  hauteur_margelle numeric,
  diametre_cm numeric,
  commentaire_puits text,
  type_forage text,
  fonctionnalite_forage text,
  equipement_forage text,
  date_realisation_forage text,
  profondeur numeric,
  profondeur_ouvrage numeric,
  nombre_total_bornes numeric,
  nombre_bornes_fonctionnelles numeric,
  etat text,

  -- Gouvernance
  organe_gestion text,
  type_organe text,
  fonctionnalite_organe text,
  commentaire_gestion text,

  -- Mesures et qualité
  date_mesure date,
  niveau_eau numeric,
  commentaire_mesure text,
  temperature_c numeric,
  ph numeric,
  conductivite numeric,
  turbidite_ntu numeric,
  tds numeric,
  presence_odeur text,
  commentaire_qualite text,

  -- Diagnostic
  etat_apparent text,
  problemes text,
  besoin_rehabilitation text,
  recommandation text,

  -- Données personnelles — privées uniquement
  nom_repondant text,
  contact_repondant text
);

create table if not exists public.controles_points_eau (
  id uuid primary key default gen_random_uuid(),
  point_eau_id uuid references public.points_eau(id) on delete cascade,
  date_visite date,
  fonctionnalite text,
  panne text,
  qualite_eau text,
  commentaire text,
  photo_url text,
  source_entry_id text unique,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 7. Synchronisation Epicollect5
-- =========================================================
create table if not exists public.epicollect_sources (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  type_source text not null,
  libelle text not null,
  project_slug text not null,
  api_url text not null,
  form_url text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module, type_source)
);

create table if not exists public.sync_log (
  id uuid primary key default gen_random_uuid(),
  module text,
  source text,
  nb_enregistrements integer default 0,
  fetched_count integer default 0,
  mapped_count integer default 0,
  skipped_count integer default 0,
  upserted_count integer default 0,
  page_count integer default 0,
  duration_ms integer default 0,
  statut text,
  message text,
  api_url text,
  started_at timestamptz,
  finished_at timestamptz,
  date_sync timestamptz not null default now(),
  details jsonb
);

create table if not exists public.alertes (
  id uuid primary key default gen_random_uuid(),
  module text,
  niveau text,
  message text,
  statut text default 'ouverte',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

insert into public.epicollect_sources (module,type_source,libelle,project_slug,api_url,form_url,actif) values
('pluviometrie','stations','Référentiel des pluviomètres','suivi-pluviometrique-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a047a461c0c4','https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs',true),
('pluviometrie','releves','Relevés pluviométriques','suivi-pluviometrique-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a05a7178bf71','https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs',true),
('piezometrie','referentiel','Référentiel piézomètres','suivi-piezo-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a047a461c0c4','https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs',true),
('piezometrie','mesures','Mesures piézométriques','suivi-piezo-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a05a7178bf71','https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs',true),
('limnimetrie','stations','Stations limnimétriques','suivi-limnimetrique-ce-koulikoro','https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a047a461c0c4','https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro',true),
('limnimetrie','lectures','Lectures limnimétriques','suivi-limnimetrique-ce-koulikoro','https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a05a7178bf71','https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro',true),
('points_eau','inventaire','Inventaire points d’eau','etat-des-lieux-pe-ptcs','https://five.epicollect.net/api/export/entries/etat-des-lieux-pe-ptcs?form_ref=9365afaa5ef642ffb8ed24b8b51bf93a_5db097aea78d5','https://five.epicollect.net/project/etat-des-lieux-pe-ptcs',true)
on conflict (module,type_source) do update set
  libelle = excluded.libelle,
  project_slug = excluded.project_slug,
  api_url = excluded.api_url,
  form_url = excluded.form_url,
  actif = true,
  updated_at = now();

-- =========================================================
-- 8. Index
-- =========================================================
create index if not exists idx_profils_role_id on public.profils(role_id);
create index if not exists idx_points_eau_commune on public.points_eau(commune);
create index if not exists idx_points_eau_village on public.points_eau(village);
create index if not exists idx_points_eau_type on public.points_eau(type_infrastructure);
create index if not exists idx_points_eau_fonctionnalite on public.points_eau(fonctionnalite_forage);
create index if not exists idx_points_eau_gps on public.points_eau(latitude, longitude);
create index if not exists idx_stations_pluvio_gps on public.stations_pluvio(latitude, longitude);
create index if not exists idx_piezometres_gps on public.piezometres(latitude, longitude);
create index if not exists idx_stations_limni_gps on public.stations_limni(latitude, longitude);
create index if not exists idx_observations_pluvio_date on public.observations_pluvio(date_observation);
create index if not exists idx_observations_piezo_date on public.observations_piezo(date_observation);
create index if not exists idx_observations_limni_date on public.observations_limni(date_observation);
create index if not exists sync_log_module_date_idx on public.sync_log(module, date_sync desc);
create index if not exists epicollect_sources_module_type_idx on public.epicollect_sources(module, type_source);

-- =========================================================
-- 9. Vues dashboard
-- =========================================================
create or replace view public.v_points_eau_dashboard as
select
  pe.id,
  pe.source_entry_id,
  pe.synced_at,
  coalesce(pe.code_pe, pe.titre_source, pe.source_entry_id) as code_pe,
  pe.created_at_source,
  pe.uploaded_at_source,
  pe.titre_source,
  pe.enqueteur_initial,
  pe.date_collecte,
  pe.heure_collecte,
  coalesce(pe.commune, c.nom) as commune,
  pe.village,
  pe.localite,
  pe.latitude,
  pe.longitude,
  pe.precision_gps,
  pe.utm_northing,
  pe.utm_easting,
  pe.utm_zone,
  pe.photo_infrastructure,
  pe.photo_emprise,
  coalesce(pe.type_infrastructure, pe.type_ouvrage) as type_infrastructure,
  pe.type_puits,
  pe.equipement_puits,
  pe.date_realisation_puits,
  pe.hauteur_margelle,
  pe.diametre_cm,
  pe.commentaire_puits,
  pe.type_forage,
  coalesce(pe.fonctionnalite_forage, pe.etat, 'Non renseigné') as fonctionnalite_forage,
  case
    when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%non fonctionnel%' then 'Non fonctionnel'
    when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%abandon%' then 'Abandonné'
    when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%partiel%' then 'Fonctionnalité partielle'
    when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%fonctionnel%' then 'Fonctionnel'
    else 'Non renseigné'
  end as statut_fonctionnalite,
  coalesce(pe.equipement_forage, pe.equipement_puits, 'Non renseigné') as equipement,
  pe.equipement_forage,
  pe.date_realisation_forage,
  pe.nombre_total_bornes,
  pe.nombre_bornes_fonctionnelles,
  coalesce(pe.organe_gestion, 'Non renseigné') as organe_gestion,
  pe.type_organe,
  coalesce(pe.fonctionnalite_organe, 'Non renseigné') as fonctionnalite_organe,
  pe.commentaire_gestion,
  pe.date_mesure,
  pe.niveau_eau,
  coalesce(pe.profondeur_ouvrage, pe.profondeur) as profondeur_ouvrage,
  pe.commentaire_mesure,
  pe.temperature_c,
  pe.ph,
  pe.conductivite,
  pe.turbidite_ntu,
  pe.tds,
  coalesce(pe.presence_odeur, 'Non renseigné') as presence_odeur,
  pe.commentaire_qualite,
  pe.etat_apparent,
  pe.problemes,
  pe.besoin_rehabilitation,
  pe.recommandation,
  (
    case when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%non fonctionnel%' or lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%abandon%' then 5 else 0 end +
    case when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%partiel%' then 3 else 0 end +
    case when lower(coalesce(pe.fonctionnalite_organe, '')) like '%non fonctionnel%' then 3 else 0 end +
    case when lower(coalesce(pe.organe_gestion, '')) = 'non' then 2 else 0 end +
    case when pe.besoin_rehabilitation is not null and pe.besoin_rehabilitation <> '' then 3 else 0 end +
    case when pe.problemes is not null and lower(pe.problemes) not in ('ras','aucun','néant','neant') then 2 else 0 end +
    case when pe.ph is not null and (pe.ph < 6.5 or pe.ph > 8.5) then 2 else 0 end +
    case when pe.temperature_c is not null and pe.temperature_c > 50 then 2 else 0 end +
    case when pe.latitude is null or pe.longitude is null then 1 else 0 end
  ) as score_priorite,
  case
    when (
      case when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%non fonctionnel%' or lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%abandon%' then 5 else 0 end +
      case when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%partiel%' then 3 else 0 end +
      case when lower(coalesce(pe.fonctionnalite_organe, '')) like '%non fonctionnel%' then 3 else 0 end +
      case when lower(coalesce(pe.organe_gestion, '')) = 'non' then 2 else 0 end +
      case when pe.besoin_rehabilitation is not null and pe.besoin_rehabilitation <> '' then 3 else 0 end +
      case when pe.problemes is not null and lower(pe.problemes) not in ('ras','aucun','néant','neant') then 2 else 0 end +
      case when pe.ph is not null and (pe.ph < 6.5 or pe.ph > 8.5) then 2 else 0 end +
      case when pe.temperature_c is not null and pe.temperature_c > 50 then 2 else 0 end +
      case when pe.latitude is null or pe.longitude is null then 1 else 0 end
    ) >= 8 then 'Élevée'
    when (
      case when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%non fonctionnel%' or lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%abandon%' then 5 else 0 end +
      case when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%partiel%' then 3 else 0 end +
      case when lower(coalesce(pe.fonctionnalite_organe, '')) like '%non fonctionnel%' then 3 else 0 end +
      case when lower(coalesce(pe.organe_gestion, '')) = 'non' then 2 else 0 end +
      case when pe.besoin_rehabilitation is not null and pe.besoin_rehabilitation <> '' then 3 else 0 end +
      case when pe.problemes is not null and lower(pe.problemes) not in ('ras','aucun','néant','neant') then 2 else 0 end +
      case when pe.ph is not null and (pe.ph < 6.5 or pe.ph > 8.5) then 2 else 0 end +
      case when pe.temperature_c is not null and pe.temperature_c > 50 then 2 else 0 end +
      case when pe.latitude is null or pe.longitude is null then 1 else 0 end
    ) >= 4 then 'Moyenne'
    else 'Faible'
  end as priorite_rehabilitation,
  (pe.latitude is null or pe.longitude is null) as alerte_gps,
  (pe.temperature_c is not null and pe.temperature_c > 50) as alerte_temperature,
  (pe.ph is not null and (pe.ph < 6.5 or pe.ph > 8.5)) as alerte_ph,
  ((pe.ph is not null and (pe.ph < 6.5 or pe.ph > 8.5)) or (pe.temperature_c is not null and pe.temperature_c > 50) or lower(coalesce(pe.presence_odeur,'')) like '%oui%') as alerte_qualite_eau,
  case
    when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%non fonctionnel%' then '#dc2626'
    when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%abandon%' then '#111827'
    when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%partiel%' then '#f97316'
    when lower(coalesce(pe.fonctionnalite_forage, pe.etat, '')) like '%fonctionnel%' then '#16a34a'
    else '#64748b'
  end as couleur_statut
from public.points_eau pe
left join public.communes c on pe.commune_id = c.id;

create or replace view public.v_pluviometrie_dashboard as
select
  o.id,
  o.date_observation,
  coalesce(s.code_station, o.code_station) as code_site,
  s.nom_station as nom_site,
  coalesce(s.commune, c.nom) as commune,
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
from public.observations_pluvio o
left join public.stations_pluvio s on o.station_id = s.id or (o.code_station is not null and o.code_station = s.code_station)
left join public.communes c on s.commune_id = c.id;

create or replace view public.v_piezometrie_dashboard as
select
  o.id,
  o.date_observation,
  coalesce(p.code_piezo, o.code_piezo) as code_site,
  p.code_piezo as nom_site,
  coalesce(p.commune, c.nom) as commune,
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
from public.observations_piezo o
left join public.piezometres p on o.piezometre_id = p.id or (o.code_piezo is not null and o.code_piezo = p.code_piezo)
left join public.communes c on p.commune_id = c.id;

create or replace view public.v_limnimetrie_dashboard as
select
  o.id,
  o.date_observation,
  coalesce(s.code_station, o.code_station) as code_site,
  s.cours_eau as nom_site,
  coalesce(s.commune, c.nom) as commune,
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
from public.observations_limni o
left join public.stations_limni s on o.station_id = s.id or (o.code_station is not null and o.code_station = s.code_station)
left join public.communes c on s.commune_id = c.id;

create or replace view public.dashboard_global as
select
  (select count(*) from public.stations_pluvio) as stations_pluvio,
  (select count(*) from public.observations_pluvio) as observations_pluvio,
  (select count(*) from public.piezometres) as piezometres,
  (select count(*) from public.observations_piezo) as observations_piezo,
  (select count(*) from public.stations_limni) as stations_limni,
  (select count(*) from public.observations_limni) as observations_limni,
  (select count(*) from public.points_eau) as points_eau,
  (select count(*) from public.points_eau where lower(coalesce(type_infrastructure,type_ouvrage,'')) like '%forage%') as points_eau_forages,
  (select count(*) from public.points_eau where lower(coalesce(type_infrastructure,type_ouvrage,'')) like '%puits%') as points_eau_puits,
  (select count(*) from public.points_eau where lower(coalesce(fonctionnalite_forage,etat,'')) like '%non fonctionnel%') as points_eau_non_fonctionnels,
  (select count(*) from public.points_eau where latitude is null or longitude is null) as points_eau_sans_gps;

create or replace view public.v_carte_points as
select
  'pluviometrie'::text as module,
  sp.code_station as code,
  sp.nom_station as libelle,
  sp.latitude,
  sp.longitude,
  sp.synced_at,
  null::text as statut_fonctionnalite,
  null::text as type_infrastructure,
  sp.commune as commune,
  sp.village as village,
  null::text as priorite_rehabilitation,
  null::text as equipement,
  null::text as organe_gestion,
  null::numeric as ph,
  null::numeric as conductivite,
  null::numeric as tds,
  false as alerte_qualite_eau,
  false as alerte_gps,
  '#7C3AED'::text as couleur
from public.stations_pluvio sp
where sp.latitude is not null and sp.longitude is not null
union all
select
  'piezometrie'::text,
  p.code_piezo,
  p.code_piezo,
  p.latitude,
  p.longitude,
  p.synced_at,
  null::text,
  null::text,
  p.commune,
  p.village,
  null::text,
  null::text,
  null::text,
  null::numeric,
  null::numeric,
  null::numeric,
  false,
  false,
  '#48CAE4'::text
from public.piezometres p
where p.latitude is not null and p.longitude is not null
union all
select
  'limnimetrie'::text,
  sl.code_station,
  sl.cours_eau,
  sl.latitude,
  sl.longitude,
  sl.synced_at,
  null::text,
  null::text,
  sl.commune,
  sl.village,
  null::text,
  null::text,
  null::text,
  null::numeric,
  null::numeric,
  null::numeric,
  false,
  false,
  '#16A34A'::text
from public.stations_limni sl
where sl.latitude is not null and sl.longitude is not null
union all
select
  'points_eau'::text,
  v.code_pe,
  coalesce(v.localite, v.village, v.type_infrastructure),
  v.latitude,
  v.longitude,
  v.synced_at,
  v.statut_fonctionnalite,
  v.type_infrastructure,
  v.commune,
  v.village,
  v.priorite_rehabilitation,
  v.equipement,
  v.organe_gestion,
  v.ph,
  v.conductivite,
  v.tds,
  v.alerte_qualite_eau,
  v.alerte_gps,
  '#0077B6'::text
from public.v_points_eau_dashboard v
where v.latitude is not null and v.longitude is not null;

create or replace view public.v_alertes as
select id, module, niveau, message, statut, created_at from public.alertes;

-- =========================================================
-- 10. RLS simple — service_role garde tous les droits.
-- Les API serveur utilisent SUPABASE_SERVICE_ROLE_KEY.
-- =========================================================
alter table public.roles enable row level security;
alter table public.profils enable row level security;
alter table public.configuration enable row level security;
alter table public.points_eau enable row level security;
alter table public.stations_pluvio enable row level security;
alter table public.observations_pluvio enable row level security;
alter table public.piezometres enable row level security;
alter table public.observations_piezo enable row level security;
alter table public.stations_limni enable row level security;
alter table public.observations_limni enable row level security;
alter table public.epicollect_sources enable row level security;
alter table public.sync_log enable row level security;
alter table public.alertes enable row level security;

-- Lecture publique limitée sur vues via anon non nécessaire si les API serveur sont utilisées.
-- Les politiques ci-dessous évitent de bloquer l'utilisateur authentifié côté client si certaines pages lisent directement.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='roles' and policyname='authenticated_read_roles') then
    create policy authenticated_read_roles on public.roles for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profils' and policyname='authenticated_read_own_profile') then
    create policy authenticated_read_own_profile on public.profils for select to authenticated using (auth.uid() = id);
  end if;
end $$;

-- =========================================================
-- 11. Résultat de fin
-- =========================================================
select 'PSORE V2.4 database migration completed successfully' as status;
