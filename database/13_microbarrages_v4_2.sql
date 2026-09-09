-- PSORE V4.2 — référentiel des quatre micro-barrages réhabilités
create table if not exists public.microbarrages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nom text not null,
  commune text not null,
  village text,
  latitude double precision,
  longitude double precision,
  utm_x double precision,
  utm_y double precision,
  epsg integer default 32629,
  annee_construction integer,
  surface_bassin_versant_km2 numeric,
  surface_inondee_ha numeric,
  surface_riziculture_ha numeric,
  surface_maraichage_ha numeric,
  nombre_exploitants integer,
  pluie_annuelle_mm numeric,
  pluie_decennale_24h_mm numeric,
  crue_projet_100ans_m3s numeric,
  diagnostic_avant jsonb not null default '[]'::jsonb,
  travaux_realises jsonb not null default '[]'::jsonb,
  curage_surface_ha numeric default 0,
  curage_profondeur_m numeric default 0,
  curage_volume_estime_m3 numeric default 0,
  lignes_cordons_pierreux integer default 0,
  digue_filtrante_longueur_m numeric default 0,
  cout_rehabilitation_fcfa bigint,
  statut_travaux text not null default 'Réalisés intégralement',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.microbarrages enable row level security;
drop policy if exists public_read_microbarrages on public.microbarrages;
create policy public_read_microbarrages on public.microbarrages for select using (true);

insert into public.microbarrages
(code,nom,commune,village,latitude,longitude,utm_x,utm_y,annee_construction,surface_bassin_versant_km2,surface_inondee_ha,surface_riziculture_ha,surface_maraichage_ha,nombre_exploitants,pluie_annuelle_mm,pluie_decennale_24h_mm,crue_projet_100ans_m3s,diagnostic_avant,travaux_realises,curage_surface_ha,curage_profondeur_m,curage_volume_estime_m3,lignes_cordons_pierreux,digue_filtrante_longueur_m,cout_rehabilitation_fcfa,statut_travaux,source)
values
('MB-01','Bodo','Koula','Bodo',13.17818483,-7.72360704,638324.70,1457191.95,2016,35,10,7,15,106,950,105,82.24,
 '["Envasement de la cuvette","Décollement et fuite au pied du contrefort","Dégradation du bassin de dissipation","Érosion régressive à l’aval","Fuites aux batardeaux","Fissures du seuil terminal","Gabions détériorés"]'::jsonb,
 '["Curage de 11 ha à 0,30 m","Traitement hydrofuge","Réhabilitation du bassin de dissipation","Barbacanes","Gabions et enrochements","Rénovation des batardeaux","Deux lignes de cordons pierreux","Euphorbia balsamifera","Deux digues filtrantes totalisant 100 m"]'::jsonb,11,0.30,33000,2,100,51217500,'Réalisés intégralement','APD CEST décembre 2024; travaux prévus considérés totalement réalisés selon validation du maître d’ouvrage'),
('MB-02','Fani','Doumba','Fani',13.16793684,-7.54300885,657906.55,1456164.79,2002,62,6.20,2,5,30,950,105,98.52,
 '["Envasement de la cuvette","Fuites et fissures du contrefort","Déchaussement du seuil terminal","Batardeaux vétustes","Enrochements désorganisés","Fissures du bassin de dissipation et du mur de raccordement"]'::jsonb,
 '["Curage de 6 ha à 0,50 m","Traitement hydrofuge","Ancrage et tapis amont","Butée du contrefort","Renforcement du bassin de dissipation","Barbacanes","Gabions et enrochements","Remplacement des batardeaux","Deux lignes de cordons pierreux","Euphorbia balsamifera","Digue filtrante de 50 m"]'::jsonb,6,0.50,30000,2,50,50050580,'Réalisés intégralement','APD CEST décembre 2024; travaux prévus considérés totalement réalisés selon validation du maître d’ouvrage'),
('MB-03','Sirimansoni','Koula','Sirimansoni',13.07871309,-7.69773138,641186.13,1446203.46,2016,91,10,6,22,110,950,105,132.52,
 '["Envasement de la cuvette","Fuites sous le contrefort","Fuites aux batardeaux","Obstruction des lits par la végétation","Fissures légères du bassin de dissipation"]'::jsonb,
 '["Curage de 9 ha à 0,30 m","Butée du contrefort","Traitement hydrofuge","Rénovation des batardeaux","Deux lignes de cordons pierreux","Euphorbia balsamifera","Digue filtrante de 230 m"]'::jsonb,9,0.30,27000,2,230,47682000,'Réalisés intégralement','APD CEST décembre 2024; travaux prévus considérés totalement réalisés selon validation du maître d’ouvrage'),
('MB-04','Wolokorodji','Koula','Wolokorodji',13.11156167,-7.46155055,666774.82,1449980.97,2016,134,36,35,90,700,950,105,148,
 '["Fuites et fissures sous le contrefort","Érosion au mur de raccordement rive droite","Fuite entre les batardeaux","Fissures légères du bassin de dissipation"]'::jsonb,
 '["Traitement hydrofuge","Prolongement du mur de raccordement rive droite","Saignée amont vers la cuvette","Rénovation des batardeaux","Une ligne de cordons pierreux"]'::jsonb,0,0,0,1,0,11614000,'Réalisés intégralement','APD CEST décembre 2024; travaux prévus considérés totalement réalisés selon validation du maître d’ouvrage')
on conflict (code) do update set
  nom=excluded.nom, commune=excluded.commune, village=excluded.village,
  latitude=excluded.latitude, longitude=excluded.longitude,
  diagnostic_avant=excluded.diagnostic_avant, travaux_realises=excluded.travaux_realises,
  curage_surface_ha=excluded.curage_surface_ha, curage_profondeur_m=excluded.curage_profondeur_m,
  curage_volume_estime_m3=excluded.curage_volume_estime_m3,
  lignes_cordons_pierreux=excluded.lignes_cordons_pierreux,
  digue_filtrante_longueur_m=excluded.digue_filtrante_longueur_m,
  cout_rehabilitation_fcfa=excluded.cout_rehabilitation_fcfa,
  statut_travaux=excluded.statut_travaux, source=excluded.source, updated_at=now();

create or replace view public.v_microbarrages_synthese as
select code,nom,commune,latitude,longitude,surface_bassin_versant_km2,surface_inondee_ha,
       curage_surface_ha,curage_volume_estime_m3,lignes_cordons_pierreux,digue_filtrante_longueur_m,
       cout_rehabilitation_fcfa,statut_travaux
from public.microbarrages;
