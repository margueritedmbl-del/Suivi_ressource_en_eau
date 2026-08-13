import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchEpicollectEntries } from "@/services/epicollect/client";
import type { EpicollectSource } from "@/services/epicollect/sources";

export type SyncResult = {
  module: string; source: string; table: string; status: "success" | "error";
  fetched: number; mapped: number; skipped: number; upserted: number; pages: number; durationMs: number;
  mode?: "full" | "incremental"; filterFrom?: string | null; error?: string;
};

async function writeSyncLog(result: SyncResult, message: string, apiUrl?: string) {
  const payload: Record<string, any> = { module:result.module, source:result.source, nb_enregistrements:result.upserted, statut:result.status, message, fetched_count:result.fetched, mapped_count:result.mapped, skipped_count:result.skipped, upserted_count:result.upserted, page_count:result.pages, duration_ms:result.durationMs, api_url:apiUrl||null };
  try { const { error }=await supabaseAdmin.from("sync_log").insert(payload); if(!error)return; } catch(_){}
  try { await supabaseAdmin.from("sync_log").insert({module:result.module,source:result.source,nb_enregistrements:result.upserted,statut:result.status,message}); } catch(_){}
}

async function targetHasData(table:string){
  try { const { count, error }=await supabaseAdmin.from(table).select("source_entry_id",{count:"exact",head:true}); return !error && Number(count||0)>0; } catch { return false; }
}

async function lastSuccessfulSync(module:string,source:string){
  try {
    const { data,error }=await supabaseAdmin.from("sync_log").select("date_sync").eq("module",module).eq("source",source).eq("statut","success").order("date_sync",{ascending:false}).limit(1).maybeSingle();
    if(error||!data?.date_sync)return null;
    // marge de 10 minutes pour éviter de rater une entrée téléversée à la frontière temporelle.
    return new Date(new Date(data.date_sync).getTime()-10*60*1000).toISOString();
  } catch { return null; }
}

function incrementalUrl(apiUrl:string, filterFrom:string){
  const u=new URL(apiUrl); u.searchParams.set("filter_by","uploaded_at"); u.searchParams.set("filter_from",filterFrom); u.searchParams.set("sort_by","uploaded_at"); u.searchParams.set("sort_order","ASC"); return u.toString();
}

export async function syncTable(source:EpicollectSource,table:string,mapper:(e:any)=>any,options:{full?:boolean}={}):Promise<SyncResult>{
  const started=Date.now();
  const base={module:source.module,source:source.type_source,table,fetched:0,mapped:0,skipped:0,upserted:0,pages:0,durationMs:0};
  try{
    const hasData=await targetHasData(table);
    const lastSync=!options.full && hasData ? await lastSuccessfulSync(source.module,source.type_source) : null;
    const mode: "full" | "incremental" = lastSync ? "incremental" : "full";
    const requestUrl=lastSync?incrementalUrl(source.api_url,lastSync):source.api_url;
    const fetched=await fetchEpicollectEntries(requestUrl,{ perPage:500,maxPages:2000,pageDelayMs:1500,maxRetries:4,baseRetryDelayMs:10_000,maxRetryDelayMs:60_000 });
    const rows=fetched.entries.map(mapper).filter((row)=>row&&row.source_entry_id); const skipped=fetched.entries.length-rows.length;
    let upserted=0; const batchSize=500;
    for(let i=0;i<rows.length;i+=batchSize){const batch=rows.slice(i,i+batchSize);const {error}=await supabaseAdmin.from(table).upsert(batch,{onConflict:"source_entry_id"});if(error)throw error;upserted+=batch.length;}
    const result:SyncResult={...base,status:"success",fetched:fetched.entries.length,mapped:rows.length,skipped,upserted,pages:fetched.pages,durationMs:Date.now()-started,mode,filterFrom:lastSync};
    await writeSyncLog(result,`${source.libelle} : ${upserted}/${fetched.entries.length} synchronisé(s), mode=${mode}, ${fetched.pages} page(s), per_page=${fetched.perPage}, ${fetched.retries} nouvelle(s) tentative(s), attente=${Math.round(fetched.rateLimitWaitMs/1000)} s.${lastSync?` Depuis ${lastSync}.`:""}`,source.api_url);
    return result;
  }catch(error:any){const result:SyncResult={...base,status:"error",durationMs:Date.now()-started,error:error.message||"Erreur inconnue"};await writeSyncLog(result,result.error||"Erreur de synchronisation",source.api_url);return result;}
}
