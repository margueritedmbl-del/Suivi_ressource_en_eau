-- PSORE V5.2.1 — vérification après migration 34 puis synchronisation complète.

-- 1) Registre parent construit depuis les exports Epicollect du 18/08/2026.
select module,
       count(*) filter(where provenance='snapshot_csv_2026-08-18') as parents_snapshot,
       count(distinct source_parent_id) as uuid_parents_registre,
       count(distinct code_site) filter(where code_site is not null) as codes_physiques
from public.epicollect_parent_registry
group by module order by module;

-- 2) Toute mesure enfant du stock actuel doit retrouver son UUID parent dans le registre.
select 'pluviometrie' module,count(*) observations,
       count(*) filter(where r.source_parent_id is not null) liees_registre,
       count(*) filter(where r.source_parent_id is null) non_resolues
from public.observations_pluvio o left join public.epicollect_parent_registry r on r.module='pluviometrie' and r.source_parent_id=o.source_parent_id
union all
select 'piezometrie',count(*),count(*) filter(where r.source_parent_id is not null),count(*) filter(where r.source_parent_id is null)
from public.observations_piezo o left join public.epicollect_parent_registry r on r.module='piezometrie' and r.source_parent_id=o.source_parent_id
union all
select 'limnimetrie',count(*),count(*) filter(where r.source_parent_id is not null),count(*) filter(where r.source_parent_id is null)
from public.observations_limni o left join public.epicollect_parent_registry r on r.module='limnimetrie' and r.source_parent_id=o.source_parent_id;

-- 3) État des tables parents après resynchronisation complète.
select 'pluviometrie' module,count(*) parents_supabase,count(distinct source_entry_id) uuid_uniques,count(distinct code_station) codes
from public.stations_pluvio
union all select 'piezometrie',count(*),count(distinct source_entry_id),count(distinct code_piezo) from public.piezometres
union all select 'limnimetrie',count(*),count(distinct source_entry_id),count(distinct code_station) from public.stations_limni;

-- 4) Liaisons directes parent/enfant et liaisons de secours via registre.
select 'pluviometrie' module,count(*) observations,
       count(*) filter(where p.source_entry_id is not null) liaison_directe,
       count(*) filter(where p.source_entry_id is null and r.source_parent_id is not null) liaison_registre,
       count(*) filter(where p.source_entry_id is null and r.source_parent_id is null) non_resolues
from public.observations_pluvio o
left join public.stations_pluvio p on p.source_entry_id=o.source_parent_id
left join public.epicollect_parent_registry r on r.module='pluviometrie' and r.source_parent_id=o.source_parent_id
union all
select 'piezometrie',count(*),count(*) filter(where p.source_entry_id is not null),count(*) filter(where p.source_entry_id is null and r.source_parent_id is not null),count(*) filter(where p.source_entry_id is null and r.source_parent_id is null)
from public.observations_piezo o
left join public.piezometres p on p.source_entry_id=o.source_parent_id
left join public.epicollect_parent_registry r on r.module='piezometrie' and r.source_parent_id=o.source_parent_id
union all
select 'limnimetrie',count(*),count(*) filter(where p.source_entry_id is not null),count(*) filter(where p.source_entry_id is null and r.source_parent_id is not null),count(*) filter(where p.source_entry_id is null and r.source_parent_id is null)
from public.observations_limni o
left join public.stations_limni p on p.source_entry_id=o.source_parent_id
left join public.epicollect_parent_registry r on r.module='limnimetrie' and r.source_parent_id=o.source_parent_id;

-- 5) Données opérationnelles depuis le 16/08/2026, hors dates futures.
select 'pluvio_operationnel' controle,count(*) total,count(distinct code_site) stations_avec_donnees from public.v_pluviometrie_dashboard_v50
union all select 'piezo_operationnel',count(*),count(distinct code_site) from public.v_piezometrie_dashboard_v50
union all select 'limni_operationnel',count(*),count(distinct code_site) from public.v_limnimetrie_dashboard_v50;

-- 6) Vérifier que les codes métier ne sont plus UNIQUE dans les tables de fiches parents.
select c.conrelid::regclass::text as table_name,c.conname,pg_get_constraintdef(c.oid) definition
from pg_constraint c
where c.contype='u' and c.conrelid in ('public.stations_pluvio'::regclass,'public.piezometres'::regclass,'public.stations_limni'::regclass)
order by 1,2;

select key,value from public.system_settings where key in ('operational_data_start_date','version_psore') order by key;
