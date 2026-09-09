-- PSORE V5.2.1 — réparation durable des relations parents/enfants Epicollect5
-- Base factuelle : exports CSV Epicollect fournis le 18/08/2026.
-- Objectif : conserver tous les UUID parents et dédupliquer uniquement au niveau analytique par code métier.
begin;

create table if not exists public.epicollect_parent_registry(
  module text not null,
  source_parent_id text not null,
  code_site text,
  commune text,
  localite text,
  latitude numeric,
  longitude numeric,
  provenance text,
  synced_at timestamptz not null default now(),
  primary key(module,source_parent_id)
);
create index if not exists idx_epicollect_parent_registry_code on public.epicollect_parent_registry(module,code_site);

-- Plusieurs fiches parents Epicollect peuvent représenter la même station physique.
-- Les contraintes UNIQUE sur le code métier empêchent alors la conservation de tous les UUID parents.
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass::text as tbl,c.conname
    from pg_constraint c
    join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.contype='u'
      and ((c.conrelid='public.stations_pluvio'::regclass and a.attname='code_station')
        or (c.conrelid='public.piezometres'::regclass and a.attname='code_piezo')
        or (c.conrelid='public.stations_limni'::regclass and a.attname='code_station'))
  loop
    execute format('alter table %s drop constraint if exists %I',r.tbl,r.conname);
  end loop;
end $$;
create index if not exists idx_stations_pluvio_code_nonunique on public.stations_pluvio(code_station);
create index if not exists idx_piezometres_code_nonunique on public.piezometres(code_piezo);
create index if not exists idx_stations_limni_code_nonunique on public.stations_limni(code_station);

-- Alimentation depuis les parents déjà présents dans Supabase.
insert into public.epicollect_parent_registry(module,source_parent_id,code_site,commune,localite,latitude,longitude,provenance,synced_at)
select 'pluviometrie',source_entry_id,code_station,commune,coalesce(village,nom_station),latitude,longitude,'supabase_existant',now()
from public.stations_pluvio where source_entry_id is not null
on conflict(module,source_parent_id) do update set code_site=excluded.code_site,commune=excluded.commune,localite=excluded.localite,latitude=excluded.latitude,longitude=excluded.longitude,provenance=excluded.provenance,synced_at=now();
insert into public.epicollect_parent_registry(module,source_parent_id,code_site,commune,localite,latitude,longitude,provenance,synced_at)
select 'piezometrie',source_entry_id,case when upper(trim(coalesce(code_piezo,'')))='PZ-DMB-SIN-001' then 'PZ-DMB-DBN-001' else code_piezo end,commune,coalesce(localite,village),latitude,longitude,'supabase_existant',now()
from public.piezometres where source_entry_id is not null
on conflict(module,source_parent_id) do update set code_site=excluded.code_site,commune=excluded.commune,localite=excluded.localite,latitude=excluded.latitude,longitude=excluded.longitude,provenance=excluded.provenance,synced_at=now();
insert into public.epicollect_parent_registry(module,source_parent_id,code_site,commune,localite,latitude,longitude,provenance,synced_at)
select 'limnimetrie',source_entry_id,code_station,commune,coalesce(localite,village),latitude,longitude,'supabase_existant',now()
from public.stations_limni where source_entry_id is not null
on conflict(module,source_parent_id) do update set code_site=excluded.code_site,commune=excluded.commune,localite=excluded.localite,latitude=excluded.latitude,longitude=excluded.longitude,provenance=excluded.provenance,synced_at=now();

