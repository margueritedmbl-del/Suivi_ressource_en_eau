"use client";
import { useState } from "react";
import { useRole } from "@/components/auth/useRole";
import { authFetch } from "@/lib/auth-client";

export default function ProtectedActions({ formUrl, syncUrl, exportModule }: { formUrl: string; syncUrl: string; exportModule: string }) {
  const { role, loading, canSync, canExportCsvXlsx, canExportAdvanced } = useRole();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  async function synchronize() {
    setSyncing(true); setMessage("Synchronisation en cours…");
    try {
      const response = await authFetch(syncUrl, { method: "POST" });
      const text = await response.text();
      let json: any = {};
      try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`Réponse serveur invalide (HTTP ${response.status}).`); }
      if (!response.ok || !json.ok) {
        if (response.status === 401) throw new Error("Session expirée ou absente. Reconnectez-vous puis relancez la synchronisation.");
        if (response.status === 403) throw new Error(`Votre rôle (${role}) n'autorise pas cette synchronisation.`);
        throw new Error(json.error || `Erreur HTTP ${response.status}`);
      }
      const results = Array.isArray(json.results) ? json.results : [];
      const total = results.reduce((s:number,r:any)=>s+Number(r.upserted||0),0);
      const failures = results.filter((r:any)=>r.status === "error");
      setMessage(failures.length ? `Synchronisation terminée avec ${failures.length} erreur(s) · ${total} enregistrement(s) intégrés.` : `Synchronisation réussie · ${total} enregistrement(s) intégrés.`);
    } catch (e:any) { setMessage(e.message || "Erreur de synchronisation"); }
    finally { setSyncing(false); }
  }

  return <div>
    <p><span className="role-badge">Rôle : {loading ? "chargement..." : role}</span></p>
    {!loading && !canSync && <div className="notice-empty">Accès consultation : les formulaires et synchronisations sont réservés aux rôles autorisés.</div>}
    <div className="quick-actions">
      {canSync && <a className="btn btn-primary" href={formUrl} target="_blank" rel="noreferrer">Ouvrir formulaire</a>}
      {canSync && <button className="btn btn-soft" type="button" disabled={syncing} onClick={synchronize}>{syncing ? "Synchronisation…" : "Synchroniser"}</button>}
      {canExportCsvXlsx && ["csv", "xlsx"].map(f => <a key={f} className="btn btn-soft" href={`/api/reports/export?module=${exportModule}&format=${f}`} target="_blank" rel="noreferrer">{f.toUpperCase()}</a>)}
      {canExportAdvanced && ["docx", "pdf"].map(f => <a key={f} className="btn btn-soft" href={`/api/reports/export?module=${exportModule}&format=${f}`} target="_blank" rel="noreferrer">{f.toUpperCase()}</a>)}
    </div>
    {message && <div className="sync-inline-status" role="status">{message}</div>}
  </div>;
}
