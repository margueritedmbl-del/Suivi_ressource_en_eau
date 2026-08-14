export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { GET as pointsGet } from "../points/route";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.searchParams.set("modules", url.searchParams.get("modules") || "points_eau,piezometrie,pluviometrie,limnimetrie");
  url.searchParams.set("detail", "public");
  const res = await pointsGet(new NextRequest(url, req));
  const json = await res.json();
  const gps = (json.data || []).filter((p: any) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))).length;
  return NextResponse.json({ ok: true, summary: json.summary || {}, gps, total: (json.data || []).length, source: json.source });
}
