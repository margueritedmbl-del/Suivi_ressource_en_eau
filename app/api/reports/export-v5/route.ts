export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { loadHydroRows, type HydroRow } from "@/lib/hydro-data";
import { stationMetaByCode, displayStationCode, type HydroModule } from "@/lib/network-registry";

type Hydro = "pluviometrie" | "piezometrie" | "limnimetrie";
const HYDRO: Hydro[] = ["pluviometrie", "piezometrie", "limnimetrie"];
const CFG: Record<Hydro, { value: string; unit: string; label: string }> = {
  pluviometrie: { value: "pluie_24h_mm", unit: "mm", label: "Précipitations journalières" },
  piezometrie: { value: "niveau_statique", unit: "m", label: "Profondeur du niveau statique" },
  limnimetrie: { value: "hauteur_eau", unit: "cm", label: "Hauteur d’eau du cours d’eau" },
};
const COLORS = { navy: "#0B2545", blue: "#0877B9", cyan: "#37B6D4", purple: "#58369A", orange: "#D97706", green: "#1F9D63", red: "#C2413A", gray: "#5F6F82", line: "#D9E5EF" };

const text = (v: any) => String(v ?? "").trim();
const number = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const finite = (v: any, fallback = 0) => {
  const n = number(v);
  return n === null ? fallback : n;
};
const dateText = (v: any) => text(v).slice(0, 10);
const validDate = (v: any) => /^\d{4}-\d{2}-\d{2}$/.test(dateText(v));
const formatNumber = (v: any, digits = 2) => {
  const n = number(v);
  return n === null ? "Non renseigné" : n.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
const formatSigned = (v: any, digits = 2) => {
  const n = number(v);
  if (n === null) return "Non renseigné";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};
const gpsValid = (r: any) => {
  const lat = number(r.latitude), lon = number(r.longitude);
  return lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};
const stationCode = (m: Hydro, r: any) => {
  const raw = text(r.code_site || r.code_station || r.code_piezo);
  const meta = stationMetaByCode(m as HydroModule, raw);
  return meta ? displayStationCode(m as HydroModule, meta.code) : raw;
};
const observationHour = (r: any) => {
  const raw = text(r.heure_observation || r.heure || r.time || r.timestamp);
  const match = raw.match(/(?:T|\s)(\d{1,2}:\d{2})/);
  return match ? match[1].padStart(5, "0") : raw.slice(0, 5);
};

function quality(rows: HydroRow[], module: Hydro) {
  const cfg = CFG[module];
  const counts = new Map<string, number>();
  for (const r of rows) {
    const code = text(r.code_site || r.code_station || r.code_piezo);
    const d = dateText(r.date_observation);
    const h = observationHour(r);
    // Limnimetry may have two daily readings. Without an hour, do not silently call
    // the two observations duplicates; flag the day for review instead.
    const key = `${code}|${d}|${h}`;
    if (module !== "limnimetrie" || h) counts.set(key, (counts.get(key) || 0) + 1);
  }
  const values = rows.map(r => number(r[cfg.value])).filter((x): x is number => x !== null).sort((a, b) => a - b);
  const quartile = (p: number) => values[Math.floor((values.length - 1) * p)];
  const bounds = values.length >= 4 ? (() => { const q1 = quartile(.25), q3 = quartile(.75), iqr = q3 - q1; return { lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr }; })() : null;
  const today = new Date().toISOString().slice(0, 10);
  return rows.map((r: any) => {
    const code = text(r.code_site || r.code_station || r.code_piezo);
    const d = dateText(r.date_observation);
    const h = observationHour(r);
    const value = number(r[cfg.value]);
    const sameDayNoHour = module === "limnimetrie" && !h && rows.filter(x => text(x.code_site || x.code_station || x.code_piezo) === code && dateText(x.date_observation) === d).length > 1;
    const duplicate = module === "limnimetrie" ? (!!h && (counts.get(`${code}|${d}|${h}`) || 0) > 1) : (counts.get(`${code}|${d}|${h}`) || 0) > 1;
    const incomplete = !code || !validDate(d) || value === null;
    const atypical = !!(bounds && value !== null && (value < bounds.lo || value > bounds.hi));
    const future = d > today;
    let status = "Validée";
    if (duplicate) status = "Doublon certain";
    else if (incomplete || !gpsValid(r) || future) status = "Rejetée";
    else if (atypical || sameDayNoHour) status = "À vérifier";
    return {
      ...r,
      __status: status,
      __duplicate: duplicate,
      __atypical: atypical,
      __future: future,
      __gpsBad: !gpsValid(r),
      __fewDailyMeasurements: sameDayNoHour,
    };
  });
}

function qualitySummary(rows: any[], loaderRejected = 0) {
  return {
    total: rows.length + loaderRejected,
    loaded: rows.length,
    valid: rows.filter(r => r.__status === "Validée").length,
    verify: rows.filter(r => r.__status === "À vérifier").length,
    rejected: rows.filter(r => r.__status === "Rejetée").length + loaderRejected,
    duplicates: rows.filter(r => r.__duplicate).length,
    atypical: rows.filter(r => r.__atypical).length,
    gps: rows.filter(r => r.__gpsBad).length,
    future: rows.filter(r => r.__future).length,
    missingHourReview: rows.filter(r => r.__fewDailyMeasurements).length,
  };
}

function weighted(items: { value: number; weight: number }[]) {
  const clean = items.filter(x => Number.isFinite(x.value) && Number.isFinite(x.weight) && x.weight > 0);
  const total = clean.reduce((s, x) => s + x.weight, 0);
  return total > 0 ? clean.reduce((s, x) => s + x.value * x.weight, 0) / total : null;
}

function piezometry(rows: any[]) {
  const byStation = new Map<string, any[]>();
  for (const r of rows.filter(x => x.__status === "Validée")) {
    const code = text(r.code_site || r.code_station || r.code_piezo);
    const a = byStation.get(code) || [];
    a.push(r);
    byStation.set(code, a);
  }
  const stations: any[] = [];
  for (const [code, observations] of byStation) {
    observations.sort((a, b) => dateText(a.date_observation).localeCompare(dateText(b.date_observation)) || observationHour(a).localeCompare(observationHour(b)));
    const first = number(observations[0]?.niveau_statique);
    const last = number(observations[observations.length - 1]?.niveau_statique);
    const eligible = observations.length >= 2 && first !== null && last !== null && first !== 0;
    const delta = first !== null && last !== null ? first - last : null;
    const rate = eligible && delta !== null ? delta / first! * 100 : null;
    stations.push({
      code,
      commune: text(observations[0]?.commune) || "Non renseignée",
      first,
      last,
      delta,
      rate,
      count: observations.length,
      firstDate: dateText(observations[0]?.date_observation),
      lastDate: dateText(observations[observations.length - 1]?.date_observation),
      warning: eligible ? "" : "⚠️ Indicateur basé sur un nombre limité de mesures.",
      eligible,
    });
  }
  const communesMap = new Map<string, any>();
  for (const s of stations.filter(x => x.eligible)) {
    const z = communesMap.get(s.commune) || { commune: s.commune, stations: 0, observations: 0, deltas: [], rates: [] };
    z.stations += 1;
    z.observations += s.count;
    z.deltas.push({ value: s.delta, weight: s.count });
    z.rates.push({ value: s.rate, weight: s.count });
    communesMap.set(s.commune, z);
  }
  const communes = Array.from(communesMap.values()).map(z => ({
    ...z,
    delta: weighted(z.deltas),
    rate: weighted(z.rates),
    warning: z.observations < 3 ? "⚠️ Indicateur basé sur un nombre limité de mesures." : "",
  }));
  const eligibleStations = stations.filter(s => s.eligible);
  const rateGlobal = weighted(eligibleStations.map(s => ({ value: s.rate, weight: s.count })));
  const deltaGlobal = weighted(eligibleStations.map(s => ({ value: s.delta, weight: s.count })));
  const rateCommunes = weighted(communes.map(c => ({ value: finite(c.rate), weight: 1 })));
  const deltaCommunes = weighted(communes.map(c => ({ value: finite(c.delta), weight: 1 })));
  return { stations, communes, deltaGlobal, rateGlobal, deltaCommunes, rateCommunes, limitedStations: stations.filter(s => !s.eligible).length };
}

function rainfall(rows: any[]) {
  const valid = rows.filter(r => r.__status === "Validée");
  const values = valid.map(r => number(r.pluie_24h_mm)).filter((x): x is number => x !== null);
  const monthlyMap = new Map<string, number>();
  for (const r of valid) {
    const d = dateText(r.date_observation), value = number(r.pluie_24h_mm);
    if (validDate(d) && value !== null) monthlyMap.set(d.slice(0, 7), (monthlyMap.get(d.slice(0, 7)) || 0) + value);
  }
  return {
    average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    total: values.reduce((a, b) => a + b, 0),
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    rainyDays: new Set(valid.filter(r => (number(r.pluie_24h_mm) || 0) >= 0.1).map(r => dateText(r.date_observation))).size,
    monthly: Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value })),
  };
}

