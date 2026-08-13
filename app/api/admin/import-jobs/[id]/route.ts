export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { getImportJob } from "@/services/import/asyncImport";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;
  try {
    const job = await getImportJob(params.id);
    if (!job) return NextResponse.json({ ok: false, error: "Tâche d’import introuvable." }, { status: 404 });
    return NextResponse.json({ ok: true, job });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erreur de lecture de la tâche." }, { status: 500 });
  }
}
