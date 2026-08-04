export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function readJson(name: string) {
  const file = path.join(process.cwd(), "public", "data", "referentiels", name);
  return JSON.parse(await readFile(file, "utf8"));
}

export async function GET() {
  try {
    const [resume, forages, piezometres, analyses] = await Promise.all([
      readJson("referentiel_resume.json"),
      readJson("forages_exploitation_crr_pm.json"),
      readJson("piezometres_reference.json"),
      readJson("analyses_eau_piezometres_manifest.json"),
    ]);
    return NextResponse.json({ ok: true, resume, forages, piezometres, analyses });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Référentiel indisponible" }, { status: 500 });
  }
}