function limnimetry(rows: any[]) {
  const by = new Map<string, any>();
  for (const r of rows.filter(x => x.__status === "Validée")) {
    const code = stationCode("limnimetrie", r);
    const z = by.get(code) || { code, coursEau: text(r.cours_eau || r.nom_cours_eau || r.nom_site || r.localite) || "Cours d’eau non renseigné", commune: text(r.commune), values: [] as number[] };
    const v = number(r.hauteur_eau);
    if (v !== null) z.values.push(v);
    const river = text(r.cours_eau || r.nom_cours_eau || r.nom_site || r.localite);
    if (river) z.coursEau = river;
    by.set(code, z);
  }
  return Array.from(by.values()).map(z => ({ ...z, moyenne: z.values.length ? z.values.reduce((a: number, b: number) => a + b, 0) / z.values.length : null, mesures: z.values.length }));
}

function detailRows(rows: any[], module: Hydro) {
  return rows.map(r => ({
    Code: stationCode(module, r),
    Localité: text(r.nom_site || r.localite || r.village),
    Commune: text(r.commune),
    Date: dateText(r.date_observation),
    Heure: observationHour(r),
    Valeur: number(r[CFG[module].value]),
    Unité: CFG[module].unit,
    "Statut qualité": r.__status,
    "Doublon certain": r.__duplicate ? "Oui" : "Non",
    "Valeur atypique": r.__atypical ? "Oui" : "Non",
    "GPS valide": r.__gpsBad ? "Non" : "Oui",
    ...(module === "limnimetrie" ? { "Cours d’eau": text(r.cours_eau || r.nom_cours_eau || r.nom_site || r.localite) } : {}),
  }));
}

