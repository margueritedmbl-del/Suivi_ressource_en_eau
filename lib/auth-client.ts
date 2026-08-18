"use client";
import { supabase } from "@/lib/supabase";

async function currentToken(forceRefresh = false) {
  if (forceRefresh) {
    const refreshed = await supabase.auth.refreshSession();
    return refreshed.data.session?.access_token || "";
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export async function getAuthHeaders(forceRefresh = false): Promise<HeadersInit> {
  const token = await currentToken(forceRefresh);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const execute = async (refresh = false) => {
    const authHeaders = await getAuthHeaders(refresh);
    return fetch(input, {
      ...init,
      cache: init.cache || "no-store",
      headers: {
        ...(authHeaders as Record<string, string>),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  };

  let response = await execute(false);
  // Une session Supabase peut expirer pendant que l'utilisateur garde PSORE ouvert.
  // On tente une seule actualisation du JWT, puis on rejoue la requête.
  if (response.status === 401) response = await execute(true);
  return response;
}
