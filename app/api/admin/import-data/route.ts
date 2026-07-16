export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { importManualFile, MANUAL_IMPORT_TARGETS } from "@/services/import/manualImport";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

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

  try {
    const form = await req.formData();
    const targetKey = String(form.get("target") || "");
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Sélectionnez un fichier CSV ou Excel." }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
      return NextResponse.json({ ok: false, error: "Format non accepté. Utilisez CSV, XLSX ou XLS." }, { status: 400 });
    }
    if (file.size <= 0) return NextResponse.json({ ok: false, error: "Le fichier est vide." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, error: "Le fichier dépasse 4 Mo. Scindez-le en plusieurs fichiers." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importManualFile({
      targetKey,
      buffer,
      filename: file.name,
      userEmail: auth.ctx?.user.email || "inconnu",
    });

    return NextResponse.json({
      ok: result.failed === 0,
      partial: result.failed > 0 && result.insertedOrUpdated > 0,
      result,
      message: `${result.insertedOrUpdated} enregistrement(s) ajouté(s) ou mis à jour sur ${result.read} ligne(s).`,
    }, { status: result.failed > 0 && result.insertedOrUpdated === 0 ? 422 : 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Échec de l’import manuel." }, { status: 500 });
  }
}
