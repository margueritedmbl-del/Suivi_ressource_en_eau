export const dynamic="force-dynamic"; export const revalidate=0; export const fetchCache="force-no-store";
import {NextResponse} from "next/server";
import {supabaseAdmin,hasSupabaseAdminEnv} from "@/lib/supabase-admin";
import {distinctOfficialSites, networkTotal, type HydroModule} from "@/lib/network-registry";

async function rows(table:string,cols="*"){if(!hasSupabaseAdminEnv())return [];const r=await supabaseAdmin.from(table).select(cols).limit(20000);return r.data||[]}
function mean(a:any[],key:string){const v=a.map(r=>Number(r?.[key])).filter(Number.isFinite);return v.length?Number((v.reduce((x,y)=>x+y,0)/v.length).toFixed(2)):null}
function moduleStats(module:HydroModule, rows:any[], valueKey:string){const active=distinctOfficialSites(module,rows);return{stations_reseau:networkTotal(module),stations_avec_donnees:active.size,observations:rows.length,couverture_pct:networkTotal(module)?Math.round(active.size/networkTotal(module)*100):0,moyenne:mean(rows,valueKey)}}
export async function GET(){
 const [pl,pi,li,pe]=await Promise.all([rows("v_pluviometrie_dashboard_v47"),rows("v_piezometrie_dashboard_v47"),rows("v_limnimetrie_dashboard_v47"),rows("points_eau","id")]);
 return NextResponse.json({ok:true,data:{
  pluviometrie:{...moduleStats("pluviometrie",pl,"pluie_24h_mm"),pluie_moyenne:mean(pl,"pluie_24h_mm")},
  piezometrie:{...moduleStats("piezometrie",pi,"niveau_statique"),niveau_moyen:mean(pi,"niveau_statique")},
  limnimetrie:{...moduleStats("limnimetrie",li,"hauteur_eau"),hauteur_moyenne:mean(li,"hauteur_eau")},
  points_eau:{total:pe.length}
 },definition:"stations_reseau=réseau physique officiel; stations_avec_donnees=stations officielles ayant au moins une mesure exploitable; observations=mesures",version:"4.9.0"});
}
