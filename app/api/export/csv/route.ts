export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import pointsEauInventaire from "@/public/data/points-eau-inventaire.json";
import { supabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase-admin";
import { toCsv } from "@/services/exports/csv";

const TABLES: Record<string, string[]> = {
  pluviometrie: ["v_pluviometrie_dashboard", "observations_pluvio"],
  piezometrie: ["v_piezometrie_dashboard", "observations_piezo"],
  limnimetrie: ["v_limnimetrie_dashboard", "observations_limni"],
  points_eau: ["v_points_eau_dashboard", "points_eau"],
};
const PRIVATE = new Set(["nom_repondant", "contact_repondant", "51_Nom_et_Prenom", "52_Contact_tlphoniqu"]);
function sanitize(rows: any[]) { return rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !PRIVATE.has(k)))); }
function t(v: any) { return String(v ?? "").trim(); }
function d(v: any) { return t(v).slice(0, 10); }
function site(r: any) { return t(r.code_site || r.code_station || r.code_piezo || r.code_pe || r.station_id || r.piezometre_id); }
function alert(r: any) { return Boolean(r.alerte_valeur || r.alerte_gps || r.alerte_donnee || r.alerte_secheresse || r.alerte_crue || r.alerte_qualite_eau); }
async function localPoints() { return pointsEauInventaire as any[]; }
async function readRows(module: string) {
  if (hasSupabaseAdminEnv()) {
    for (const table of TABLES[module] || []) {
      const { data, error } = await supabaseAdmin.from(table).select("*").limit(20000);
      if (!error && data?.length) return data;
    }
  }
  if (module === "points_eau") return localPoints();
  return [];
}
function applyFilters(rows: any[], req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const commune = q.get("commune");
  const siteFilter = q.get("site");
  const start = q.get("start");
  const end = q.get("end");
  const alerte = q.get("alerte");
  const type = q.get("type");
  let out = rows;
  if (commune && commune !== "all") out = out.filter((r) => t(r.commune) === commune);
  if (siteFilter && siteFilter !== "all") out = out.filter((r) => site(r) === siteFilter);
  if (start) out = out.filter((r) => d(r.date_observation || r.created_at || r.date_collecte) >= start);
  if (end) out = out.filter((r) => d(r.date_observation || r.created_at || r.date_collecte) <= end);
  if (alerte === "yes") out = out.filter(alert);
  if (alerte === "no") out = out.filter((r) => !alert(r));
  if (type && type !== "all") out = out.filter((r) => t(r.type_infrastructure || r.type_ouvrage) === type);
  return out;
}
export async function GET(req: NextRequest) {
  const module = req.nextUrl.searchParams.get("module") || "pluviometrie";
  if (!TABLES[module]) return NextResponse.json({ ok: false, error: "Module invalide" }, { status: 400 });
  const rows = sanitize(applyFilters(await readRows(module), req));
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${module}_PSORE_V2_4.csv"` } });
}
