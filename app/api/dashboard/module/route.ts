export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase-admin";

type Row = Record<string, any>;
type Cfg = { view: string; table: string; label: string; valueKey: string; dateKey: string; module: string; stationKey: string };

const CFG: Record<string, Cfg> = {
  pluviometrie: { view: "v_pluviometrie_dashboard", table: "observations_pluvio", label: "Pluviométrie", valueKey: "pluie_24h_mm", dateKey: "date_observation", module: "pluviometrie", stationKey: "code_site" },
  piezometrie: { view: "v_piezometrie_dashboard", table: "observations_piezo", label: "Piézométrie", valueKey: "niveau_statique", dateKey: "date_observation", module: "piezometrie", stationKey: "code_site" },
  limnimetrie: { view: "v_limnimetrie_dashboard", table: "observations_limni", label: "Limnimétrie", valueKey: "hauteur_eau", dateKey: "date_observation", module: "limnimetrie", stationKey: "code_site" },
};

function text(v: any) { return String(v ?? "").trim(); }
function num(v: any) { const raw = String(v ?? "").replace(",", ".").trim(); if (!raw) return null; const n = Number(raw); return Number.isFinite(n) ? n : null; }
function dateText(v: any) { return text(v).slice(0, 10); }
function isAlert(r: Row) { return Boolean(r.alerte_valeur || r.alerte_gps || r.alerte_donnee || r.alerte_secheresse || r.alerte_crue); }
function siteCode(r: Row) { return text(r.code_site || r.code_station || r.code_piezo || r.station_id || r.piezometre_id); }
function counts(rows: Row[], key: string | ((r: Row) => string)) {
  const m = new Map<string, number>();
  rows.forEach((r) => { const k = typeof key === "function" ? key(r) : text(r[key]); const label = k || "Non renseigné"; m.set(label, (m.get(label) || 0) + 1); });
  return Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}
function avg(rows: Row[], key: string) { const xs = rows.map((r) => num(r[key] ?? r.valeur_observee)).filter((x): x is number => x !== null); return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null; }
function byDate(rows: Row[], dateKey: string, valueKey: string) {
  const m = new Map<string, { n: number; sum: number }>();
  rows.forEach((r) => {
    const d = dateText(r[dateKey]) || "Non daté";
    const val = num(r[valueKey] ?? r.valeur_observee);
    const old = m.get(d) || { n: 0, sum: 0 };
    if (val !== null) { old.n += 1; old.sum += val; } else old.n += 1;
    m.set(d, old);
  });
  return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, v]) => ({ label, value: v.n ? Math.round((v.sum / v.n) * 100) / 100 : 0 })).slice(-24);
}
function alertTypes(rows: Row[]) {
  const out = [
    { label: "Valeur", value: rows.filter((r) => r.alerte_valeur).length },
    { label: "GPS", value: rows.filter((r) => r.alerte_gps).length },
    { label: "Donnée", value: rows.filter((r) => r.alerte_donnee).length },
    { label: "Seuil sécheresse", value: rows.filter((r) => r.alerte_secheresse).length },
    { label: "Seuil crue", value: rows.filter((r) => r.alerte_crue).length },
  ].filter((x) => x.value > 0);
  return out.length ? out : [{ label: "Aucune alerte", value: 0 }];
}

async function readRows(cfg: Cfg) {
  if (!hasSupabaseAdminEnv()) return { rows: [] as Row[], source: "En attente configuration Supabase" };
  let res = await supabaseAdmin.from(cfg.view).select("*").limit(20000);
  if (res.error || !res.data?.length) res = await supabaseAdmin.from(cfg.table).select("*").limit(20000);
  return { rows: (res.data || []) as Row[], source: res.error ? `Supabase (${res.error.message})` : "Supabase" };
}

function applyFilters(rows: Row[], req: NextRequest, cfg: Cfg) {
  const commune = req.nextUrl.searchParams.get("commune");
  const site = req.nextUrl.searchParams.get("site");
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");
  const alerte = req.nextUrl.searchParams.get("alerte");
  let filtered = rows;
  if (commune && commune !== "all") filtered = filtered.filter((r) => text(r.commune) === commune);
  if (site && site !== "all") filtered = filtered.filter((r) => siteCode(r) === site);
  if (start) filtered = filtered.filter((r) => dateText(r[cfg.dateKey]) >= start);
  if (end) filtered = filtered.filter((r) => dateText(r[cfg.dateKey]) <= end);
  if (alerte === "yes") filtered = filtered.filter(isAlert);
  if (alerte === "no") filtered = filtered.filter((r) => !isAlert(r));
  return filtered;
}

export async function GET(req: NextRequest) {
  const moduleName = req.nextUrl.searchParams.get("module") || "pluviometrie";
  const cfg = CFG[moduleName];
  if (!cfg) return NextResponse.json({ ok: false, error: "Module invalide" }, { status: 400 });

  const { rows: rawRows, source } = await readRows(cfg);
  const rows = applyFilters(rawRows, req, cfg);
  const values = rows.map((r) => num(r[cfg.valueKey] ?? r.valeur_observee)).filter((x): x is number => x !== null);
  const latest = [...rows].sort((a, b) => dateText(b[cfg.dateKey]).localeCompare(dateText(a[cfg.dateKey]))).slice(0, 500);
  const stations = new Set(rows.map(siteCode).filter(Boolean));
  const gpsMissingSites = new Set(rows.filter((r) => r.alerte_gps || r.latitude === null || r.longitude === null).map(siteCode).filter(Boolean));

  return NextResponse.json({
    ok: true,
    source,
    module: cfg.module,
    label: cfg.label,
    stats: {
      observations: rows.length,
      sites: stations.size,
      moyenne: avg(rows, cfg.valueKey),
      minimum: values.length ? Math.min(...values) : null,
      maximum: values.length ? Math.max(...values) : null,
      alertes: rows.filter(isAlert).length,
      sans_gps: gpsMissingSites.size,
      derniere_observation: latest[0] ? dateText(latest[0][cfg.dateKey]) : null,
    },
    charts: {
      communes: counts(rows, "commune"),
      sites: counts(rows, siteCode),
      evolution: byDate(rows, cfg.dateKey, cfg.valueKey),
      alertes: alertTypes(rows),
    },
    filters: {
      communes: counts(rawRows, "commune").map((x) => x.label).filter((x) => x !== "Non renseigné"),
      sites: counts(rawRows, siteCode).map((x) => x.label).filter((x) => x !== "Non renseigné"),
    },
    data: latest,
  });
}
