-- PSORE V4.4.2 — Vérification après correctif confidentialité financière

-- A. Les vues non-superadmin doivent contenir 0 colonne financière.
select table_name,
       count(*) filter (
         where column_name in ('cout_execute_fcfa','cout_rehabilitation_fcfa','cout_apd_fcfa','montant_contrat_fcfa','montant_execute_fcfa')
       ) as colonnes_financieres
from information_schema.columns
where table_schema='public'
  and table_name in ('v_microbarrages_synthese','v_microbarrages_public')
group by table_name
order by table_name;

-- B. La politique publique historique ne doit plus exister.
select policyname, roles, cmd
from pg_policies
where schemaname='public' and tablename='microbarrages'
order by policyname;

-- C. Contrôle des colonnes d'exécution attendues.
select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='microbarrages'
  and column_name in (
    'cout_execute_fcfa','taux_execution_pct','depots_evacues_m3','cordons_pierreux_ml',
    'digue_filtrante_gabion_m3','euphorbia_ml','recalibrage_lit_mineur_ml',
    'date_reception_technique','date_reception_provisoire_debut','date_reception_provisoire_fin',
    'entreprise_execution','bureau_controle'
  )
order by column_name;
