export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { NextResponse } from "next/server";
import { supabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase-admin";
async function count(table:string){if(!hasSupabaseAdminEnv())return 0;try{const{count}=await supabaseAdmin.from(table).select("*",{count:"exact",head:true});return count||0}catch{return 0}}
async function avg(table:string,field:string){if(!hasSupabaseAdminEnv())return null;try{const{data}=await supabaseAdmin.from(table).select(field).limit(5000);const vals=(data||[]).map((r:any)=>Number(r[field])).filter((n:number)=>Number.isFinite(n));return vals.length?Number((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)):null}catch{return null}}
export async function GET(){const data={pluviometrie:{stations:await count("v_stations_pluvio_canonical_v47"),observations:await count("v_pluviometrie_dashboard_v47"),pluie_moyenne:await avg("v_pluviometrie_dashboard_v47","pluie_24h_mm")},piezometrie:{stations:await count("v_piezometres_canonical_v47"),observations:await count("v_piezometrie_dashboard_v47"),niveau_moyen:await avg("v_piezometrie_dashboard_v47","niveau_statique")},limnimetrie:{stations:await count("v_stations_limni_canonical_v47"),observations:await count("v_limnimetrie_dashboard_v47"),hauteur_moyenne:await avg("v_limnimetrie_dashboard_v47","hauteur_eau")},points_eau:{total:await count("points_eau")}};return NextResponse.json({ok:true,data,mode:"operational",version:"4.7.1"});}
