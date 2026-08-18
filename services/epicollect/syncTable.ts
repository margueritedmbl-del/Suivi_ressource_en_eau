import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchEpicollectEntries } from "@/services/epicollect/client";
import type { EpicollectSource } from "@/services/epicollect/sources";
import { resolveStation, type HydroModule } from "@/lib/network-registry";

export type SyncResult = {
  module:string; source:string; label?:string; table:string; status:"success"|"error";
  fetched:number; mapped:number; skipped:number; rejected?:number; upserted:number; pages:number; durationMs:number;
  mode?:"full"|"incremental"; filterFrom?:string|null; totalReported?:number|null; linked?:number; unresolvedParents?:number; error?:string; details?:string[];
};

const ENGINE_REVISION="v5.2.0";
const VALUE_KEY:Record<string,string>={observations_pluvio:"pluie_24h_mm",observations_piezo:"niveau_statique",observations_limni:"hauteur_eau"};

async function writeSyncLog(result:SyncResult,message:string,apiUrl?:string){const payload:Record<string,any>={module:result.module,source:result.source,nb_enregistrements:result.upserted,statut:result.status,message,fetched_count:result.fetched,mapped_count:result.mapped,skipped_count:result.skipped,upserted_count:result.upserted,page_count:result.pages,duration_ms:result.durationMs,api_url:apiUrl||null};try{const{error}=await supabaseAdmin.from("sync_log").insert(payload);if(!error)return;}catch(_){}try{await supabaseAdmin.from("sync_log").insert({module:result.module,source:result.source,nb_enregistrements:result.upserted,statut:result.status,message});}catch(_){}}

async function targetHasMeaningfulData(table:string){try{const key=VALUE_KEY[table];if(key){const{count,error}=await supabaseAdmin.from(table).select("id",{count:"exact",head:true}).not(key,"is",null).not("date_observation","is",null);return !error&&Number(count||0)>0;}const{count,error}=await supabaseAdmin.from(table).select("source_entry_id",{count:"exact",head:true});return !error&&Number(count||0)>0;}catch{return false;}}

async function lastSuccessfulSync(module:string,source:string){try{const{data,error}=await supabaseAdmin.from("sync_log").select("date_sync,message").eq("module",module).eq("source",source).eq("statut","success").order("date_sync",{ascending:false}).limit(1).maybeSingle();if(error||!data?.date_sync||!String(data.message||"").includes(`engine=${ENGINE_REVISION}`))return null;return new Date(new Date(data.date_sync).getTime()-10*60*1000).toISOString();}catch{return null;}}
function incrementalUrl(apiUrl:string,filterFrom:string){const u=new URL(apiUrl);u.searchParams.set("filter_by","uploaded_at");u.searchParams.set("filter_from",filterFrom);u.searchParams.set("sort_by","uploaded_at");u.searchParams.set("sort_order","ASC");return u.toString();}

function validateRow(table:string,row:any){if(!row?.source_entry_id)return"identifiant source absent";if(table==="observations_pluvio"&&(!row.date_observation||row.pluie_24h_mm===null||row.pluie_24h_mm===undefined))return"date ou hauteur de pluie absente";if(table==="observations_piezo"&&(!row.date_observation||row.niveau_statique===null||row.niveau_statique===undefined))return"date ou niveau statique absent";if(table==="observations_limni"&&(!row.date_observation||row.hauteur_eau===null||row.hauteur_eau===undefined))return"date ou hauteur d'eau absente";return null;}

async function storeRejects(source:EpicollectSource,table:string,rejects:{entry:any;reason:string}[]){if(!rejects.length)return;try{const rows=rejects.slice(0,500).map(({entry,reason})=>({module:source.module,source:source.type_source,target_table:table,source_entry_id:entry?.source_entry_id||null,reason,raw_payload:entry?.raw_payload||null}));await supabaseAdmin.from("sync_rejects").insert(rows);}catch(_){}}

async function enrichFromParent(table:string,rows:any[]){
  const parentIds=Array.from(new Set(rows.map(r=>r.source_parent_id).filter(Boolean)));
  if(!parentIds.length)return{rows,linked:0,unresolved:rows.length};
  let parentTable="",idField="",codeField="",module:HydroModule|null=null;
  if(table==="observations_pluvio"){parentTable="stations_pluvio";idField="station_id";codeField="code_station";module="pluviometrie";}
  else if(table==="observations_piezo"){parentTable="piezometres";idField="piezometre_id";codeField="code_piezo";module="piezometrie";}
  else if(table==="observations_limni"){parentTable="stations_limni";idField="station_id";codeField="code_station";module="limnimetrie";}
  else return{rows,linked:0,unresolved:0};
  try{
    const{data,error}=await supabaseAdmin.from(parentTable).select(`id,source_entry_id,${codeField}`).in("source_entry_id",parentIds);
    if(error||!data)return{rows,linked:0,unresolved:rows.length};
    const map=new Map((data as any[]).map(p=>[String(p.source_entry_id||""),p]));
    let linked=0,unresolved=0;
    for(const row of rows){
      const p=map.get(String(row.source_parent_id||""));
      if(!p){unresolved++;continue;}
      row[idField]=p.id;
      const resolution=resolveStation(module!,{code:p[codeField]||row[codeField]});
      if(resolution.code){row[codeField]=resolution.code;row.code_site=resolution.code;linked++;}
      else { if(!row[codeField])row[codeField]=p[codeField]; unresolved++; }
    }
    return{rows,linked,unresolved};
  }catch{return{rows,linked:0,unresolved:rows.length};}
}


