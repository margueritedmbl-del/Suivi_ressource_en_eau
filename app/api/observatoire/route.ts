export const dynamic="force-dynamic"; export const revalidate=0; export const fetchCache="force-no-store";
import {NextResponse} from "next/server"; import {supabaseAdmin,hasSupabaseAdminEnv} from "@/lib/supabase-admin";
async function rows(table:string,cols="*"){if(!hasSupabaseAdminEnv())return [];const r=await supabaseAdmin.from(table).select(cols).limit(20000);return r.data||[]}
function distinct(a:any[],keys:string[]){return new Set(a.map(r=>keys.map(k=>String(r?.[k]??"").trim()).find(Boolean)||"").filter(Boolean)).size}
function mean(a:any[],key:string){const v=a.map(r=>Number(r?.[key])).filter(Number.isFinite);return v.length?Number((v.reduce((x,y)=>x+y,0)/v.length).toFixed(2)):null}
export async function GET(){
 const [pl,pi,li,pe]=await Promise.all([rows("v_pluviometrie_dashboard_v47"),rows("v_piezometrie_dashboard_v47"),rows("v_limnimetrie_dashboard_v47"),rows("points_eau","id")]);
 // Une station = un code métier présent dans les données exploitables; une observation reste une mesure distincte.
 const data={
  pluviometrie:{stations:distinct(pl,["code_site","code_station"]),observations:pl.length,pluie_moyenne:mean(pl,"pluie_24h_mm")},
  piezometrie:{stations:distinct(pi,["code_site","code_piezo"]),observations:pi.length,niveau_moyen:mean(pi,"niveau_statique")},
  limnimetrie:{stations:distinct(li,["code_site","code_station"]),observations:li.length,hauteur_moyenne:mean(li,"hauteur_eau")},
  points_eau:{total:pe.length}
 }; return NextResponse.json({ok:true,data,definition:"stations=sites physiques distincts présents dans les mesures exploitables; observations=mesures",version:"4.8.0"});
}
