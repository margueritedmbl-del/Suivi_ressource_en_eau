export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseAdminEnv, getSupabaseServiceRoleStatus, supabaseAdmin } from "@/lib/supabase-admin";

const REQUIRED_ROLES = [
  { nom_role: "Super administrateur", description: "Accès total : administration, utilisateurs, sécurité et paramétrage" },
  { nom_role: "Administrateur PTCS", description: "Gestion complète de la plateforme" },
  { nom_role: "DNH/DRHK", description: "Consultation, validation et export" },
  { nom_role: "Collecteur", description: "Collecte, synchronisation terrain et mise à jour autorisée" },
  { nom_role: "Observateur", description: "Consultation simple des données autorisées" },
  { nom_role: "Public", description: "Accès limité" },
];

function errorJson(error: string, status = 500, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
}

async function ensureRole(role: { nom_role: string; description: string }) {
  const existing = await supabaseAdmin
    .from("roles")
    .select("id,nom_role,description")
    .eq("nom_role", role.nom_role)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const updated = await supabaseAdmin
      .from("roles")
      .update({ description: role.description })
      .eq("id", existing.data.id)
      .select("id,nom_role,description")
      .single();
    if (updated.error) throw updated.error;
    return updated.data;
  }

  const created = await supabaseAdmin
    .from("roles")
    .insert(role)
    .select("id,nom_role,description")
    .single();
  if (created.error) throw created.error;
  return created.data;
}

async function ensureRoles() {
  const roles: any[] = [];
  for (const role of REQUIRED_ROLES) roles.push(await ensureRole(role));
  const superRole = roles.find((r) => r.nom_role === "Super administrateur");
  if (!superRole?.id) throw new Error("Rôle Super administrateur introuvable après initialisation.");
  return { roles, superRole };
}

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

async function ensureAdminAuthUser(email: string, password: string) {
  let adminUser = await findAuthUserByEmail(email);
  if (!adminUser) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "Super administrateur" },
    });
    if (created.error) throw new Error(created.error.message);
    adminUser = created.data.user;
  } else {
    const updated = await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(adminUser.user_metadata || {}), role: "Super administrateur" },
    });
    if (updated.error) throw new Error(updated.error.message);
    adminUser = updated.data.user || adminUser;
  }
  if (!adminUser?.id) throw new Error("Utilisateur administrateur introuvable après création/mise à jour.");
  return adminUser;
}

async function ensureAdminProfile(adminUser: any, email: string, superRoleId: string) {
  const byEmail = await supabaseAdmin
    .from("profils")
    .select("id,email")
    .eq("email", email)
    .maybeSingle();

  if (byEmail.error) throw byEmail.error;

  if (byEmail.data?.id) {
    const updated = await supabaseAdmin
      .from("profils")
      .update({ id: adminUser.id, email, role_id: superRoleId, actif: true })
      .eq("email", email);
    if (updated.error) throw updated.error;
    return "profil mis à jour par email";
  }

  const byId = await supabaseAdmin
    .from("profils")
    .select("id,email")
    .eq("id", adminUser.id)
    .maybeSingle();

  if (byId.error) throw byId.error;

  if (byId.data?.id) {
    const updated = await supabaseAdmin
      .from("profils")
      .update({ email, role_id: superRoleId, actif: true })
      .eq("id", adminUser.id);
    if (updated.error) throw updated.error;
    return "profil mis à jour par id";
  }

  const inserted = await supabaseAdmin
    .from("profils")
    .insert({ id: adminUser.id, email, role_id: superRoleId, actif: true });
  if (inserted.error) throw inserted.error;
  return "profil créé";
}

async function setConfiguration(key: string, value: string) {
  try {
    const existing = await supabaseAdmin.from("configuration").select("id").eq("cle", key).maybeSingle();
    if (existing.error) return;
    if (existing.data?.id) await supabaseAdmin.from("configuration").update({ valeur: value }).eq("cle", key);
    else await supabaseAdmin.from("configuration").insert({ cle: key, valeur: value });
  } catch (_) {}
}

export async function GET(req: NextRequest) {
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
  if (bootstrapSecret && req.nextUrl.searchParams.get("secret") !== bootstrapSecret) {
    return errorJson("Secret bootstrap invalide.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
    return errorJson(
      "Variables Supabase manquantes dans Vercel : NEXT_PUBLIC_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY.",
      500
    );
  }

  const serviceRoleStatus = getSupabaseServiceRoleStatus();
  if (!serviceRoleStatus.isServiceRole) {
    return errorJson(
      "SUPABASE_SERVICE_ROLE_KEY invalide : collez la clé service_role du nouveau projet Supabase, pas la clé anon et pas une autre clé secrète.",
      500,
      serviceRoleStatus
    );
  }

  const email = process.env.ADMIN_EMAIL || "gireexpert@gmail.com";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) return errorJson("ADMIN_PASSWORD manquant dans les variables Vercel.", 400);
  if (String(password).length < 8) return errorJson("ADMIN_PASSWORD doit contenir au moins 8 caractères.", 400);

  try {
    const { roles, superRole } = await ensureRoles();
    const adminUser = await ensureAdminAuthUser(email, password);
    const profileStatus = await ensureAdminProfile(adminUser, email, superRole.id);

    await setConfiguration("version_psore", "V2_4");
    await setConfiguration("bootstrap_done", "true");
    await setConfiguration("bootstrap_admin_email", email);
    await setConfiguration("bootstrap_last_run", new Date().toISOString());

    return NextResponse.json({
      ok: true,
      email,
      role: "Super administrateur",
      profileStatus,
      roles_initialises: roles.map((r) => r.nom_role),
      message: "PSORE initialisé : rôles confirmés, Super administrateur confirmé et mot de passe synchronisé.",
    });
  } catch (error: any) {
    const message = error.message || "Erreur bootstrap inconnue.";
    if (message.includes("row-level security") || message.includes("row level security")) {
      return errorJson(
        "RLS bloque le bootstrap. Vérifiez que SUPABASE_SERVICE_ROLE_KEY est bien la clé service_role du nouveau projet Supabase, puis redéployez Vercel avec Clear Build Cache.",
        500,
        { original_error: message, service_role_status: getSupabaseServiceRoleStatus() }
      );
    }
    return errorJson(message, 500);
  }
}
