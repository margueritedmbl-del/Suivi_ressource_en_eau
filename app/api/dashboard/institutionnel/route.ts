export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { buildInstitutionalDashboard } from "@/services/dashboard/institutionnel";
import { cleanRowsForPublic, readPointEauRows } from "@/services/points-eau/analytics";

function dateText(v: any) { return String(v ?? "").trim().slice(0, 10); }

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;

  const data = await buildInstitutionalDashboard();

  // Les points d'eau constituent un inventaire d'ouvrages, et non une série
  // temporelle quotidienne : leurs alertes qualité/GPS doivent rester visibles
  // même lorsque leur date de collecte est antérieure au début de la période
  // opérationnelle des réseaux hydro (16/08/2026).
  try {
    const { rows } = await readPointEauRows();
    const pointRows = cleanRowsForPublic(rows);
    const existing = new Set((data.alertes || []).map((a: any) => `${a.module}|${a.site}|${a.date}|${a.message}`));
    const pointAlerts = pointRows
      .filter((r: any) => r.alerte_qualite_eau || r.alerte_gps || r.priorite_rehabilitation === "Élevée")
      .map((r: any) => ({
        module: "points_eau",
        niveau: r.priorite_rehabilitation || (r.alerte_qualite_eau ? "Alerte qualité" : "À vérifier"),
        commune: r.commune,
        site: r.code_pe || r.village,
        date: dateText(r.date_collecte),
        message: r.alerte_ph ? `pH hors plage : ${r.ph}` : r.alerte_temperature ? `Température à vérifier : ${r.temperature_c} °C` : r.alerte_odeur ? "Présence d’odeur signalée" : r.alerte_gps ? "Coordonnées GPS manquantes" : r.besoin_rehabilitation || r.problemes || "Contrôle qualité / réhabilitation",
      }));
    data.alertes = [...pointAlerts.filter((a: any) => !existing.has(`${a.module}|${a.site}|${a.date}|${a.message}`)), ...(data.alertes || [])].slice(0, 120);
  } catch {
    // Le dashboard principal reste disponible même si la consolidation détaillée échoue.
  }

  return NextResponse.json({ ok: true, data });
}
