import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabase-admin";
import { buildPointEauDashboard, cleanRowsForPublic, counts as pointCounts, readPointEauRows } from "@/services/points-eau/analytics";

export type ChartItem = { label: string; value: number };
export type InstitutionalDashboardData = {
  source: string;
  generated_at: string;
  stats: Record<string, any>;
  modules: Record<string, any>;
  charts: Record<string, ChartItem[]>;
  alertes: any[];
  synchronisations: any[];
  dernieres_observations: any[];
  recommandations: string[];
};

function text(v: any) { return String(v ?? "").trim(); }
function num(v: any) { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : null; }
function dateText(v: any) { return text(v).slice(0, 10); }
function countBy(rows: any[], key: string | ((r: any) => string)): ChartItem[] {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const k = typeof key === "function" ? key(r) : text(r[key]);
    const label = k || "Non renseigné";
    m.set(label, (m.get(label) || 0) + 1);
  });
  return Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}
function pct(n: number, d: number) { return d ? Math.round((n / d) * 100) : 0; }
function latestDate(rows: any[], key = "date_observation") {
  const values = rows.map((r) => dateText(r[key])).filter(Boolean).sort();
  return values[values.length - 1] || null;
}
function avg(rows: any[], key = "valeur_observee") {
  const xs = rows.map((r) => num(r[key])).filter((x): x is number => x !== null);
  if (!xs.length) return null;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;
}
function isHydroAlert(r: any) {
  return Boolean(r.alerte_valeur || r.alerte_crue || r.alerte_secheresse || r.alerte_gps || r.alerte_donnee || text(r.niveau_alerte).toLowerCase().includes("élev"));
}

async function readView(view: string, fallbackTable: string) {
  if (!hasSupabaseAdminEnv()) return { rows: [] as any[], source: "Mode local" };
  try {
    let { data, error } = await supabaseAdmin.from(view).select("*").limit(20000);
    if ((!data || !data.length) || error) {
      const res = await supabaseAdmin.from(fallbackTable).select("*").limit(20000);
      data = res.data || [];
      error = res.error;
    }
    return { rows: (data || []) as any[], source: error ? `Supabase (${error.message})` : "Supabase" };
  } catch (e: any) {
    return { rows: [] as any[], source: `Supabase (${e.message || "erreur"})` };
  }
}

async function readSyncLogs() {
  if (!hasSupabaseAdminEnv()) return [] as any[];
  try {
    const { data } = await supabaseAdmin.from("sync_log").select("*").order("date_sync", { ascending: false }).limit(20);
    return data || [];
  } catch { return []; }
}

async function readAlerts() {
  if (!hasSupabaseAdminEnv()) return [] as any[];
  try {
    const { data } = await supabaseAdmin.from("alertes").select("*").order("created_at", { ascending: false }).limit(50);
    return data || [];
  } catch { return []; }
}

function moduleSummary(module: string, label: string, rows: any[], stationKey: (r: any) => string) {
  const stations = new Set(rows.map(stationKey).filter(Boolean));
  const alerts = rows.filter(isHydroAlert);
  const gpsMissing = new Set(rows.filter((r) => r.alerte_gps || r.latitude === null || r.longitude === null).map(stationKey).filter(Boolean));
  return {
    module,
    label,
    observations: rows.length,
    sites: stations.size,
    moyenne: avg(rows),
    alertes: alerts.length,
    taux_alerte: pct(alerts.length, rows.length),
    sans_gps: gpsMissing.size,
    derniere_observation: latestDate(rows),
    communes: countBy(rows, "commune"),
    alertes_par_niveau: countBy(rows.filter(isHydroAlert), (r) => text(r.niveau_alerte) || "Alerte"),
    evolution: countBy(rows, (r) => dateText(r.date_observation) || "Non daté").sort((a, b) => a.label.localeCompare(b.label)).slice(-24),
  };
}

