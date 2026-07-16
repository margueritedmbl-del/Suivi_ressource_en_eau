"use client";

import { FormEvent, useEffect, useState } from "react";
import { Upload, FileSpreadsheet, ShieldCheck, AlertTriangle } from "lucide-react";
import { authFetch } from "@/lib/auth-client";

type Target = { key: string; module: string; source: string; label: string; table: string };

type ImportResult = {
  filename: string;
  sheet: string;
  read: number;
  mapped: number;
  skipped: number;
  insertedOrUpdated: number;
  failed: number;
  warnings: string[];
  errors: string[];
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

export default function ManualDataImport({ onCompleted }: { onCompleted?: () => void }) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [target, setTarget] = useState("points_eau:inventaire");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    authFetch("/api/admin/import-data")
      .then(async (response) => ({ response, json: await readApiResponse(response) }))
      .then(({ response, json }) => {
        if (!response.ok || !json.ok) throw new Error(json.error || "Impossible de charger les types d’import.");
        setTargets(json.targets || []);
        if (json.targets?.length && !json.targets.some((item: Target) => item.key === target)) setTarget(json.targets[0].key);
      })
      .catch((error) => setMessage(error?.message || "Impossible de charger les types d’import."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("Sélectionnez d’abord un fichier CSV ou Excel.");
      return;
    }

    setLoading(true);
    setMessage("Lecture, contrôle et import en cours… Ne fermez pas cette page.");
    setResult(null);
    try {
      const body = new FormData();
      body.set("target", target);
      body.set("file", file);
      const response = await authFetch("/api/admin/import-data", { method: "POST", body });
      const json = await readApiResponse(response);
      if (!response.ok && !json.partial) throw new Error(json.error || "Import impossible");
      setResult(json.result || null);
      setMessage(json.message || "Import terminé.");
      onCompleted?.();
    } catch (error: any) {
      setMessage(`Erreur d’import : ${error?.message || "erreur inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  return <section className="panel" style={{ border: "1px solid #bfdbfe", background: "linear-gradient(180deg,#eff6ff,#ffffff)" }}>
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", background: "#dbeafe", color: "#1d4ed8" }}><FileSpreadsheet size={24} /></div>
      <div style={{ flex: 1, minWidth: 260 }}>
        <h2 style={{ margin: 0 }}>Import manuel de secours</h2>
        <p style={{ color: "#475569", marginTop: 6 }}>Charge le dernier export CSV/XLSX d’Epicollect5 directement dans Supabase. Les tableaux de bord, cartes et exports utilisent ensuite ces données.</p>
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
      <button className="btn btn-primary" type="submit" disabled={loading || !file} style={{ minHeight: 44 }}><Upload size={17} /> {loading ? "Import en cours…" : "Importer"}</button>
    </form>

    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: "#475569", fontSize: 14 }}><ShieldCheck size={17} /> Import réservé aux rôles autorisés, limité à 4 Mo par fichier, avec ajout/mise à jour sans doublons.</div>
    {message && <p style={{ marginTop: 14 }}><strong>{message}</strong></p>}

    {result && <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: result.failed ? "#fff7ed" : "#ecfdf5", border: `1px solid ${result.failed ? "#fed7aa" : "#a7f3d0"}` }}>
      <strong>{result.filename}</strong> — feuille « {result.sheet} »
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 8 }}>
        <span>Lignes lues : <strong>{result.read}</strong></span>
        <span>Reconnues : <strong>{result.mapped}</strong></span>
        <span>Ajoutées/mises à jour : <strong>{result.insertedOrUpdated}</strong></span>
        <span>Ignorées : <strong>{result.skipped}</strong></span>
        <span>Échecs : <strong>{result.failed}</strong></span>
      </div>
      {!!result.warnings?.length && <details style={{ marginTop: 10 }}><summary>Avertissements ({result.warnings.length})</summary><ul>{result.warnings.map((item, index) => <li key={index}>{item}</li>)}</ul></details>}
      {!!result.errors?.length && <details style={{ marginTop: 10, color: "#9a3412" }}><summary><AlertTriangle size={15} style={{ verticalAlign: "middle" }} /> Détails des lignes rejetées ({result.errors.length})</summary><ul>{result.errors.map((item, index) => <li key={index}>{item}</li>)}</ul></details>}
    </div>}

    <p style={{ marginTop: 14, fontSize: 13, color: "#64748b" }}>Conseil : télécharge le CSV depuis la fiche Epicollect5 concernée, sélectionne le même type ci-dessus, puis importe-le. Ne modifie pas les noms des colonnes.</p>
  </section>;
}
