import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabase-admin";
import { networkTotal, stationMetaByCode, type HydroModule } from "@/lib/network-registry";

export type HydroRow = Record<string, any>;

type HydroCfg = {
  view: string;
  observationTable: string;
  stationTable: string;
  codeField: "code_station" | "code_piezo";
  stationIdField: "station_id" | "piezometre_id";
  valueField: string;
  dateField: string;
};

export const HYDRO_CFG: Record<HydroModule, HydroCfg> = {
  pluviometrie: { view: "v_pluviometrie_dashboard_v50", observationTable: "observations_pluvio", stationTable: "stations_pluvio", codeField: "code_station", stationIdField: "station_id", valueField: "pluie_24h_mm", dateField: "date_observation" },
  piezometrie: { view: "v_piezometrie_dashboard_v50", observationTable: "observations_piezo", stationTable: "piezometres", codeField: "code_piezo", stationIdField: "piezometre_id", valueField: "niveau_statique", dateField: "date_observation" },
  limnimetrie: { view: "v_limnimetrie_dashboard_v50", observationTable: "observations_limni", stationTable: "stations_limni", codeField: "code_station", stationIdField: "station_id", valueField: "hauteur_eau", dateField: "date_observation" },
};

function text(v: any) { return String(v ?? "").trim(); }
function dateText(v: any) { return text(v).slice(0, 10); }

function enrichWithMeta(module: HydroModule, row: HydroRow, rawCode: any, parent?: HydroRow | null) {
  const meta = stationMetaByCode(module, rawCode);
  if (!meta) return null;
  const p = parent || {};
  const latitude = row.latitude ?? p.latitude ?? null;
  const longitude = row.longitude ?? p.longitude ?? null;
  const name = meta.locality || row.nom_site || p.nom_station || p.localite || p.cours_eau || p.village || meta.code;
  return {
    ...row,
    code_site: meta.code,
    code_station: module === "piezometrie" ? row.code_station : meta.code,
    code_piezo: module === "piezometrie" ? meta.code : row.code_piezo,
    code_court: meta.shortCode || row.code_court || null,
    nom_site: name,
    commune: meta.commune || row.commune || p.commune || "Non renseignée",
    village: row.village || p.village || meta.locality || null,
    latitude,
    longitude,
    __station_officielle: true,
  };
}

async function operationalCutoff() {
  if (!hasSupabaseAdminEnv()) return "";
  try {
    const { data, error } = await supabaseAdmin.from("system_settings").select("value").eq("key", "operational_data_start_date").maybeSingle();
    return error ? "" : text(data?.value);
  } catch { return ""; }
}

async function loadFromView(module: HydroModule) {
  const cfg = HYDRO_CFG[module];
  const { data, error } = await supabaseAdmin.from(cfg.view).select("*").limit(20000);
  if (error) return { rows: [] as HydroRow[], error: error.message };
  const valid: HydroRow[] = [];
  let rejected = 0;
  for (const r of data || []) {
    const rawCode = r.code_site || r[cfg.codeField];
    const e = enrichWithMeta(module, r, rawCode);
    if (e) valid.push(e); else rejected++;
  }
  return { rows: valid, rejected, error: "" };
}

async function loadFromRaw(module: HydroModule) {
  const cfg = HYDRO_CFG[module];
  const [obsRes, stationRes] = await Promise.all([
    supabaseAdmin.from(cfg.observationTable).select("*").limit(20000),
    supabaseAdmin.from(cfg.stationTable).select("*").limit(5000),
  ]);
  if (obsRes.error) return { rows: [] as HydroRow[], rejected: 0, error: obsRes.error.message };
  const stations = stationRes.data || [];
  const bySource = new Map(stations.map((s: any) => [text(s.source_entry_id), s]));
  const byId = new Map(stations.map((s: any) => [text(s.id), s]));
  const valid: HydroRow[] = [];
  let rejected = 0;
  for (const r of obsRes.data || []) {
    const parent = bySource.get(text(r.source_parent_id)) || byId.get(text(r[cfg.stationIdField])) || null;
    const rawCode = parent?.[cfg.codeField] || r[cfg.codeField] || r.code_site;
    const e = enrichWithMeta(module, r, rawCode, parent);
    if (e) valid.push(e); else rejected++;
  }
  return { rows: valid, rejected, error: stationRes.error?.message || "" };
}

export async function loadHydroRows(module: HydroModule) {
  if (!hasSupabaseAdminEnv()) return { rows: [] as HydroRow[], source: "En attente configuration Supabase", rejected: 0, network: networkTotal(module) };
  const cutoff = await operationalCutoff();
  const [view, raw] = await Promise.all([loadFromView(module), loadFromRaw(module)]);
  let rows = view.rows;
  let rejected = raw.rejected || view.rejected || 0;
  let source = `Supabase — ${HYDRO_CFG[module].view}`;
  if (!rows.length) {
    rows = raw.rows;
    source = "Supabase — tables brutes rapprochées du référentiel officiel";
  }
  if (cutoff) rows = rows.filter(r => !dateText(r[HYDRO_CFG[module].dateField]) || dateText(r[HYDRO_CFG[module].dateField]) >= cutoff);
  return { rows, source, rejected, network: networkTotal(module), cutoff };
}

export async function loadOfficialStations(module: HydroModule) {
  if (!hasSupabaseAdminEnv()) return [] as HydroRow[];
  const cfg = HYDRO_CFG[module];
  const { data } = await supabaseAdmin.from(cfg.stationTable).select("*").limit(5000);
  const byCode = new Map<string, HydroRow>();
  for (const r of data || []) {
    const meta = stationMetaByCode(module, r[cfg.codeField]);
    if (!meta) continue;
    const prev = byCode.get(meta.code);
    const currentTime = Date.parse(text(r.synced_at) || text(r.updated_at) || text(r.created_at) || "1970-01-01");
    const prevTime = Date.parse(text(prev?.synced_at) || text(prev?.updated_at) || text(prev?.created_at) || "1970-01-01");
    if (!prev || currentTime >= prevTime) byCode.set(meta.code, enrichWithMeta(module, r, meta.code, r)!);
  }
  return Array.from(byCode.values());
}