function buildSyntheticRecommendations(data: InstitutionalDashboardData) {
  const r: string[] = [];
  const pe = data.modules.points_eau?.stats || {};
  if (Number(pe.non_fonctionnels || 0) > 0) r.push(`Prioriser la réhabilitation des ${pe.non_fonctionnels} point(s) d’eau non fonctionnel(s), en commençant par les priorités élevées.`);
  if (Number(pe.sans_gps || 0) > 0) r.push(`Corriger les coordonnées GPS manquantes pour ${pe.sans_gps} point(s) d’eau afin d’améliorer la cartographie.`);
  const totalAlerts = Number(data.stats.alertes_total || 0);
  if (totalAlerts > 0) r.push(`Analyser les ${totalAlerts} alerte(s) actives ou potentielles issues des modules hydrologiques et points d’eau.`);
  if (!data.synchronisations.length) r.push("Lancer une synchronisation Epicollect5 complète pour consolider les données avant reporting institutionnel.");
  if (!r.length) r.push("Les indicateurs disponibles ne signalent pas d’anomalie majeure ; poursuivre la collecte régulière et les contrôles qualité.");
  return r;
}

export async function buildInstitutionalDashboard(): Promise<InstitutionalDashboardData> {
  const { rows: pointRows, source: peSource } = await readPointEauRows();
  const cleanPointRows = cleanRowsForPublic(pointRows);
  const peDashboard = buildPointEauDashboard(cleanPointRows);

  const [pluvio, piezo, limni, syncLogs, dbAlerts] = await Promise.all([
    readView("v_pluviometrie_dashboard", "observations_pluvio"),
    readView("v_piezometrie_dashboard", "observations_piezo"),
    readView("v_limnimetrie_dashboard", "observations_limni"),
    readSyncLogs(),
    readAlerts(),
  ]);

  const pluvioSummary = moduleSummary("pluviometrie", "Pluviométrie", pluvio.rows, (r) => text(r.code_site || r.code_station || r.station_id));
  const piezoSummary = moduleSummary("piezometrie", "Piézométrie", piezo.rows, (r) => text(r.code_site || r.code_piezo || r.piezometre_id));
  const limniSummary = moduleSummary("limnimetrie", "Limnimétrie", limni.rows, (r) => text(r.code_site || r.code_station || r.station_id));

  const hydrologicalAlerts = [...pluvio.rows, ...piezo.rows, ...limni.rows]
    .filter(isHydroAlert)
    .map((r) => ({
      module: r.module || (r.pluie_24h_mm !== undefined ? "pluviometrie" : r.niveau_statique !== undefined ? "piezometrie" : "limnimetrie"),
      niveau: text(r.niveau_alerte) || "Alerte",
      commune: text(r.commune),
      site: text(r.code_site || r.nom_site),
      date: dateText(r.date_observation),
      message: text(r.statut_qualite || r.commentaire || "Alerte à vérifier"),
    }));
  const pointAlerts = cleanPointRows
    .filter((r: any) => r.priorite_rehabilitation === "Élevée" || r.alerte_qualite_eau || r.alerte_gps)
    .slice(0, 80)
    .map((r: any) => ({ module: "points_eau", niveau: r.priorite_rehabilitation || "Alerte", commune: r.commune, site: r.code_pe || r.village, date: r.date_collecte, message: r.besoin_rehabilitation || r.problemes || "Contrôle qualité / réhabilitation" }));

  const dernieres = [
    ...pluvio.rows.map((r) => ({ module: "Pluviométrie", date: dateText(r.date_observation), site: text(r.code_site || r.nom_site), commune: text(r.commune), valeur: r.pluie_24h_mm ?? r.valeur_observee, unite: "mm" })),
    ...piezo.rows.map((r) => ({ module: "Piézométrie", date: dateText(r.date_observation), site: text(r.code_site || r.nom_site), commune: text(r.commune), valeur: r.niveau_statique ?? r.valeur_observee, unite: "m" })),
    ...limni.rows.map((r) => ({ module: "Limnimétrie", date: dateText(r.date_observation), site: text(r.code_site || r.nom_site), commune: text(r.commune), valeur: r.hauteur_eau ?? r.valeur_observee, unite: "m/cm" })),
  ].filter((r) => r.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  const alertes = [...pointAlerts, ...hydrologicalAlerts, ...dbAlerts.map((a) => ({ module: a.module, niveau: a.niveau, date: dateText(a.created_at), message: a.message, statut: a.statut }))]
    .slice(0, 120);

  const modules = {
    points_eau: { label: "Points d’eau", ...peDashboard },
    pluviometrie: pluvioSummary,
    piezometrie: piezoSummary,
    limnimetrie: limniSummary,
  };

  const stats = {
    points_eau: peDashboard.stats.total,
    forages: peDashboard.stats.forages,
    puits: peDashboard.stats.puits,
    points_non_fonctionnels: peDashboard.stats.non_fonctionnels,
    points_a_rehabiliter: peDashboard.stats.a_rehabiliter,
    points_sans_gps: peDashboard.stats.sans_gps,
    stations_pluvio: pluvioSummary.sites,
    observations_pluvio: pluvioSummary.observations,
    piezometres: piezoSummary.sites,
    observations_piezo: piezoSummary.observations,
    stations_limni: limniSummary.sites,
    observations_limni: limniSummary.observations,
    observations_total: pluvioSummary.observations + piezoSummary.observations + limniSummary.observations,
    alertes_total: alertes.length,
    communes_couvertes: new Set([...cleanPointRows.map((r: any) => r.commune), ...pluvio.rows.map((r) => r.commune), ...piezo.rows.map((r) => r.commune), ...limni.rows.map((r) => r.commune)].filter(Boolean)).size,
    derniere_observation: [pluvioSummary.derniere_observation, piezoSummary.derniere_observation, limniSummary.derniere_observation].filter(Boolean).sort().pop() || null,
    derniere_sync: syncLogs[0]?.date_sync || null,
  };

  const charts = {
    modules: [
      { label: "Points d’eau", value: Number(stats.points_eau || 0) },
      { label: "Obs. pluie", value: Number(stats.observations_pluvio || 0) },
      { label: "Obs. piézo", value: Number(stats.observations_piezo || 0) },
      { label: "Obs. limni", value: Number(stats.observations_limni || 0) },
    ],
    alertes_par_module: countBy(alertes, "module"),
    communes_points_eau: pointCounts(cleanPointRows, "commune").slice(0, 12),
    fonctionnalite_points_eau: peDashboard.charts.fonctionnalite,
    synchronisations: countBy(syncLogs, "module"),
    couverture_territoriale: [
      { label: "Communes", value: Number(stats.communes_couvertes || 0) },
      { label: "Villages PE", value: Number(peDashboard.stats.villages || 0) },
      { label: "Sites pluie", value: pluvioSummary.sites },
      { label: "Piézomètres", value: piezoSummary.sites },
      { label: "Stations limni", value: limniSummary.sites },
    ],
  };

  const data: InstitutionalDashboardData = {
    source: [peSource, pluvio.source, piezo.source, limni.source].filter(Boolean).join(" | "),
    generated_at: new Date().toISOString(),
    stats,
    modules,
    charts,
    alertes,
    synchronisations: syncLogs,
    dernieres_observations: dernieres,
    recommandations: [],
  };
  data.recommandations = buildSyntheticRecommendations(data);
  return data;
}

export function flattenInstitutionalExport(data: InstitutionalDashboardData) {
  return [
    ...Object.entries(data.stats).map(([indicateur, valeur]) => ({ section: "KPI global", indicateur, valeur })),
    ...Object.entries(data.modules).flatMap(([module, v]: any) => [
      { section: "Module", module, indicateur: "observations", valeur: v.observations ?? v.stats?.total ?? 0 },
      { section: "Module", module, indicateur: "sites", valeur: v.sites ?? v.stats?.communes ?? 0 },
      { section: "Module", module, indicateur: "alertes", valeur: v.alertes ?? v.stats?.alertes_qualite ?? 0 },
    ]),
    ...data.alertes.slice(0, 200).map((a) => ({ section: "Alertes", module: a.module, niveau: a.niveau, commune: a.commune, site: a.site, date: a.date, message: a.message })),
    ...data.synchronisations.map((s) => ({ section: "Synchronisations", module: s.module, source: s.source, statut: s.statut, nb_enregistrements: s.nb_enregistrements, date_sync: s.date_sync, message: s.message })),
  ];
}
