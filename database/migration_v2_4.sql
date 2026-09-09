-- PSORE V2_4 — migration de compatibilité Supabase/Auth/RBAC
-- À exécuter dans Supabase SQL Editor avant /api/admin/bootstrap si la base est ancienne.

create extension if not exists "pgcrypto";
create extension if not exists "postgis";

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  nom_role text unique not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.profils (
  id uuid primary key,
  nom text,
  prenom text,
  email text unique not null,
  telephone text,
  role_id uuid references public.roles(id),
  actif boolean default true,
  created_at timestamptz default now()
);

insert into public.roles (nom_role, description) values
('Super administrateur','Accès total : administration, utilisateurs, sécurité et paramétrage'),
('Administrateur PTCS','Gestion complète de la plateforme'),
('DNH/DRHK','Consultation, validation et export'),
('Collecteur','Consultation autorisée et appui terrain'),
('Observateur','Consultation simple des données autorisées'),
('Public','Accès limité')
on conflict (nom_role) do update set description = excluded.description;

-- Tables minimales utiles aux synchronisations si elles manquent dans une base plus ancienne.
create table if not exists public.sync_log (
  id uuid primary key default gen_random_uuid(),
  module text,
  source text,
  nb_enregistrements integer,
  statut text,
  message text,
  date_sync timestamptz default now()
);

create table if not exists public.configuration (
  id uuid primary key default gen_random_uuid(),
  cle text unique,
  valeur text
);

insert into public.configuration (cle, valeur) values
('version_psore','V2_4'),
('nom_plateforme','PSORE – Plateforme de Suivi et d’Observation des Ressources en Eau'),
('organisation','PTCS – Enabel – DNH/DRHK'),
('domaine','eau-ptcs-mali.org')
on conflict (cle) do update set valeur = excluded.valeur;
