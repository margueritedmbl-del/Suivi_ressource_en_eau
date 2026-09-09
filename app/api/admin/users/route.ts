export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN]);
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("profils")
    .select("id,email,nom,prenom,telephone,actif,created_at,role_id,roles(nom_role)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("roles")
    .select("id,nom_role,description")
    .order("nom_role");

  if (rolesError) return NextResponse.json({ ok: false, error: rolesError.message }, { status: 500 });

  return NextResponse.json({ ok: true, users: data || [], roles: roles || [] });
}
