import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchEpicollectEntries } from "@/services/epicollect/client";
import type { EpicollectSource } from "@/services/epicollect/sources";
import { resolveStation, type HydroModule } from "@/lib/network-registry";

export type SyncResult = {
  module:string; source:string; label?:string; table:string; status:"success"|"error";
  fetched:number; mapped:number; skipped:number; rejected?:number; upserted:number; pages:number; durationMs:number;
  mode?:"full"|"incremental"; filterFrom?:string|null; totalReported?:number|null; linked?:number; unresolvedParents?:number; error?:string; details?:string[];
};

const ENGINE_REVISION="v5.2.1";
const VALUE_KEY:Record<string,string>={observations_pluvio:"pluie_24h_mm",observations_piezo:"niveau_statique",observations_limni:"hauteur_eau"};

async function writeSyncLog(result:SyncResult,message:string,apiUrl?:string){const payload:Record<string,any>={module:result.module,source:result.source,nb_enregistrements:result.upserted,statut:result.status,message,fetched_count:result.fetched,mapped_count:result.mapped,skipped_count:result.skipped,upserted_count:result.upserted,page_count:result.pages,duration_ms:result.durationMs,api_url:apiUrl||null};try{const{error}=await supabaseAdmin.from("sync_log").insert(payload);if(!error)return;}catch(_){}try{await supabaseAdmin.from("sync_log").insert({module:result.module,source:result.source,nb_enregistrements:result.upserted,statut:result.status,message});}catch(_){}}

async function targetHasMeaningfulData(table:string){try{const key=VALUE_KEY[table];if(key){const{count,error}=await supabaseAdmin.from(table).select("id",{count:"exact",head:true}).not(key,"is",null).not("date_observation","is",null);return !error&&Number(count||0)>0;}const{count,error}=await supabaseAdmin.from(table).select("source_entry_id",{count:"exact",head:true});return !error&&Number(count||0)>0;}catch{return false;}}

async function lastSuccessfulSync(module:string,source:string){try{const{data,error}=await supabaseAdmin.from("sync_log").select("date_sync,message").eq("module",module).eq("source",source).eq("statut","success").order("date_sync",{ascending:false}).limit(1).maybeSingle();if(error||!data?.date_sync||!String(data.message||"").includes(`engine=${ENGINE_REVISION}`))return null;return new Date(new Date(data.date_sync).getTime()-10*60*1000).toISOString();}catch{return null;}}
function incrementalUrl(apiUrl:string,filterFrom:string){const u=new URL(apiUrl);u.searchParams.set("filter_by","uploaded_at");u.searchParams.set("filter_from",filterFrom);u.searchParams.set("sort_by","uploaded_at");u.searchParams.set("sort_order","ASC");return u.toString();}

function validateRow(table:string,row:any){if(!row?.source_entry_id)return"identifiant source absent";if(table==="observations_pluvio"&&(!row.date_observation||row.pluie_24h_mm===null||row.pluie_24h_mm===undefined))return"date ou hauteur de pluie absente";if(table==="observations_piezo"&&(!row.date_observation||row.niveau_statique===null||row.niveau_statique===undefined))return"date ou niveau statique absent";if(table==="observations_limni"&&(!row.date_observation||row.hauteur_eau===null||row.hauteur_eau===undefined))return"date ou hauteur d'eau absente";return null;}

async function storeRejects(source:EpicollectSource,table:string,rejects:{entry:any;reason:string}[]){if(!rejects.length)return;try{const rows=rejects.slice(0,500).map(({entry,reason})=>({module:source.module,source:source.type_source,target_table:table,source_entry_id:entry?.source_entry_id||null,reason,raw_payload:entry?.raw_payload||null}));await supabaseAdmin.from("sync_rejects").insert(rows);}catch(_){}}

const PARENT_TABLE_MODULE:Record<string,{module:HydroModule;codeField:string}>={
  stations_pluvio:{module:"pluviometrie",codeField:"code_station"},
  piezometres:{module:"piezometrie",codeField:"code_piezo"},
  stations_limni:{module:"limnimetrie",codeField:"code_station"},
};

