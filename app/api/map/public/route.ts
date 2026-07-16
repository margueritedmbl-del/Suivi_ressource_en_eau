export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { GET as pointsGet } from "../points/route";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (!url.searchParams.has("modules")) url.searchParams.set("modules", "points_eau");
  url.searchParams.set("detail", "public");
  return pointsGet(new NextRequest(url, req));
}
