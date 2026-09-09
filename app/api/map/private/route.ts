export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { GET as pointsGet } from "../points/route";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_COLLECTEUR, ROLE_DNH, ROLE_OBSERVATEUR, ROLE_SUPER_ADMIN } from "@/lib/permissions";

const ROLES_INTERNAL = [ROLE_OBSERVATEUR, ROLE_COLLECTEUR, ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN];

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req, ROLES_INTERNAL);
  if (guard.response) return guard.response;
  const url = new URL(req.url);
  if (!url.searchParams.has("modules")) url.searchParams.set("modules", "points_eau,piezometrie,pluviometrie,limnimetrie");
  url.searchParams.set("detail", "connected");
  return pointsGet(new NextRequest(url, req));
}