async function upsertParentRegistry(table:string,rows:any[]){
  const cfg=PARENT_TABLE_MODULE[table];
  if(!cfg||!rows.length)return{upserted:0,error:null as string|null};
  const payload=rows.map((row:any)=>{
    const resolution=resolveStation(cfg.module,{code:row[cfg.codeField],locality:row.localite||row.village||row.nom_station});
    return {
      module:cfg.module,
      source_parent_id:String(row.source_entry_id||""),
      code_site:resolution.code||row[cfg.codeField]||null,
      commune:resolution.meta?.commune||row.commune||null,
      localite:resolution.meta?.locality||row.localite||row.village||row.nom_station||null,
      latitude:row.latitude??null,longitude:row.longitude??null,
      synced_at:new Date().toISOString(),
    };
  }).filter((r:any)=>r.source_parent_id);
  if(!payload.length)return{upserted:0,error:null};
  try{
    let n=0;
    for(let i=0;i<payload.length;i+=250){
      const batch=payload.slice(i,i+250);
      const{error}=await supabaseAdmin.from("epicollect_parent_registry").upsert(batch,{onConflict:"module,source_parent_id"});
      if(error)return{upserted:n,error:error.message};
      n+=batch.length;
    }
    return{upserted:n,error:null};
  }catch(error:any){return{upserted:0,error:error?.message||String(error)}}
}

async function enrichFromParent(table:string,rows:any[]){
  const parentIds=Array.from(new Set(rows.map(r=>r.source_parent_id).filter(Boolean)));
  if(!parentIds.length)return{rows,linked:0,unresolved:rows.length,registryLinked:0};
  let parentTable="",idField="",codeField="",module:HydroModule|null=null;
  if(table==="observations_pluvio"){parentTable="stations_pluvio";idField="station_id";codeField="code_station";module="pluviometrie";}
  else if(table==="observations_piezo"){parentTable="piezometres";idField="piezometre_id";codeField="code_piezo";module="piezometrie";}
  else if(table==="observations_limni"){parentTable="stations_limni";idField="station_id";codeField="code_station";module="limnimetrie";}
  else return{rows,linked:0,unresolved:0,registryLinked:0};
  try{
    const{data,error}=await supabaseAdmin.from(parentTable).select(`id,source_entry_id,${codeField}`).in("source_entry_id",parentIds);
    const parents=(!error&&data?data:[]) as any[];
    const parentMap=new Map(parents.map(p=>[String(p.source_entry_id||""),p]));
    const missingIds=parentIds.filter(id=>!parentMap.has(String(id)));
    let registryMap=new Map<string,any>();
    if(missingIds.length){
      try{
        const{data:reg,error:regError}=await supabaseAdmin.from("epicollect_parent_registry").select("source_parent_id,code_site,commune,localite").eq("module",module).in("source_parent_id",missingIds);
        if(!regError&&reg)registryMap=new Map((reg as any[]).map(r=>[String(r.source_parent_id||""),r]));
      }catch(_){}
    }
    let linked=0,unresolved=0,registryLinked=0;
    for(const row of rows){
      const key=String(row.source_parent_id||"");
      const p=parentMap.get(key);
      if(p){
        row[idField]=p.id;
        const resolution=resolveStation(module!,{code:p[codeField]||row[codeField]});
        if(resolution.code){row[codeField]=resolution.code;linked++;}
        else {if(!row[codeField])row[codeField]=p[codeField];unresolved++;}
        continue;
      }
      const reg=registryMap.get(key);
      if(reg){
        const resolution=resolveStation(module!,{code:reg.code_site||row[codeField],locality:reg.localite});
        if(resolution.code){row[codeField]=resolution.code;linked++;registryLinked++;continue;}
      }
      unresolved++;
    }
    return{rows,linked,unresolved,registryLinked};
  }catch{return{rows,linked:0,unresolved:rows.length,registryLinked:0};}
}


