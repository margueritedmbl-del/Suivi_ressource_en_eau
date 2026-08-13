export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_COLLECTEUR, ROLE_DNH, ROLE_OBSERVATEUR, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import manifest from "@/public/data/referentiels/analyses_eau_piezometres_manifest.json";

const ALLOWED_ROLES = [ROLE_OBSERVATEUR, ROLE_COLLECTEUR, ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN];
const TYPE_MAP: Record<string, { db:string; manifestKey:string }> = {
  analyse: { db:"ANALYSE_EAU", manifestKey:"storage_path_certificat" },
  essai: { db:"ESSAI_POMPAGE", manifestKey:"storage_path_essai" },
};

export async function GET(req: NextRequest,{ params }: { params: { code: string; type: string } }) {
  const auth = await requireApiRole(req, ALLOWED_ROLES); if (auth.response) return auth.response;
  const code = String(params.code || "").toUpperCase(); const cfg=TYPE_MAP[String(params.type || "").toLowerCase()];
  if (!/^PZ-\d{2}$/.test(code) || !cfg) return NextResponse.json({ ok:false,error:"Document demandé invalide." },{status:400});

  let bucket="psore-documents"; let storagePath=""; let titre=`Document — ${code}`; let mimeType="application/pdf";
  const { data: document } = await supabaseAdmin.from("documents_ouvrages").select("bucket,storage_path,titre,mime_type").eq("code_ouvrage",code).eq("type_document",cfg.db).eq("actif",true).maybeSingle();
  if(document){ bucket=document.bucket||bucket; storagePath=document.storage_path; titre=document.titre||titre; mimeType=document.mime_type||mimeType; }
  if(!storagePath){ const m=(manifest as any[]).find(x=>String(x.code).toUpperCase()===code); storagePath=m?.[cfg.manifestKey]||""; bucket=m?.bucket||bucket; titre=`${params.type.toLowerCase()==="analyse"?"Certificat d'analyse d'eau":"Essai de pompage"} — ${m?.site||code}`; }
  if(!storagePath) return NextResponse.json({ok:false,error:"Document non référencé."},{status:404});

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(storagePath,300,{download:false});
  if(error||!data?.signedUrl) return NextResponse.json({ok:false,error:`Fichier absent de Supabase Storage : ${storagePath}. Utilisez Administration > Documents techniques pour le téléverser.`},{status:404});
  return NextResponse.json({ok:true,url:data.signedUrl,expires_in:300,titre,mime_type:mimeType,storage_path:storagePath});
}
