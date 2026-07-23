import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function hasSupabaseClientEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseClientEnvStatus() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(supabaseAnonKey),
  };
}

export const supabase = createClient(
  supabaseUrl || "https://example.supabase.co",
  supabaseAnonKey || "anon-placeholder"
);