async function reconcileFullDataset(_table:string,_rows:any[]){
  // V5.2.1 : aucune suppression automatique des données Epicollect.
  // Les formulaires parents peuvent être saisis plusieurs fois pour une même station physique :
  // chaque UUID parent doit rester disponible car les formulaires enfants le référencent via ec5_parent_uuid.
  // Les vues canoniques dédupliquent ensuite les stations par code métier officiel.
  return 0;
}
async function upsertResilient(table:string,rows:any[]){let upserted=0;const errors:string[]=[];async function write(batch:any[]):Promise<void>{if(!batch.length)return;const{error}=await supabaseAdmin.from(table).upsert(batch,{onConflict:"source_entry_id"});if(!error){upserted+=batch.length;return;}const msg=error.message||String(error);if(/column .* does not exist|schema cache|could not find/i.test(msg))throw new Error(`${msg}. Exécutez les migrations PSORE requises avant de synchroniser.`);if(/duplicate key value violates unique constraint.*(code_station|code_piezo)|stations_pluvio_code_station_key|piezometres_code_piezo_key|stations_limni_code_station_key/i.test(msg))throw new Error(`${msg}. Le schéma bloque plusieurs fiches Epicollect pour une même station physique. Exécutez database/34_REPAIR_PARENT_HISTORY_V5_2_1.sql puis relancez une synchronisation complète.`);if(batch.length===1){errors.push(`${batch[0]?.source_entry_id||"ligne"}: ${msg}`);return;}const mid=Math.ceil(batch.length/2);await write(batch.slice(0,mid));await write(batch.slice(mid));}
  for(let i=0;i<rows.length;i+=250)await write(rows.slice(i,i+250));return{upserted,errors};
}

export async function syncTable(source:EpicollectSource,table:string,mapper:(e:any)=>any,options:{full?:boolean}={}):Promise<SyncResult>{
  const started=Date.now();const base={module:source.module,source:source.type_source,label:source.libelle,table,fetched:0,mapped:0,skipped:0,rejected:0,upserted:0,pages:0,durationMs:0};
  try{
    const hasMeaningful=await targetHasMeaningfulData(table);const lastSync=!options.full&&hasMeaningful?await lastSuccessfulSync(source.module,source.type_source):null;const mode:"full"|"incremental"=lastSync?"incremental":"full";const requestUrl=lastSync?incrementalUrl(source.api_url,lastSync):source.api_url;
    const fetched=await fetchEpicollectEntries(requestUrl,{perPage:500,maxPages:2000,pageDelayMs:1200,maxRetries:4,baseRetryDelayMs:10_000,maxRetryDelayMs:60_000});
    const mapped=fetched.entries.map(mapper).filter(Boolean);const rejects:{entry:any;reason:string}[]=[];const valid:any[]=[];for(const row of mapped){const reason=validateRow(table,row);if(reason)rejects.push({entry:row,reason});else valid.push(row);}await storeRejects(source,table,rejects);
    const registryWrite=await upsertParentRegistry(table,valid);
    const enriched=await enrichFromParent(table,valid);const written=await upsertResilient(table,enriched.rows);await reconcileFullDataset(table,enriched.rows);const skipped=fetched.entries.length-valid.length+written.errors.length;
    const writeIncomplete=written.errors.length>0;
    const registryError=registryWrite.error;
    const result:SyncResult={...base,status:writeIncomplete?"error":"success",fetched:fetched.entries.length,mapped:mapped.length,skipped,rejected:rejects.length+written.errors.length,upserted:written.upserted,pages:fetched.pages,durationMs:Date.now()-started,mode,filterFrom:lastSync,totalReported:fetched.totalReported,linked:enriched.linked,unresolvedParents:enriched.unresolved,error:writeIncomplete?`Synchronisation partielle : ${written.errors.length} rejet(s) SQL. Consultez les détails.`:undefined,details:[...(written.errors.slice(0,20)),...(registryError?[`Registre parents : ${registryError}`]:[]),`Registre parents : ${registryWrite.upserted} UUID traité(s) ; liaisons via registre=${enriched.registryLinked}.`,`Historique Epicollect conservé : aucune suppression automatique des fiches parents/enfants.`]};
    const note=`engine=${ENGINE_REVISION}; ${source.libelle}: ${written.upserted}/${fetched.entries.length} intégré(s), ${rejects.length} donnée(s) non exploitable(s), ${written.errors.length} rejet(s) SQL, liés_parent=${enriched.linked}, via_registre=${enriched.registryLinked}, parents_non_resolus=${enriched.unresolved}, registre_upsert=${registryWrite.upserted}, mode=${mode}, pages=${fetched.pages}, per_page=${fetched.perPage}, total_api=${fetched.totalReported??"?"}, retries=${fetched.retries}, historique_conserve=oui.`;
    await writeSyncLog(result,note,source.api_url);return result;
  }catch(error:any){const result:SyncResult={...base,status:"error",durationMs:Date.now()-started,error:error.message||"Erreur inconnue"};await writeSyncLog(result,`engine=${ENGINE_REVISION}; ${result.error}`,source.api_url);return result;}
}
