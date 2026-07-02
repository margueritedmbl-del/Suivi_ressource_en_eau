import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

function decodeJwtPayload(token: string): any | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((part.length + 3) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch (_) {
    return null;
  }
}

export function hasSupabaseAdminEnv() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function getSupabaseServiceRoleStatus() {
  const payload = decodeJwtPayload(serviceRoleKey);
  const role = payload?.role || payload?.user_role || null;
  return {
    present: Boolean(serviceRoleKey),
    role,
    isServiceRole: role === "service_role",
    isAnon: role === "anon",
    prefix: serviceRoleKey ? `${serviceRoleKey.slice(0, 8)}...` : "",
  };
}

export function getSupabaseAdminEnvStatus() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceRoleKey),
    service_role_status: getSupabaseServiceRoleStatus(),
  };
}

export const supabaseAdmin = createClient(
  supabaseUrl || "https://example.supabase.co",
  serviceRoleKey || "service-role-placeholder",
  { auth: { persistSession: false, autoRefreshToken: false } }
);
