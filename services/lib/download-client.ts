"use client";
import { authFetch } from "@/lib/auth-client";

export async function downloadAuthenticated(url: string, fallbackName: string) {
  const response = await authFetch(url);
  if (!response.ok) {
    let message = `Téléchargement impossible (HTTP ${response.status})`;
    try { const j = await response.json(); if (j?.error) message = j.error; } catch {}
    throw new Error(message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const m = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
  const name = m ? decodeURIComponent(m[1].replace(/^\"|\"$/g, "")) : fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
