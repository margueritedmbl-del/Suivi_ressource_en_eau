export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { supabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase-admin";

function text(v:any){return String(v??"").trim();}
function num(v:any){const n=Number(String(v??"").replace(",","."));return Number.isFinite(n)?n:null;}
function date(v:any){return text(v).slice(0,10);}
function station(r:any){return text(r.code_site||r.code_station||r.code_piezo||r.piezometre_id||r.station_id||r.nom_site||r.village);}

export async function GET(){
  if(!hasSupabaseAdminEnv()) return NextResponse.json({ok:true,source:"Supabase non configuré",observations:[],pluie:[]});
  let piezo=await supabaseAdmin.from("v_piezometrie_dashboard").select("*").limit(50000);
  if(piezo.error) piezo=await supabaseAdmin.from("observations_piezo").select("*").limit(50000);
  let pluie=await supabaseAdmin.from("v_pluviometrie_dashboard").select("*").limit(50000);
  if(pluie.error) pluie=await supabaseAdmin.from("observations_pluvio").select("*").limit(50000);
  const observations=(piezo.data||[]).map((r:any)=>({station:station(r),date:date(r.date_observation||r.date_mesure),value:num(r.niveau_statique??r.valeur_observee??r.niveau_eau),commune:text(r.commune),village:text(r.village),latitude:num(r.latitude),longitude:num(r.longitude)})).filter((r:any)=>r.date&&r.value!==null);
  const rain=(pluie.data||[]).map((r:any)=>({station:station(r),date:date(r.date_observation||r.date_mesure),value:num(r.pluie_24h_mm??r.valeur_observee??r.pluie_mm),commune:text(r.commune)})).filter((r:any)=>r.date&&r.value!==null);
  return NextResponse.json({ok:true,source:"Supabase",observations,pluie:rain,warnings:[piezo.error?.message,pluie.error?.message].filter(Boolean)});
}
