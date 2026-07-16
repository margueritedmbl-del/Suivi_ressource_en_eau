export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function roleName(profil: any) {
  const r = profil?.roles;
  return Array.isArray(r) ? r[0]?.nom_role : r?.nom_role;
}

async function getSuperAdminRole() {
  const { data } = await supabaseAdmin.from("roles").select("id,nom_role").eq("nom_role", "Super administrateur").maybeSingle();
  return data;
}

export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return NextResponse.json({ ok: false, role: "Public" });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ ok: false, role: "Public" });

  const email = data.user.email || "";
  let { data: profil }: any = await supabaseAdmin
    .from("profils")
    .select("id,email,nom,prenom,actif,roles(nom_role)")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profil && email) {
    const byEmail = await supabaseAdmin
      .from("profils")
      .select("id,email,nom,prenom,actif,roles(nom_role)")
      .eq("email", email)
      .maybeSingle();
    profil = byEmail.data || null;
  }

  let role = roleName(profil) || "Public";

  const isBootstrapAdmin = email.toLowerCase() === (process.env.ADMIN_EMAIL || "gireexpert@gmail.com").toLowerCase();
  if ((!profil || role === "Public" || profil.actif === false) && isBootstrapAdmin) {
    const roleRow = await getSuperAdminRole();
    if (roleRow?.id) {
      const existing = await supabaseAdmin.from("profils").select("id,email").eq("email", email).maybeSingle();
      if (existing.data?.id) {
        await supabaseAdmin.from("profils").update({ id: data.user.id, email, role_id: roleRow.id, actif: true }).eq("email", email);
      } else {
        await supabaseAdmin.from("profils").insert({ id: data.user.id, email, role_id: roleRow.id, actif: true });
      }
      role = roleRow.nom_role;
      profil = { ...(profil || {}), id: data.user.id, email, actif: true };
    }
  }

  if (profil?.actif === false) return NextResponse.json({ ok: false, user: { id: data.user.id, email }, profil, role: "Public", inactive: true });
  return NextResponse.json({ ok: true, user: { id: data.user.id, email }, profil, role });
}
