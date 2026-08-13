create extension if not exists "pgcrypto";
create extension if not exists "postgis";

create table if not exists roles (id uuid primary key default gen_random_uuid(), nom_role text unique not null, description text, created_at timestamptz default now());
create table if not exists profils (id uuid primary key, nom text, prenom text, email text unique not null, telephone text, role_id uuid references roles(id), actif boolean default true, created_at timestamptz default now());
create table if not exists regions (id uuid primary key default gen_random_uuid(), nom text unique not null);
create table if not exists cercles (id uuid primary key default gen_random_uuid(), region_id uuid references regions(id), nom text not null);
create table if not exists communes (id uuid primary key default gen_random_uuid(), cercle_id uuid references cercles(id), nom text not null);

create table if not exists stations_pluvio (id uuid primary key default gen_random_uuid(), code_station text unique, nom_station text, commune_id uuid references communes(id), latitude numeric, longitude numeric, geom geography(Point,4326), altitude numeric, actif boolean default true, source_entry_id text unique, synced_at timestamptz);
create table if not exists observations_pluvio (id uuid primary key default gen_random_uuid(), station_id uuid references stations_pluvio(id), date_observation date, pluie_24h_mm numeric, cumul_mensuel_mm numeric, observateur text, photo_url text, source_entry_id text unique, synced_at timestamptz);
create table if not exists piezometres (id uuid primary key default gen_random_uuid(), code_piezo text unique, commune_id uuid references communes(id), latitude numeric, longitude numeric, geom geography(Point,4326), profondeur numeric, aquifere text, actif boolean default true, source_entry_id text unique, synced_at timestamptz);
create table if not exists observations_piezo (id uuid primary key default gen_random_uuid(), piezometre_id uuid references piezometres(id), date_observation date, niveau_statique numeric, observateur text, commentaire text, photo_url text, source_entry_id text unique, synced_at timestamptz);
create table if not exists stations_limni (id uuid primary key default gen_random_uuid(), code_station text unique, cours_eau text, commune_id uuid references communes(id), latitude numeric, longitude numeric, geom geography(Point,4326), actif boolean default true, source_entry_id text unique, synced_at timestamptz);
create table if not exists observations_limni (id uuid primary key default gen_random_uuid(), station_id uuid references stations_limni(id), date_observation date, periode text, hauteur_eau numeric, commentaire text, photo_url text, source_entry_id text unique, synced_at timestamptz);
create table if not exists points_eau (id uuid primary key default gen_random_uuid(), code_pe text unique, type_ouvrage text, commune_id uuid references communes(id), latitude numeric, longitude numeric, geom geography(Point,4326), profondeur numeric, etat text, source_entry_id text unique, synced_at timestamptz);
create table if not exists controles_points_eau (id uuid primary key default gen_random_uuid(), point_eau_id uuid references points_eau(id), date_visite date, fonctionnalite text, panne text, qualite_eau text, commentaire text, photo_url text, source_entry_id text unique, synced_at timestamptz);

create table if not exists epicollect_sources (id uuid primary key default gen_random_uuid(), module text not null, type_source text not null, libelle text not null, project_slug text not null, api_url text not null, form_url text not null, actif boolean default true, created_at timestamptz default now(), unique(module,type_source));
create table if not exists sync_log (id uuid primary key default gen_random_uuid(), module text, source text, nb_enregistrements integer, statut text, message text, date_sync timestamptz default now());
create table if not exists alertes (id uuid primary key default gen_random_uuid(), module text, niveau text, message text, statut text default 'ouverte', created_at timestamptz default now());
create table if not exists configuration (id uuid primary key default gen_random_uuid(), cle text unique, valeur text);

-- PSORE V2_3 — enrichissement inventaire Points d'eau et tableaux de bord thématiques
alter table points_eau add column if not exists created_at_source timestamptz;
alter table points_eau add column if not exists uploaded_at_source timestamptz;
alter table points_eau add column if not exists titre_source text;
alter table points_eau add column if not exists enqueteur_initial text;
alter table points_eau add column if not exists date_collecte date;
alter table points_eau add column if not exists heure_collecte text;
alter table points_eau add column if not exists commune text;
alter table points_eau add column if not exists village text;
alter table points_eau add column if not exists localite text;
alter table points_eau add column if not exists precision_gps numeric;
alter table points_eau add column if not exists utm_northing numeric;
alter table points_eau add column if not exists utm_easting numeric;
alter table points_eau add column if not exists utm_zone text;
alter table points_eau add column if not exists photo_infrastructure text;
alter table points_eau add column if not exists photo_emprise text;
alter table points_eau add column if not exists type_infrastructure text;
alter table points_eau add column if not exists type_puits text;
alter table points_eau add column if not exists equipement_puits text;
alter table points_eau add column if not exists date_realisation_puits text;
alter table points_eau add column if not exists hauteur_margelle numeric;
alter table points_eau add column if not exists diametre_cm numeric;
alter table points_eau add column if not exists commentaire_puits text;
alter table points_eau add column if not exists type_forage text;
alter table points_eau add column if not exists fonctionnalite_forage text;
alter table points_eau add column if not exists equipement_forage text;
alter table points_eau add column if not exists date_realisation_forage text;
alter table points_eau add column if not exists nombre_total_bornes numeric;
alter table points_eau add column if not exists nombre_bornes_fonctionnelles numeric;
alter table points_eau add column if not exists organe_gestion text;
alter table points_eau add column if not exists type_organe text;
alter table points_eau add column if not exists fonctionnalite_organe text;
alter table points_eau add column if not exists commentaire_gestion text;
alter table points_eau add column if not exists date_mesure date;
alter table points_eau add column if not exists niveau_eau numeric;
alter table points_eau add column if not exists profondeur_ouvrage numeric;
alter table points_eau add column if not exists commentaire_mesure text;
alter table points_eau add column if not exists temperature_c numeric;
alter table points_eau add column if not exists ph numeric;
alter table points_eau add column if not exists conductivite numeric;
alter table points_eau add column if not exists turbidite_ntu numeric;
alter table points_eau add column if not exists tds numeric;
alter table points_eau add column if not exists presence_odeur text;
alter table points_eau add column if not exists commentaire_qualite text;
alter table points_eau add column if not exists etat_apparent text;
alter table points_eau add column if not exists problemes text;
alter table points_eau add column if not exists besoin_rehabilitation text;
alter table points_eau add column if not exists nom_repondant text;
alter table points_eau add column if not exists contact_repondant text;
alter table points_eau add column if not exists recommandation text;

create index if not exists idx_points_eau_commune on points_eau(commune);
create index if not exists idx_points_eau_village on points_eau(village);
create index if not exists idx_points_eau_type on points_eau(type_infrastructure);
create index if not exists idx_points_eau_fonctionnalite on points_eau(fonctionnalite_forage);
create index if not exists idx_points_eau_gps on points_eau(latitude, longitude);

-- Données personnelles : accès recommandé seulement aux administrateurs via politiques RLS / vues non publiques.
