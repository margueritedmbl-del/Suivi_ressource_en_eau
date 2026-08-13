"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileSpreadsheet, ShieldCheck, AlertTriangle, Play, RotateCcw } from "lucide-react";
import { authFetch } from "@/lib/auth-client";

type Target = { key: string; module: string; source: string; label: string; table: string };

type ImportJob = {
  id: string;
  target_key: string;
  module: string;
  source: string;
  filename: string;
  sheet_name: string | null;
  status: "queued" | "processing" | "completed" | "completed_with_errors" | "failed";
  total_rows: number;
  processed_rows: number;
  mapped_rows: number;
  skipped_rows: number;
  upserted_rows: number;
  failed_rows: number;
  warnings: string[];
  errors: string[];
  error_message: string | null;
  created_at: string;
};

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw || "{}");
    } catch {
      throw new Error(`Réponse JSON invalide du serveur (HTTP ${response.status}).`);
    }
  }
  const preview = raw.replace(/\s+/g, " ").trim().slice(0, 350);
  throw new Error(`Erreur serveur HTTP ${response.status}${preview ? ` : ${preview}` : ""}`);
}

function isDone(status: ImportJob["status"]) {
  return status === "completed" || status === "completed_with_errors" || status === "failed";
}

function statusLabel(status: ImportJob["status"]) {
  if (status === "queued") return "En attente";
  if (status === "processing") return "Traitement";
  if (status === "completed") return "Terminé";
  if (status === "completed_with_errors") return "Terminé avec erreurs";
  return "Échec";
}

