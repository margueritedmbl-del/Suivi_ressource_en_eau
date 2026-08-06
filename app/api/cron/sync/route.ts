export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { syncAll } from "@/services/epicollect/jobs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.SYNC_SECRET;
  const auth = req.headers.get("authorization") || "";
  const querySecret = req.nextUrl.searchParams.get("secret") || "";
  const headerSecret = req.headers.get("x-cron-secret") || "";

  if (secret && auth !== `Bearer ${secret}` && querySecret !== secret && headerSecret !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAll();
  return NextResponse.json({ ok: true, triggered: "sync/all", results });
}
