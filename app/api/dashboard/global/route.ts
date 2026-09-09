export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { buildInstitutionalDashboard } from "@/services/dashboard/institutionnel";

export async function GET() {
  const dashboard = await buildInstitutionalDashboard();
  return NextResponse.json({ ok: true, data: dashboard.stats });
}
