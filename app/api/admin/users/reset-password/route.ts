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

  const { user_id, password } = await req.json();
  if (!user_id) return NextResponse.json({ ok: false, error: "user_id requis." }, { status: 400 });
  if (!password || String(password).length < 8) {
    return NextResponse.json({ ok: false, error: "Nouveau mot de passe requis : minimum 8 caractères." }, { status: 400 });
  }

  const updated = await supabaseAdmin.auth.admin.updateUserById(user_id, { password, email_confirm: true });
  if (updated.error) return NextResponse.json({ ok: false, error: updated.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, message: "Mot de passe réinitialisé." });
}
