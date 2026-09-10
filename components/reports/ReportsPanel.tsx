"use client";
import { useMemo, useState } from "react";
import { useRole } from "@/components/auth/useRole";
import { authFetch } from "@/lib/auth-client";

const HYDRO = new Set(["pluviometrie", "piezometrie", "limnimetrie"]);

export default function ReportsPanel() {
  const { role, canAccessReports } = useRole();
  const [module, setModule] = useState("pluviometrie");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [sb, setSb] = useState("102");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const isSubBasin = module === "sous_bassin";
  const isHydro = HYDRO.has(module);
  const isPointsEau = module === "points_eau";
  const query = useMemo(() => {
    const p = new URLSearchParams({ module });
    if (isSubBasin) p.set("sb", sb);
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    return p.toString();
  }, [module, start, end, sb, isSubBasin]);

  async function download(format: string, scope = "analytic") {
    if (!canAccessReports) return;
    setBusy(`${scope}-${format}`);
    setMsg("");
    try {
      const endpoint = isPointsEau ? "/api/reports/export-points-eau-v5" : "/api/reports/export-v5";
      const suffix = !isSubBasin ? `&scope=${scope}` : "";
      const r = await authFetch(`${endpoint}?${query}&format=${format}${suffix}`);
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = r.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      a.download = match?.[1] || `psore_rapport.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      setMsg(`Erreur : ${error?.message || "export impossible"}`);
    } finally {
      setBusy("");
    }
  }

  const analyticFormats = ["pdf", "docx", "xlsx", "csv"];
  const sourceFormats = ["xlsx", "csv"];

  return (
    <div className="panel">
      <h2>Rapports techniques — PSORE</h2>
      <p><span className="role-badge">Rôle : {role}</span></p>
      <p className="muted">
        Moteur analytique PSORE V5 : contrôle qualité transversal, séparation source/analytique,
        indicateurs piézométriques pondérés, pluviométrie, niveaux des cours d’eau et cartographie harmonisée.
        Les points d’eau restent des fiches d’inventaire et ne sont pas traités comme des séries temporelles.
      </p>
      {!canAccessReports && <div className="notice-empty">Rapports techniques réservés aux rôles DNH/DRHK, Administrateur PTCS et Super administrateur.</div>}

      <div className="grid-2">
        <label>
          <span>Type de rapport</span>
          <select className="input" value={module} onChange={e => setModule(e.target.value)}>
            <option value="pluviometrie">Pluviométrie</option>
            <option value="piezometrie">Piézométrie</option>
            <option value="limnimetrie">Limnimétrie</option>
            <option value="points_eau">Points d'eau — inventaire</option>
            <option value="sous_bassin">Rapport intégré de sous-bassin</option>
          </select>
        </label>
        {isSubBasin ? (
          <label>
            <span>Identifiant du sous-bassin</span>
            <input className="input" value={sb} onChange={e => setSb(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Ex. 102" />
          </label>
        ) : (
          <label>
            <span>Début — facultatif</span>
            <input className="input" type="date" value={start} onChange={e => setStart(e.target.value)} />
          </label>
        )}
        {!isSubBasin && (
          <label>
            <span>Fin — facultatif</span>
            <input className="input" type="date" value={end} onChange={e => setEnd(e.target.value)} />
          </label>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>Export analytique validé</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Rapports et données retenues après contrôle qualité. Les périodes non renseignées utilisent automatiquement la première et la dernière mesure disponible.
        </p>
        <div className="report-grid">
          {analyticFormats.map(format => (
            <button key={`a-${format}`} className="btn btn-primary" disabled={!canAccessReports || !!busy} onClick={() => download(format, "analytic")}>
              {busy === `analytic-${format}` ? "Génération..." : `Exporter ${format.toUpperCase()}`}
            </button>
          ))}
        </div>
      </div>

      {!isSubBasin && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginBottom: 8 }}>Export des données sources + qualité</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Les données collectées sont conservées avec leur statut qualité : Validée, À vérifier, Rejetée ou Doublon certain selon le module.
          </p>
          <div className="report-grid">
            {sourceFormats.map(format => (
              <button key={`s-${format}`} className="btn btn-primary" disabled={!canAccessReports || !!busy} onClick={() => download(format, "source")}>
                {busy === `source-${format}` ? "Génération..." : `Source ${format.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {msg && <div className="notice-empty" style={{ marginTop: 16 }}>{msg}</div>}
    </div>
  );
}
