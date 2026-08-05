export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import pointsEauInventaire from "@/public/data/points-eau-inventaire.json";
import { supabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

const allowed = new Set(["pluviometrie", "piezometrie", "limnimetrie", "points_eau"]);
const moduleColors: Record<string, string> = { points_eau: "#0077B6", piezometrie: "#48CAE4", pluviometrie: "#7C3AED", limnimetrie: "#16A34A" };
const fallback = [
  { module: "pluviometrie", code: "PLV-001", libelle: "Station pluviométrique", latitude: 12.86, longitude: -7.56 },
  { module: "piezometrie", code: "PZ-001", libelle: "Piézomètre", latitude: 12.88, longitude: -7.50 },
  { module: "limnimetrie", code: "LIM-001", libelle: "Station limnimétrique", latitude: 12.80, longitude: -7.62 },
];
function text(v: any) { return String(v ?? "").trim(); }
function esc(v: any) { return text(v).replace(/[<>&"]/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;","\"":"&quot;"}[c] as string)); }
function num(v: any) { const raw = String(v ?? "").trim(); if (!raw) return null; const n = Number(raw.replace(",", ".")); return Number.isFinite(n) ? n : null; }
function lower(v: any) { return text(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function valid(r: any) { return r && r.latitude !== null && r.longitude !== null && Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude)); }
function colorPoint(r: any, theme: string) {
  const value = lower(theme === "type" ? r.type_infrastructure : theme === "rehabilitation" ? r.priorite_rehabilitation : theme === "equipement" ? r.equipement : theme === "organe" ? r.organe_gestion : theme === "qualite" ? (r.alerte_qualite_eau ? "alerte" : "normal") : theme === "donnees" ? (r.alerte_gps ? "gps" : "ok") : r.statut_fonctionnalite);
  if (theme === "type") return value.includes("forage") ? "#0077B6" : value.includes("puits") ? "#B45309" : "#64748b";
  if (theme === "rehabilitation") return value.includes("elevee") ? "#dc2626" : value.includes("moyenne") ? "#f97316" : value.includes("faible") ? "#eab308" : "#64748b";
  if (theme === "equipement") return value.includes("pmh") ? "#2563eb" : value.includes("shv") || value.includes("shp") ? "#7c3aed" : value.includes("saep") || value.includes("saes") ? "#0891b2" : value.includes("non") ? "#991b1b" : "#64748b";
  if (theme === "organe") return value === "oui" ? "#16a34a" : value === "non" ? "#dc2626" : "#64748b";
  if (theme === "qualite") return value.includes("alerte") ? "#be123c" : "#16a34a";
  if (theme === "donnees") return value.includes("gps") ? "#f97316" : "#16a34a";
  if (value.includes("non fonctionnel")) return "#dc2626";
  if (value.includes("abandon")) return "#111827";
  if (value.includes("partiel")) return "#f97316";
  if (value.includes("fonctionnel")) return "#16a34a";
  return "#64748b";
}
function normalizePe(r: any) {
  const ph = num(r.ph ?? r["40_pH_"]);
  const temp = num(r.temperature_c ?? r["39_Temprature_C"]);
  const lat = num(r.latitude ?? r["lat_10_Coordonnes_infras"]);
  const lon = num(r.longitude ?? r["long_10_Coordonnes_infras"]);
  const statut = text(r.statut_fonctionnalite ?? r.fonctionnalite_forage ?? r["24_Fonctionnalit_for"] ?? r.etat) || "Non renseigné";
  const probleme = text(r.problemes ?? r["48_Problmes_ou_dysfo"]);
  const besoin = text(r.besoin_rehabilitation ?? r["49_Besoin_en_rhabili"]);
  let score = 0;
  if (lower(statut).includes("non fonctionnel") || lower(statut).includes("abandon")) score += 5;
  if (lower(statut).includes("partiel")) score += 3;
  if (besoin) score += 3;
  if (probleme && !["ras", "aucun"].includes(lower(probleme))) score += 2;
  if (ph !== null && (ph < 6.5 || ph > 8.5)) score += 2;
  if (temp !== null && temp > 50) score += 2;
  if (lat === null || lon === null) score += 1;
  const priorite = score >= 8 ? "Élevée" : score >= 4 ? "Moyenne" : "Faible";
  return {
    module: "points_eau",
    code: text(r.code_pe ?? r.title ?? r.ec5_uuid),
    libelle: text(r.localite ?? r["8_Localit_hameauQuar"] ?? r.village ?? r["7_Village"]),
    latitude: lat,
    longitude: lon,
    commune: text(r.commune ?? r["6_Commune"]),
    village: text(r.village ?? r["7_Village"]),
    type_infrastructure: text(r.type_infrastructure ?? r["13_Type"] ?? r.type_ouvrage),
    statut_fonctionnalite: statut,
    equipement: text(r.equipement ?? r.equipement_forage ?? r["25_Equipement"] ?? r["17_Equipement"]),
    organe_gestion: text(r.organe_gestion ?? r["29_Organe_de_Gestion"]),
    priorite_rehabilitation: text(r.priorite_rehabilitation) || priorite,
    ph,
    conductivite: num(r.conductivite ?? r["41_Conductivit_lectr"]),
    tds: num(r.tds ?? r["43_TDS_"]),
    presence_odeur: text(r.presence_odeur ?? r["44_Prsence_dodeur"]),
    recommandation: text(r.recommandation ?? r["53_Recommandation_pa"]),
    alerte_gps: lat === null || lon === null,
    alerte_qualite_eau: (ph !== null && (ph < 6.5 || ph > 8.5)) || (temp !== null && temp > 50) || lower(r.presence_odeur ?? r["44_Prsence_dodeur"]).includes("oui"),
  };
}
function normalizeGeneric(r: any) {
  return {
    module: text(r.module),
    code: text(r.code || r.code_site || r.code_station || r.code_piezo),
    libelle: text(r.libelle || r.nom_station || r.cours_eau || r.commune || r.village),
    latitude: num(r.latitude),
    longitude: num(r.longitude),
    couleur: moduleColors[text(r.module)],
  };
}
async function localPeRows() { return (pointsEauInventaire as any[]).map(normalizePe); }
async function supabaseRows() {
  if (!hasSupabaseAdminEnv()) return [];
  const { data: view } = await supabaseAdmin.from("v_carte_points").select("*").limit(20000);
  if (view?.length) return view.map((r: any) => r.module === "points_eau" ? normalizePe(r) : normalizeGeneric(r));
  return [];
}
async function supabasePeRows() {
  if (!hasSupabaseAdminEnv()) return [];
  const { data } = await supabaseAdmin.from("v_points_eau_dashboard").select("*").limit(20000);
  return (data || []).map(normalizePe);
}
function publicPopup(r: any) {
  if (r.module === "points_eau") return `<strong>Point d’eau</strong><br/>Commune : ${esc(r.commune || "--")}<br/>Village/localité : ${esc(r.village || r.libelle || "--")}<br/>Type d’ouvrage : ${esc(r.type_infrastructure || "--")}`;
  const label = r.module === "piezometrie" ? "Piézomètre" : r.module === "pluviometrie" ? "Pluviomètre" : r.module === "limnimetrie" ? "Limnimètre" : r.module;
  return `<strong>${esc(label)}</strong><br/>Emplacement : ${esc(r.libelle || r.code || "--")}`;
}
function connectedPePopup(r: any) {
  return `<strong>Point d’eau</strong><br/><b>${esc(r.code || "")}</b><br/>Commune : ${esc(r.commune || "--")}<br/>Village : ${esc(r.village || "--")}<br/>Type : ${esc(r.type_infrastructure || "--")}<br/>Fonctionnalité : ${esc(r.statut_fonctionnalite || "--")}<br/>Équipement : ${esc(r.equipement || "--")}<br/>Organe : ${esc(r.organe_gestion || "--")}<br/>Priorité : ${esc(r.priorite_rehabilitation || "--")}<br/>pH : ${esc(r.ph ?? "--")}<br/>Conductivité : ${esc(r.conductivite ?? "--")}<br/>TDS : ${esc(r.tds ?? "--")}<br/>Recommandation : ${esc(r.recommandation || "--")}`;
}

