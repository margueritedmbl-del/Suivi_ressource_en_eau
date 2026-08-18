-- PSORE V4.4.0 — référentiel piézométrique initial et comparaison temporelle
-- À exécuter après les migrations V4.1/V4.2 existantes.

alter table public.piezometres
  add column if not exists niveau_reference_m numeric,
  add column if not exists date_reference date,
  add column if not exists debit_developpement_reference_m3h numeric,
  add column if not exists rabattement_max_reference_m numeric,
  add column if not exists source_reference text;

insert into public.piezometres (code_piezo,commune,village,localite,latitude,longitude,profondeur,niveau_reference_m,date_reference,debit_developpement_reference_m3h,rabattement_max_reference_m,source_reference,actif,updated_at)
select code,commune,village,village,latitude,longitude,profondeur,niveau_ref,to_date(date_ref,'DD/MM/YYYY'),debit_dev,rabattement,'Essais de pompage initiaux CEST 2025',true,now()
from (values
('PZ-01','Doumba','Fani',13.1667968,-7.5440815,37.0,3.25,'24/04/2025',36.0,22.2),
('PZ-02','Doumba','Dombana',13.1974635,-7.5915264,35.3,8.84,'26/04/2025',15.2,17.75),
('PZ-03','Doumba','Doumba',13.1105329,-7.5930741,87.5,8.69,'26/04/2025',1.4,58.01),
('PZ-04','Koula','Dialakorobougou',13.1122462,-7.5025032,100.0,6.81,'24/04/2025',6.0,46.69),
('PZ-05','Koula','Wolokorodji',13.1159399,-7.4604979,81.0,11.83,'25/04/2025',3.1,39.93),
('PZ-06','Koula','Gnamakorobougou',13.1290916,-7.4800896,71.1,5.82,'26/04/2025',10.8,47.65),
('PZ-07','Koula','Félou',13.0590271,-7.7303421,91.1,10.86,'18/05/2025',4.1,48.06),
('PZ-08','Koula','Niobougou',13.0925603,-7.685495,66.1,14.73,'17/05/2025',4.5,13.64),
('PZ-09','Sirakorola','Sirakorola Ouest',13.2912712,-7.5638233,80.0,10.18,'20/04/2025',15.0,47.13),
('PZ-10','Sirakorola','Monzombala',13.2965925,-7.4582855,61.1,14.73,'22/04/2025',15.0,28.75),
('PZ-11','Sirakorola','Dlana',13.2275254,-7.424904,45.8,11.17,'22/04/2025',17.0,22.03),
('PZ-12','Sirakorola','Boron Cissé',13.2200861,-7.4545602,40.3,10.9,'23/04/2025',20.0,8.62),
('PZ-13','Sirakorola','Dontérébougou',13.2300401,-7.5329939,48.1,9.83,'21/04/2025',27.0,29.56),
('PZ-14','Sirakorola','Koroka',13.2735314,-7.6819069,86.1,15.34,'21/04/2025',10.0,9.45),
('PZ-15','Sirakorola','Zana',13.3562812,-7.6739344,61.1,5.87,'21/04/2025',9.0,39.84),
('PZ-16','Méguétan','Gouni',12.8709466,-7.5334427,82.0,7.4,'29/04/2025',2.8,47.16),
('PZ-17','Méguétan','Fégoun',12.8422368,-7.5386121,46.0,12.18,'28/04/2025',6.3,15.48),
('PZ-18','Méguétan','Diaguinébougou',12.9803161,-7.3931353,78.0,6.8,'28/04/2025',7.4,46.62),
('PZ-19','Méguétan','Siratiguila',12.7867174,-7.5136848,78.0,14.63,'29/04/2025',3.4,13.22),
('PZ-20','Méguétan','Diladjè',12.9690333,-7.5843792,61.1,8.8,'27/04/2025',3.6,28.62)
) as v(code,commune,village,latitude,longitude,profondeur,niveau_ref,date_ref,debit_dev,rabattement)
on conflict (code_piezo) do update set
  commune=excluded.commune,village=excluded.village,localite=excluded.localite,latitude=excluded.latitude,longitude=excluded.longitude,
  profondeur=coalesce(excluded.profondeur,public.piezometres.profondeur),niveau_reference_m=excluded.niveau_reference_m,date_reference=excluded.date_reference,
  debit_developpement_reference_m3h=excluded.debit_developpement_reference_m3h,rabattement_max_reference_m=excluded.rabattement_max_reference_m,
  source_reference=excluded.source_reference,actif=true,updated_at=now();

create or replace view public.v_piezometrie_dashboard as
select
  o.id,o.date_observation,coalesce(p.code_piezo,o.code_piezo) as code_site,p.code_piezo as nom_site,
  coalesce(p.commune,c.nom) as commune,p.village,p.localite,p.latitude,p.longitude,
  o.niveau_statique as valeur_observee,o.niveau_statique,p.profondeur,p.aquifere,
  p.niveau_reference_m,p.date_reference,
  case when o.niveau_statique is not null and p.niveau_reference_m is not null then round((o.niveau_statique-p.niveau_reference_m)::numeric,2) else null end as ecart_reference_m,
  case when o.niveau_statique is null or p.niveau_reference_m is null then 'Non comparable'
       when abs(o.niveau_statique-p.niveau_reference_m)<=0.10 then 'Stable'
       when o.niveau_statique>p.niveau_reference_m then 'Baisse' else 'Hausse' end as evolution_reference,
  o.observateur,o.commentaire,o.photo_url,o.synced_at,
  case when o.niveau_statique is null or o.niveau_statique < 0 or (p.profondeur is not null and o.niveau_statique > p.profondeur) then true else false end as alerte_valeur,
  case when p.latitude is null or p.longitude is null then true else false end as alerte_gps
from public.observations_piezo o
left join public.piezometres p on o.piezometre_id=p.id or (o.code_piezo is not null and o.code_piezo=p.code_piezo)
left join public.communes c on p.commune_id=c.id;

comment on column public.piezometres.niveau_reference_m is 'Niveau statique initial mesuré lors des essais de pompage 2025; profondeur sous le repère de mesure.';
