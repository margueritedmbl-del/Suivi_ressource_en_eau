export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { supabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase-admin";

async function count(table: string) {
  if (!hasSupabaseAdminEnv()) return 0;
  try {
    const { count } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
    return count || 0;
  } catch {
    return 0;
  }
}

async function avg(table: string, field: string) {
  if (!hasSupabaseAdminEnv()) return null;
  try {
    const { data } = await supabaseAdmin.from(table).select(field).limit(5000);
    const vals = (data || []).map((r: any) => Number(r[field])).filter((n: number) => Number.isFinite(n));
    return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const data = {
    pluviometrie: { stations: await count("stations_pluvio"), observations: await count("observations_pluvio"), pluie_moyenne: await avg("observations_pluvio", "pluie_24h_mm") },
    piezometrie: { stations: await count("piezometres"), observations: await count("observations_piezo"), niveau_moyen: await avg("observations_piezo", "niveau_statique") },
    limnimetrie: { stations: await count("stations_limni"), observations: await count("observations_limni"), hauteur_moyenne: await avg("observations_limni", "hauteur_eau") },
    points_eau: { total: await count("points_eau") }
  };

  return NextResponse.json({ ok: true, data });
}