export async function GET(req: NextRequest) {
  const theme = req.nextUrl.searchParams.get("theme") || "fonctionnalite";
  const requestedDetail = req.nextUrl.searchParams.get("detail") || "public";
  const ctx = requestedDetail === "connected" ? await getAuthContext(req) : null;
  const detail = ctx ? "connected" : "public";
  const modulesParam = req.nextUrl.searchParams.get("modules") || req.nextUrl.searchParams.get("module") || "points_eau";
  const modules = modulesParam === "none" ? [] : modulesParam.split(",").map((m) => m.trim()).filter((m) => allowed.has(m));

  let rows: any[] = (await supabaseRows()).filter(valid);
  let source = rows.length ? "Supabase" : "CSV local V2_3";
  const needPe = modules.includes("points_eau") || !modules.length;
  if (needPe) {
    let pe = rows.filter((r) => r.module === "points_eau");
    if (!pe.length) pe = (await supabasePeRows()).filter(valid);
    if (!pe.length) pe = (await localPeRows()).filter(valid);
    rows = [...rows.filter((r) => r.module !== "points_eau"), ...pe];
    if (source !== "Supabase") source = "CSV local V2_3";
  }
  if (!rows.length) rows = fallback;

  const summary = rows.reduce((acc: Record<string, number>, r: any) => { acc[r.module] = (acc[r.module] || 0) + 1; return acc; }, {});
  const data = rows
    .filter((p: any) => !modules.length || modules.includes(p.module))
    .map((r: any) => ({ ...r, couleur: r.module === "points_eau" ? colorPoint(r, theme) : (moduleColors[r.module] || r.couleur), popup_html: detail === "connected" && r.module === "points_eau" ? connectedPePopup(r) : publicPopup(r) }));

  return NextResponse.json({ ok: true, data, summary, source: rows === fallback ? "fallback" : source, theme });
}
