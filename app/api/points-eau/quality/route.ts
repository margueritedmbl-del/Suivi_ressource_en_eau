export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { buildPointEauDashboard, cleanRowsForPublic, readPointEauRows } from "@/services/points-eau/analytics";

export async function GET() {
  const { rows, source } = await readPointEauRows();
  const cleanRows = cleanRowsForPublic(rows);
  const dashboard = buildPointEauDashboard(cleanRows);
  return NextResponse.json({ ok: true, source, controles: dashboard.controles, stats: dashboard.stats });
}
