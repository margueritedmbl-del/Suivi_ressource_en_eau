select key,value from public.system_settings where key='version_psore';
select count(*) total,count(*) filter(where ph_source is not null) ph_renseignes,count(*) filter(where ph_donnee_a_verifier) ph_donnees_a_verifier,count(*) filter(where alerte_ph_qualite) alertes_ph_qualite,count(*) filter(where alerte_gps) sans_gps from public.v_points_eau_quality_v522;