function csv(rows: any[]) {
  if (!rows.length) return "Aucune donnée\n";
  const headers = Object.keys(rows[0]);
  const quote = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.map(quote).join(";"), ...rows.map(r => headers.map(h => quote(r[h])).join(";"))].join("\n");
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function safeCoord(v: any, fallback = 0) { const n = number(v); return n === null || !Number.isFinite(n) ? fallback : n; }
function ink(p: jsPDF, c: string) { p.setTextColor(...rgb(c)); }
function fill(p: jsPDF, c: string) { p.setFillColor(...rgb(c)); }
function stroke(p: jsPDF, c: string) { p.setDrawColor(...rgb(c)); }
function card(p: jsPDF, x: number, y: number, w: number, label: string, value: string, color: string) {
  const xx = safeCoord(x), yy = safeCoord(y), ww = Math.max(1, safeCoord(w));
  fill(p, "#FFFFFF"); stroke(p, COLORS.line); p.roundedRect(xx, yy, ww, 21, 3, 3, "FD");
  fill(p, color); p.roundedRect(xx, yy, 3, 21, 2, 2, "F");
  ink(p, COLORS.gray); p.setFont("helvetica", "normal"); p.setFontSize(5.5); p.text(text(label), xx + 6, yy + 6);
  ink(p, COLORS.navy); p.setFont("helvetica", "bold"); p.setFontSize(9); p.text(text(value), xx + 6, yy + 16);
}
function chart(p: jsPDF, title: string, items: { label: string; value: number }[], x: number, y: number, w: number, h: number, xLabel: string, yLabel: string, color: string, period: string) {
  const xx = safeCoord(x), yy = safeCoord(y), ww = Math.max(10, safeCoord(w)), hh = Math.max(20, safeCoord(h));
  const clean = items.filter(i => Number.isFinite(i.value)).slice(0, 10);
  ink(p, COLORS.navy); p.setFont("helvetica", "bold"); p.setFontSize(7.5); p.text(text(title), xx, yy - 4);
  ink(p, COLORS.gray); p.setFont("helvetica", "normal"); p.setFontSize(4.5); p.text(`Période : ${text(period)}`, xx, yy + 1);
  const max = Math.max(...clean.map(i => Math.abs(i.value)), 1);
  const left = xx + 18, bottom = yy + hh - 15;
  stroke(p, COLORS.line); p.line(left, bottom, xx + ww, bottom); p.line(left, yy + 5, left, bottom);
  for (let i = 0; i <= 4; i++) {
    const gy = safeCoord(bottom - i * (hh - 20) / 4);
    stroke(p, "#E8EEF4"); p.line(left, gy, xx + ww, gy);
    ink(p, COLORS.gray); p.setFontSize(4); p.text(formatNumber(max * i / 4, 1), xx + 1, gy + 1);
  }
  ink(p, COLORS.gray); p.setFontSize(4.5); p.text(text(xLabel), xx + ww / 2 - 10, bottom + 8); p.text(text(yLabel), xx, yy + 6);
  if (!clean.length) { p.text("Aucune donnée validée", xx + 25, yy + 18); return; }
  const step = (ww - 20) / clean.length;
  clean.forEach((it, i) => {
    const bar = Math.abs(it.value) / max * (hh - 20);
    const bx = safeCoord(left + i * step + 1), by = safeCoord(bottom - bar);
    fill(p, it.value >= 0 ? color : COLORS.red); p.rect(bx, by, Math.max(2, step * .65), Math.max(0.2, bar), "F");
    ink(p, COLORS.gray); p.setFontSize(3.8); p.text(text(it.label).slice(0, 11), bx, bottom + 5);
  });
}
function qualityBlock(p: jsPDF, q: any, x: number, y: number) {
  const xx = safeCoord(x), yy = safeCoord(y);
  ink(p, COLORS.navy); p.setFont("helvetica", "bold"); p.setFontSize(7.5); p.text("Contrôle qualité transversal", xx, yy);
  ink(p, COLORS.gray); p.setFont("helvetica", "normal"); p.setFontSize(5.5);
  p.text(`Reçues : ${q.total} · Validées : ${q.valid} · À vérifier : ${q.verify} · Rejetées : ${q.rejected} · Doublons : ${q.duplicates}`, xx, yy + 7);
  p.text(`Atypiques : ${q.atypical} · GPS invalides/absents : ${q.gps} · Dates futures : ${q.future} · Heure limni à vérifier : ${q.missingHourReview}`, xx, yy + 14);
  p.text("Les anomalies restent conservées dans la source ; seules les données validées alimentent les indicateurs.", xx, yy + 21);
}
function footer(p: jsPDF) {
  const pages = p.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    p.setPage(i); ink(p, COLORS.gray); p.setFont("helvetica", "normal"); p.setFontSize(4.5);
    p.text(`PSORE • PTCS – Enabel – DNH/DRHK • Production : ${new Date().toISOString().slice(0, 10)}`, 12, 204);
    p.text(`Page ${i}/${pages}`, 270, 204);
  }
}

