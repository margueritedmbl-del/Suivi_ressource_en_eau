"use client";
import { useMemo, useState } from "react";
import { useRole } from "@/components/auth/useRole";
import { authFetch } from "@/lib/auth-client";

const HYDRO = new Set(["pluviometrie", "piezometrie", "limnimetrie"]);
const COMMUNES = ["Doumba", "Koula", "Méguétan", "Sirakorola"];

type Preset = "custom" | "today" | "7d" | "30d" | "month" | "prevmonth" | "year" | "prevyear" | "rainy";
function iso(d: Date) { return d.toISOString().slice(0, 10); }
function resolvePreset(p: Preset) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  if (p === "today") return [iso(now), iso(now)];
  if (p === "7d") { const s = new Date(now); s.setDate(s.getDate() - 6); return [iso(s), iso(now)]; }
  if (p === "30d") { const s = new Date(now); s.setDate(s.getDate() - 29); return [iso(s), iso(now)]; }
  if (p === "month") return [iso(new Date(y, m, 1)), iso(now)];
  if (p === "prevmonth") return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
  if (p === "year") return [`${y}-01-01`, iso(now)];
  if (p === "prevyear") return [`${y - 1}-01-01`, `${y - 1}-12-31`];
  if (p === "rainy") return [`${y}-05-01`, `${y}-10-31`];
  return ["", ""];
}

