"use client";
import { supabase } from "@/lib/supabase";

export async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const authHeaders = await getAuthHeaders();
  return fetch(input, {
    ...init,
    headers: {
      ...(authHeaders as Record<string, string>),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}