function polygonRings(g: any) {
  if (!g) return [];
  if (g.type === "Polygon") return [g.coordinates?.[0] || []];
  if (g.type === "MultiPolygon") return (g.coordinates || []).map((x: any) => x?.[0] || []);
  return [];
}
function pointInRing(pt: [number, number], ring: any[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) continue;
    if (((a[1] > pt[1]) !== (b[1] > pt[1])) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / ((b[1] - a[1]) || 1e-12) + a[0]) inside = !inside;
  }
  return inside;
}
function inside(pt: [number, number] | null, geometry: any) {
  if (!pt || !geometry) return false;
  return polygonRings(geometry).some((ring: any[]) => pointInRing(pt, ring));
}
function geometryCentroid(g: any): [number, number] | null {
  const pts: number[][] = [];
  const walk = (x: any) => {
    if (Array.isArray(x) && typeof x[0] === "number" && typeof x[1] === "number") pts.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
  };
  walk(g?.coordinates);
  return pts.length ? [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length] : null;
}

function loadSubBasinFeature(id: string) {
  const data: any = JSON.parse(readFileSync(join(process.cwd(), "public/data/decisionnel/sous_bassins_data.json"), "utf8"));
  const feature = (data.features || []).find((x: any) => String(x?.properties?.HydroID ?? x?.properties?.OBJECTID) === String(id));
  if (!feature) throw new Error(`Sous-bassin SB-${id} introuvable`);
  return feature;
}

async function integratedSubBasin(id: string, start: string, end: string) {
  const feature = loadSubBasinFeature(id);
  const restoration: any = JSON.parse(readFileSync(join(process.cwd(), "public/data/decisionnel/restaurations_data.json"), "utf8"));
  const restorationRows = (restoration.features || []).filter((r: any) => {
    const c = geometryCentroid(r.geometry);
    return c && inside(c, feature.geometry);
  }).map((r: any) => ({
    area: finite(r.properties?.Surf_ha),
    technology: text(r.properties?.["Méthode de"]) || text(r.properties?.["MÃ©thode d"]) || "Technologie non renseignée",
    commune: text(r.properties?.commune_2 || r.properties?.Commune || r.properties?.commune) || "Non renseignée",
  }));
  const modules: any = {};
  for (const module of HYDRO) {
    const loaded = await loadHydroRows(module);
    let source = loaded.rows.filter((r: any) => {
      const lat = number(r.latitude), lon = number(r.longitude);
      return lat !== null && lon !== null && inside([lon, lat], feature.geometry);
    });
    if (start) source = source.filter(r => dateText(r.date_observation) >= start);
    if (end) source = source.filter(r => dateText(r.date_observation) <= end);
    const checked = quality(source, module);
    modules[module] = { rows: checked, quality: qualitySummary(checked, loaded.rejected || 0) };
  }
  const pz = piezometry(modules.piezometrie.rows), pl = rainfall(modules.pluviometrie.rows), lm = limnimetry(modules.limnimetrie.rows);
  const technologies = new Map<string, any>();
  for (const r of restorationRows) {
    const z = technologies.get(r.technology) || { technology: r.technology, sites: 0, area: 0 };
    z.sites += 1; z.area += r.area; technologies.set(r.technology, z);
  }
  const basinHa = Math.abs(finite(feature.properties?.Shape_Area)) / 10000;
  const restoredHa = restorationRows.reduce((s: number, r: any) => s + r.area, 0);
  return {
    id,
    basinHa,
    restoredHa,
    density: basinHa ? restoredHa / basinHa * 100 : 0,
    sites: restorationRows.length,
    technologies: Array.from(technologies.values()).sort((a, b) => b.area - a.area),
    pz, pl, lm, modules,
    period: periodLabel(modules, start, end),
  };
}

function periodLabel(modules: any, start: string, end: string) {
  const dates: string[] = [];
  for (const module of HYDRO) for (const r of modules[module]?.rows || []) { const d = dateText(r.date_observation); if (validDate(d)) dates.push(d); }
  dates.sort();
  return `${start || dates[0] || "début disponible"} → ${end || dates[dates.length - 1] || "fin disponible"}`;
}

