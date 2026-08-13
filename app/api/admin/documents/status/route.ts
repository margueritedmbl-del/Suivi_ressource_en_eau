export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import manifest from "@/public/data/referentiels/analyses_eau_piezometres_manifest.json";

export async function GET(req:NextRequest){
  const auth=await requireApiRole(req,[ROLE_ADMIN,ROLE_SUPER_ADMIN]); if(auth.response)return auth.response;
  const {data:analyse}=await supabaseAdmin.storage.from("psore-documents").list("piezometres/analyses-eau",{limit:100});
  const {data:essai}=await supabaseAdmin.storage.from("psore-documents").list("piezometres/essais-pompage",{limit:100});
  const a=new Set((analyse||[]).map(x=>x.name)); const e=new Set((essai||[]).map(x=>x.name));
  const rows=(manifest as any[]).map(x=>({code:x.code,site:x.site,analyse:a.has(`${x.code}.pdf`),essai:e.has(`${x.code}.pdf`)}));
  return NextResponse.json({ok:true,stats:{analyses:rows.filter(x=>x.analyse).length,essais:rows.filter(x=>x.essai).length},rows});
}
