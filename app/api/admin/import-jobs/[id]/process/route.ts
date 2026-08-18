export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { failImportJob, getImportJob, processImportJobChunk } from "@/services/import/asyncImport";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;
  try {
    const job = await getImportJob(params.id);
    if (!job) return NextResponse.json({ ok: false, error: "Tâche d’import introuvable." }, { status: 404 });
    const updated = await processImportJobChunk(job);
    return NextResponse.json({ ok: true, job: updated });
  } catch (error: any) {
    const message = await failImportJob(params.id, error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