function makeHydroPdf(module: Hydro, rows: any[], q: any, start: string, end: string, rejected: number) {
  const p = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const period = periodLabel({ [module]: { rows } }, start, end);
  const pz = module === "piezometrie" ? piezometry(rows) : null;
  const pl = module === "pluviometrie" ? rainfall(rows) : null;
  const lm = module === "limnimetrie" ? limnimetry(rows) : null;
  fill(p, COLORS.navy); p.rect(0, 0, 297, 27, "F"); ink(p, "#FFFFFF"); p.setFont("helvetica", "bold"); p.setFontSize(15); p.text(`PSORE — ${CFG[module].label}`, 12, 11);
  p.setFont("helvetica", "normal"); p.setFontSize(6.5); p.text(`Période : ${period} • Source : couche analytique PSORE V5`, 12, 19);
  card(p, 12, 33, 42, "Validées", String(q.valid), COLORS.blue); card(p, 57, 33, 42, "À vérifier", String(q.verify), COLORS.orange); card(p, 102, 33, 42, "Rejetées", String(q.rejected), COLORS.red);
  if (pz) {
    card(p, 147, 33, 47, "Remontée moyenne", `${formatSigned(pz.deltaGlobal)} m (${formatSigned(pz.rateGlobal, 1)} %)`, COLORS.cyan);
    card(p, 197, 33, 42, "Moyenne communes", `${formatSigned(pz.rateCommunes, 1)} %`, COLORS.green);
    card(p, 242, 33, 43, "Taux global pondéré", `${formatSigned(pz.rateGlobal, 1)} %`, COLORS.purple);
  } else if (pl) {
    card(p, 147, 33, 42, "Pluie moyenne", `${formatNumber(pl.average)} mm`, COLORS.blue); card(p, 192, 33, 42, "Cumul", `${formatNumber(pl.total)} mm`, COLORS.green); card(p, 237, 33, 48, "Jours pluvieux", String(pl.rainyDays), COLORS.purple);
  } else if (lm) {
    card(p, 147, 33, 42, "Stations", String(lm.length), COLORS.purple); card(p, 192, 33, 42, "Niveau moyen", `${formatNumber(lm.length ? lm.reduce((s, x) => s + finite(x.moyenne), 0) / lm.length : null)} cm`, COLORS.cyan); card(p, 237, 33, 48, "Mesures validées", String(lm.reduce((s, x) => s + x.mesures, 0)), COLORS.green);
  }
  if (pz) {
    chart(p, "Évolution de la remontée du niveau statique par commune", pz.communes.map(x => ({ label: x.commune, value: finite(x.delta) })), 12, 68, 132, 75, "Commune", "Remontée (m)", COLORS.cyan, period);
    chart(p, "Taux de remontée par commune", pz.communes.map(x => ({ label: x.commune, value: finite(x.rate) })), 151, 68, 134, 75, "Commune", "Taux (%)", COLORS.green, period);
    qualityBlock(p, { ...q, rejected: q.rejected + rejected }, 12, 151);
    ink(p, COLORS.gray); p.setFontSize(5.5); p.text(`Taux global pondéré par les stations : ${formatSigned(pz.rateGlobal, 1)} % • Moyenne simple des taux communaux : ${formatSigned(pz.rateCommunes, 1)} %.`, 151, 151);
    p.text(`Stations avec moins de deux mesures exploitables : ${pz.limitedStations}. Elles restent conservées et signalées, mais ne contribuent pas à la variation.`, 151, 158);
    p.text("Axe Y : Profondeur du niveau statique (m) dans les séries détaillées. Convention : remontée = niveau initial − niveau final.", 151, 166);
  } else if (pl) {
    chart(p, "Cumul pluviométrique mensuel", pl.monthly, 12, 68, 132, 75, "Mois", "Précipitations (mm)", COLORS.blue, period);
    chart(p, "Statistiques pluviométriques", [{ label: "Moyenne", value: finite(pl.average) }, { label: "Minimum", value: finite(pl.min) }, { label: "Maximum", value: finite(pl.max) }], 151, 68, 134, 75, "Indicateur", "Précipitations (mm)", COLORS.green, period);
    qualityBlock(p, { ...q, rejected: q.rejected + rejected }, 12, 151);
    ink(p, COLORS.gray); p.setFontSize(5.5); p.text("Les cumuls mensuels sont calculés uniquement à partir des observations validées.", 151, 151);
  } else if (lm) {
    chart(p, "Niveau moyen des cours d’eau par station", lm.map(x => ({ label: x.code, value: finite(x.moyenne) })), 12, 68, 132, 75, "Station", "Hauteur d’eau (cm)", COLORS.cyan, period);
    qualityBlock(p, { ...q, rejected: q.rejected + rejected }, 12, 151);
    ink(p, COLORS.navy); p.setFontSize(6); p.text("La mesure caractérise le niveau du cours d’eau au droit de la station limnimétrique.", 151, 151);
    let y = 160; for (const x of lm.slice(0, 7)) { ink(p, COLORS.gray); p.setFontSize(5.2); p.text(`${x.code} — ${x.coursEau} : ${formatNumber(x.moyenne)} cm`, 151, y); y += 6; }
  }
  drawStationMap(p, rows, module, 153, 175, 132, 24);
  footer(p);
  return p.output("arraybuffer");
}

function drawStationMap(p: jsPDF, rows: any[], module: Hydro, x: number, y: number, w: number, h: number) {
  const by = new Map<string, { lat: number; lon: number; label: string }>();
  for (const r of rows) {
    if (!gpsValid(r)) continue;
    const code = stationCode(module, r); if (!code || by.has(code)) continue;
    by.set(code, { lat: finite(r.latitude), lon: finite(r.longitude), label: code });
  }
  const pts = Array.from(by.values());
  fill(p, "#F7FAFC"); stroke(p, COLORS.line); p.roundedRect(x, y, w, h, 2, 2, "FD"); ink(p, COLORS.navy); p.setFont("helvetica", "bold"); p.setFontSize(6.5); p.text("Cartographie harmonisée — une entité = un point", x + 2, y + 4);
  if (!pts.length) { ink(p, COLORS.gray); p.setFontSize(4.5); p.text("Aucune coordonnée valide", x + 2, y + 11); return; }
  const minLat = Math.min(...pts.map(a => a.lat)), maxLat = Math.max(...pts.map(a => a.lat)), minLon = Math.min(...pts.map(a => a.lon)), maxLon = Math.max(...pts.map(a => a.lon));
  const dx = Math.max(maxLon - minLon, 0.01), dy = Math.max(maxLat - minLat, 0.01);
  for (const pt of pts) {
    const px = safeCoord(x + 4 + (pt.lon - minLon) / dx * (w - 8)), py = safeCoord(y + h - 3 - (pt.lat - minLat) / dy * (h - 10));
    fill(p, COLORS.purple); stroke(p, "#FFFFFF"); p.circle(px, py, 1, "FD");
  }
  ink(p, COLORS.gray); p.setFontSize(4); p.text(`Source géographique : référentiel station PSORE • ${pts.length} station(s)`, x + 2, y + h - 1.5);
}

