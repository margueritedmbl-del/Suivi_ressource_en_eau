export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { buildInstitutionalDashboard, flattenInstitutionalExport } from "@/services/dashboard/institutionnel";
import { toCsv } from "@/services/exports/csv";

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;

  const format = req.nextUrl.searchParams.get("format") || "csv";
  const dashboard = await buildInstitutionalDashboard();
  const rows = flattenInstitutionalExport(dashboard);

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Dashboard_global");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dashboard.alertes), "Alertes");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dashboard.synchronisations), "Synchronisations");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="dashboard_institutionnel_PSORE_V2_4.xlsx"',
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dashboard_institutionnel_PSORE_V2_4.csv"',
    },
  });
}
