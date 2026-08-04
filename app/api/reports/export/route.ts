export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

const TABLES: Record<string, string> = {
  global: "points_eau",
  pluviometrie: "observations_pluvio",
  piezometrie: "observations_piezo",
  limnimetrie: "observations_limni",
  points_eau: "points_eau",
};

function csv(rows: any[]) {
  if (!rows.length) return "Aucune donnée collectée pour le moment\n";
  const h = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [h.join(","), ...rows.map((r) => h.map((k) => esc(r[k])).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  const module = req.nextUrl.searchParams.get("module") || "global";
  const format = req.nextUrl.searchParams.get("format") || "csv";

  const table = TABLES[module] || "points_eau";
  const { data } = await supabaseAdmin.from(table).select("*").limit(5000);
  const rows = data || [];

  const title = `PSORE - Rapport ${module}`;

  if (format === "csv") {
    return new Response(csv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${module}.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        rows.length ? rows : [{ message: "Aucune donnée collectée" }]
      ),
      "Données"
    );

    const buf = XLSX.write(wb, {
      type: "array",
      bookType: "xlsx",
    });

    return new Response(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${module}.xlsx"`,
      },
    });
  }

  if (format === "docx") {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
            new Paragraph("PTCS – Enabel – DNH/DRHK"),
            new Paragraph(`Nombre d'enregistrements : ${rows.length}`),
            new Paragraph(
              rows.length
                ? "Données disponibles."
                : "Aucune donnée collectée pour le moment."
            ),
          ],
        },
      ],
    });

    const buf = await Packer.toBuffer(doc);

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${module}.docx"`,
      },
    });
  }

  if (format === "pdf") {
    const pdf = new jsPDF();

    pdf.setFontSize(16);
    pdf.text(title, 15, 20);
    pdf.setFontSize(11);
    pdf.text("PTCS - Enabel - DNH/DRHK", 15, 30);
    pdf.text(`Nombre d'enregistrements : ${rows.length}`, 15, 42);
    pdf.text(
      rows.length
        ? "Données disponibles."
        : "Aucune donnée collectée pour le moment.",
      15,
      54
    );

    const arrayBuffer = pdf.output("arraybuffer");

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${module}.pdf"`,
      },
    });
  }

  return NextResponse.json(
    { ok: false, error: "Format non supporté" },
    { status: 400 }
  );
}
