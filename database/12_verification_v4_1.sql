-- Vérification PSORE V4.1
select 'bucket_psore_documents' as verification,
       count(*)::text as resultat
from storage.buckets
where id = 'psore-documents' and public = false;

select 'documents_references' as verification,
       json_build_object(
         'total', count(*),
         'analyses_eau', count(*) filter (where type_document='ANALYSE_EAU'),
         'essais_pompage', count(*) filter (where type_document='ESSAI_POMPAGE')
       )::text as resultat
from public.documents_ouvrages
where actif = true;

select 'objets_storage' as verification,
       count(*)::text as resultat
from storage.objects
where bucket_id = 'psore-documents';

select code_ouvrage, type_document, storage_path,
       exists (
         select 1 from storage.objects o
         where o.bucket_id = d.bucket and o.name = d.storage_path
       ) as fichier_present
from public.documents_ouvrages d
order by code_ouvrage, type_document;
