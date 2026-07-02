"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

function formatDuration(ms: any) {
  const n = Number(ms || 0);
  if (!n) return "—";
  if (n < 1000) return `${n} ms`;
  return `${(n / 1000).toFixed(1)} s`;
}

export default function SyncLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadLogs() {
    const response = await authFetch("/api/admin/sync-logs");
    const json = await response.json();
    if (json.ok) setLogs(json.data || []);
  }

  async function runSync(path: string, label: string) {
    setLoading(true);
    setMessage(`Synchronisation ${label} en cours...`);
    try {
      const response = await authFetch(path, { method: "POST" });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || "Erreur de synchronisation");
      const total = (json.results || []).reduce((sum: number, row: any) => sum + Number(row.upserted || row.count || 0), 0);
      setMessage(`${label} terminé : ${total} enregistrement(s) synchronisé(s).`);
      await loadLogs();
    } catch (error: any) {
      setMessage(`Erreur ${label} : ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLogs().catch(() => setMessage("Impossible de charger l'historique.")); }, []);

  const actions = [
    ["/api/sync/all", "Tout"],
    ["/api/sync/points-eau", "Points d'eau"],
    ["/api/sync/pluviometrie", "Pluviométrie"],
    ["/api/sync/piezometrie", "Piézométrie"],
    ["/api/sync/limnimetrie", "Limnimétrie"],
  ] as const;

  return <div className="panel">
    <h2>Synchronisation Epicollect5</h2>
    <p style={{ color: "#64748b" }}>Les synchronisations récupèrent toutes les pages Epicollect5 et enregistrent les résultats dans Supabase.</p>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0" }}>
      {actions.map(([path, label]) => <button key={path} className={label === "Tout" ? "btn btn-primary" : "btn btn-soft"} disabled={loading} onClick={() => runSync(path, label)}>{loading ? "Patientez..." : `Synchroniser ${label}`}</button>)}
    </div>
    {message && <p><strong>{message}</strong></p>}

    <h2>Historique des synchronisations</h2>
    <table className="table"><thead><tr><th>Date</th><th>Module</th><th>Source</th><th>Pages</th><th>Récupérés</th><th>Synchronisés</th><th>Durée</th><th>Statut</th><th>Message</th></tr></thead><tbody>
      {logs.map((l) => <tr key={l.id}><td>{l.date_sync}</td><td>{l.module}</td><td>{l.source}</td><td>{l.page_count ?? "—"}</td><td>{l.fetched_count ?? "—"}</td><td>{l.upserted_count ?? l.nb_enregistrements}</td><td>{formatDuration(l.duration_ms)}</td><td>{l.statut}</td><td>{l.message}</td></tr>)}
      {!logs.length && <tr><td colSpan={9}>Aucune synchronisation enregistrée.</td></tr>}
    </tbody></table>
  </div>;
}
