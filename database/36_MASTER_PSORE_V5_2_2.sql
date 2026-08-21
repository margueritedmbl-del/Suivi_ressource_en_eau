-- PSORE V5.2.2 - Qualité des données Points d'eau / reporting cartographique
-- Non destructif : aucune mesure brute n'est corrigée ou supprimée.
begin;
create table if not exists public.system_settings (key text primary key,value text,description text,updated_at timestamptz default now());
insert into public.system_settings(key,value,description) values('version_psore','5.2.2','Version applicative PSORE') on conflict(key) do update set value=excluded.value,description=excluded.description,updated_at=now();
create or replace view public.v_points_eau_quality_v522 as
select pe.id,pe.code_pe,pe.commune,pe.village,pe.localite,pe.ph as ph_source,
 case when pe.ph between 0 and 14 then pe.ph else null end as ph_physiquement_exploitable,
 (pe.ph is not null and (pe.ph<0 or pe.ph>14)) as ph_donnee_a_verifier,
 (pe.ph between 0 and 14 and (pe.ph<6.5 or pe.ph>8.5)) as alerte_ph_qualite,
 pe.temperature_c,pe.conductivite,pe.turbidite_ntu,pe.tds,(pe.latitude is null or pe.longitude is null) as alerte_gps,pe.source_entry_id,pe.synced_at
from public.points_eau pe;
grant select on public.v_points_eau_quality_v522 to anon,authenticated;
notify pgrst,'reload schema';
commit;
