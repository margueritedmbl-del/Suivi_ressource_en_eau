create table if not exists alert_recipients (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role_cible text default 'Super administrateur',
  actif boolean default true,
  created_at timestamptz default now()
);

insert into alert_recipients (email, role_cible, actif)
values ('gireexpert@gmail.com', 'Super administrateur', true)
on conflict (email) do update set actif = true;
