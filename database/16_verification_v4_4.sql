-- PSORE V4.4.0 — vérification post-migration
select 'piezometres_reference' as controle, count(*) as valeur
from public.piezometres where niveau_reference_m is not null;

select 'microbarrages_100_pct' as controle, count(*) as valeur
from public.microbarrages where taux_execution_pct = 100;

select 'microbarrages_total_execute_fcfa' as controle,
       coalesce(sum(cout_execute_fcfa),0)::bigint as valeur
from public.microbarrages;

select 'documents_ouvrages_registres' as controle, count(*) as valeur
from public.documents_ouvrages;

select code_piezo, village, niveau_reference_m, date_reference
from public.piezometres
where niveau_reference_m is not null
order by code_piezo;