function makeSubBasinPdf(d: any) {
  const p = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  fill(p, COLORS.navy); p.rect(0, 0, 297, 27, "F"); ink(p, "#FFFFFF"); p.setFont("helvetica", "bold"); p.setFontSize(15); p.text(`PSORE — Rapport intégré du sous-bassin SB-${d.id}`, 12, 11); p.setFont("helvetica", "normal"); p.setFontSize(6.5); p.text(`Période : ${d.period} • Analyse intégrée restauration + eaux souterraines + pluie + cours d’eau`, 12, 19);
  card(p, 12, 33, 32, "Surface", `${formatNumber(d.basinHa)} ha`, COLORS.blue); card(p, 47, 33, 32, "Restaurée", `${formatNumber(d.restoredHa)} ha`, COLORS.green); card(p, 82, 33, 32, "Taux restauration", `${formatNumber(d.density)} %`, COLORS.orange); card(p, 117, 33, 32, "Sites restaurés", String(d.sites), COLORS.purple);
  card(p, 152, 33, 43, "Remontée moyenne", `${formatSigned(d.pz.deltaGlobal)} m (${formatSigned(d.pz.rateGlobal, 1)} %)`, COLORS.cyan); card(p, 198, 33, 43, "Pluie moyenne", `${formatNumber(d.pl.average)} mm`, COLORS.blue); card(p, 244, 33, 41, "Niveau moyen", `${formatNumber(d.lm.length ? d.lm.reduce((s: number, x: any) => s + finite(x.moyenne), 0) / d.lm.length : null)} cm`, COLORS.purple);
  chart(p, "Remontée du niveau statique par commune", d.pz.communes.map((x: any) => ({ label: x.commune, value: finite(x.delta) })), 12, 68, 132, 67, "Commune", "Remontée (m)", COLORS.cyan, d.period);
  chart(p, "Surface restaurée par technologie", d.technologies.map((x: any) => ({ label: x.technology, value: finite(x.area) })), 151, 68, 134, 67, "Technologie", "Superficie (ha)", COLORS.green, d.period);
  qualityBlock(p, { total: HYDRO.reduce((s, m) => s + d.modules[m].quality.total, 0), valid: HYDRO.reduce((s, m) => s + d.modules[m].quality.valid, 0), verify: HYDRO.reduce((s, m) => s + d.modules[m].quality.verify, 0), rejected: HYDRO.reduce((s, m) => s + d.modules[m].quality.rejected, 0), duplicates: HYDRO.reduce((s, m) => s + d.modules[m].quality.duplicates, 0), atypical: HYDRO.reduce((s, m) => s + d.modules[m].quality.atypical, 0), gps: HYDRO.reduce((s, m) => s + d.modules[m].quality.gps, 0), future: HYDRO.reduce((s, m) => s + d.modules[m].quality.future, 0), missingHourReview: HYDRO.reduce((s, m) => s + d.modules[m].quality.missingHourReview, 0) }, 12, 141);
  ink(p, COLORS.gray); p.setFontSize(5.5); p.text(`Taux global pondéré stations : ${formatSigned(d.pz.rateGlobal, 1)} % • Moyenne simple des taux communaux : ${formatSigned(d.pz.rateCommunes, 1)} %.`, 151, 141);
  p.text("Limnimétrie : chaque niveau décrit la situation au droit de la station ; il ne représente pas automatiquement l’ensemble du cours d’eau.", 151, 149);
  p.text(`Pluviométrie : moyenne ${formatNumber(d.pl.average)} mm • cumul ${formatNumber(d.pl.total)} mm • min ${formatNumber(d.pl.min)} mm • max ${formatNumber(d.pl.max)} mm • ${d.pl.rainyDays} jour(s) pluvieux.`, 151, 157);
  p.text(`Stations piézométriques avec peu de mesures : ${d.pz.limitedStations}.`, 151, 165);
  footer(p); return p.output("arraybuffer");
}