async function reconcileFullDataset(table:string,rows:any[]){
  // Une synchronisation complète représente l'état autoritatif Epicollect5 pour ces tables.
  // Elle supprime les anciennes lignes fantômes créées par les moteurs V4.5 et antérieurs.
  if(!rows.length)return 0;
  const keep=new Set(rows.map(r=>String(r.source_entry_id||"")).filter(Boolean));
  try{
    const {data,error}=await supabaseAdmin.from(table).select("id,source_entry_id").limit(50000);
    if(error||!data)return 0;
    const stale=(data as any[]).filter(r=>r.source_entry_id&&!keep.has(String(r.source_entry_id))).map(r=>r.id);
    let deleted=0;
    for(let i=0;i<stale.length;i+=200){const batch=stale.slice(i,i+200);const {error:delError}=await supabaseAdmin.from(table).delete().in("id",batch);if(!delError)deleted+=batch.length;}
    return deleted;
  }catch{return 0;}
}
async function upsertResilient(table:string,rows:any[]){let upserted=0;const errors:string[]=[];async function write(batch:any[]):Promise<void>{if(!batch.length)return;const{error}=await supabaseAdmin.from(table).upsert(batch,{onConflict:"source_entry_id"});if(!error){upserted+=batch.length;return;}const msg=error.message||String(error);if(/column .* does not exist|schema cache|could not find/i.test(msg))throw new Error(`${msg}. Exécutez la migration database/24_MASTER_OPERATIONAL_READY_V4_7.sql avant de synchroniser.`);if(batch.length===1){errors.push(`${batch[0]?.source_entry_id||"ligne"}: ${msg}`);return;}const mid=Math.ceil(batch.length/2);await write(batch.slice(0,mid));await write(batch.slice(mid));}
  for(let i=0;i<rows.length;i+=250)await write(rows.slice(i,i+250));return{upserted,errors};
}

export async function syncTable(source:EpicollectSource,table:string,mapper:(e:any)=>any,options:{full?:boolean}={}):Promise<SyncResult>{
  const started=Date.now();const base={module:source.module,source:source.type_source,label:source.libelle,table,fetched:0,mapped:0,skipped:0,rejected:0,upserted:0,pages:0,durationMs:0};
  try{
    const hasMeaningful=await targetHasMeaningfulData(table);const lastSync=!options.full&&hasMeaningful?await lastSuccessfulSync(source.module,source.type_source):null;const mode:"full"|"incremental"=lastSync?"incremental":"full";const requestUrl=lastSync?incrementalUrl(source.api_url,lastSync):source.api_url;
    const fetched=await fetchEpicollectEntries(requestUrl,{perPage:500,maxPages:2000,pageDelayMs:1200,maxRetries:4,baseRetryDelayMs:10_000,maxRetryDelayMs:60_000});
    const mapped=fetched.entries.map(mapper).filter(Boolean);const rejects:{entry:any;reason:string}[]=[];const valid:any[]=[];for(const row of mapped){const reason=validateRow(table,row);if(reason)rejects.push({entry:row,reason});else valid.push(row);}await storeRejects(source,table,rejects);
    const enriched=await enrichFromParent(table,valid);const written=await upsertResilient(table,enriched.rows);const reconciledDeleted=mode==="full"?await reconcileFullDataset(table,enriched.rows):0;const skipped=fetched.entries.length-valid.length+written.errors.length;
    const result:SyncResult={...base,status:"success",fetched:fetched.entries.length,mapped:mapped.length,skipped,rejected:rejects.length+written.errors.length,upserted:written.upserted,pages:fetched.pages,durationMs:Date.now()-started,mode,filterFrom:lastSync,totalReported:fetched.totalReported,linked:enriched.linked,unresolvedParents:enriched.unresolved,details:[...(written.errors.slice(0,20)),...(reconciledDeleted?[`Réconciliation : ${reconciledDeleted} ancienne(s) ligne(s) supprimée(s)`]:[])]};
    const note=`engine=${ENGINE_REVISION}; ${source.libelle}: ${written.upserted}/${fetched.entries.length} intégré(s), ${rejects.length} donnée(s) non exploitable(s), ${written.errors.length} rejet(s) SQL, liés_parent=${enriched.linked}, parents_non_resolus=${enriched.unresolved}, mode=${mode}, pages=${fetched.pages}, per_page=${fetched.perPage}, total_api=${fetched.totalReported??"?"}, retries=${fetched.retries}, anciennes_supprimees=${reconciledDeleted}.`;
    await writeSyncLog(result,note,source.api_url);return result;
  }catch(error:any){const result:SyncResult={...base,status:"error",durationMs:Date.now()-started,error:error.message||"Erreur inconnue"};await writeSyncLog(result,`engine=${ENGINE_REVISION}; ${result.error}`,source.api_url);return result;}
}
