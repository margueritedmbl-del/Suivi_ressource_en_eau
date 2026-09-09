export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/permissions";

async function findAuthUserByEmail(email: string) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    const found = data?.users?.find((u: any) => String(u.email || "").toLowerCase() === target);
    if (found) return found;
    if (!data?.users?.length || data.users.length < 1000) break;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(req, [ROLE_ADMIN, ROLE_SUPER_ADMIN]);
  if (auth.response) return auth.response;

  const { email, role_id, nom, prenom, telephone, password, mode } = await req.json();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail || !role_id) {
    return NextResponse.json({ ok: false, error: "Email et rôle requis." }, { status: 400 });
  }

  const roleCheck = await supabaseAdmin.from("roles").select("id,nom_role").eq("id", role_id).maybeSingle();
  if (roleCheck.error) return NextResponse.json({ ok: false, error: roleCheck.error.message }, { status: 500 });
  if (!roleCheck.data?.id) return NextResponse.json({ ok: false, error: "Rôle introuvable." }, { status: 400 });

  let userId = "";

  if (mode === "invite") {
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/login`;
    const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, { redirectTo });
    if (invited.error) return NextResponse.json({ ok: false, error: invited.error.message }, { status: 500 });
    userId = invited.data.user?.id || "";
  } else {
    if (!password || String(password).length < 8) {
      return NextResponse.json({ ok: false, error: "Mot de passe requis : minimum 8 caractères." }, { status: 400 });
    }

    const existingUser = await findAuthUserByEmail(cleanEmail);
    if (existingUser?.id) {
      const updated = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(existingUser.user_metadata || {}), nom: nom || "", prenom: prenom || "" },
      });
      if (updated.error) return NextResponse.json({ ok: false, error: updated.error.message }, { status: 500 });
      userId = existingUser.id;
    } else {
      const created = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { nom: nom || "", prenom: prenom || "" },
      });
      if (created.error) return NextResponse.json({ ok: false, error: created.error.message }, { status: 500 });
      userId = created.data.user?.id || "";
    }
  }

  if (!userId) return NextResponse.json({ ok: false, error: "Utilisateur Auth introuvable après création/invitation." }, { status: 500 });

  const existingProfile = await supabaseAdmin.from("profils").select("id,email").eq("email", cleanEmail).maybeSingle();
  if (existingProfile.error) return NextResponse.json({ ok: false, error: existingProfile.error.message }, { status: 500 });

  const profilePayload = {
    id: userId,
    email: cleanEmail,
    nom: nom || null,
    prenom: prenom || null,
    telephone: telephone || null,
    role_id,
    actif: true,
  };

  const profileWrite = existingProfile.data?.id
    ? await supabaseAdmin.from("profils").update(profilePayload).eq("email", cleanEmail)
    : await supabaseAdmin.from("profils").insert(profilePayload);

  if (profileWrite.error) return NextResponse.json({ ok: false, error: profileWrite.error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    message: mode === "invite" ? "Invitation envoyée et profil créé/mis à jour." : "Utilisateur créé ou mis à jour. Communiquez le mot de passe de manière sécurisée.",
  });
}