function makeHydroDocx(module: Hydro, rows: any[], q: any, start: string, end: string, rejected: number) {
  const period = periodLabel({ [module]: { rows } }, start, end), pz = module === "piezometrie" ? piezometry(rows) : null, pl = module === "pluviometrie" ? rainfall(rows) : null, lm = module === "limnimetrie" ? limnimetry(rows) : null;
  const children: Paragraph[] = [
    new Paragraph({ text: `PSORE — ${CFG[module].label}`, heading: HeadingLevel.TITLE }),
    new Paragraph(`Période : ${period}`),
    new Paragraph(`Contrôle qualité : ${q.valid} validées · ${q.verify} à vérifier · ${q.rejected + rejected} rejetées · ${q.duplicates} doublons certains.`),
  ];
  if (pz) {
    children.push(new Paragraph(`Remontée moyenne du niveau statique : ${formatSigned(pz.deltaGlobal)} m (${formatSigned(pz.rateGlobal, 1)} %).`));
    children.push(new Paragraph(`Taux global pondéré par les stations : ${formatSigned(pz.rateGlobal, 1)} %.`));
    children.push(new Paragraph(`Moyenne simple des taux communaux : ${formatSigned(pz.rateCommunes, 1)} %.`));
    children.push(new Paragraph({ text: "Analyse par commune", heading: HeadingLevel.HEADING_1 }));
    for (const c of pz.communes) children.push(new Paragraph(`• ${c.commune} : niveau initial/final par station, variation ${formatSigned(c.delta)} m, taux ${formatSigned(c.rate, 1)} %, ${c.stations} station(s), ${c.observations} mesures. ${c.warning}`));
    children.push(new Paragraph({ text: "Convention", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph("Le niveau statique est une profondeur sous le sol : remontée = niveau initial − niveau final. Une valeur positive indique une remontée."));
  }
  if (pl) children.push(new Paragraph(`Pluviométrie : moyenne ${formatNumber(pl.average)} mm · cumul ${formatNumber(pl.total)} mm · minimum ${formatNumber(pl.min)} mm · maximum ${formatNumber(pl.max)} mm · jours pluvieux ${pl.rainyDays}.`));
  if (lm) {
    children.push(new Paragraph({ text: "Cours d’eau par station", heading: HeadingLevel.HEADING_1 }));
    for (const x of lm) children.push(new Paragraph(`• ${x.code} — cours d’eau : ${x.coursEau} — niveau moyen ${formatNumber(x.moyenne)} cm (${x.mesures} mesures). La mesure caractérise le niveau au droit de la station.`));
  }
  children.push(new Paragraph({ text: "Source et qualité", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph("Les données source sont conservées avec leur statut qualité. Les indicateurs validés excluent les doublons certains, les données rejetées et les incohérences certaines."));
  return Packer.toBuffer(new Document({ sections: [{ children }] }));
}

function makeSubBasinDocx(d: any) {
  const children: Paragraph[] = [new Paragraph({ text: `PSORE — Rapport intégré du sous-bassin SB-${d.id}`, heading: HeadingLevel.TITLE }), new Paragraph(`Période : ${d.period}`), new Paragraph(`Surface : ${formatNumber(d.basinHa)} ha · surface restaurée : ${formatNumber(d.restoredHa)} ha · taux de restauration : ${formatNumber(d.density)} % · sites : ${d.sites}.`), new Paragraph(`Remontée moyenne du niveau statique : ${formatSigned(d.pz.deltaGlobal)} m (${formatSigned(d.pz.rateGlobal, 1)} %).`), new Paragraph(`Taux global pondéré : ${formatSigned(d.pz.rateGlobal, 1)} % · moyenne simple des taux communaux : ${formatSigned(d.pz.rateCommunes, 1)} %.`), new Paragraph({ text: "Restauration par technologie", heading: HeadingLevel.HEADING_1 })];
  for (const x of d.technologies) children.push(new Paragraph(`• ${x.technology} : ${formatNumber(x.area)} ha · ${x.sites} site(s).`));
  children.push(new Paragraph({ text: "Eaux souterraines par commune", heading: HeadingLevel.HEADING_1 }));
  for (const x of d.pz.communes) children.push(new Paragraph(`• ${x.commune} : variation ${formatSigned(x.delta)} m · taux ${formatSigned(x.rate, 1)} % · ${x.stations} station(s) · ${x.observations} mesures. ${x.warning}`));
  children.push(new Paragraph({ text: "Pluviométrie", heading: HeadingLevel.HEADING_1 }), new Paragraph(`Moyenne ${formatNumber(d.pl.average)} mm · cumul ${formatNumber(d.pl.total)} mm · min ${formatNumber(d.pl.min)} mm · max ${formatNumber(d.pl.max)} mm · ${d.pl.rainyDays} jour(s) pluvieux.`));
  children.push(new Paragraph({ text: "Cours d’eau", heading: HeadingLevel.HEADING_1 }));
  for (const x of d.lm) children.push(new Paragraph(`• ${x.code} — ${x.coursEau} : niveau moyen ${formatNumber(x.moyenne)} cm (${x.mesures} mesures). Mesure au droit de la station, non représentative automatiquement de tout le cours d’eau.`));
  return Packer.toBuffer(new Document({ sections: [{ children }] }));
}

function workbookHydro(module: Hydro, rows: any[], q: any, rejected: number) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Indicateur: "Reçues", Valeur: q.total + rejected }, { Indicateur: "Validées", Valeur: q.valid }, { Indicateur: "À vérifier", Valeur: q.verify }, { Indicateur: "Rejetées", Valeur: q.rejected + rejected }, { Indicateur: "Doublons certains", Valeur: q.duplicates }, { Indicateur: "Valeurs atypiques", Valeur: q.atypical }, { Indicateur: "GPS invalides/absents", Valeur: q.gps }]), "Qualité");
  const pz = module === "piezometrie" ? piezometry(rows) : null;
  const pl = module === "pluviometrie" ? rainfall(rows) : null;
  const lm = module === "limnimetrie" ? limnimetry(rows) : null;
  if (pz) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Indicateur: "Remontée moyenne pondérée (m)", Valeur: pz.deltaGlobal }, { Indicateur: "Taux global pondéré stations (%)", Valeur: pz.rateGlobal }, { Indicateur: "Moyenne simple des taux communaux (%)", Valeur: pz.rateCommunes }]), "Indicateurs");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pz.stations), "Piézo stations");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pz.communes), "Piézo communes");
  }
  if (pl) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Moyenne_mm: pl.average, Cumul_mm: pl.total, Minimum_mm: pl.min, Maximum_mm: pl.max, Jours_pluvieux: pl.rainyDays }]), "Indicateurs");
  if (pl) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pl.monthly), "Pluie mensuelle");
  if (lm) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lm), "Limni stations");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows(rows, module)), "Données validées");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