export default function ReportsPanel() {
  const { role, canAccessReports } = useRole();
  const [module, setModule] = useState("pluviometrie");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [preset, setPreset] = useState<Preset>("custom");
  const [sb, setSb] = useState("102");
  const [communes, setCommunes] = useState<string[]>([]);
  const [localites, setLocalites] = useState("");
  const [stations, setStations] = useState("");
  const [basemap, setBasemap] = useState("osm");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const isSubBasin = module === "sous_bassin";
  const isPointsEau = module === "points_eau";

  const query = useMemo(() => {
    const p = new URLSearchParams({ module });
    if (isSubBasin) p.set("sb", sb);
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    if (communes.length) p.set("communes", communes.join(","));
    if (localites.trim()) p.set("localites", localites.trim());
    if (stations.trim()) p.set("stations", stations.trim());
    p.set("basemap", basemap);
    return p.toString();
  }, [module, start, end, sb, isSubBasin, communes, localites, stations, basemap]);

  function choosePreset(v: Preset) {
    setPreset(v);
    if (v !== "custom") {
      const [s, e] = resolvePreset(v);
      setStart(s); setEnd(e);
    }
  }
  function toggleCommune(c: string) {
    setCommunes(v => v.includes(c) ? v.filter(x => x !== c) : [...v, c]);
  }

  async function download(format: string, scope = "analytic") {
    if (!canAccessReports) return;
    setBusy(`${scope}-${format}`); setMsg("");
    try {
      let endpoint: string;
      if (isPointsEau) endpoint = "/api/reports/export-points-eau-v5";
      else endpoint = scope === "analytic" ? "/api/reports/export-v5-decision" : "/api/reports/export-v5";
      const suffix = !isSubBasin ? `&scope=${scope}` : "";
      const r = await authFetch(`${endpoint}?${query}&format=${format}${suffix}`);
      if (!r.ok) { const body = await r.json().catch(() => ({})); throw new Error(body.error || `HTTP ${r.status}`); }
      const blob = await r.blob(), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url;
      const disposition = r.headers.get("content-disposition") || "", match = disposition.match(/filename="?([^";]+)"?/i);
      a.download = match?.[1] || `psore_rapport.${format}`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) { setMsg(`Erreur : ${error?.message || "export impossible"}`); }
    finally { setBusy(""); }
  }

  const analyticFormats = ["pdf", "docx", "xlsx", "csv"], sourceFormats = ["xlsx", "csv"];
  return (
    <div className="panel">
      <h2>Rapports territoriaux d’aide à la décision — PSORE V5</h2>
      <p><span className="role-badge">Rôle : {role}</span></p>
      <p className="muted">Les exports analytiques présentent uniquement les informations utiles à la décision : état et évolution de la ressource, indicateurs, graphiques, cartographie et synthèse territoriale. Les contrôles qualité restent réservés aux exports sources et à l’administration.</p>
      {!canAccessReports && <div className="notice-empty">Rapports réservés aux rôles autorisés.</div>}

      <div className="grid-2">
        <label><span>Type de rapport</span><select className="input" value={module} onChange={e => setModule(e.target.value)}><option value="pluviometrie">Pluviométrie</option><option value="piezometrie">Piézométrie</option><option value="limnimetrie">Limnimétrie</option><option value="points_eau">Points d'eau — inventaire</option><option value="sous_bassin">Rapport intégré de sous-bassin</option></select></label>
        {isSubBasin ? <label><span>Identifiant du sous-bassin</span><input className="input" value={sb} onChange={e => setSb(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Ex. 102" /></label> : <label><span>Période prédéfinie</span><select className="input" value={preset} onChange={e => choosePreset(e.target.value as Preset)}><option value="custom">Période personnalisée</option><option value="today">Aujourd’hui</option><option value="7d">7 derniers jours</option><option value="30d">30 derniers jours</option><option value="month">Mois en cours</option><option value="prevmonth">Mois précédent</option><option value="rainy">Saison des pluies (mai–octobre)</option><option value="year">Année en cours</option><option value="prevyear">Année précédente</option></select></label>}
        <label><span>Début</span><input className="input" type="date" value={start} onChange={e => { setStart(e.target.value); setPreset("custom"); }} /></label>
        <label><span>Fin</span><input className="input" type="date" value={end} onChange={e => { setEnd(e.target.value); setPreset("custom"); }} /></label>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Filtre territorial — une ou plusieurs communes</strong>
        <div className="report-grid" style={{ marginTop: 8 }}>
          {COMMUNES.map(c => <label key={c} className="btn" style={{ cursor: "pointer", justifyContent: "flex-start" }}><input type="checkbox" checked={communes.includes(c)} onChange={() => toggleCommune(c)} style={{ marginRight: 8 }} />{c}</label>)}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>Aucune commune cochée = ensemble du territoire disponible. Plusieurs communes peuvent être combinées dans un même rapport.</p>
      </div>

      {!isPointsEau && <div className="grid-2" style={{ marginTop: 12 }}>
        <label><span>Localité(s) — facultatif, séparées par des virgules</span><input className="input" value={localites} onChange={e => setLocalites(e.target.value)} placeholder="Ex. Fani, Dombana" /></label>
        <label><span>Station(s) — facultatif, séparées par des virgules</span><input className="input" value={stations} onChange={e => setStations(e.target.value)} placeholder="Ex. PZ-DMB-FAN-001" /></label>
        <label><span>Fond cartographique PDF</span><select className="input" value={basemap} onChange={e => setBasemap(e.target.value)}><option value="osm">OpenStreetMap</option><option value="satellite">Satellite — Esri World Imagery</option></select></label>
      </div>}

      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>Export analytique — aide à la décision</h3>
        <p className="muted" style={{ marginTop: 0 }}>Aucun détail interne de validation, doublon ou contrôle qualité n’est affiché. Le PDF reprend les indicateurs pertinents, au maximum 2–3 graphiques, la carte du territoire filtré, une synthèse « À retenir pour la décision » et un tableau détaillé.</p>
        <div className="report-grid">{analyticFormats.map(format => <button key={`a-${format}`} className="btn btn-primary" disabled={!canAccessReports || !!busy} onClick={() => download(format, "analytic")}>{busy === `analytic-${format}` ? "Génération..." : `Exporter ${format.toUpperCase()}`}</button>)}</div>
      </div>

      {!isSubBasin && <div style={{ marginTop: 18 }}><h3 style={{ marginBottom: 8 }}>Export source — administration et contrôle</h3><p className="muted" style={{ marginTop: 0 }}>Conserve les statuts qualité, doublons exacts, contrôles GPS et autres informations techniques nécessaires à l’administration.</p><div className="report-grid">{sourceFormats.map(format => <button key={`s-${format}`} className="btn btn-primary" disabled={!canAccessReports || !!busy} onClick={() => download(format, "source")}>{busy === `source-${format}` ? "Génération..." : `Source ${format.toUpperCase()}`}</button>)}</div></div>}
      {msg && <div className="notice-empty" style={{ marginTop: 16 }}>{msg}</div>}
    </div>
  );
}
