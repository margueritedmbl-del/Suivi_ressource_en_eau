import {NextRequest} from "next/server";
import {requireApiRole} from "@/lib/auth-server";
import {ENABLED_ROLES} from "@/lib/permissions";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { buildPointEauDashboard, cleanRowsForPublic, readPointEauRows } from "@/services/points-eau/analytics";

export async function GET(req: NextRequest) {const guard=await requireApiRole(req,[...ENABLED_ROLES]);if(guard.response)return guard.response;
  const { rows, source } = await readPointEauRows();
  const cleanRows = cleanRowsForPublic(rows);
  const dashboard = buildPointEauDashboard(cleanRows);
  return NextResponse.json({ ok: true, source, controles: dashboard.controles, stats: dashboard.stats });
}
