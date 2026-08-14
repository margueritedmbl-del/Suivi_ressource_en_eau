-- PSORE V4.4.0 — quantités réellement exécutées des quatre micro-barrages
-- Source : Rapport mensuel n°03 CEST-SARL, période 01/06/2025–13/08/2025.

alter table public.microbarrages
  add column if not exists cout_execute_fcfa bigint,
  add column if not exists taux_execution_pct numeric,
  add column if not exists depots_evacues_m3 numeric,
  add column if not exists cordons_pierreux_ml numeric,
  add column if not exists digue_filtrante_gabion_m3 numeric,
  add column if not exists euphorbia_ml numeric,
  add column if not exists recalibrage_lit_mineur_ml numeric,
  add column if not exists date_reception_technique date,
  add column if not exists date_reception_provisoire_debut date,
  add column if not exists date_reception_provisoire_fin date,
  add column if not exists entreprise_execution text,
  add column if not exists bureau_controle text;

update public.microbarrages set
  cout_execute_fcfa=198973086,taux_execution_pct=100,depots_evacues_m3=33000,cordons_pierreux_ml=4500,digue_filtrante_gabion_m3=283,euphorbia_ml=2000,recalibrage_lit_mineur_ml=0,
  cout_rehabilitation_fcfa=198973086,statut_travaux='Réalisés et réceptionnés provisoirement',date_reception_technique='2025-07-18',date_reception_provisoire_debut='2025-08-12',date_reception_provisoire_fin='2025-08-13',entreprise_execution='SORY BUILDING SARL',bureau_controle='CEST-SARL',
  travaux_realises='["Dragage de la cuvette sur 11 ha à 0,30 m","Évacuation de 33 000 m³ de dépôts solides","Réalisation de 4 500 ml de cordons pierreux","Fouille d’ancrage de digue filtrante : 135 m³","Gabions de digue filtrante : 283 m³ réalisés","Traitement du déversoir et réparation de 14 batardeaux","Réhabilitation du bassin de dissipation et protections aval par gabions/enrochements","Plantation de 2 000 ml d’Euphorbia balsamifera","Mise en œuvre du PGES et réception provisoire"]'::jsonb,
  source='Rapport mensuel n°03 CEST-SARL, 01 juin–13 août 2025',updated_at=now() where code='MB-01';

update public.microbarrages set
  cout_execute_fcfa=141651272,taux_execution_pct=100,depots_evacues_m3=30000,cordons_pierreux_ml=4600,digue_filtrante_gabion_m3=157,euphorbia_ml=2400,recalibrage_lit_mineur_ml=0,
  cout_rehabilitation_fcfa=141651272,statut_travaux='Réalisés et réceptionnés provisoirement',date_reception_technique='2025-07-18',date_reception_provisoire_debut='2025-08-12',date_reception_provisoire_fin='2025-08-13',entreprise_execution='SORY BUILDING SARL',bureau_controle='CEST-SARL',
  travaux_realises='["Dragage de la cuvette sur 6 ha à 0,50 m","Évacuation de 30 000 m³ de dépôts solides","Réalisation de 4 600 ml de cordons pierreux","Fouille d’ancrage de digue filtrante : 75 m³","Gabions de digue filtrante : 157 m³","Réhabilitation du déversoir, pose de profilés UPN100 et 10 batardeaux","Renforcement du bassin de dissipation, barbacanes, gabions et empierrement aval","Plantation de 2 400 ml d’Euphorbia balsamifera","Mise en œuvre du PGES et réception provisoire"]'::jsonb,
  source='Rapport mensuel n°03 CEST-SARL, 01 juin–13 août 2025',updated_at=now() where code='MB-02';

update public.microbarrages set
  cout_execute_fcfa=175746986,taux_execution_pct=100,depots_evacues_m3=27000,cordons_pierreux_ml=4800,digue_filtrante_gabion_m3=550,euphorbia_ml=2100,recalibrage_lit_mineur_ml=100,
  cout_rehabilitation_fcfa=175746986,statut_travaux='Réalisés et réceptionnés provisoirement',date_reception_technique='2025-07-18',date_reception_provisoire_debut='2025-08-12',date_reception_provisoire_fin='2025-08-13',entreprise_execution='SORY BUILDING SARL',bureau_controle='CEST-SARL',
  travaux_realises='["Dragage de la cuvette sur 9 ha à 0,30 m","Évacuation de 27 000 m³ de dépôts solides","Recalibrage de 100 ml du lit mineur","Réalisation de 4 800 ml de cordons pierreux","Fouille d’ancrage de digue filtrante : 203,5 m³","Gabions de digue filtrante : 550 m³","Ancrage du contrefort, traitement des fissures et réparation de 8 batardeaux","Plantation de 2 100 ml d’Euphorbia balsamifera","Mise en œuvre du PGES et réception provisoire"]'::jsonb,
  source='Rapport mensuel n°03 CEST-SARL, 01 juin–13 août 2025',updated_at=now() where code='MB-03';

update public.microbarrages set
  cout_execute_fcfa=43888532,taux_execution_pct=100,depots_evacues_m3=175,cordons_pierreux_ml=5800,digue_filtrante_gabion_m3=0,euphorbia_ml=0,recalibrage_lit_mineur_ml=0,
  cout_rehabilitation_fcfa=43888532,statut_travaux='Réalisés et réceptionnés provisoirement',date_reception_technique='2025-07-18',date_reception_provisoire_debut='2025-08-12',date_reception_provisoire_fin='2025-08-13',entreprise_execution='SORY BUILDING SARL',bureau_controle='CEST-SARL',
  travaux_realises='["Décapage de 175 m³ de bourrelet à l’amont du déversoir","Évacuation de 175 m³ de dépôts solides","Réalisation de 5 800 ml de cordons pierreux","Traitement des fissures du déversoir et réparation de 7 batardeaux","Traitement des fissures du bassin de dissipation","Prolongement du mur de raccordement rive droite","Mise en œuvre du PGES et réception provisoire"]'::jsonb,
  source='Rapport mensuel n°03 CEST-SARL, 01 juin–13 août 2025',updated_at=now() where code='MB-04';

create or replace view public.v_microbarrages_synthese as
select code,nom,commune,latitude,longitude,surface_bassin_versant_km2,surface_inondee_ha,
       curage_surface_ha,curage_volume_estime_m3,cordons_pierreux_ml,digue_filtrante_gabion_m3,euphorbia_ml,
       cout_execute_fcfa,taux_execution_pct,statut_travaux,date_reception_technique,date_reception_provisoire_debut,date_reception_provisoire_fin
from public.microbarrages;
