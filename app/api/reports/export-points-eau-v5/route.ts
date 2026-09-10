export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { applyPointEauFilters, readPointEauRows, type PointEauRow } from "@/services/points-eau/analytics";

const C = { navy: "#0B2545", blue: "#0877B9", green: "#1F9D63", orange: "#D97706", purple: "#58369A", gray: "#5F6F82", line: "#D9E5EF" };
const t = (v: any) => String(v ?? "").trim();
const n = (v: any) => { const x = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : null; };
const fr = (v: any, d = 2) => { const x = n(v); return x === null ? "Non renseigné" : x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }); };
const date = (v: any) => t(v).slice(0, 10);
const finite = (v: any) => n(v) ?? 0;
function status(r: PointEauRow) { return r.alerte_gps || r.alerte_ph_donnee ? "Rejetée" : r.alerte_qualite_eau || r.alerte_photo ? "À vérifier" : "Validée"; }
function latestByPoint(rows: PointEauRow[]) {
  const by = new Map<string, PointEauRow>();
  for (const r of rows) {
    const key = t(r.code_pe) || t(r.source_entry_id) || t(r.id);
    const prev = by.get(key);
    if (!prev || date(r.date_collecte) > date(prev.date_collecte)) by.set(key, r);
  }
  return Array.from(by.values());
}
function csv(rows: any[]) { if (!rows.length) return "Aucune donnée\n"; const h = Object.keys(rows[0]); const q = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`; return [h.map(q).join(";"), ...rows.map(r => h.map(k => q(r[k])).join(";"))].join("\n"); }
function exportRows(rows: PointEauRow[]) { return rows.map(r => ({ Code: r.code_pe, Village: r.village, Commune: r.commune, "Date collecte / mise à jour": date(r.date_collecte), Type: r.type_infrastructure, Fonctionnalité: r.statut_fonctionnalite, Équipement: r.equipement, "Organe de gestion": r.organe_gestion, "pH": r.ph, "Température (°C)": r.temperature_c, "Conductivité": r.conductivite, "TDS": r.tds, "Besoin réhabilitation": r.besoin_rehabilitation, Priorité: r.priorite_rehabilitation, Score: r.score_priorite, Latitude: r.latitude, Longitude: r.longitude, "Statut qualité": status(r) })); }
function rgb(h: string): [number, number, number] { const x = h.replace("#", ""); return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]; }
function ink(p: jsPDF, c: string) { p.setTextColor(...rgb(c)); }
function fill(p: jsPDF, c: string) { p.setFillColor(...rgb(c)); }
function stroke(p: jsPDF, c: string) { p.setDrawColor(...rgb(c)); }
function card(p: jsPDF, x: number, y: number, w: number, label: string, value: string, color: string) { fill(p, "#FFFFFF"); stroke(p, C.line); p.roundedRect(x, y, w, 21, 3, 3, "FD"); fill(p, color); p.roundedRect(x, y, 3, 21, 2, 2, "F"); ink(p, C.gray); p.setFontSize(5.5); p.text(label, x + 6, y + 6); ink(p, C.navy); p.setFont("helvetica", "bold"); p.setFontSize(9); p.text(value, x + 6, y + 16); p.setFont("helvetica", "normal"); }
function chart(p: jsPDF, items: any[], x: number, y: number, w: number, h: number) { const clean = items.filter(i => Number.isFinite(i.value)).slice(0, 10); const max = Math.max(...clean.map(i => i.value), 1), left = x + 20, bottom = y + h - 10; ink(p, C.navy); p.setFont("helvetica", "bold"); p.setFontSize(7); p.text("Points d’eau par commune", x, y - 4); ink(p, C.gray); p.setFont("helvetica", "normal"); p.setFontSize(4.5); p.text("Axe X : commune", x, y + 2); p.text("Axe Y : nombre de points d’eau", x, y + 7); stroke(p, C.line); p.line(left, bottom, x + w, bottom); p.line(left, y + 10, left, bottom); if (!clean.length) return; const step = (w - 22) / clean.length; clean.forEach((it, i) => { const bh = it.value / max * (h - 22); fill(p, C.blue); p.rect(left + i * step + 1, bottom - bh, Math.max(2, step * .65), bh, "F"); ink(p, C.gray); p.setFontSize(3.8); p.text(String(it.label).slice(0, 10), left + i * step, bottom + 5); }); }
function footer(p: jsPDF) { ink(p, C.gray); p.setFontSize(4.5); p.text(`PSORE • Inventaire des points d’eau • ${new Date().toISOString().slice(0, 10)}`, 12, 204); p.text("Page 1/1", 270, 204); }
function makePdf(rows: PointEauRow[], source: string) {
  const p = jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const total = rows.length, gps = rows.filter(r => !r.alerte_gps).length, verify = rows.filter(r => status(r) === "À vérifier").length, rejected = rows.filter(r => status(r) === "Rejetée").length;
  const communes = Array.from(rows.reduce((m, r) => { const k = t(r.commune) || "Non renseigné"; m.set(k, (m.get(k) || 0) + 1); return m; }, new Map<string, number>()).entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  fill(p, C.navy); p.rect(0, 0, 297, 27, "F"); ink(p, "#FFFFFF"); p.setFont("helvetica", "bold"); p.setFontSize(15); p.text("PSORE — Inventaire des points d’eau", 12, 11); p.setFont("helvetica", "normal"); p.setFontSize(6.5); p.text("Inventaire global des ouvrages — aucune interprétation comme série temporelle", 12, 19);
  card(p, 12, 33, 48, "Points d’eau", String(total), C.blue); card(p, 63, 33, 48, "Avec GPS", String(gps), C.green); card(p, 114, 33, 48, "À vérifier", String(verify), C.orange); card(p, 165, 33, 48, "Rejetées", String(rejected), C.purple); card(p, 216, 33, 69, "Communes couvertes", String(new Set(rows.map(r => r.commune)).size), C.blue);
  chart(p, communes, 12, 70, 140, 75);
  ink(p, C.navy); p.setFont("helvetica", "bold"); p.setFontSize(7.5); p.text("Contrôle qualité", 160, 70); ink(p, C.gray); p.setFont("helvetica", "normal"); p.setFontSize(5.5); p.text("Statut Validée : données sans incohérence certaine.", 160, 79); p.text("Statut À vérifier : alerte de qualité, photo manquante ou autre plausibilité.", 160, 87); p.text("Statut Rejetée : GPS manquant/invalide ou donnée physiquement invalide.", 160, 95); p.text(`Source : ${source}`, 160, 105); p.text("Le point d’eau est une fiche d’inventaire pouvant être mise à jour périodiquement.", 160, 115); p.text("Il n’est pas traité comme une station à observations quotidiennes.", 160, 123); footer(p); return p.output("arraybuffer");
}
function makeDocx(rows: PointEauRow[], source: string) { const total = rows.length, verify = rows.filter(r => status(r) === "À vérifier").length, rejected = rows.filter(r => status(r) === "Rejetée").length; const children: Paragraph[] = [new Paragraph({ text: "PSORE — Inventaire des points d’eau", heading: HeadingLevel.TITLE }), new Paragraph(`Source : ${source}`), new Paragraph(`Ouvrages : ${total} · À vérifier : ${verify} · Rejetées : ${rejected}.`), new Paragraph({ text: "Principe", heading: HeadingLevel.HEADING_1 }), new Paragraph("Le point d’eau est une fiche d’inventaire global, éventuellement mise à jour lors de visites. Il n’est pas traité comme une station possédant une série temporelle quotidienne."), new Paragraph({ text: "Qualité", heading: HeadingLevel.HEADING_1 }), new Paragraph("Les données sources restent disponibles avec leur statut qualité. Les incohérences certaines sont exclues des indicateurs analytiques."), new Paragraph({ text: "Répartition communale", heading: HeadingLevel.HEADING_1 })]; const map = new Map<string, number>(); for (const r of rows) { const c = t(r.commune) || "Non renseigné"; map.set(c, (map.get(c) || 0) + 1); } for (const [c, v] of map) children.push(new Paragraph(`• ${c} : ${v} point(s) d’eau.`)); return Packer.toBuffer(new Document({ sections: [{ children }] })); }

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN]); if ("response" in auth) return auth.response;
  const sp = req.nextUrl.searchParams, format = (sp.get("format") || "pdf").toLowerCase(), scope = (sp.get("scope") || "analytic").toLowerCase();
  try {
    const loaded = await readPointEauRows();
    let rows = applyPointEauFilters(loaded.rows, sp);
    const start = sp.get("start") || "", end = sp.get("end") || "";
    if (start) rows = rows.filter(r => date(r.date_collecte) >= start); if (end) rows = rows.filter(r => date(r.date_collecte) <= end);
    const sourceRows = rows, analyticRows = latestByPoint(rows).filter(r => status(r) !== "Rejetée");
    const chosen = scope === "source" ? sourceRows : analyticRows;
    if (format === "csv") return new Response(csv(exportRows(chosen)), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="psore_points-eau_${scope}.csv"` } });
    if (format === "xlsx") { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Source: loaded.source, Enregistrements_source: sourceRows.length, Points_analytiques: analyticRows.length, Validees: analyticRows.filter(r => status(r) === "Validée").length, A_verifier: analyticRows.filter(r => status(r) === "À vérifier").length }]), "Synthèse"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportRows(chosen)), scope === "source" ? "Source + qualité" : "Inventaire analytique"); return new Response(XLSX.write(wb, { type: "array", bookType: "xlsx" }), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="psore_points-eau_${scope}.xlsx"` } }); }
    if (scope === "source") return NextResponse.json({ ok: false, error: "Pour l'inventaire source, utilisez CSV ou XLSX." }, { status: 400 });
    if (format === "docx") return new Response(new Uint8Array(await makeDocx(analyticRows, loaded.source)), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": "attachment; filename=\"psore_points-eau_rapport.docx\"" } });
    return new Response(makePdf(analyticRows, loaded.source), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"psore_points-eau_rapport.pdf\"" } });
  } catch (e: any) { console.error("PSORE points-eau export", e); return NextResponse.json({ ok: false, error: e?.message || "Génération du rapport impossible" }, { status: 500 }); }
}
