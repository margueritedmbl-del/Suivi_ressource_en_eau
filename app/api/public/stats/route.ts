export const dynamic="force-dynamic";
export const revalidate=0;
export const fetchCache="force-no-store";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
async function count(t:string){try{const{count}=await supabaseAdmin.from(t).select("*",{count:"exact",head:true});return count||0}catch{return 0}}
export async function GET(){return NextResponse.json({ok:true,data:{points_eau:await count("points_eau"),pluviometrie:await count("observations_pluvio"),piezometrie:await count("observations_piezo"),limnimetrie:await count("observations_limni")}})}