-- Snapshot minimal des 278 fiches parents exportées le 18/08/2026 : 70 pluvio, 104 piezo, 104 limni.
insert into public.epicollect_parent_registry(module,source_parent_id,code_site,commune,localite,latitude,longitude,provenance)
values
('pluviometrie','b30f3c76-65d9-450e-8f39-7d52e17e4666','PL-MGT-GOU-001','Meguetan','GOUNI',12.870953,-7.533399,'snapshot_csv_2026-08-18'),
('pluviometrie','fa41a88b-1a3a-43b0-a422-651a580d53bd','PL-MGT-GOU-001','Meguetan','GOUNI',12.87095,-7.533411,'snapshot_csv_2026-08-18'),
('pluviometrie','4d184a5f-b2ea-418e-8da7-07566c380704','PL-SRK-DTB-001','Sirakorola',null,13.230034,-7.532984,'snapshot_csv_2026-08-18'),
('pluviometrie','9d0d1b80-8c45-4587-83bb-bbe39d0a0df4','PL-SRK-DTB-001','Sirakorola',null,13.230071,-7.532964,'snapshot_csv_2026-08-18'),
('pluviometrie','406643d0-25c3-474c-96a3-9f34903345ff','PL-MGT-GOU-001','Meguetan',null,12.870945,-7.533399,'snapshot_csv_2026-08-18'),
('pluviometrie','83fd7591-8bb5-405c-a423-36b9b27ece09','PL-MGT-GOU-001','Meguetan','GOUNI',12.870946,-7.53344,'snapshot_csv_2026-08-18'),
('pluviometrie','88d15255-5423-4bea-8fa4-62dee00c06bb','PL-MGT-GOU-001','Meguetan','GOUNI',12.870927,-7.533415,'snapshot_csv_2026-08-18'),
('pluviometrie','3dcf07aa-40fc-42ab-a05c-8c2f5f5470a6','PL-MGT-GOU-001','Meguetan','GOUNI',12.879951,-7.522197,'snapshot_csv_2026-08-18'),
('pluviometrie','6025e34d-415b-4865-888a-5facef13a42e','PL-SRK-DTB-001','Sirakorola',null,13.230077,-7.532984,'snapshot_csv_2026-08-18'),
('pluviometrie','a93b02e7-a8ae-4d12-a120-e3d3b4246135','PL-SRK-DTB-001','Sirakorola',null,13.230065,-7.533044,'snapshot_csv_2026-08-18'),
('pluviometrie','6f3a1cf5-5158-4774-a822-a727b77f01da','PL-MGT-GOU-001','Meguetan','GOUNI',12.870975,-7.533445,'snapshot_csv_2026-08-18'),
('pluviometrie','82c88bb1-7dad-4f73-8417-614458aa1d1e','PL-MGT-GOU-001','Meguetan','GOUNI',12.870958,-7.533421,'snapshot_csv_2026-08-18'),
('pluviometrie','22dee186-036e-4bdf-a137-d26774ad09a6','PL-MGT-GOU-001','Meguetan','GOUNI',12.87095,-7.53342,'snapshot_csv_2026-08-18'),
('pluviometrie','ade04780-90da-4c69-af55-668cc8d2fa82','PL-MGT-GOU-001','Meguetan','GOUNI',12.880084,-7.522115,'snapshot_csv_2026-08-18'),
('pluviometrie','57ec7328-70a6-4bc9-894a-c8593e13f3d1','PL-MGT-GOU-001','Meguetan','GOUNI',12.879958,-7.522232,'snapshot_csv_2026-08-18'),
('pluviometrie','a47fcaaa-6c0b-46c6-a852-7638b4990f33','PL-MGT-GOU-001','Meguetan','GOUNI',12.879959,-7.52219,'snapshot_csv_2026-08-18'),
('pluviometrie','c9e81582-d273-4914-af51-5d6f6f9e9431','PL-MGT-GOU-001','Meguetan','GOUNI',12.88,-7.522182,'snapshot_csv_2026-08-18'),
('pluviometrie','15ed458b-3d24-4960-81f1-9738e87f651a','PL-MGT-GOU-001','Meguetan','GOUNI',12.879898,-7.522141,'snapshot_csv_2026-08-18'),
('pluviometrie','c93d2d61-af1b-4d70-bb36-01750ce0bdc7','PL-MGT-GOU-001','Meguetan','GOUNI',12.879943,-7.522289,'snapshot_csv_2026-08-18'),
('pluviometrie','437fc466-03b5-4d89-888c-8e8b3eb80288','PL-MGT-GOU-001','Meguetan','GOUNI',12.87997,-7.522236,'snapshot_csv_2026-08-18'),
('pluviometrie','86823c64-32d1-4dc3-aa1f-70bb62603f06','PL-MGT-GOU-001','Meguetan','GOUNI',12.879965,-7.522212,'snapshot_csv_2026-08-18'),
('pluviometrie','b3b08755-9507-4085-aa03-ffb8e1d404ff','PL-MGT-GOU-001','Meguetan','GOUNI',12.879989,-7.522225,'snapshot_csv_2026-08-18'),
('pluviometrie','f3d1258d-6c46-4c57-b5b8-4bee29a49172','PL-SRK-DTB-001','Sirakorola',null,13.230074,-7.532986,'snapshot_csv_2026-08-18'),
('pluviometrie','c43eb08d-4637-46b0-aa62-646aca0a4839','PL-KLA-FEL-001','Koula','Felou',13.11404,-7.594023,'snapshot_csv_2026-08-18'),
('pluviometrie','25b5c52d-63d8-4a42-84f1-5995390202c0','PL-DMB-DOM-001','Doumba',null,13.104873,-7.612822,'snapshot_csv_2026-08-18'),
('pluviometrie','c3283311-8499-4d1a-97ed-20a40aeec549','PL-DMB-DOM-001','Doumba',null,13.10487,-7.612845,'snapshot_csv_2026-08-18'),
('pluviometrie','ce3e818a-95ad-49d1-bcbd-fe66dee63bba','PL-DMB-DOM-001','Doumba','Doumba',13.104873,-7.61285,'snapshot_csv_2026-08-18'),
('pluviometrie','db4fb517-bf96-44a0-8657-a3cc0d68bb80','PL-DMB-DOM-001','Doumba','Doumba',13.104875,-7.612833,'snapshot_csv_2026-08-18'),
('pluviometrie','9484f0b2-58e2-47b3-b0fa-8443820b9b56','PL-DMB-DOM-001','Doumba',null,13.104857,-7.612831,'snapshot_csv_2026-08-18'),
('pluviometrie','5593d53b-d653-4ebf-ba02-1590bc22c423','PL-DMB-DOM-001','Doumba',null,13.104873,-7.612829,'snapshot_csv_2026-08-18'),
('pluviometrie','f0fbc500-3551-438d-aad3-8cb8c658162f','PL-DMB-FAN-001','Doumba',null,13.114085,-7.593992,'snapshot_csv_2026-08-18'),
('pluviometrie','09376648-ef3c-4cf0-8054-bc3a3ee2d9cf','PL-DMB-DOM-001','Doumba',null,13.104878,-7.612813,'snapshot_csv_2026-08-18'),
('pluviometrie','d94569ac-15f9-48c2-86f8-f6939b4ad1ac','PL-DMB-DOM-001','Doumba',null,13.104872,-7.612828,'snapshot_csv_2026-08-18'),
('pluviometrie','31130d5b-0e41-48c1-8956-934d6471c8f4','PL-DMB-DIB-001','Doumba',null,13.10488,-7.612812,'snapshot_csv_2026-08-18'),
('pluviometrie','5639b440-d47a-40e8-b9b3-a2bd76c0caef','PL-DMB-DOM-001','Doumba',null,13.1048,-7.612848,'snapshot_csv_2026-08-18'),
('pluviometrie','d3dfb265-2316-4c02-a072-4cb2e81252ad','PL-DMB-DOM-001','Doumba',null,13.104886,-7.612803,'snapshot_csv_2026-08-18'),
('pluviometrie','fb72f9cf-473f-4fbf-a515-a6b4426bc42f','PL-DMB-DOM-001','Doumba',null,13.104868,-7.612822,'snapshot_csv_2026-08-18'),
('pluviometrie','c3f78b8e-ae7b-407e-9c74-b291ba9153ec','PL-SRK-DTB-001','Sirakorola',null,13.230075,-7.532987,'snapshot_csv_2026-08-18'),
('pluviometrie','68851ddb-2dbc-4227-a366-a360f6c17719','PL-DMB-DIB-001','Doumba','Doumba',13.114,-7.593974,'snapshot_csv_2026-08-18'),
('pluviometrie','6bbc79d6-cb75-41c8-b6e7-c2ac8a82e0af','PL-DMB-DOM-001','Doumba','DOUMBA',13.114045,-7.59396,'snapshot_csv_2026-08-18'),
('pluviometrie','fadc93c2-0a4e-4629-987c-72097a02ea90','PL-KLA-GKB-001','Koula','GAMAKOROBOUKOU',13.114008,-7.59398,'snapshot_csv_2026-08-18'),
('pluviometrie','7d717f29-2154-48ed-8db6-d75460766305','PL-KLA-FEL-001','Koula','FELOU',13.113974,-7.594022,'snapshot_csv_2026-08-18'),
('pluviometrie','b7a4b712-16a8-4258-bef2-0ec4f779f82f','PL-KLA-FEL-001','Koula','FELOU',13.114017,-7.594022,'snapshot_csv_2026-08-18'),
('pluviometrie','f7bafd8a-3b38-4739-ac1a-68ffa0bd35cc','PL-DMB-DIB-001','Doumba','Donmana',13.114027,-7.593973,'snapshot_csv_2026-08-18'),
('pluviometrie','b1a0c3c3-1efc-47ff-963a-70a86393a17c','PL-KLA-GKB-001','Koula','NIAMAKOROBOUGOU',13.114067,-7.593965,'snapshot_csv_2026-08-18'),
('pluviometrie','3779dbcd-37eb-4a74-b7ff-48015bd3273d','PL-DMB-FAN-001','Doumba','FANI',13.113968,-7.594009,'snapshot_csv_2026-08-18'),
('pluviometrie','9b9da987-c939-4e5e-9c36-781fb4fd5cbc','PL-KLA-FEL-001','Koula','Felou',13.114055,-7.59393,'snapshot_csv_2026-08-18'),
('pluviometrie','a881a434-6c2a-433d-943a-c915601d1503','PL-KLA-DKB-001','Koula','DKB',13.114045,-7.594006,'snapshot_csv_2026-08-18'),
('pluviometrie','7ca0370b-0abe-4457-b447-274ebc047dfb','PL-KLA-DKB-001','Koula',null,13.114028,-7.594015,'snapshot_csv_2026-08-18'),
('pluviometrie','3175b42f-47c9-4a55-aa15-b7e22f3ee4f3','PL-SRK-DTB-001','Sirakorola',null,13.230075,-7.532991,'snapshot_csv_2026-08-18'),
('pluviometrie','44e07ca9-af42-4124-914f-34085639eb6b','PL-SRK-DTB-001','Sirakorola',null,13.230056,-7.532987,'snapshot_csv_2026-08-18'),
('pluviometrie','754dc622-62b5-491e-bbc4-bfe7f112d09f','PL-SRK-DTB-001','Sirakorola',null,13.23008,-7.532992,'snapshot_csv_2026-08-18'),
('pluviometrie','5997ef28-d569-4bc1-8380-3741d7f82eda','PL-SRK-DTB-001','Sirakorola',null,13.23007,-7.532963,'snapshot_csv_2026-08-18'),
('pluviometrie','c6229053-28c7-4a4c-b14e-61fea438ad15','PL-SRK-DTB-001','Sirakorola',null,13.230042,-7.533017,'snapshot_csv_2026-08-18'),
('pluviometrie','777f1860-43f6-4ece-b233-05a94777f0d5','PL-SRK-DTB-001','Sirakorola',null,13.230067,-7.532969,'snapshot_csv_2026-08-18'),
('pluviometrie','e29eccbf-4eb3-4994-97c0-7d7dfecc2056','PL-SRK-DTB-001','Sirakorola',null,13.230082,-7.532982,'snapshot_csv_2026-08-18'),
('pluviometrie','f0291df4-7faa-467e-88d5-f57d1e8df045','PL-SRK-DTB-001','Sirakorola',null,13.230067,-7.532969,'snapshot_csv_2026-08-18'),
('pluviometrie','d68ca4b9-3b5f-4790-b41e-76bc434fdc88','PL-SRK-DTB-001','Sirakorola',null,13.230061,-7.532982,'snapshot_csv_2026-08-18'),
('pluviometrie','4a87a6c4-232d-4172-8b0b-aaaf33184a1a','PL-SRK-DTB-001','Sirakorola',null,13.230042,-7.532966,'snapshot_csv_2026-08-18'),
('pluviometrie','8ab781a7-f012-4296-8d35-cc031c9aa6d4','PL-SRK-BRC-001','Sirakorola','Monzombala',13.289527,-7.560507,'snapshot_csv_2026-08-18'),
('pluviometrie','c0228c72-ee5d-4669-96bf-6ed34ffcedd8','PL-SRK-DLN-001','Sirakorola','SIRAKOROLA OUST',13.289538,-7.560538,'snapshot_csv_2026-08-18'),
('pluviometrie','4293c0e8-1f47-435d-8916-6f7f6cceb425','PL-SRK-DTB-001','Sirakorola','Donthierebougou',13.289548,-7.560495,'snapshot_csv_2026-08-18'),
('pluviometrie','6496aaaf-ac1b-41bb-bb9a-b906053a55d1','PL-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.23007,-7.532983,'snapshot_csv_2026-08-18'),
('pluviometrie','b927b3ae-46f0-422a-a709-b2e72442318c','PL-SRK-BRC-001','Sirakorola','Boston cisse',13.289593,-7.560522,'snapshot_csv_2026-08-18'),
('pluviometrie','6a60a7cd-a268-4358-a8c2-b08b98013540','PL-SRK-DTB-001','Sirakorola',null,13.23007,-7.532977,'snapshot_csv_2026-08-18'),
('pluviometrie','e9c72173-9b79-4cfc-8e6e-e822d079744d','PL-SRK-DTB-001','Sirakorola','DOTIEBBOUGOUU',13.289563,-7.560533,'snapshot_csv_2026-08-18'),
('pluviometrie','4cb55e71-f924-4555-b731-7765733ef14a','PL-SRK-DTB-001','Sirakorola',null,13.230073,-7.53301,'snapshot_csv_2026-08-18'),
('pluviometrie','1866ef86-327c-4597-b394-b567359974b4','PL-SRK-DTB-001','Sirakorola',null,13.289535,-7.560502,'snapshot_csv_2026-08-18'),
('pluviometrie','411d2b62-048d-4e3b-b45b-bdb7bc710f1d','PL-SRK-DTB-001','Sirakorola',null,13.23007,-7.532995,'snapshot_csv_2026-08-18'),
('pluviometrie','b330f770-90e4-11f1-998c-5fbb4db1ff75','PL-SRK-DTB-001','Sirakorola','SIRAKOROLA OUEST',13.284483,-7.571499,'snapshot_csv_2026-08-18'),
('piezometrie','04dfb622-afc3-4620-8616-defa1d53d155','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273537,-7.681852,'snapshot_csv_2026-08-18'),
('piezometrie','9f860561-3b1f-481f-af60-75ba1ba36f34','PZ-SRK-DLN-001','Sirakorola','DLANA',13.227537,-7.424867,'snapshot_csv_2026-08-18'),
('piezometrie','1edfd98f-3434-474e-abda-31baf6174f84','PZ-KLA-NIO-001','Koula','KOULA BAMBARA',13.09254,-7.685477,'snapshot_csv_2026-08-18'),
('piezometrie','ca2413f1-5398-46b0-8823-d930090f6c55','PZ-SRK-O-001','Sirakorola','SIRAKOROLA EST',13.291273,-7.563827,'snapshot_csv_2026-08-18'),
('piezometrie','574cd561-5bed-40ae-b340-282e63e5fcfe','PZ-MGT-STG-001','Meguetan','SIRATIGUILA',12.786725,-7.513701,'snapshot_csv_2026-08-18'),
('piezometrie','07b466ac-4874-4858-b76a-7a3b159f489c','PZ-SRK-DLN-001','Sirakorola','DLANA',13.22753,-7.424883,'snapshot_csv_2026-08-18'),
('piezometrie','ea6f09da-7a37-490a-9525-75a4e42822ee','PZ-MGT-STG-001','Meguetan','SIRATIGUILA',12.786738,-7.513693,'snapshot_csv_2026-08-18'),
('piezometrie','15010e8f-0b18-4813-8b77-794b162bd9cb','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.230064,-7.532966,'snapshot_csv_2026-08-18'),
('piezometrie','dd104680-dbeb-4d1b-8069-148d9999c408','PZ-SRK-O-001','Sirakorola','SIRAKOROLA EST',13.291273,-7.563838,'snapshot_csv_2026-08-18'),
('piezometrie','5e225fde-88f4-4653-ba14-9c6c77d2e6f3','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273529,-7.681896,'snapshot_csv_2026-08-18'),
('piezometrie','d55b72f6-9027-4254-8e89-1b303691af8c','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273567,-7.68187,'snapshot_csv_2026-08-18'),
('piezometrie','084b4d7b-7bce-4f37-a368-958f8ea0c560','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.230066,-7.532991,'snapshot_csv_2026-08-18'),
('piezometrie','b83e8303-3de5-47a2-9806-6ae99eabfe21','PZ-DMB-FAN-001','Doumba','FANI',13.166823,-7.544083,'snapshot_csv_2026-08-18'),
('piezometrie','ce2b5446-16bb-4001-b803-eea6f1e2e18d','PZ-KLA-NIO-001','Koula','KOULA BAMBARA',13.092525,-7.685492,'snapshot_csv_2026-08-18'),
('piezometrie','98c3b064-fba6-4992-9847-5dd16514ac5e','PZ-MGT-DGB-001','Meguetan','DIAGUINABOUGOU',12.98031,-7.393111,'snapshot_csv_2026-08-18'),
('piezometrie','f6d8b272-cd3f-419b-8773-0527c2030a65','PZ-MGT-DGB-001','Meguetan','DIAGUINABOUGOU',12.980332,-7.393154,'snapshot_csv_2026-08-18'),
('piezometrie','8ec68059-01a1-4d72-a58b-76d6bfc54a03','PZ-MGT-DGB-001','Meguetan','DIAGUINABOUGOU',12.980238,-7.393094,'snapshot_csv_2026-08-18'),
('piezometrie','ffcf0331-371a-42ca-bfc3-07a45c5e456a','PZ-MGT-STG-001','Meguetan','SIRATIGUILA',12.78673,-7.513727,'snapshot_csv_2026-08-18'),
('piezometrie','073c6d0f-033c-4b4f-a3ab-533132d39852','PZ-SRK-O-001','Sirakorola','SIRAKOROLA EST',13.291262,-7.56382,'snapshot_csv_2026-08-18'),
('piezometrie','18b0f25a-0155-425c-8f9a-d15aa5879708','PZ-KLA-DKB-001','Koula','BOUGOUNISSABA',13.112262,-7.502511,'snapshot_csv_2026-08-18'),
('piezometrie','5f0ef28e-991d-4b3f-b828-a6a2ed7dc36e','PZ-MGT-GOU-001','Meguetan','GOUNI',12.870907,-7.533392,'snapshot_csv_2026-08-18'),
('piezometrie','a84dd8c5-28e7-4504-8524-c2c57b51fff0','PZ-MGT-GOU-001','Meguetan','GOUNI',12.870933,-7.533414,'snapshot_csv_2026-08-18'),
('piezometrie','a332aa7d-5f08-4bbe-aa9a-72217ad6308a','PZ-KLA-NIO-001','Koula','KOULA BAMBARA',13.092523,-7.685468,'snapshot_csv_2026-08-18'),
('piezometrie','cbf98ac4-591e-4a89-afeb-31426649aed5','PZ-MGT-DLDJ-001','Meguetan','DLADIE',12.969045,-7.587133,'snapshot_csv_2026-08-18'),
('piezometrie','301c2c6c-c1aa-45a5-8e20-dac64736adbe','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273588,-7.681875,'snapshot_csv_2026-08-18'),
('piezometrie','217451cc-c253-45b9-8301-24fdb540c315','PZ-DMB-FAN-001','Doumba','FANI',13.166828,-7.544067,'snapshot_csv_2026-08-18'),
('piezometrie','5aa0293e-fed1-404b-afa0-1ada03e9167a','PZ-SRK-O-001','Sirakorola','SIRAKOROLA EST',13.291287,-7.563822,'snapshot_csv_2026-08-18'),
('piezometrie','e85d3f2a-7af7-452b-b147-d184a5e14918','PZ-SRK-O-001','Sirakorola','SIRAKOROLA EST',13.291273,-7.5638,'snapshot_csv_2026-08-18'),
('piezometrie','5263be81-b034-41df-9241-42155d95d892','PZ-SRK-BRC-001','Sirakorola','BORON CISSE',13.220135,-7.45455,'snapshot_csv_2026-08-18'),
('piezometrie','d858ec9e-26f4-44b8-a359-3228264276c9','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.27357,-7.681885,'snapshot_csv_2026-08-18'),
('piezometrie','cc891b1c-3b8b-4913-87fb-659514f442cc','PZ-KLA-NIO-001','Koula','KOULA BAMBARA',13.092525,-7.685458,'snapshot_csv_2026-08-18'),
('piezometrie','90c79404-7626-45b5-a657-f26ca6141606','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.230054,-7.532991,'snapshot_csv_2026-08-18'),
('piezometrie','ddd3cf89-a35f-49b5-a222-c42fbde83ef7','PZ-SRK-O-001','Sirakorola','SIRAKOROLA EST',13.29126,-7.563842,'snapshot_csv_2026-08-18'),
('piezometrie','f8fa431a-947d-4541-bd50-d3554ff94320','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.230029,-7.532959,'snapshot_csv_2026-08-18'),
('piezometrie','d1147cf5-8afe-4097-8e62-e0b8354ad342','PZ-KLA-DKB-001','Koula','BOUGOUNISSABA',13.112243,-7.502488,'snapshot_csv_2026-08-18'),
('piezometrie','5b057915-2810-45ea-8582-240eadd57b19','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273536,-7.681897,'snapshot_csv_2026-08-18'),
('piezometrie','12ca8326-51d0-4945-9708-446329937334','PZ-SRK-O-001','Sirakorola','SIRAKOROLA OUEST',13.291267,-7.563833,'snapshot_csv_2026-08-18'),
('piezometrie','b7b19a1a-5b7f-4881-90c4-43873f2d0ac2','PZ-MGT-GOU-001','Meguetan','GOUNI',12.870991,-7.533377,'snapshot_csv_2026-08-18'),
('piezometrie','b53ce44d-97c0-4b7f-b39d-56ce25a912a7','PZ-MGT-GOU-001','Meguetan','GOUNI',12.870962,-7.533447,'snapshot_csv_2026-08-18'),
('piezometrie','4e38359d-2f26-420a-b737-fd0fd559dd48','PZ-MGT-GOU-001','Meguetan','GOUNI',12.870955,-7.53341,'snapshot_csv_2026-08-18'),
('piezometrie','6c292ceb-da5e-49fc-8807-a585b2e03994','PZ-MGT-GOU-001','Meguetan','GOUNI',12.870952,-7.533414,'snapshot_csv_2026-08-18'),
('piezometrie','8f92d01d-40ac-426b-8bd7-c5f9fef44247','PZ-MGT-GOU-001','Meguetan','GOUNI',12.87096,-7.533445,'snapshot_csv_2026-08-18'),
('piezometrie','653e9289-afcb-4d56-b59c-d912cd733c25','PZ-MGT-GOU-001','Meguetan','GOUNI',12.870955,-7.533438,'snapshot_csv_2026-08-18'),
('piezometrie','40f86854-8e9a-49a8-a82b-57b49b3afad0','PZ-MGT-GOU-001','Meguetan','GOUNI',12.870958,-7.533424,'snapshot_csv_2026-08-18'),
('piezometrie','8a857a0f-8fda-4018-a337-bfaca0ebd895','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273563,-7.68188,'snapshot_csv_2026-08-18'),
('piezometrie','756ec369-fd8f-4098-9ae9-e312d1ca7521','PZ-SRK-O-001','Sirakorola','SIRAKOROLA EST',13.291287,-7.563815,'snapshot_csv_2026-08-18'),
('piezometrie','66e8ff22-048c-4370-a851-9c7126bb587d','PZ-SRK-MON-001','Sirakorola','MONZONBALA',13.296589,-7.458275,'snapshot_csv_2026-08-18'),
('piezometrie','ecdb5b35-ee1a-4ff1-b292-cb0fd38dc98d','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.230096,-7.532991,'snapshot_csv_2026-08-18'),
('piezometrie','67184b85-738d-4801-a0e7-0fbb4dce5a61','PZ-KLA-NIO-001','Koula','KOULA BAMBARA',13.091395,-7.684558,'snapshot_csv_2026-08-18'),
('piezometrie','caa6227e-5d76-4453-9ab4-b2227e046fca','PZ-KLA-NIO-001','Koula','KOULA BAMBARA',13.092538,-7.685462,'snapshot_csv_2026-08-18'),
('piezometrie','423cac6b-1770-4250-8605-87643fd6cdf2','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273522,-7.681891,'snapshot_csv_2026-08-18'),
('piezometrie','dc286838-0dea-4b8b-9403-e1cdcddcae95','PZ-MGT-GOU-001','Meguetan','GOUNI',12.879964,-7.522234,'snapshot_csv_2026-08-18'),
('piezometrie','ddef22b5-63ed-4c12-b183-eacfa2c3d1b8','PZ-MGT-DGB-001','Meguetan','DIANGUINEBOUGOU',12.879907,-7.522233,'snapshot_csv_2026-08-18'),
('piezometrie','045e682a-d99b-477a-a78b-62e332a864c5','PZ-MGT-STG-001','Meguetan','SIRATIGUILA',12.879909,-7.522237,'snapshot_csv_2026-08-18'),
('piezometrie','34a949e8-a3a7-4de4-b7b6-5a5e7b81702d','PZ-MGT-GOU-001','Meguetan','GOUNI',12.879959,-7.52222,'snapshot_csv_2026-08-18'),
('piezometrie','fa5bba11-27bb-4e75-a1b4-b3c6961542b2','PZ-MGT-DLDJ-001','Meguetan','DLADIE',12.879947,-7.52229,'snapshot_csv_2026-08-18'),
('piezometrie','2513b6f3-cbc1-4122-92df-6fbe7f95c418','PZ-MGT-GOU-001','Meguetan','GOUNI',12.879934,-7.52221,'snapshot_csv_2026-08-18'),
('piezometrie','05c536a7-4f64-47f9-a655-80eead8becb5','PZ-MGT-FEG-001','Meguetan','FEGOUN',12.879945,-7.522189,'snapshot_csv_2026-08-18'),
('piezometrie','ce95716e-f8d9-45d0-85b4-f03babaeb340','PZ-DMB-DOM-001','Doumba','DOUMBA',13.110565,-7.59305,'snapshot_csv_2026-08-18'),
('piezometrie','05e29b92-2982-40cd-ad18-f51185d48ef2','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273557,-7.681863,'snapshot_csv_2026-08-18'),
('piezometrie','ecdf887e-903c-48dc-ab4b-34ca9f949089','PZ-DMB-DOM-001','Doumba','DOUMBA',13.113766,-7.594143,'snapshot_csv_2026-08-18'),
('piezometrie','6093fc8c-9961-4825-b132-6bcdedbca882','PZ-DMB-DOM-001','Doumba','DOUMBA',13.113777,-7.59417,'snapshot_csv_2026-08-18'),
('piezometrie','dd63e7a6-18ac-4baf-ad39-39209aacdc36','PZ-DMB-DOM-001','Doumba','DOUMBA',13.113757,-7.594148,'snapshot_csv_2026-08-18'),
('piezometrie','9479ab24-6f55-4125-b6e1-47859ca8fc97','PZ-DMB-DOM-001','Koula','DOUMBA',13.113795,-7.594122,'snapshot_csv_2026-08-18'),
('piezometrie','699118ca-a035-4f98-81e0-d4269d348706','PZ-DMB-DOM-001','Doumba','DOUMBA',13.113768,-7.594143,'snapshot_csv_2026-08-18'),
('piezometrie','8b75d141-4bff-4f78-b26f-2d2fe8866081','PZ-DMB-DOM-001','Doumba','DOUMBA',13.113795,-7.594143,'snapshot_csv_2026-08-18'),
('piezometrie','f65049f0-173d-480b-8782-fc13d22a930e','PZ-DMB-FAN-001','Doumba','DOUMBA',13.113763,-7.594184,'snapshot_csv_2026-08-18'),
('piezometrie','8749daec-2c79-47e7-968c-27247f58bac4','PZ-DMB-DOM-001','Doumba','DOUMBA',13.113758,-7.594148,'snapshot_csv_2026-08-18'),
('piezometrie','b329dceb-c32d-43e7-bcaa-22f420b92cd9','PZ-DMB-DOM-001','Doumba','DOUMBA',13.11377,-7.594207,'snapshot_csv_2026-08-18'),
('piezometrie','11bc4ded-4f8c-47f8-854c-9ad0dbf2fa7c','PZ-DMB-DOM-001','Koula','DOUMBA',13.11377,-7.59415,'snapshot_csv_2026-08-18'),
('piezometrie','adc7810b-2cd5-45f1-8259-1d28904c8ba6','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273501,-7.681849,'snapshot_csv_2026-08-18'),
('piezometrie','4d754361-7c8e-439f-a3d7-df503254426f','PZ-DMB-DOM-001','Doumba','DOUMBA',13.114128,-7.593887,'snapshot_csv_2026-08-18'),
('piezometrie','4f1aef85-6ebc-419d-b6a3-930433e6914e','PZ-KLA-FEL-001','Koula','FELOU',13.114057,-7.593932,'snapshot_csv_2026-08-18'),
('piezometrie','34e95c5a-9ff6-4e93-8b71-c72087772a99','PZ-DMB-FAN-001','Doumba','FANI',13.114024,-7.593989,'snapshot_csv_2026-08-18'),
('piezometrie','48dc3388-42e8-42f7-88ac-e14814ced7cd','PZ-KLA-NIO-001','Koula','KOULA BAMBARA',13.114058,-7.59393,'snapshot_csv_2026-08-18'),
('piezometrie','5d9defab-b592-4d9c-8a57-01032bb5d745','PZ-DMB-DOM-001','Doumba','DOUMBA',13.11406,-7.594092,'snapshot_csv_2026-08-18'),
('piezometrie','d7b2daf3-f6af-4ecb-b170-7de2ebd9a072','PZ-DMB-DBN-001','Doumba','DOMBANA',13.114176,-7.593828,'snapshot_csv_2026-08-18'),
('piezometrie','11513cd0-50e7-4d6c-85b1-85c749bb1ef3','PZ-DMB-FAN-001','Doumba','FANI',13.114057,-7.59397,'snapshot_csv_2026-08-18'),
('piezometrie','1dc9993c-7924-4e2f-829a-9ec90f9d826a','PZ-KLA-WLK-001','Koula','WOLOKORODJI',13.114125,-7.594016,'snapshot_csv_2026-08-18'),
('piezometrie','ce7978a2-4b6a-4221-ad18-3f657c361216','PZ-KLA-NMCBG-001','Koula','NIAMAKOROBOUGOU',13.114088,-7.594023,'snapshot_csv_2026-08-18'),
('piezometrie','cdcc8887-a0fc-4f09-984c-7fdf40ce38e2','PZ-KLA-DKB-001','Koula','BOUGOUNISSABA',13.114119,-7.59401,'snapshot_csv_2026-08-18'),
('piezometrie','75b81ec8-2097-49dd-9090-68b34d277c5d','PZ-DMB-DBN-001','Koula','SINZANI',13.114038,-7.593992,'snapshot_csv_2026-08-18'),
('piezometrie','ec83aba1-b0b0-4908-ac27-03e366370860','PZ-KLA-WLK-001','Koula','SINZANI',13.114067,-7.594011,'snapshot_csv_2026-08-18'),
('piezometrie','a9c24b9e-e5d5-4f8d-bb18-6ce33474acf4','PZ-DMB-FAN-001','Doumba','FANI',13.114082,-7.594102,'snapshot_csv_2026-08-18'),
('piezometrie','6332d390-6b6e-40d5-959e-d7013992c6d3','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273548,-7.681866,'snapshot_csv_2026-08-18'),
('piezometrie','f91d3eec-66b4-40b8-a0e5-1cb5491a4e2d','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273534,-7.681858,'snapshot_csv_2026-08-18'),
('piezometrie','70027b54-11b0-4806-87ce-be9bb0e9351c','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273507,-7.681839,'snapshot_csv_2026-08-18'),
('piezometrie','a6b78a81-19d7-4cfc-89f5-1cea14c14d57','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273539,-7.681855,'snapshot_csv_2026-08-18'),
('piezometrie','93d9d2cf-7171-490d-8242-ecccc73f2524','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273548,-7.68187,'snapshot_csv_2026-08-18'),
('piezometrie','f8b5993a-fa33-490d-b292-25815f89a2c1','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273558,-7.68187,'snapshot_csv_2026-08-18'),
('piezometrie','e407bc8d-a9ce-452c-a849-31eb839c256f','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273535,-7.681868,'snapshot_csv_2026-08-18'),
('piezometrie','08803763-469d-4c38-a984-6706a3ffaaef','PZ-SRK-KOR-001','Sirakorola','KOROKA',13.273556,-7.681871,'snapshot_csv_2026-08-18'),
('piezometrie','f2866a09-efc3-4efa-8502-44daaa641590','PZ-SRK-DTB-001','Sirakorola','DOTLEMBOUGOU',13.230068,-7.532992,'snapshot_csv_2026-08-18'),
('piezometrie','1561e9a4-b7b9-4c29-b6be-36c0c2fb2f23','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.289559,-7.560483,'snapshot_csv_2026-08-18'),
('piezometrie','4c2a29b9-f559-443d-9467-a90097dd70d4','PZ-SRK-DTB-001','Meguetan','DONTIEREBOUGOU',13.289515,-7.560482,'snapshot_csv_2026-08-18'),
('piezometrie','c0882c99-d55b-4c3d-8249-dbb4f75976f1','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.289612,-7.560479,'snapshot_csv_2026-08-18'),
('piezometrie','f95a4fe2-1b01-4529-9c60-e7675528c9fd','PZ-SRK-BRC-001','Sirakorola','BORON CISSE',13.289522,-7.560572,'snapshot_csv_2026-08-18'),
('piezometrie','d8cd17ac-d4a4-46db-9db7-c4ad94cc56cb','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.230065,-7.532988,'snapshot_csv_2026-08-18'),
('piezometrie','6bac91c2-44d5-4474-967e-0f89d121452d','PZ-SRK-O-001','Sirakorola','SIRAKOROLA OUEST',13.288212,-7.568229,'snapshot_csv_2026-08-18'),
('piezometrie','746fce43-0721-4894-a888-067cb2af0e90','PZ-SRK-MON-001','Sirakorola','MONZONBALA',13.28965,-7.560524,'snapshot_csv_2026-08-18'),
('piezometrie','addee438-e148-4564-aa47-2be5dc72f7b5','PZ-SRK-O-001','Sirakorola','SIRAKOROLA EST',13.289685,-7.560503,'snapshot_csv_2026-08-18'),
('piezometrie','ae7ac6fd-6b73-4b23-a0fd-65d1783083cf','PZ-SRK-DTB-001','Sirakorola','DONTIEREBOUGOU',13.230083,-7.532998,'snapshot_csv_2026-08-18'),
('piezometrie','281a0bfc-b66e-47fc-b0ef-6e7dafd776ff','PZ-MGT-DGB-001','Sirakorola','DONTIEREBOUGOU',13.230081,-7.532993,'snapshot_csv_2026-08-18'),
('piezometrie','1d8db3b0-90cc-11f1-a0b5-19febe4ab864','PZ-SRK-O-001','Sirakorola','SIRAKOROLA OUEST',13.284483,-7.571499,'snapshot_csv_2026-08-18'),
('limnimetrie','7a0c0a6a-c0aa-4cf7-b235-ca014e910f60','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221523,-7.42116,'snapshot_csv_2026-08-18'),
('limnimetrie','973d6c06-c7ba-4fc6-a4d7-418aab6d5e88','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819061,-7.569196,'snapshot_csv_2026-08-18'),
('limnimetrie','ea6f980a-ac0c-4330-b136-a94e59630da2','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221638,-7.42118,'snapshot_csv_2026-08-18'),
('limnimetrie','cbf457e3-77fb-4078-8f33-2946f8e19b68','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229903,-7.533606,'snapshot_csv_2026-08-18'),
('limnimetrie','4148fb8c-5f6d-4e41-a698-abecde18eb92','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.818875,-7.569581,'snapshot_csv_2026-08-18'),
('limnimetrie','3ffe4ae3-fcb1-4f17-9f9e-7afa7b0e670f','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221527,-7.421157,'snapshot_csv_2026-08-18'),
('limnimetrie','2631823d-6dce-4737-a0b8-8c4be9527a35','CE-KLK-001_B-FANI','Doumba','FANI',13.167582,-7.542968,'snapshot_csv_2026-08-18'),
('limnimetrie','c18b1de3-d854-4fd8-ab2c-01e8a05f3525','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819057,-7.569254,'snapshot_csv_2026-08-18'),
('limnimetrie','ac16e814-81f1-4c4a-a6c3-b4f4d6be9623','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819074,-7.569263,'snapshot_csv_2026-08-18'),
('limnimetrie','9ce47052-c5d2-48ff-ab17-930e0ec0b2f9','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819001,-7.569288,'snapshot_csv_2026-08-18'),
('limnimetrie','2d3eee02-359c-4f8c-b0e2-0e23618acf96','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.21317,-7.425292,'snapshot_csv_2026-08-18'),
('limnimetrie','64e0435a-8be1-4528-89e2-62c3283872ca','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.22164,-7.421147,'snapshot_csv_2026-08-18'),
('limnimetrie','998b7430-3799-4783-a2a4-63ceb7592401','CE-KLK-007_R-DBNA','Doumba','D0MBANA',null,null,'snapshot_csv_2026-08-18'),
('limnimetrie','66b4d948-011b-4f2d-8531-9db0d9a45c87','CE-KLK-001_B-FANI','Doumba','Fani',13.16759,-7.542962,'snapshot_csv_2026-08-18'),
('limnimetrie','75b374ac-c4cd-4eda-a8dc-d4055c0421b6','CE-KLK-001_B-FANI','Doumba',null,13.167545,-7.542958,'snapshot_csv_2026-08-18'),
('limnimetrie','632c7e9a-99f6-4a1e-ad2e-78d5f1dccc6c','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221532,-7.421177,'snapshot_csv_2026-08-18'),
('limnimetrie','3ae978fc-4539-4323-8b25-2958e6e45499','CE-KLK-004_B-SRMSNI','Koula','SRMNSONI',13.078869,-7.697161,'snapshot_csv_2026-08-18'),
('limnimetrie','77c23b44-d4c1-4dfe-bec5-64620596e429','CE-KLK-008_R-DLNA','Sirakorola','DLANA',null,null,'snapshot_csv_2026-08-18'),
('limnimetrie','13786cc9-1285-472d-853f-94cfe14f2d31','CE-KLK-007_R-DBNA','Doumba','AD',13.199787,-7.49931,'snapshot_csv_2026-08-18'),
('limnimetrie','b931b5ef-5cb6-4c02-aa71-f784b8e1e354','CE-KLK-007_R-DBNA','Doumba','EHLI',13.199785,-7.499355,'snapshot_csv_2026-08-18'),
('limnimetrie','cc04026f-e2da-461a-accd-74f176d2daae','CE-KLK-007_R-DBNA','Doumba','DONMA',null,null,'snapshot_csv_2026-08-18'),
('limnimetrie','4c004a0f-dcb0-4257-b38c-b6681ef8302c','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.22185,-7.42123,'snapshot_csv_2026-08-18'),
('limnimetrie','c4185b05-bebd-45a6-9479-f98bacce7c54','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.81907,-7.569262,'snapshot_csv_2026-08-18'),
('limnimetrie','ec85e871-921c-42f2-b054-ff2a7a59fb79','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819057,-7.569308,'snapshot_csv_2026-08-18'),
('limnimetrie','c328469e-6a22-4e4c-b763-11bcfe05b1cb','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819076,-7.569285,'snapshot_csv_2026-08-18'),
('limnimetrie','977ed676-216a-4edb-b541-f0ad2cfef0c7','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819059,-7.569252,'snapshot_csv_2026-08-18'),
('limnimetrie','3f539965-fff3-4acb-9a3c-00868228c644','CE-KLK-005_R-BBGOU-PNT','Meguetan','SEKKOU.  COULIBALY',12.879938,-7.52217,'snapshot_csv_2026-08-18'),
('limnimetrie','9f0e5648-2736-4d14-855a-b59c87085832','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819019,-7.569265,'snapshot_csv_2026-08-18'),
('limnimetrie','bf56f584-a8c0-498e-879c-796e12eebdb7','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.81908,-7.569263,'snapshot_csv_2026-08-18'),
('limnimetrie','6bfdd556-65db-40bf-806e-ddad422d1dff','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.819077,-7.569308,'snapshot_csv_2026-08-18'),
('limnimetrie','13a9abaa-bc94-4976-8ad8-a3d1e0a97cd1','CE-KLK-006_R-TNKA-PNT','Meguetan','TONGA',12.81909,-7.569235,'snapshot_csv_2026-08-18'),
('limnimetrie','5f689686-28e5-43cf-9f0d-2fcc5640eb24','CE-KLK-006_R-TNKA-PNT','Meguetan',null,12.879964,-7.522164,'snapshot_csv_2026-08-18'),
('limnimetrie','bda91771-cb4c-429c-9bce-71525bea5cb0','CE-KLK-006_R-TNKA-PNT','Meguetan','TOUGA',12.879926,-7.522186,'snapshot_csv_2026-08-18'),
('limnimetrie','6d87f6e1-c777-4d3b-bf3c-eefa6d004e97','CE-KLK-006_R-TNKA-PNT','Koula',null,12.879952,-7.522197,'snapshot_csv_2026-08-18'),
('limnimetrie','5fbe6cce-3bcd-42a7-a5bc-1933cc43c7e0','CE-KLK-006_R-TNKA-PNT','Meguetan',null,12.879938,-7.522204,'snapshot_csv_2026-08-18'),
('limnimetrie','b5aa422e-3923-4c08-8d9f-7bf246fabda5','CE-KLK-006_R-TNKA-PNT','Meguetan',null,12.879915,-7.522251,'snapshot_csv_2026-08-18'),
('limnimetrie','f654fb5a-9eb7-4cd1-b27b-647cc7825dc2','CE-KLK-006_R-TNKA-PNT','Meguetan',null,12.87998,-7.522222,'snapshot_csv_2026-08-18'),
('limnimetrie','88c3dcd0-3503-40bb-adda-c84605c3bbc0','CE-KLK-006_R-TNKA-PNT','Meguetan',null,12.87995,-7.522237,'snapshot_csv_2026-08-18'),
('limnimetrie','620d853c-4e20-4909-9e2f-d7075fc703f7','CE-KLK-006_R-TNKA-PNT','Meguetan',null,12.879951,-7.522161,'snapshot_csv_2026-08-18'),
('limnimetrie','827ec834-988b-4db8-991b-2772065e4aad','CE-KLK-006_R-TNKA-PNT','Koula',null,12.879978,-7.522218,'snapshot_csv_2026-08-18'),
('limnimetrie','0f477020-dd36-4b5e-8028-dbba7e4edf4b','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221892,-7.421232,'snapshot_csv_2026-08-18'),
('limnimetrie','dc1a4fd7-2ebc-436e-88f7-54d1e4714dd7','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229859,-7.53339,'snapshot_csv_2026-08-18'),
('limnimetrie','dea4a015-6f59-46fe-9519-9faa7f402609','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221887,-7.42124,'snapshot_csv_2026-08-18'),
('limnimetrie','d82c121c-720f-448a-b28a-d97a394dab8e','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221987,-7.421218,'snapshot_csv_2026-08-18'),
('limnimetrie','319a2e8e-4568-427a-a714-77d5770e8be5','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221957,-7.421228,'snapshot_csv_2026-08-18'),
('limnimetrie','04bb690f-3e99-4dc6-bc4b-4e683a88ea42','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.027288,-7.610467,'snapshot_csv_2026-08-18'),
('limnimetrie','9e811600-85a8-47eb-b4ae-975adac8cb3c','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.02727,-7.610453,'snapshot_csv_2026-08-18'),
('limnimetrie','1477c4aa-c487-47a1-9653-403dceacf439','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.027282,-7.610458,'snapshot_csv_2026-08-18'),
('limnimetrie','70d26124-b0e7-45a1-b466-7852ac928f8d','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.027268,-7.610457,'snapshot_csv_2026-08-18'),
('limnimetrie','8c2565bc-f04a-472d-b6f7-76af3a15f122','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.027288,-7.610453,'snapshot_csv_2026-08-18'),
('limnimetrie','3e840111-348e-4ac3-9338-61931cc1de66','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.027273,-7.610448,'snapshot_csv_2026-08-18'),
('limnimetrie','3640c7fc-70c3-45ba-857f-443ff66040f0','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.027257,-7.61047,'snapshot_csv_2026-08-18'),
('limnimetrie','e006227a-febc-4bb9-a576-e9826180e435','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.02727,-7.610429,'snapshot_csv_2026-08-18'),
('limnimetrie','d403ed42-5fdd-4896-acfb-443e62feb823','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.027283,-7.610458,'snapshot_csv_2026-08-18'),
('limnimetrie','1eb11c22-ea06-478f-869e-20dee22c8321','CE-KLK-005_R-BBGOU-PNT','Doumba',null,13.02725,-7.610465,'snapshot_csv_2026-08-18'),
('limnimetrie','a7f48f17-3f02-49ba-bc13-d77ade0e50d5','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221968,-7.421263,'snapshot_csv_2026-08-18'),
('limnimetrie','0e05aab2-4580-4fd7-aa32-53bf9143d490','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229935,-7.533601,'snapshot_csv_2026-08-18'),
('limnimetrie','933b13d6-e616-4ab6-994e-6be6d3bb38df','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.22189,-7.421248,'snapshot_csv_2026-08-18'),
('limnimetrie','9288fa8a-1777-468f-9ffa-24ca0ca68ee2','CE-KLK-007_R-DBNA','Doumba','Donmana',13.113984,-7.593996,'snapshot_csv_2026-08-18'),
('limnimetrie','08c3fc3d-6382-4908-858d-a15a7d5f9caf','CE-KLK-003_B-BDO','Koula',null,13.114058,-7.593998,'snapshot_csv_2026-08-18'),
('limnimetrie','90ebef43-00f6-45f7-8618-8710e61e82c0','CE-KLK-004_B-SRMSNI','Koula','Sirimansoni',13.114046,-7.593971,'snapshot_csv_2026-08-18'),
('limnimetrie','db71a1bc-5f65-4b3f-9253-55154eaab0ff','CE-KLK-001_B-FANI','Doumba','Fani',13.114015,-7.593995,'snapshot_csv_2026-08-18'),
('limnimetrie','86c0b05e-558a-494d-b42e-feb77fe38670','CE-KLK-001_B-FANI','Doumba','Doumba',13.11405,-7.593951,'snapshot_csv_2026-08-18'),
('limnimetrie','cef69e2d-a678-4ac9-9c96-838ea9b7b109','CE-KLK-002_B-WLKRDJI','Koula',null,13.11402,-7.594023,'snapshot_csv_2026-08-18'),
('limnimetrie','49f16bf4-9959-496d-a2e9-0ce6f4088ace','CE-KLK-001_B-FANI','Doumba','DOUMBA',13.114032,-7.593929,'snapshot_csv_2026-08-18'),
('limnimetrie','81fb8e06-e16e-41a7-bb55-aada3137136e','CE-KLK-003_B-BDO','Koula',null,13.114065,-7.593953,'snapshot_csv_2026-08-18'),
('limnimetrie','643c5999-21ff-45c2-ae1b-119a6bca22d4','CE-KLK-001_B-FANI','Doumba','FANI',13.114033,-7.593965,'snapshot_csv_2026-08-18'),
('limnimetrie','c2a374c4-9b46-4906-a588-01689283e60f','CE-KLK-002_B-WLKRDJI','Koula',null,13.114048,-7.59407,'snapshot_csv_2026-08-18'),
('limnimetrie','65c19522-3dee-4201-93b1-5f5e82dc2cd0','CE-KLK-001_B-FANI','Koula',null,13.114068,-7.594027,'snapshot_csv_2026-08-18'),
('limnimetrie','0955700e-e2dc-4215-b539-ae002377a3b5','CE-KLK-003_B-BDO','Koula','Niobougou',13.114047,-7.593955,'snapshot_csv_2026-08-18'),
('limnimetrie','9206c6c2-49e0-4e47-9411-4d56efa58ced','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221876,-7.421239,'snapshot_csv_2026-08-18'),
('limnimetrie','9619a3e9-d07e-486a-aa41-f572dab06180','CE-KLK-008_R-DLNA','Sirakorola','Dlana',null,null,'snapshot_csv_2026-08-18'),
('limnimetrie','00acec5f-f433-4129-8cbd-64aeaa87daec','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.22987,-7.533576,'snapshot_csv_2026-08-18'),
('limnimetrie','85bf5e86-6d4d-4a98-9352-7ea76625dc06','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221863,-7.421225,'snapshot_csv_2026-08-18'),
('limnimetrie','f4b0398d-4a53-4a88-baf0-67812a7b9241','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221847,-7.421242,'snapshot_csv_2026-08-18'),
('limnimetrie','70cece24-8510-49c7-ab9f-deec17f2f2ce','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229874,-7.533525,'snapshot_csv_2026-08-18'),
('limnimetrie','0cef0521-a58d-46d6-afd0-4c74ccfc9307','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229914,-7.533606,'snapshot_csv_2026-08-18'),
('limnimetrie','0cd61751-0b44-46cb-8055-3dc657d4f336','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221713,-7.421187,'snapshot_csv_2026-08-18'),
('limnimetrie','bb15a5ce-3fca-44bf-8bcd-c560eb88e573','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221735,-7.421197,'snapshot_csv_2026-08-18'),
('limnimetrie','a002029d-9312-4eb1-b8d9-6f800c36af36','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229941,-7.533641,'snapshot_csv_2026-08-18'),
('limnimetrie','7a31fa77-77fa-48a6-9596-2c82f8a39804','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229907,-7.53361,'snapshot_csv_2026-08-18'),
('limnimetrie','5dccc18d-ee5a-4cc8-a77c-f260a545866d','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221842,-7.421227,'snapshot_csv_2026-08-18'),
('limnimetrie','689abc1f-73ff-4bfa-9d47-5f5c70660723','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221833,-7.421202,'snapshot_csv_2026-08-18'),
('limnimetrie','144404fe-674b-4773-9233-e3275e7ea51d','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229866,-7.533509,'snapshot_csv_2026-08-18'),
('limnimetrie','648f486e-6d71-497e-aa51-9a032973b34a','CE-KLK-008_R-DLNA','Sirakorola','DLANA',13.221818,-7.421262,'snapshot_csv_2026-08-18'),
('limnimetrie','10477f62-e39c-46fc-b5c4-9fe4569e7a6b','CE-KLK-008_R-BRN-CSSE','Sirakorola',null,13.216148,-7.451925,'snapshot_csv_2026-08-18'),
('limnimetrie','c7550f29-1641-462a-9943-ecbf08bf170b','CE-KLK-007_R-DBNA','Sirakorola','ST',13.221843,-7.421202,'snapshot_csv_2026-08-18'),
('limnimetrie','2001e539-925c-4008-a9e4-3397b624e4d4','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229928,-7.533698,'snapshot_csv_2026-08-18'),
('limnimetrie','33925825-852f-4160-b8da-fa9c8c8c06a8','CE-KLK-009_R-DNTRBGOU','Sirakorola','DONTIEREBOUGOU',13.229887,-7.53357,'snapshot_csv_2026-08-18'),
('limnimetrie','472237fa-cc38-48ce-a88c-2be57a9ef482','CE-KLK-009_R-DNTRBGOU','Sirakorola','MC',13.229926,-7.533538,'snapshot_csv_2026-08-18'),
('limnimetrie','92659ebf-ac2f-4f79-98a9-37de7d4b9bc1','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.289551,-7.560496,'snapshot_csv_2026-08-18'),
('limnimetrie','55b1286e-aa39-4aa2-af28-d35686a89aaf','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.22994,-7.533567,'snapshot_csv_2026-08-18'),
('limnimetrie','257ca1d6-5d00-4270-a511-0025a65ed95d','CE-KLK-009_R-DNTRBGOU','Sirakorola','VILLAGE',13.229893,-7.533538,'snapshot_csv_2026-08-18'),
('limnimetrie','e1d4711c-af1c-404b-aad0-0199c2cad5e0','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229951,-7.53364,'snapshot_csv_2026-08-18'),
('limnimetrie','2d816c31-3209-4e33-90b2-6e2e45e25775','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.229893,-7.533613,'snapshot_csv_2026-08-18'),
('limnimetrie','f2d2ed04-2b84-483a-9b1e-0dd76f3e1ead','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.289607,-7.560542,'snapshot_csv_2026-08-18'),
('limnimetrie','9a9dd412-0581-4ee4-89b6-92f2c9bcdc05','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.289551,-7.560496,'snapshot_csv_2026-08-18'),
('limnimetrie','3ebe2c2e-1cea-415a-95c9-9e048e59b3e6','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.289582,-7.56053,'snapshot_csv_2026-08-18'),
('limnimetrie','d29a0b5a-6427-4ca3-996d-5791713e2654','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.289602,-7.56052,'snapshot_csv_2026-08-18'),
('limnimetrie','67e2c09c-dc02-4ce8-9b31-c50cd693e40d','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.289605,-7.56051,'snapshot_csv_2026-08-18'),
('limnimetrie','43851a4d-5718-442b-9550-4d029fb51f46','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.289627,-7.560515,'snapshot_csv_2026-08-18'),
('limnimetrie','9b75c131-2bbe-45f8-a1d0-10fd0a0092b5','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.289546,-7.560536,'snapshot_csv_2026-08-18'),
('limnimetrie','d8513e72-251a-48e4-9dd7-ec3b3c3978dd','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.28958,-7.56047,'snapshot_csv_2026-08-18'),
('limnimetrie','483f5eb0-9180-11f1-ac07-79a7d629f338','CE-KLK-009_R-DNTRBGOU','Sirakorola',null,13.284483,-7.571499,'snapshot_csv_2026-08-18')
on conflict(module,source_parent_id) do update set
  code_site=excluded.code_site,commune=excluded.commune,localite=excluded.localite,
  latitude=excluded.latitude,longitude=excluded.longitude,provenance=excluded.provenance,synced_at=now();

-- Correction canonique PZ-02 validée : Dombana = PZ-DMB-DBN-001.
update public.epicollect_parent_registry set code_site='PZ-DMB-DBN-001',localite='Dombana',commune='Doumba'
where module='piezometrie' and upper(trim(coalesce(code_site,'')))='PZ-DMB-SIN-001';

-- Les vues opérationnelles utilisent d'abord l'UUID parent, puis le registre de secours, puis le code de la mesure.
create or replace view public.v_pluviometrie_dashboard_v50 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,r.code code_site,
 coalesce(nullif(c.localite_officielle,''),nullif(r.locality,''),nullif(rg.localite,''),nullif(c.nom_station,''),nullif(c.village,''),r.code) nom_site,
 coalesce(nullif(c.commune_officielle,''),nullif(r.commune,''),nullif(rg.commune,''),c.commune,'Non renseignée') commune,
 coalesce(c.village,rg.localite,r.locality) village,
 coalesce(c.latitude,rg.latitude) latitude,coalesce(c.longitude,rg.longitude) longitude,
 o.date_observation,o.pluie_24h_mm,o.cumul_mensuel_mm,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,o.pluie_24h_mm valeur_observee,
 (o.pluie_24h_mm is null or o.pluie_24h_mm<0) alerte_valeur,(coalesce(c.latitude,rg.latitude) is null or coalesce(c.longitude,rg.longitude) is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_pluvio o
left join public.stations_pluvio px on o.source_parent_id=px.source_entry_id
left join public.epicollect_parent_registry rg on rg.module='pluviometrie' and rg.source_parent_id=o.source_parent_id
join public.monitoring_network_registry r on r.module='pluviometrie' and r.actif and r.code=upper(trim(coalesce(px.code_station,rg.code_site,o.code_station,'')))
left join public.v_stations_pluvio_canonical_v50 c on upper(trim(c.code_station))=r.code
where o.date_observation is not null and o.pluie_24h_mm is not null
 and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01') and o.date_observation<=current_date;

create or replace view public.v_piezometrie_dashboard_v50 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,r.code code_site,r.short_code code_court,
 coalesce(nullif(c.localite_officielle,''),nullif(r.locality,''),nullif(rg.localite,''),nullif(c.localite,''),nullif(c.village,''),r.code) nom_site,
 coalesce(nullif(c.commune_officielle,''),nullif(r.commune,''),nullif(rg.commune,''),c.commune,'Non renseignée') commune,
 coalesce(c.village,rg.localite,r.locality) village,
 coalesce(c.latitude,rg.latitude) latitude,coalesce(c.longitude,rg.longitude) longitude,
 o.date_observation,o.niveau_statique,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,o.niveau_statique valeur_observee,
 (o.niveau_statique is null or o.niveau_statique<0) alerte_valeur,(coalesce(c.latitude,rg.latitude) is null or coalesce(c.longitude,rg.longitude) is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_piezo o
left join public.piezometres px on o.source_parent_id=px.source_entry_id
left join public.epicollect_parent_registry rg on rg.module='piezometrie' and rg.source_parent_id=o.source_parent_id
join public.monitoring_network_registry r on r.module='piezometrie' and r.actif and r.code=upper(trim(case when coalesce(px.code_piezo,rg.code_site,o.code_piezo,'')='PZ-DMB-SIN-001' then 'PZ-DMB-DBN-001' else coalesce(px.code_piezo,rg.code_site,o.code_piezo,'') end))
left join public.v_piezometres_canonical_v50 c on upper(trim(c.code_piezo))=r.code
where o.date_observation is not null and o.niveau_statique is not null
 and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01') and o.date_observation<=current_date;

create or replace view public.v_limnimetrie_dashboard_v50 as
with cutoff as (select nullif(value,'')::date d from public.system_settings where key='operational_data_start_date' limit 1)
select o.id,r.code code_site,
 coalesce(nullif(c.localite_officielle,''),nullif(r.locality,''),nullif(rg.localite,''),nullif(c.cours_eau,''),nullif(c.localite,''),nullif(c.village,''),r.code) nom_site,
 coalesce(nullif(c.commune_officielle,''),nullif(r.commune,''),nullif(rg.commune,''),c.commune,'Non renseignée') commune,
 coalesce(c.village,rg.localite,r.locality) village,c.cours_eau,
 coalesce(c.latitude,rg.latitude) latitude,coalesce(c.longitude,rg.longitude) longitude,
 o.date_observation,o.periode,o.hauteur_eau,o.observateur,o.commentaire,o.photo_url,o.source_entry_id,o.source_parent_id,o.synced_at,o.hauteur_eau valeur_observee,
 (o.hauteur_eau is null or o.hauteur_eau<0) alerte_valeur,(coalesce(c.latitude,rg.latitude) is null or coalesce(c.longitude,rg.longitude) is null) alerte_gps,false alerte_donnee,false alerte_secheresse,false alerte_crue
from public.observations_limni o
left join public.stations_limni px on o.source_parent_id=px.source_entry_id
left join public.epicollect_parent_registry rg on rg.module='limnimetrie' and rg.source_parent_id=o.source_parent_id
join public.monitoring_network_registry r on r.module='limnimetrie' and r.actif and r.code=upper(trim(coalesce(px.code_station,rg.code_site,o.code_station,'')))
left join public.v_stations_limni_canonical_v50 c on upper(trim(c.code_station))=r.code
where o.date_observation is not null and o.hauteur_eau is not null
 and o.date_observation>=coalesce((select d from cutoff),date '1900-01-01') and o.date_observation<=current_date;

insert into public.system_settings(key,value,description) values('version_psore','5.2.1','Version applicative PSORE')
on conflict(key) do update set value=excluded.value,description=excluded.description,updated_at=now();
notify pgrst,'reload schema';
commit;
