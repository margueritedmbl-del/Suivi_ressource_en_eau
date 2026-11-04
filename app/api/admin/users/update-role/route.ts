import { checkManagedTarget, checkAssignableRole } from "@/lib/user-management-policy";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN]);
  if (auth.response) return auth.response;

  const { user_id, role_id, actif } = await req.json();
  if (!user_id) return NextResponse.json({ ok: false, error: "user_id requis." }, { status: 400 });

  const targetDenied=await checkManagedTarget(auth.ctx.role,"id",user_id);if(targetDenied)return targetDenied;
  if(role_id){const roleDenied=await checkAssignableRole(auth.ctx.role,role_id);if(roleDenied)return roleDenied;}
  const patch: any = { actif: actif !== false };
  if (role_id) patch.role_id = role_id;

  const { error } = await supabaseAdmin.from("profils").update(patch).eq("id", user_id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
