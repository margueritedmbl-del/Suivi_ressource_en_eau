import {requireApiRole} from "@/lib/auth-server";
import {ENABLED_ROLES} from "@/lib/permissions";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  applyPointEauFilters,
  buildPointEauDashboard,
  cleanRowsForPublic,
  pointEauFilterOptions,
  readPointEauRows,
} from "@/services/points-eau/analytics";

export async function GET(req: NextRequest) {const guard=await requireApiRole(req,[...ENABLED_ROLES]);if(guard.response)return guard.response;
  const { rows: allRows, source } = await readPointEauRows();
  const filteredRows = applyPointEauFilters(allRows, req.nextUrl.searchParams);
  const cleanRows = cleanRowsForPublic(filteredRows);
  const dashboard = buildPointEauDashboard(cleanRows);

  return NextResponse.json({
    ok: true,
    source,
    ...dashboard,
    filters: await pointEauFilterOptions(),
    data: cleanRows.slice(0, 2000),
  });
}
