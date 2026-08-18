insert into roles (nom_role, description) values
('Super administrateur','Accès total : administration, utilisateurs, sécurité et paramétrage'),
('Administrateur PTCS','Gestion complète de la plateforme'),
('DNH/DRHK','Consultation, validation et export'),
('Collecteur','Consultation autorisée et appui terrain'),
('Observateur','Consultation simple des données autorisées'),
('Public','Accès limité')
on conflict (nom_role) do update set description=excluded.description;

insert into regions (nom) values ('Koulikoro') on conflict (nom) do nothing;

insert into configuration (cle, valeur) values
('nom_plateforme','PSORE – Plateforme de Suivi et d’Observation des Ressources en Eau'),
('organisation','PTCS – Enabel – DNH/DRHK'),
('domaine','eau-ptcs-mali.org'),
('couleur_principale','#5B2A86')
on conflict (cle) do update set valeur=excluded.valeur;

insert into epicollect_sources (module,type_source,libelle,project_slug,api_url,form_url) values
('pluviometrie','stations','Référentiel des pluviomètres','suivi-pluviometrique-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a047a461c0c4','https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs'),
('pluviometrie','releves','Relevés pluviométriques','suivi-pluviometrique-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-pluviometrique-koulikoro-ptcs?form_ref=b08ac6bb9fcc46229ca70b7442315ff9_6a05a7178bf71','https://five.epicollect.net/project/suivi-pluviometrique-koulikoro-ptcs'),
('piezometrie','referentiel','Référentiel piézomètres','suivi-piezo-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a047a461c0c4','https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs'),
('piezometrie','mesures','Mesures piézométriques','suivi-piezo-koulikoro-ptcs','https://five.epicollect.net/api/export/entries/suivi-piezo-koulikoro-ptcs?form_ref=6144ed6ab3d646baa82de06e13b4f051_6a05a7178bf71','https://five.epicollect.net/project/suivi-piezo-koulikoro-ptcs'),
('limnimetrie','stations','Stations limnimétriques','suivi-limnimetrique-ce-koulikoro','https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a047a461c0c4','https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro'),
('limnimetrie','lectures','Lectures limnimétriques','suivi-limnimetrique-ce-koulikoro','https://five.epicollect.net/api/export/entries/suivi-limnimetrique-ce-koulikoro?form_ref=bd5f4213890945cfb0d4976cd8768332_6a05a7178bf71','https://five.epicollect.net/project/suivi-limnimetrique-ce-koulikoro'),
('points_eau','inventaire','Inventaire points d’eau','etat-des-lieux-pe-ptcs','https://five.epicollect.net/api/export/entries/etat-des-lieux-pe-ptcs?form_ref=9365afaa5ef642ffb8ed24b8b51bf93a_5db097aea78d5','https://five.epicollect.net/project/etat-des-lieux-pe-ptcs')
on conflict (module,type_source) do update set libelle=excluded.libelle, api_url=excluded.api_url, form_url=excluded.form_url, actif=true;
