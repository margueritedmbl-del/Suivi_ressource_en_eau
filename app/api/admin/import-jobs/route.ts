export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { MANUAL_IMPORT_TARGETS, parseWorkbook } from "@/services/import/manualImport";
import { createImportJob, listImportJobs } from "@/services/import/asyncImport";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

function jsonError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error || "Erreur d’import.");
  console.error("[PSORE import asynchrone]", error);
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;
  try {
    const jobs = await listImportJobs(15);
    return NextResponse.json({
      ok: true,
      jobs,
      targets: MANUAL_IMPORT_TARGETS.map(({ key, module, source, label, table }) => ({ key, module, source, label, table })),
      maxFileSize: MAX_FILE_SIZE,
      acceptedExtensions: ACCEPTED_EXTENSIONS,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;
  try {
    const form = await req.formData();
    const targetKey = String(form.get("target") || "");
    const file = form.get("file");
    if (!file || typeof file === "string" || typeof (file as any).arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, error: "Sélectionnez un fichier CSV ou Excel." }, { status: 400 });
    }
    const uploaded = file as File;
    const lowerName = uploaded.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
      return NextResponse.json({ ok: false, error: "Format non accepté. Utilisez CSV, XLSX ou XLS." }, { status: 400 });
    }
    if (uploaded.size <= 0) return NextResponse.json({ ok: false, error: "Le fichier est vide." }, { status: 400 });
    if (uploaded.size > MAX_FILE_SIZE) return NextResponse.json({ ok: false, error: "Le fichier dépasse 4 Mo." }, { status: 413 });

    const buffer = Buffer.from(await uploaded.arrayBuffer());
    // Validation rapide avant stockage.
    parseWorkbook(buffer, uploaded.name);
    const job = await createImportJob({
      userId: auth.ctx!.user.id,
      userEmail: auth.ctx!.user.email || "inconnu",
      targetKey,
      filename: uploaded.name,
      buffer,
      contentType: uploaded.type,
    });
    return NextResponse.json({ ok: true, job, message: "Fichier chargé. Le traitement par lots peut commencer." }, { status: 202 });
  } catch (error) {
    return jsonError(error);
  }
}
