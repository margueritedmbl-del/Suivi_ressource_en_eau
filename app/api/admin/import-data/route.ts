export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { MANUAL_IMPORT_TARGETS } from "@/services/import/manualImport";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

function jsonError(error: unknown, status = 500, stage?: string) {
  const message = error instanceof Error ? error.message : String(error || "Échec de l’import manuel.");
  console.error("[PSORE import manuel]", stage || "unknown", error);
  return NextResponse.json({ ok: false, error: message, stage }, { status });
}

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;
  return NextResponse.json({
    ok: true,
    targets: MANUAL_IMPORT_TARGETS.map(({ key, module, source, label, table }) => ({ key, module, source, label, table })),
    maxFileSize: MAX_FILE_SIZE,
    acceptedExtensions: ACCEPTED_EXTENSIONS,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;

  let stage = "lecture du formulaire";
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_FILE_SIZE + 512 * 1024) {
      return NextResponse.json({ ok: false, error: "La requête dépasse la limite autorisée. Utilisez un fichier inférieur à 4 Mo." }, { status: 413 });
    }

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
    if (uploaded.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, error: "Le fichier dépasse 4 Mo. Scindez-le en plusieurs fichiers." }, { status: 413 });
    }

    stage = "chargement du fichier";
    const buffer = Buffer.from(await uploaded.arrayBuffer());

    stage = "analyse et import Supabase";
    // Import dynamique : toute erreur de chargement XLSX est capturée et renvoyée en JSON.
    const { importManualFile } = await import("@/services/import/manualImport");
    const result = await importManualFile({
      targetKey,
      buffer,
      filename: uploaded.name,
      userEmail: auth.ctx?.user.email || "inconnu",
    });

    return NextResponse.json({
      ok: result.failed === 0,
      partial: result.failed > 0 && result.insertedOrUpdated > 0,
      result,
      message: `${result.insertedOrUpdated} enregistrement(s) ajouté(s) ou mis à jour sur ${result.read} ligne(s).`,
    }, { status: result.failed > 0 && result.insertedOrUpdated === 0 ? 422 : 200 });
  } catch (error) {
    return jsonError(error, 500, stage);
  }
}
