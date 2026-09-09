-- PSORE V4.1 — stockage externalisé des documents techniques
-- Exécuter après database/10_observatoire_integre_ouvrages.sql

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'psore-documents',
  'psore-documents',
  false,
  15728640,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.documents_ouvrages (
  id uuid primary key default gen_random_uuid(),
  code_ouvrage text not null,
  type_document text not null check (type_document in ('ANALYSE_EAU','ESSAI_POMPAGE')),
  titre text not null,
  bucket text not null default 'psore-documents',
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  actif boolean not null default true,
  source_document text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(code_ouvrage, type_document)
);

alter table public.documents_ouvrages enable row level security;

-- La lecture des fichiers passe par l'API PSORE qui vérifie le rôle puis crée une URL signée.
-- Aucune politique publique n'est créée sur le bucket privé.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='documents_ouvrages' and policyname='authenticated_read_documents_ouvrages'
  ) then
    create policy authenticated_read_documents_ouvrages
      on public.documents_ouvrages for select
      to authenticated
      using (actif = true);
  end if;
end $$;

insert into public.documents_ouvrages
(code_ouvrage,type_document,titre,bucket,storage_path,mime_type,source_document)
select code,
       'ANALYSE_EAU',
       'Certificat d''analyse d''eau — ' || site,
       'psore-documents',
       'piezometres/analyses-eau/' || code || '.pdf',
       'application/pdf',
       'Archives des analyses d''eau des piézomètres'
from (values
('PZ-01','Fani'),('PZ-02','Dombana'),('PZ-03','Doumba'),('PZ-04','Dialakorobougou'),
('PZ-05','Wolokorodji'),('PZ-06','Gnamakorobougou'),('PZ-07','Félou'),('PZ-08','Niobougou'),
('PZ-09','Sirakorola Ouest'),('PZ-10','Monzombala'),('PZ-11','Dlana'),('PZ-12','Boron Cissé'),
('PZ-13','Dontérébougou'),('PZ-14','Koroka'),('PZ-15','Zana'),('PZ-16','Gouni'),
('PZ-17','Fégoun'),('PZ-18','Diaguinébougou'),('PZ-19','Siratiguila'),('PZ-20','Diladjè')
) as p(code,site)
on conflict (code_ouvrage,type_document) do update set
  titre=excluded.titre,bucket=excluded.bucket,storage_path=excluded.storage_path,
  mime_type=excluded.mime_type,source_document=excluded.source_document,actif=true,updated_at=now();

insert into public.documents_ouvrages
(code_ouvrage,type_document,titre,bucket,storage_path,mime_type,source_document)
select code,
       'ESSAI_POMPAGE',
       'Essai de pompage — ' || site,
       'psore-documents',
       'piezometres/essais-pompage/' || code || '.pdf',
       'application/pdf',
       'Fiches d''essais de pompage des piézomètres'
from (values
('PZ-01','Fani'),('PZ-02','Dombana'),('PZ-03','Doumba'),('PZ-04','Dialakorobougou'),
('PZ-05','Wolokorodji'),('PZ-06','Gnamakorobougou'),('PZ-07','Félou'),('PZ-08','Niobougou'),
('PZ-09','Sirakorola Ouest'),('PZ-10','Monzombala'),('PZ-11','Dlana'),('PZ-12','Boron Cissé'),
('PZ-13','Dontérébougou'),('PZ-14','Koroka'),('PZ-15','Zana'),('PZ-16','Gouni'),
('PZ-17','Fégoun'),('PZ-18','Diaguinébougou'),('PZ-19','Siratiguila'),('PZ-20','Diladjè')
) as p(code,site)
on conflict (code_ouvrage,type_document) do update set
  titre=excluded.titre,bucket=excluded.bucket,storage_path=excluded.storage_path,
  mime_type=excluded.mime_type,source_document=excluded.source_document,actif=true,updated_at=now();

comment on table public.documents_ouvrages is 'Registre des documents techniques externalisés dans Supabase Storage';
