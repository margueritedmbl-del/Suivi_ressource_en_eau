import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ROLE_PUBLIC } from "@/lib/permissions";

export type AuthContext = {
  user: { id: string; email: string };
  profil: any | null;
  role: string;
};

function getBearerToken(req: NextRequest) {
  const value = req.headers.get("authorization") || "";
  if (!value.toLowerCase().startsWith("bearer ")) return "";
  return value.slice(7).trim();
}

function roleName(profil: any) {
  const r = profil?.roles;
  return Array.isArray(r) ? r[0]?.nom_role : r?.nom_role;
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const user = { id: data.user.id, email: data.user.email || "" };

  let { data: profil, error: profileError }: any = await supabaseAdmin
    .from("profils")
    .select("id,email,nom,prenom,telephone,actif,role_id,roles(nom_role)")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profil && user.email) {
    const byEmail: any = await supabaseAdmin
      .from("profils")
      .select("id,email,nom,prenom,telephone,actif,role_id,roles(nom_role)")
      .eq("email", user.email)
      .maybeSingle();
    if (byEmail.error) throw byEmail.error;
    profil = byEmail.data || null;
  }

  if (profil?.actif === false) return { user, profil, role: ROLE_PUBLIC };
  return { user, profil, role: roleName(profil) || ROLE_PUBLIC };
}

export async function requireApiRole(req: NextRequest, allowedRoles: string[]) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx) {
      return { response: NextResponse.json({ ok: false, error: "Authentification requise." }, { status: 401 }) };
    }
    if (!allowedRoles.includes(ctx.role)) {
      return { response: NextResponse.json({ ok: false, error: "Accès non autorisé.", role: ctx.role }, { status: 403 }) };
    }
    return { ctx };
  } catch (error: any) {
    return { response: NextResponse.json({ ok: false, error: error.message || "Erreur d'authentification." }, { status: 500 }) };
  }
}
