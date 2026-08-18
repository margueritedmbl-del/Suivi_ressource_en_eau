-- Vérification structurelle V4.4.1
select 'vue_synthese_sans_finances' as controle,
       count(*) filter (where column_name in ('cout_execute_fcfa','cout_rehabilitation_fcfa','cout_apd_fcfa')) as colonnes_financieres
from information_schema.columns
where table_schema='public' and table_name='v_microbarrages_synthese';

select 'vue_publique_sans_finances' as controle,
       count(*) filter (where column_name in ('cout_execute_fcfa','cout_rehabilitation_fcfa','cout_apd_fcfa')) as colonnes_financieres
from information_schema.columns
where table_schema='public' and table_name='v_microbarrages_public';

select policyname, roles, cmd
from pg_policies
where schemaname='public' and tablename='microbarrages';
