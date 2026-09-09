export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { authorizeSync } from "@/app/api/sync/_auth";
import { syncAll } from "@/services/epicollect/jobs";
export async function GET(req: NextRequest) {
  const auth = await authorizeSync(req);
  if (!auth.ok) return auth.response;
  const results = await syncAll({ full: false });
  return NextResponse.json({ ok:true, triggered:"sync/all", mode:auth.mode, results });
}
