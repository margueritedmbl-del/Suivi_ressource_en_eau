-- PSORE V2.4 - Lot 6 : Cartographie publique / privée
-- Objectif : consolider la vue cartographique unique et sécuriser l'exposition publique.

create or replace view public.v_carte_points_public as
select
  module,
  code,
  libelle,
  commune,
  village,
  type_infrastructure,
  latitude,
  longitude
from public.v_carte_points
where latitude is not null
  and longitude is not null;

comment on view public.v_carte_points_public is
'Vue cartographique publique limitée : localisation et type uniquement. Aucune donnée personnelle.';

create or replace view public.v_carte_points_privee as
select *
from public.v_carte_points
where latitude is not null
  and longitude is not null;

comment on view public.v_carte_points_privee is
'Vue cartographique privée : détails techniques complets selon les droits applicatifs.';

create index if not exists idx_points_eau_lat_lon on public.points_eau(latitude, longitude);
create index if not exists idx_points_eau_commune_type on public.points_eau(commune_id, type_ouvrage);
