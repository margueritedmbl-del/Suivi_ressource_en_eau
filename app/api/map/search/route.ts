export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { GET as pointsGet } from "../points/route";

function norm(v: any) { return String(v ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

export async function GET(req: NextRequest) {
  const q = norm(req.nextUrl.searchParams.get("q"));
  const url = new URL(req.url);
  url.pathname = url.pathname.replace(/\/api\/map\/search$/, "/api/map/points");
  url.searchParams.set("modules", req.nextUrl.searchParams.get("modules") || "points_eau,piezometrie,pluviometrie,limnimetrie");
  url.searchParams.set("detail", "public");
  const res = await pointsGet(new NextRequest(url, req));
  const json = await res.json();
  const data = q ? (json.data || []).filter((p: any) => [p.code, p.libelle, p.commune, p.village, p.type_infrastructure, p.module].some((v) => norm(v).includes(q))) : (json.data || []);
  return NextResponse.json({ ok: true, data: data.slice(0, 100), count: data.length, source: json.source });
}
