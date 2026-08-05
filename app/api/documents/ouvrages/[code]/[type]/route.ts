export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import {
  ROLE_ADMIN,
  ROLE_COLLECTEUR,
  ROLE_DNH,
  ROLE_OBSERVATEUR,
  ROLE_SUPER_ADMIN,
} from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_ROLES = [ROLE_OBSERVATEUR, ROLE_COLLECTEUR, ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN];
const TYPE_MAP: Record<string, string> = {
  analyse: "ANALYSE_EAU",
  essai: "ESSAI_POMPAGE",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string; type: string } }
) {
  const auth = await requireApiRole(req, ALLOWED_ROLES);
  if (auth.response) return auth.response;

  const code = String(params.code || "").toUpperCase();
  const typeDocument = TYPE_MAP[String(params.type || "").toLowerCase()];
  if (!/^PZ-\d{2}$/.test(code) || !typeDocument) {
    return NextResponse.json({ ok: false, error: "Document demandé invalide." }, { status: 400 });
  }

  const { data: document, error } = await supabaseAdmin
    .from("documents_ouvrages")
    .select("bucket,storage_path,titre,mime_type")
    .eq("code_ouvrage", code)
    .eq("type_document", typeDocument)
    .eq("actif", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!document) {
    return NextResponse.json(
      { ok: false, error: "Document non référencé. Exécutez la migration V4.1 et transférez les fichiers dans Supabase Storage." },
      { status: 404 }
    );
  }

  const { data, error: signedError } = await supabaseAdmin.storage
    .from(document.bucket)
    .createSignedUrl(document.storage_path, 300, { download: false });

  if (signedError || !data?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: signedError?.message || "Fichier absent de Supabase Storage." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    url: data.signedUrl,
    expires_in: 300,
    titre: document.titre,
    mime_type: document.mime_type,
  });
}
