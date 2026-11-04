import { loadHydroRows, type HydroRow } from "@/lib/hydro-data";
import { networkTotal, type HydroModule } from "@/lib/network-registry";
import { readPointEauRows } from "@/services/points-eau/analytics";

const modules: HydroModule[] = ["pluviometrie", "piezometrie", "limnimetrie"];
const fields = {pluviometrie:"pluie_24h_mm",piezometrie:"niveau_statique",limnimetrie:"hauteur_eau"};
const units = {pluviometrie:"mm",piezometrie:"m",limnimetrie:"cm"};
function number(v:unknown){if(v===null||v===undefined||String(v).trim()==="")return null;const n=Number(String(v).replace(",","."));return Number.isFinite(n)?n:null;}
function date(v:unknown){const d=String(v||"").slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d?d:null;}

export function summarizeHydro(module:HydroModule,rows:HydroRow[],today:string){
  const start=new Date(today+"T00:00:00Z");start.setUTCDate(start.getUTCDate()-29);
  const dates=Array.from({length:30},(_,i)=>{const d=new Date(start);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);});
  const seen=new Set<string>(),stations=new Set<string>(),daily=new Map<string,Map<string,number[]>>();let measurements=0,lastDate:string|null=null;
  for(const row of rows){
    const station=String(row.code_site||row.code_station||row.code_piezo||"").trim(),day=date(row.date_observation),value=number(row[fields[module]]);
    if(!station||!day||day>today||value===null||(module==="pluviometrie"&&value<0))continue;
    const key=JSON.stringify([station,day,row.heure_observation||row.heure||"",value]);if(seen.has(key))continue;seen.add(key);
    measurements++;stations.add(station);if(!lastDate||day>lastDate)lastDate=day;
    if(day<dates[0])continue;
    const byStation=daily.get(day)||new Map<string,number[]>(),values=byStation.get(station)||[];values.push(value);byStation.set(station,values);daily.set(day,byStation);
  }
  const series=dates.map(day=>{const byStation=daily.get(day),values=byStation?[...byStation.values()].map(xs=>xs.reduce((a,b)=>a+b,0)/xs.length):[];return{date:day,value:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,stations:values.length};});
  return{status:"ok" as const,network:networkTotal(module),stations:stations.size,measurements,lastDate,unit:units[module],series,start:dates[0],end:today};
}

export async function buildPublicOverview(now=new Date()){
 const today=now.toISOString().slice(0,10);
 const entries=await Promise.all(modules.map(async module=>{try{const loaded=await loadHydroRows(module);if(loaded.error||loaded.source.startsWith("En attente"))throw Error("Source indisponible");return[module,summarizeHydro(module,loaded.rows,today)] as const;}catch{return[module,{status:"unavailable" as const,network:networkTotal(module),stations:null,measurements:null,lastDate:null,unit:units[module],series:[],start:null,end:today}] as const;}}));
 let points:{count:number|null;source:string;status:string}={count:null,source:"Indisponible",status:"unavailable"};
 try{const loaded=await readPointEauRows();const ids=new Set<string>();let withoutCode=0;for(const row of loaded.rows){const id=String(row.source_entry_id||row.ec5_uuid||row.id||row.code_pe||"").trim();if(id)ids.add(id);else withoutCode++;}points={count:ids.size+withoutCode,source:loaded.source,status:"ok"};}catch{}
 return{generatedAt:now.toISOString(),period:{start:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-29)).toISOString().slice(0,10),end:today},points,modules:Object.fromEntries(entries) as Record<HydroModule,{status:string;network:number;stations:number|null;measurements:number|null;lastDate:string|null;unit:string;series:{date:string;value:number|null;stations:number}[]}>};
}
