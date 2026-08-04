export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import resume from "@/public/data/referentiels/referentiel_resume.json";
import forages from "@/public/data/referentiels/forages_exploitation_crr_pm.json";
import piezometres from "@/public/data/referentiels/piezometres_reference.json";
import analyses from "@/public/data/referentiels/analyses_eau_piezometres_manifest.json";

export async function GET() {
  return NextResponse.json(
    { ok: true, resume, forages, piezometres, analyses },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
