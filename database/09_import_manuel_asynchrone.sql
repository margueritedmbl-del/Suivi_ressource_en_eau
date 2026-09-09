-- PSORE V2.4.7 - Import manuel asynchrone et reprenable
create extension if not exists pgcrypto;

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text not null,
  target_key text not null,
  module text not null,
  source text not null,
  table_name text not null,
  filename text not null,
  storage_path text not null,
  sheet_name text,
  status text not null default 'queued' check (status in ('queued','processing','completed','completed_with_errors','failed')),
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  mapped_rows integer not null default 0,
  skipped_rows integer not null default 0,
  upserted_rows integer not null default 0,
  failed_rows integer not null default 0,
  warnings jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_import_jobs_created_at on public.import_jobs(created_at desc);
create index if not exists idx_import_jobs_status on public.import_jobs(status);
create index if not exists idx_import_jobs_user_id on public.import_jobs(user_id);

alter table public.import_jobs enable row level security;

drop policy if exists authenticated_read_own_import_jobs on public.import_jobs;
create policy authenticated_read_own_import_jobs
on public.import_jobs for select
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('manual-imports', 'manual-imports', false, 4194304)
on conflict (id) do update set public = false, file_size_limit = 4194304;
