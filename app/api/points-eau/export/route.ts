export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { applyPointEauFilters, cleanRowsForPublic, readPointEauRows } from "@/services/points-eau/analytics";
import { toCsv } from "@/services/exports/csv";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") || "csv";
  const { rows } = await readPointEauRows();
  const filtered = cleanRowsForPublic(applyPointEauFilters(rows, req.nextUrl.searchParams));

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtered), "Points_eau");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="points_eau_PSORE_V2_4.xlsx"`,
      },
    });
  }

  return new NextResponse(toCsv(filtered), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="points_eau_PSORE_V2_4.csv"`,
    },
  });
}
