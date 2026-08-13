export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_SUPER_ADMIN]);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("microbarrages")
    .select("code,cout_execute_fcfa,cout_rehabilitation_fcfa")
    .order("code");

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });
  const rows = (data || []).map((row:any) => ({
    code: row.code,
    cout_execute_fcfa: Number(row.cout_execute_fcfa ?? row.cout_rehabilitation_fcfa ?? 0),
  }));
  return NextResponse.json({ ok:true, rows }, { headers:{ "Cache-Control":"no-store, max-age=0" } });
}
