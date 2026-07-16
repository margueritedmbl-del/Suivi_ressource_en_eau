export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { authorizeSync, syncError } from "@/app/api/sync/_auth";
import { syncModule } from "@/services/epicollect/jobs";

async function handler(req: NextRequest) {
  const auth = await authorizeSync(req);
  if (!auth.ok) return auth.response;
  try { return NextResponse.json({ ok: true, mode: auth.mode, results: await syncModule("limnimetrie") }); }
  catch (error: any) { return syncError(error); }
}
export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
