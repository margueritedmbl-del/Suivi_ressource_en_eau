-- Après création du compte dans Supabase Auth, attribuer le rôle administrateur.
insert into profils (id,email,role_id,actif)
select u.id,u.email,r.id,true
from auth.users u
cross join roles r
where u.email='gireexpert@gmail.com'
and r.nom_role='Super administrateur'
on conflict (id) do update set role_id=excluded.role_id, actif=true;
