import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";

export async function authorizeSync(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || process.env.SYNC_SECRET;
  const providedSecret = req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret") || req.headers.get("x-sync-secret");
  if (cronSecret && providedSecret === cronSecret) return { ok: true as const, mode: "secret" as const };

  const auth = await requireApiRole(req, [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_DNH]);
  if (auth.response) return { ok: false as const, response: auth.response };
  return { ok: true as const, mode: "user" as const, ctx: auth.ctx };
}

export function syncError(error: any, status = 500) {
  return NextResponse.json({ ok: false, error: error.message || "Erreur de synchronisation" }, { status });
}