function workbookSource(module: Hydro, rows: any[], q: any, rejected: number) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Indicateur: "Reçues", Valeur: q.total + rejected }, { Indicateur: "Validées", Valeur: q.valid }, { Indicateur: "À vérifier", Valeur: q.verify }, { Indicateur: "Rejetées", Valeur: q.rejected + rejected }, { Indicateur: "Doublons certains", Valeur: q.duplicates }]), "Qualité");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows(rows, module)), "Données source + qualité");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN]);
  if ("response" in auth) return auth.response;
  const sp = req.nextUrl.searchParams;
  const module = (sp.get("module") || "pluviometrie") as Hydro | "sous_bassin";
  const format = (sp.get("format") || "pdf").toLowerCase();
  const scope = (sp.get("scope") || "analytic").toLowerCase();
  const start = sp.get("start") || "";
  const end = sp.get("end") || "";
  try {
    if (module === "sous_bassin") {
      const id = sp.get("sb");
      if (!id) return NextResponse.json({ ok: false, error: "Identifiant de sous-bassin requis" }, { status: 400 });
      const d = await integratedSubBasin(id, start, end);
      if (format === "pdf") return new Response(makeSubBasinPdf(d), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=\"psore_SB-${id}_rapport-integre.pdf\"` } });
      if (format === "docx") return new Response(new Uint8Array(await makeSubBasinDocx(d)), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename=\"psore_SB-${id}_rapport-integre.docx\"` } });
      const summary = [{ Sous_bassin: `SB-${id}`, Surface_ha: d.basinHa, Surface_restauree_ha: d.restoredHa, Taux_restauration_pct: d.density, Sites_restaures: d.sites, Remontee_m: d.pz.deltaGlobal, Taux_global_pondere_pct: d.pz.rateGlobal, Moyenne_taux_communaux_pct: d.pz.rateCommunes, Pluviometrie_moyenne_mm: d.pl.average, Pluviometrie_cumul_mm: d.pl.total, Pluviometrie_min_mm: d.pl.min, Pluviometrie_max_mm: d.pl.max, Jours_pluvieux: d.pl.rainyDays, Niveau_moyen_cours_eau_cm: d.lm.length ? d.lm.reduce((s: number, x: any) => s + finite(x.moyenne), 0) / d.lm.length : null }];
      if (format === "csv") return new Response(csv(summary), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=\"psore_SB-${id}_synthese.csv\"` } });
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Synthèse"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.technologies), "Restauration par technologie"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.pz.stations), "Piézo stations"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.pz.communes), "Piézo communes"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.pl.monthly), "Pluie mensuelle"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.lm), "Limni stations");
      return new Response(XLSX.write(wb, { type: "array", bookType: "xlsx" }), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename=\"psore_SB-${id}_rapport-integre.xlsx\"` } });
    }
    if (!HYDRO.includes(module as Hydro)) return NextResponse.json({ ok: false, error: "Module invalide" }, { status: 400 });
    const loaded = await loadHydroRows(module as Hydro);
    let rows = loaded.rows;
    if (start) rows = rows.filter(r => dateText(r.date_observation) >= start);
    if (end) rows = rows.filter(r => dateText(r.date_observation) <= end);
    const checked = quality(rows, module as Hydro);
    const q = qualitySummary(checked);
    if (scope === "source" && format === "xlsx") {
      return new Response(workbookSource(module as Hydro, checked, q, loaded.rejected || 0), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename=\"psore_${module}_source-qualite.xlsx\"` } });
    }
    if (scope === "source" && format === "csv") {
      return new Response(csv(detailRows(checked, module as Hydro)), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=\"psore_${module}_source-qualite.csv\"` } });
    }
    if (format === "csv") return new Response(csv(detailRows(checked.filter(r => r.__status === "Validée"), module as Hydro)), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=\"psore_${module}_donnees-validees.csv\"` } });
    if (format === "xlsx") return new Response(workbookHydro(module as Hydro, checked.filter(r => r.__status !== "Rejetée" && r.__status !== "Doublon certain"), q, loaded.rejected || 0), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename=\"psore_${module}_rapport-analytique.xlsx\"` } });
    if (format === "docx") return new Response(new Uint8Array(await makeHydroDocx(module as Hydro, checked, q, start, end, loaded.rejected || 0)), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename=\"psore_${module}_rapport-analytique.docx\"` } });
    return new Response(makeHydroPdf(module as Hydro, checked, q, start, end, loaded.rejected || 0), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=\"psore_${module}_rapport-analytique.pdf\"` } });
  } catch (error: any) {
    console.error("PSORE export-v5", error);
    return NextResponse.json({ ok: false, error: error?.message || "Génération du rapport impossible" }, { status: 500 });
  }
}
