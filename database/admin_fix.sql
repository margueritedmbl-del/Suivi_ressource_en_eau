-- PSORE V2_3 PATCH1 — correction accès administration gireexpert@gmail.com
-- À exécuter après database/schema.sql et database/seed.sql.

insert into roles (nom_role, description) values
('Super administrateur','Accès total : administration, utilisateurs, sécurité et paramétrage'),
('Administrateur PTCS','Gestion complète de la plateforme'),
('DNH/DRHK','Consultation, validation et export'),
('Collecteur','Consultation autorisée et appui terrain'),
('Observateur','Consultation simple des données autorisées'),
('Public','Accès limité')
on conflict (nom_role) do update set description=excluded.description;

-- Le profil sera associé automatiquement par /api/admin/bootstrap via l’ID Auth Supabase.
-- Si besoin manuel : remplacer AUTH_USER_ID par l'id utilisateur visible dans Supabase Auth > Users.
-- update profils set role_id=(select id from roles where nom_role='Super administrateur'), actif=true where email='gireexpert@gmail.com';