export default function ManualDataImport({ onCompleted }: { onCompleted?: () => void }) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [target, setTarget] = useState("points_eau:inventaire");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const stopRef = useRef(false);

  const progress = useMemo(() => {
    if (!activeJob?.total_rows) return 0;
    return Math.min(100, Math.round((activeJob.processed_rows / activeJob.total_rows) * 100));
  }, [activeJob]);

  async function loadJobs() {
    const response = await authFetch("/api/admin/import-jobs");
    const json = await readApiResponse(response);
    if (!response.ok || !json.ok) throw new Error(json.error || "Impossible de charger les imports.");
    setTargets(json.targets || []);
    setJobs(json.jobs || []);
    if (json.targets?.length && !json.targets.some((item: Target) => item.key === target)) setTarget(json.targets[0].key);
  }

  useEffect(() => {
    loadJobs().catch((error) => setMessage(error?.message || "Impossible de charger les imports."));
    return () => { stopRef.current = true; };
  }, []);

  async function processUntilDone(initialJob: ImportJob) {
    stopRef.current = false;
    let current = initialJob;
    setActiveJob(current);
    setLoading(true);
    try {
      while (!isDone(current.status) && !stopRef.current) {
        const response = await authFetch(`/api/admin/import-jobs/${current.id}/process`, { method: "POST" });
        const json = await readApiResponse(response);
        if (!response.ok || !json.ok) throw new Error(json.error || "Échec du traitement d’un lot.");
        current = json.job as ImportJob;
        setActiveJob(current);
        setMessage(`${current.processed_rows}/${current.total_rows} lignes traitées — ${current.upserted_rows} intégrées.`);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (current.status === "completed") setMessage(`Import terminé : ${current.upserted_rows}/${current.total_rows} ligne(s) intégrée(s).`);
      else if (current.status === "completed_with_errors") setMessage(`Import terminé avec erreurs : ${current.upserted_rows} intégrée(s), ${current.failed_rows} échec(s).`);
      else if (current.status === "failed") setMessage(`Échec : ${current.error_message || "erreur inconnue"}`);
      await loadJobs();
      if (current.status === "completed" || current.status === "completed_with_errors") onCompleted?.();
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("Sélectionnez d’abord un fichier CSV ou Excel.");
      return;
    }
    setLoading(true);
    setMessage("Chargement du fichier et création de la tâche…");
    setActiveJob(null);
    try {
      const body = new FormData();
      body.set("target", target);
      body.set("file", file);
      const response = await authFetch("/api/admin/import-jobs", { method: "POST", body });
      const json = await readApiResponse(response);
      if (!response.ok || !json.ok) throw new Error(json.error || "Création de l’import impossible.");
      const job = json.job as ImportJob;
      setActiveJob(job);
      setMessage(`Tâche créée : ${job.total_rows} ligne(s). Démarrage du traitement par lots…`);
      await processUntilDone(job);
    } catch (error: any) {
      setMessage(`Erreur d’import : ${error?.message || "erreur inconnue"}`);
      setLoading(false);
    }
  }

  async function resume(job: ImportJob) {
    if (loading) return;
    setMessage("Reprise du traitement…");
    await processUntilDone(job).catch((error) => {
      setMessage(`Erreur de reprise : ${error?.message || "erreur inconnue"}`);
      setLoading(false);
    });
  }

  return <section className="panel" style={{ border: "1px solid #bfdbfe", background: "linear-gradient(180deg,#eff6ff,#ffffff)" }}>
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", background: "#dbeafe", color: "#1d4ed8" }}><FileSpreadsheet size={24} /></div>
      <div style={{ flex: 1, minWidth: 260 }}>
        <h2 style={{ margin: 0 }}>Import manuel par lots</h2>
        <p style={{ color: "#475569", marginTop: 6 }}>Le fichier est stocké temporairement, puis traité en petits lots. L’import peut être repris sans recommencer le fichier.</p>
      </div>
    </div>

    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "minmax(250px,1fr) minmax(260px,1fr) auto", gap: 12, alignItems: "end", marginTop: 16 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <strong>Type de fichier</strong>
        <select value={target} onChange={(event) => setTarget(event.target.value)} disabled={loading} style={{ padding: 12, border: "1px solid #cbd5e1", borderRadius: 10, background: "white" }}>
          {targets.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <strong>Fichier CSV ou Excel</strong>
        <input type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" disabled={loading} onChange={(event) => setFile(event.target.files?.[0] || null)} style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 10, background: "white" }} />
      </label>
      <button className="btn btn-primary" type="submit" disabled={loading || !file} style={{ minHeight: 44 }}><Upload size={17} /> {loading ? "Traitement…" : "Charger et importer"}</button>
    </form>

    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: "#475569", fontSize: 14 }}><ShieldCheck size={17} /> Fichier limité à 4 Mo, traitement par lots de 20 lignes, ajout/mise à jour sans doublons.</div>
    {message && <p style={{ marginTop: 14 }}><strong>{message}</strong></p>}

    {activeJob && <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "white", border: "1px solid #bfdbfe" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <strong>{activeJob.filename}</strong><span>{statusLabel(activeJob.status)} — {progress}%</span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: "#e2e8f0", overflow: "hidden", marginTop: 10 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#5b21b6,#0284c7)", transition: "width .25s ease" }} />
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 10 }}>
        <span>Traitées : <strong>{activeJob.processed_rows}/{activeJob.total_rows}</strong></span>
        <span>Intégrées : <strong>{activeJob.upserted_rows}</strong></span>
        <span>Ignorées : <strong>{activeJob.skipped_rows}</strong></span>
        <span>Échecs : <strong>{activeJob.failed_rows}</strong></span>
      </div>
      {!!activeJob.errors?.length && <details style={{ marginTop: 10, color: "#9a3412" }}><summary><AlertTriangle size={15} style={{ verticalAlign: "middle" }} /> Détails des erreurs ({activeJob.errors.length})</summary><ul>{activeJob.errors.map((item, index) => <li key={index}>{item}</li>)}</ul></details>}
    </div>}

    {!!jobs.length && <div style={{ marginTop: 20 }}>
      <h3 style={{ marginBottom: 8 }}>Imports récents</h3>
      <div style={{ overflowX: "auto" }}><table className="table"><thead><tr><th>Date</th><th>Fichier</th><th>Module</th><th>Progression</th><th>Statut</th><th>Action</th></tr></thead><tbody>
        {jobs.map((job) => <tr key={job.id}><td>{new Date(job.created_at).toLocaleString("fr-FR")}</td><td>{job.filename}</td><td>{job.module}</td><td>{job.processed_rows}/{job.total_rows}</td><td>{statusLabel(job.status)}</td><td>{!isDone(job.status) ? <button type="button" className="btn btn-soft" disabled={loading} onClick={() => resume(job)}><Play size={15} /> Reprendre</button> : job.status === "failed" ? <span style={{ color: "#b91c1c" }}><RotateCcw size={15} /> Corriger puis relancer</span> : "—"}</td></tr>)}
      </tbody></table></div>
    </div>}

    <p style={{ marginTop: 14, fontSize: 13, color: "#64748b" }}>Le navigateur pilote les lots successifs. Si la page est fermée, utilise « Reprendre » à ton retour.</p>
  </section>;
}
