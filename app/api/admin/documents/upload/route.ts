export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import manifest from "@/public/data/referentiels/analyses_eau_piezometres_manifest.json";

const BUCKET = "psore-documents";
const TYPE: Record<string, { db: string; folder: string; title: string }> = {
  analyse: { db: "ANALYSE_EAU", folder: "piezometres/analyses-eau", title: "Certificat d'analyse d'eau" },
  essai: { db: "ESSAI_POMPAGE", folder: "piezometres/essais-pompage", title: "Essai de pompage" },
};

function siteFor(code:string){ return (manifest as any[]).find(x=>String(x.code).toUpperCase()===code)?.site || code; }

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN]);
  if (auth.response) return auth.response;
  const form = await req.formData();
  const typeKey = String(form.get("type") || "analyse").toLowerCase();
  const cfg = TYPE[typeKey];
  if (!cfg) return NextResponse.json({ ok:false, error:"Type de document invalide." }, { status:400 });
  const files = form.getAll("files").filter((x): x is File => x instanceof File);
  if (!files.length) return NextResponse.json({ ok:false, error:"Aucun fichier sélectionné." }, { status:400 });
  const results:any[]=[];
  for (const file of files) {
    const match = file.name.toUpperCase().match(/PZ[-_ ]?(\d{1,2})/);
    if (!match) { results.push({file:file.name,ok:false,error:"Nom attendu : PZ-01.pdf à PZ-20.pdf"}); continue; }
    const code=`PZ-${String(Number(match[1])).padStart(2,"0")}`;
    if (!/^PZ-(0[1-9]|1[0-9]|20)$/.test(code)) { results.push({file:file.name,ok:false,error:"Code hors plage PZ-01 à PZ-20"}); continue; }
    if (file.size > 15*1024*1024) { results.push({file:file.name,ok:false,error:"Fichier supérieur à 15 Mo"}); continue; }
    const storagePath=`${cfg.folder}/${code}.pdf`;
    const buffer=Buffer.from(await file.arrayBuffer());
    const {error:uploadError}=await supabaseAdmin.storage.from(BUCKET).upload(storagePath,buffer,{contentType:"application/pdf",upsert:true,cacheControl:"3600"});
    if(uploadError){results.push({file:file.name,code,ok:false,error:uploadError.message});continue;}
    const site=siteFor(code);
    const {error:dbError}=await supabaseAdmin.from("documents_ouvrages").upsert({code_ouvrage:code,type_document:cfg.db,titre:`${cfg.title} — ${site}`,bucket:BUCKET,storage_path:storagePath,mime_type:"application/pdf",actif:true,source_document:"Téléversement depuis l'administration PSORE"},{onConflict:"code_ouvrage,type_document"});
    results.push({file:file.name,code,ok:!dbError,error:dbError?.message||null});
  }
  return NextResponse.json({ok:results.every(x=>x.ok),results});
}
