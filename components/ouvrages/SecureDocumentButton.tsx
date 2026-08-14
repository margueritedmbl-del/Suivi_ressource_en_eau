"use client";

import { useState } from "react";
import { authFetch } from "@/lib/auth-client";

type Props = {
  code: string;
  type: "analyse" | "essai";
  label: string;
  className?: string;
};

export default function SecureDocumentButton({ code, type, label, className = "btn btn-soft btn-mini" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openDocument() {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/documents/ouvrages/${encodeURIComponent(code)}/${type}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) throw new Error(payload?.error || "Document indisponible.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setError(e?.message || "Document indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return <span className="secure-document-action">
    <button type="button" className={className} onClick={openDocument} disabled={loading}>
      {loading ? "Ouverture…" : label}
    </button>
    {error && <small className="secure-document-error" title={error}>Document indisponible</small>}
  </span>;
}
