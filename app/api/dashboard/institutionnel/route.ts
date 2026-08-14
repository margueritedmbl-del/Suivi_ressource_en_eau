export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { buildInstitutionalDashboard } from "@/services/dashboard/institutionnel";

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;
  const data = await buildInstitutionalDashboard();
  return NextResponse.json({ ok: true, data });
}
