import {requireApiRole} from "@/lib/auth-server";
import {ROLE_ADMIN,ROLE_SUPER_ADMIN} from "@/lib/permissions";
import {NextRequest} from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import resume from "../../../../public/data/referentiels/referentiel_resume.json";
import forages from "../../../../public/data/referentiels/forages_exploitation_crr_pm.json";
import piezometres from "../../../../public/data/referentiels/piezometres_reference.json";
import analyses from "../../../../public/data/referentiels/analyses_eau_piezometres_manifest.json";

import infrastructuresAGR from "../../../../public/data/referentiels/infrastructures_agr_2026.json";

export async function GET(req:NextRequest) {
 const guard=await requireApiRole(req,[ROLE_ADMIN,ROLE_SUPER_ADMIN]);if(guard.response)return guard.response;
  return NextResponse.json(
    { ok: true, resume, forages, piezometres, analyses, infrastructuresAGR },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
