export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_DNH, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { FALLBACK_SOURCES } from "@/services/epicollect/sources";

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_DNH]);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("epicollect_sources")
    .select("*")
    .order("module")
    .order("type_source");
  if (error || !data?.length) return NextResponse.json({ ok: true, data: FALLBACK_SOURCES, source: "fallback" });
  return NextResponse.json({ ok: true, data, source: "supabase" });
}
