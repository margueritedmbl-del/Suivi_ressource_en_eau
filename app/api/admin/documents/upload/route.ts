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
function norm(v:string){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");}
function siteFor(code:string){ return (manifest as any[]).find(x=>String(x.code).toUpperCase()===code)?.site || code; }
function codeFromFile(name:string){
  const m=name.toUpperCase().match(/PZ[-_ ]?(\d{1,2})/);
  if(m){const c=`PZ-${String(Number(m[1])).padStart(2,"0")}`;if(/^PZ-(0[1-9]|1[0-9]|20)$/.test(c))return c;}
  const n=norm(name.replace(/\.pdf$/i,""));
  const rows=manifest as any[];
  const exact=rows.find(x=>n===norm(x.site)||n===norm(x.code)); if(exact)return exact.code;
  const contains=rows.find(x=>n.includes(norm(x.site))||norm(x.site).includes(n)); return contains?.code||null;
}
async function ensureBucket(){
  const {data}=await supabaseAdmin.storage.getBucket(BUCKET);
  if(data)return null;
  const {error}=await supabaseAdmin.storage.createBucket(BUCKET,{public:false,fileSizeLimit:15*1024*1024,allowedMimeTypes:["application/pdf"]});
  return error?.message||null;
}
export async function POST(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN]); if (auth.response) return auth.response;
  const bucketError=await ensureBucket(); if(bucketError)return NextResponse.json({ok:false,error:`Bucket Supabase indisponible : ${bucketError}`},{status:500});
  const form = await req.formData(); const typeKey = String(form.get("type") || "analyse").toLowerCase(); const cfg = TYPE[typeKey];
  if (!cfg) return NextResponse.json({ ok:false, error:"Type de document invalide." }, { status:400 });
  const files = form.getAll("files").filter((x): x is File => x instanceof File);
  if (!files.length) return NextResponse.json({ ok:false, error:"Aucun fichier sélectionné." }, { status:400 });
  const results:any[]=[];
  for (const file of files) {
    const code=codeFromFile(file.name);
    if (!code) { results.push({file:file.name,ok:false,error:"Site non reconnu. Utilisez PZ-01…PZ-20 ou incluez le nom exact de la localité dans le nom du PDF."}); continue; }
    if (file.size > 15*1024*1024) { results.push({file:file.name,code,ok:false,error:"Fichier supérieur à 15 Mo"}); continue; }
    if(file.type && file.type!=="application/pdf" && !file.name.toLowerCase().endsWith(".pdf")){results.push({file:file.name,code,ok:false,error:"Seuls les PDF sont acceptés"});continue;}
    const storagePath=`${cfg.folder}/${code}.pdf`; const buffer=Buffer.from(await file.arrayBuffer());
    const {error:uploadError}=await supabaseAdmin.storage.from(BUCKET).upload(storagePath,buffer,{contentType:"application/pdf",upsert:true,cacheControl:"3600"});
    if(uploadError){results.push({file:file.name,code,ok:false,error:`Storage : ${uploadError.message}`});continue;}
    const site=siteFor(code);
    const {error:dbError}=await supabaseAdmin.from("documents_ouvrages").upsert({code_ouvrage:code,type_document:cfg.db,titre:`${cfg.title} — ${site}`,bucket:BUCKET,storage_path:storagePath,mime_type:"application/pdf",actif:true,source_document:"Téléversement depuis l'administration PSORE"},{onConflict:"code_ouvrage,type_document"});
    results.push({file:file.name,code,site,ok:!dbError,error:dbError?`Base : ${dbError.message}`:null});
  }
  return NextResponse.json({ok:results.every(x=>x.ok),success:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results});
}
