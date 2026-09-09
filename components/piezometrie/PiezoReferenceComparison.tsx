"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Equal, Gauge, RefreshCw } from "lucide-react";
import { PIEZO_REFERENCES, classifyPiezoEvolution, normalizeLocality } from "@/lib/piezo-reference";
import { authFetch } from "@/lib/auth-client";
import { useRole } from "@/components/auth/useRole";
import { stationMeta } from "@/lib/network-registry";

type Row = Record<string, any>;

function value(row: Row, ...keys: string[]) {
  for (const key of keys) if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  return null;
}
function numeric(v: any) { if (v === null || v === undefined || v === "") return null; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; }
function fmt(v: any, digits = 2) { const n = numeric(v); return n === null ? "—" : n.toLocaleString("fr-FR", { maximumFractionDigits: digits }); }
function dateValue(row: Row) { return String(value(row, "date_observation", "date_mesure", "date") || ""); }
function localityValue(row: Row) { return value(row, "village", "localite", "site", "nom_site", "code_site", "code_piezo"); }

export default function PiezoReferenceComparison() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const { canSync } = useRole();

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/dashboard/module?module=piezometrie", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Lecture des observations impossible.");
      setRows(Array.isArray(payload?.data) ? payload.data : []);
    } catch (e: any) { setError(e?.message || "Lecture des observations impossible."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); const onSync=(event:Event)=>{const detail=(event as CustomEvent).detail;if(!detail?.module||detail.module==="piezometrie")load();};window.addEventListener("psore-sync-complete",onSync);return()=>window.removeEventListener("psore-sync-complete",onSync); }, []);

  async function fullSync() {
    setSyncing(true); setSyncMessage(""); setError("");
    try {
      const response = await authFetch("/api/sync/piezometrie?full=1", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || payload?.message || `Synchronisation impossible (HTTP ${response.status}).`);
      setSyncMessage("Historique piézométrique resynchronisé. Les observations sont maintenant rapprochées du référentiel initial.");
      await load();
    } catch (e: any) { setError(e?.message || "Synchronisation complète impossible."); }
    finally { setSyncing(false); }
  }

  const comparisons = useMemo(() => PIEZO_REFERENCES.map((ref) => {
    const key = normalizeLocality(ref.village);
    const meta = stationMeta("piezometrie", ref.code, ref.village);
    const operationalCode = String(meta?.code || "").toUpperCase();
    const candidates = rows.filter((r) => {
      const code = String(value(r, "code_site", "code_piezo") || "").toUpperCase();
      const shortCode = String(value(r, "code_court") || "").toUpperCase();
      if (operationalCode && code === operationalCode) return true;
      if (shortCode === ref.code.toUpperCase()) return true;
      return normalizeLocality(localityValue(r)) === key || normalizeLocality(value(r, "nom_site")) === key;
    }).sort((a, b) => dateValue(b).localeCompare(dateValue(a)));
    const latest = candidates[0] || null;
    const current = latest ? numeric(value(latest, "niveau_statique", "valeur_observee")) : null;
    const evolution = classifyPiezoEvolution(ref.niveau_statique_m, current);
    return { ref, meta, latest, current, ...evolution };
  }), [rows]);

  const counts = comparisons.reduce((acc, x) => { acc[x.status] = (acc[x.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const matched = comparisons.filter((x) => x.current !== null).length;

  return <section className="panel piezo-reference-panel">
    <div className="panel-title-row">
      <div>
        <h2>Référentiel piézométrique initial et évolution</h2>
        <p>Les niveaux issus des essais d’avril–mai 2025 servent de référence. Les codes historiques PZ-01…PZ-20 sont harmonisés avec les codes métier Epicollect5. Le rapprochement utilise en priorité cette correspondance, puis la localité normalisée.</p>
      </div>
      <div className="map-tools"><button className="btn btn-soft" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading ? " Actualisation…" : " Actualiser"}</button>{canSync && <button className="btn btn-primary" onClick={fullSync} disabled={syncing}><RefreshCw size={16}/>{syncing ? " Resynchronisation…" : " Re-synchroniser l’historique"}</button>}</div>
    </div>
    {error && <div className="alert warn">{error}</div>}{syncMessage && <div className="alert success">{syncMessage}</div>}
    <div className="grid-4 piezo-reference-kpis">
      <article className="kpi"><span>Piézomètres de référence</span><strong>20</strong><small>État initial 2025</small></article>
      <article className="kpi"><span>Sites rapprochés</span><strong>{matched}/20</strong><small>Dernière mesure disponible</small></article>
      <article className="kpi"><span>Hausse / stable</span><strong>{counts.Hausse || 0} / {counts.Stable || 0}</strong><small>Nappe moins profonde / variation ≤ 0,10 m</small></article>
      <article className="kpi"><span>Baisse</span><strong>{counts.Baisse || 0}</strong><small>Nappe plus profonde que la référence</small></article>
    </div>
    <div className="table-wrap"><table className="table"><thead><tr><th>Code PSORE</th><th>Code Epicollect</th><th>Localité</th><th>Commune</th><th>Date référence</th><th>NS référence</th><th>Dernière mesure</th><th>NS actuel</th><th>Écart</th><th>Évolution</th></tr></thead><tbody>
      {comparisons.map(({ ref, meta, latest, current, delta, status }) => <tr key={ref.code}>
        <td><strong>{ref.code}</strong></td><td>{meta?.code || "Information à vérifier"}</td><td>{ref.village}</td><td>{ref.commune}</td><td>{ref.date_essai || "—"}</td><td>{fmt(ref.niveau_statique_m)} m</td><td>{latest ? dateValue(latest) || "—" : "—"}</td><td>{fmt(current)}{current === null ? "" : " m"}</td><td>{delta === null ? "—" : `${delta > 0 ? "+" : ""}${fmt(delta)} m`}</td>
        <td><span className={`badge ${status === "Baisse" ? "danger" : status === "Hausse" ? "ok" : ""}`}>{status === "Baisse" ? <ArrowDown size={13}/> : status === "Hausse" ? <ArrowUp size={13}/> : status === "Stable" ? <Equal size={13}/> : <Gauge size={13}/>} {status}</span></td>
      </tr>)}
    </tbody></table></div>
    <p className="muted"><strong>Convention :</strong> le niveau statique est une profondeur sous le repère de mesure. Un écart positif signifie que la surface de la nappe est plus profonde qu’à l’état initial (baisse) ; un écart négatif indique une remontée.</p>
  </section>;
}
