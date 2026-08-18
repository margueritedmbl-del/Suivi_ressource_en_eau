export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getSupabaseClientEnvStatus, hasSupabaseClientEnv } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    app: "ok",
    supabase_client_env: hasSupabaseClientEnv() ? "configured" : "missing",
    required_env: getSupabaseClientEnvStatus(),
    message: hasSupabaseClientEnv()
      ? "Les variables publiques Supabase nécessaires à l'authentification sont disponibles au build."
      : "NEXT_PUBLIC_SUPABASE_URL et/ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquent. Ajoutez-les dans Vercel puis redéployez.",
  });
}
