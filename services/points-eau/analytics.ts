import pointsEauInventaire from "@/public/data/points-eau-inventaire.json";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabase-admin";

export type PointEauRow = Record<string, any>;

const PRIVATE_FIELDS = new Set([
  "nom_repondant",
  "contact_repondant",
  "51_Nom_et_Prenom",
  "52_Contact_tlphoniqu",
  "telephone",
  "phone",
  "email",
  "nom_enqueteur",
]);

export const POINTS_EAU_FILTERS = [
  "commune",
  "village",
  "type_infrastructure",
  "statut_fonctionnalite",
  "equipement",
  "organe_gestion",
  "priorite_rehabilitation",
];

export function asText(v: any) {
  return String(v ?? "").trim();
}

export function asNumber(v: any) {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function normalizedLower(v: any) {
  return asText(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function pick(row: PointEauRow, ...keys: string[]) {
  for (const k of keys) if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
  return null;
}

function problemSignaled(value: string) {
  const v = normalizedLower(value);
  return Boolean(v && !["ras", "aucun", "aucune", "neant", "néant", "non", "rien"].includes(v));
}

export function normalizePointEau(row: PointEauRow): PointEauRow {
  const type = asText(pick(row, "type_infrastructure", "13_Type", "type_ouvrage")) || "Non renseigné";
  const fonctionnalite = asText(pick(row, "statut_fonctionnalite", "fonctionnalite_forage", "24_Fonctionnalit_for", "etat")) || "Non renseigné";
  const organe = asText(pick(row, "organe_gestion", "29_Organe_de_Gestion")) || "Non renseigné";
  const foncOrgane = asText(pick(row, "fonctionnalite_organe", "31_Fonctionnalit_de_")) || "Non renseigné";
  const besoin = asText(pick(row, "besoin_rehabilitation", "49_Besoin_en_rhabili"));
  const probleme = asText(pick(row, "problemes", "48_Problmes_ou_dysfo"));
  const ph = asNumber(pick(row, "ph", "40_pH_"));
  const temperature = asNumber(pick(row, "temperature_c", "39_Temprature_C"));
  const conductivite = asNumber(pick(row, "conductivite", "41_Conductivit_lectr"));
  const tds = asNumber(pick(row, "tds", "43_TDS_"));
  const turbidite = asNumber(pick(row, "turbidite_ntu", "42_Turbidit_NTU"));
  const latitude = asNumber(pick(row, "latitude", "lat_10_Coordonnes_infras"));
  const longitude = asNumber(pick(row, "longitude", "long_10_Coordonnes_infras"));
  const equipement = asText(pick(row, "equipement", "equipement_forage", "25_Equipement", "17_Equipement")) || "Non renseigné";
  const odeur = asText(pick(row, "presence_odeur", "44_Prsence_dodeur")) || "Non renseigné";
  const hasProblem = problemSignaled(probleme);

  let score = 0;
  if (normalizedLower(fonctionnalite).includes("non fonctionnel")) score += 5;
  if (normalizedLower(fonctionnalite).includes("abandon")) score += 5;
  if (normalizedLower(fonctionnalite).includes("partiel")) score += 3;
  if (normalizedLower(foncOrgane).includes("non fonctionnel")) score += 3;
  if (normalizedLower(organe) === "non") score += 2;
  if (besoin) score += 3;
  if (hasProblem) score += 2;
  if (ph !== null && (ph < 6.5 || ph > 8.5)) score += 2;
  if (temperature !== null && temperature > 50) score += 2;
  if (latitude === null || longitude === null) score += 1;

  const priorite = score >= 8 ? "Élevée" : score >= 4 ? "Moyenne" : "Faible";

  return {
    id: asText(pick(row, "id", "ec5_uuid", "source_entry_id")),
    source_entry_id: asText(pick(row, "source_entry_id", "ec5_uuid", "id")),
    code_pe: asText(pick(row, "code_pe", "title", "ec5_uuid", "source_entry_id")),
    date_collecte: asText(pick(row, "date_collecte", "3_Date", "created_at")),
    commune: asText(pick(row, "commune", "6_Commune")) || "Non renseigné",
    village: asText(pick(row, "village", "7_Village")) || "Non renseigné",
    localite: asText(pick(row, "localite", "8_Localit_hameauQuar")),
    latitude,
    longitude,
    precision_gps: asNumber(pick(row, "precision_gps", "accuracy_10_Coordonnes_infras")),
    photo_infrastructure: asText(pick(row, "photo_infrastructure", "11_Photo_Infrastruct")),
    photo_emprise: asText(pick(row, "photo_emprise", "12_Photo_Emprise_Inf")),
    type_infrastructure: type,
    fonctionnalite_forage: fonctionnalite,
    statut_fonctionnalite: fonctionnalite,
    equipement,
    organe_gestion: organe,
    type_organe: asText(pick(row, "type_organe", "30_Type_dorgane")),
    fonctionnalite_organe: foncOrgane,
    niveau_eau: asNumber(pick(row, "niveau_eau", "35_Niveau_de_leau__N")),
    profondeur_ouvrage: asNumber(pick(row, "profondeur_ouvrage", "36_Profondeur_ouvrag", "profondeur")),
    temperature_c: temperature,
    ph,
    conductivite,
    turbidite_ntu: turbidite,
    tds,
    presence_odeur: odeur,
    etat_apparent: asText(pick(row, "etat_apparent", "47_tat_apparent_de_l")),
    problemes: probleme,
    besoin_rehabilitation: besoin,
    recommandation: asText(pick(row, "recommandation", "53_Recommandation_pa")),
    score_priorite: score,
    priorite_rehabilitation: priorite,
    alerte_gps: latitude === null || longitude === null,
    alerte_temperature: temperature !== null && temperature > 50,
    alerte_ph: ph !== null && (ph < 6.5 || ph > 8.5),
    alerte_odeur: normalizedLower(odeur).includes("oui"),
    alerte_photo: !asText(pick(row, "photo_infrastructure", "11_Photo_Infrastruct")),
    alerte_qualite_eau: (ph !== null && (ph < 6.5 || ph > 8.5)) || (temperature !== null && temperature > 50) || normalizedLower(odeur).includes("oui"),
  };
}

export function sanitizePointEau(row: PointEauRow) {
  return Object.fromEntries(Object.entries(row).filter(([k]) => !PRIVATE_FIELDS.has(k)));
}

export function applyPointEauFilters(rows: PointEauRow[], filters: URLSearchParams | Record<string, string>) {
  const get = (k: string) => filters instanceof URLSearchParams ? filters.get(k) : filters[k];
  return POINTS_EAU_FILTERS.reduce((acc, f) => {
    const v = get(f);
    if (!v || v === "all") return acc;
    return acc.filter((r) => asText(r[f]) === v);
  }, rows);
}

export function counts(rows: PointEauRow[], key: string) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const label = asText(r[key]) || "Non renseigné";
    map.set(label, (map.get(label) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function avg(rows: PointEauRow[], key: string) {
  const nums = rows.map((r) => asNumber(r[key])).filter((n): n is number => n !== null);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

export function buildPointEauDashboard(rows: PointEauRow[]) {
  const total = rows.length;
  const nonRenseigne = rows.filter((r) => normalizedLower(r.statut_fonctionnalite).includes("non renseigne")).length;
  const fonctionnels = rows.filter((r) => normalizedLower(r.statut_fonctionnalite).includes("fonctionnel") && !normalizedLower(r.statut_fonctionnalite).includes("non")).length;
  const nonFonctionnels = rows.filter((r) => normalizedLower(r.statut_fonctionnalite).includes("non fonctionnel")).length;
  const aRehabiliter = rows.filter((r) => r.besoin_rehabilitation || r.priorite_rehabilitation === "Élevée").length;
  const sansGps = rows.filter((r) => r.alerte_gps).length;
  const alertesQualite = rows.filter((r) => r.alerte_qualite_eau).length;
  const sansPhoto = rows.filter((r) => r.alerte_photo).length;
  const denom = Math.max(1, total - nonRenseigne);

  return {
    stats: {
      total,
      forages: rows.filter((r) => normalizedLower(r.type_infrastructure).includes("forage")).length,
      puits: rows.filter((r) => normalizedLower(r.type_infrastructure).includes("puits")).length,
      fonctionnels,
      non_fonctionnels: nonFonctionnels,
      taux_fonctionnalite: total ? Math.round((fonctionnels / denom) * 100) : 0,
      a_rehabiliter: aRehabiliter,
      sans_gps: sansGps,
      avec_gps: total - sansGps,
      sans_photo: sansPhoto,
      communes: new Set(rows.map((r) => r.commune)).size,
      villages: new Set(rows.map((r) => r.village)).size,
      alertes_qualite: alertesQualite,
      ph_moyen: avg(rows, "ph"),
      conductivite_moyenne: avg(rows, "conductivite"),
      tds_moyen: avg(rows, "tds"),
    },
    charts: {
      communes: counts(rows, "commune"),
      villages: counts(rows, "village"),
      fonctionnalite: counts(rows, "statut_fonctionnalite"),
      equipements: counts(rows, "equipement"),
      organes: counts(rows, "organe_gestion"),
      fonctionnalite_organe: counts(rows, "fonctionnalite_organe"),
      priorites: counts(rows, "priorite_rehabilitation"),
      odeur: counts(rows, "presence_odeur"),
      qualite_donnees: [
        { label: "Avec GPS", value: total - sansGps },
        { label: "Sans GPS", value: sansGps },
        { label: "Sans photo", value: sansPhoto },
        { label: "Alertes qualité eau", value: alertesQualite },
      ],
    },
    top_priorites: [...rows].sort((a, b) => Number(b.score_priorite || 0) - Number(a.score_priorite || 0)).slice(0, 20),
    controles: {
      gps_manquants: rows.filter((r) => r.alerte_gps).slice(0, 50),
      alertes_qualite: rows.filter((r) => r.alerte_qualite_eau).slice(0, 50),
      temperature_anormale: rows.filter((r) => r.alerte_temperature).slice(0, 50),
      ph_hors_plage: rows.filter((r) => r.alerte_ph).slice(0, 50),
      photos_manquantes: rows.filter((r) => r.alerte_photo).slice(0, 50),
    },
  };
}

export async function readPointEauRows() {
  if (hasSupabaseAdminEnv()) {
    try {
      const { data, error } = await supabaseAdmin.from("v_points_eau_dashboard").select("*").limit(20000);
      if (!error && data && data.length) return { rows: data.map(normalizePointEau), source: "Supabase v_points_eau_dashboard" };
    } catch {}
    try {
      const { data, error } = await supabaseAdmin.from("points_eau").select("*").limit(20000);
      if (!error && data && data.length) return { rows: data.map(normalizePointEau), source: "Supabase points_eau" };
    } catch {}
  }
  return { rows: (pointsEauInventaire as PointEauRow[]).map(normalizePointEau), source: "CSV local 540 PE" };
}

export async function pointEauFilterOptions() {
  const { rows } = await readPointEauRows();
  return {
    communes: counts(rows, "commune").map((x) => x.label),
    villages: counts(rows, "village").map((x) => x.label),
    types: counts(rows, "type_infrastructure").map((x) => x.label),
    fonctionnalites: counts(rows, "statut_fonctionnalite").map((x) => x.label),
    equipements: counts(rows, "equipement").map((x) => x.label),
    organes: counts(rows, "organe_gestion").map((x) => x.label),
    priorites: counts(rows, "priorite_rehabilitation").map((x) => x.label),
  };
}

export function cleanRowsForPublic(rows: PointEauRow[]) {
  return rows.map((r) => sanitizePointEau(r));
}
