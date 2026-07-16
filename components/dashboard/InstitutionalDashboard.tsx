"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Kpi from "@/components/Kpi";
import MiniBarChart from "@/components/dashboard/MiniBarChart";
import { authFetch } from "@/lib/auth-client";

function val(v: any) { return v === null || v === undefined || v === "" ? "--" : String(v); }
function fmt(v: any) {
  if (v === null || v === undefined || v === "") return "--";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat("fr-FR").format(n);
}
function date(v: any) { return v ? String(v).slice(0, 10) : "--"; }
function normalizeModule(v: any) { return String(v || "").replace("points_eau", "Points d’eau").replace("pluviometrie", "Pluviométrie").replace("piezometrie", "Piézométrie").replace("limnimetrie", "Limnimétrie"); }
function badgeClass(level: any) {
  const x = String(level || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (x.includes("elevee") || x.includes("critique") || x.includes("haute")) return "badge danger";
  if (x.includes("moyenne")) return "badge warning";
  return "badge ok";
}

export default function InstitutionalDashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function download(format: "csv" | "xlsx") {
    try {
      const response = await authFetch(`/api/dashboard/institutionnel/export?format=${format}`);
      if (!response.ok) throw new Error("Export impossible");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard_institutionnel_PSORE_V2_4.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || "Erreur export");
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch("/api/dashboard/institutionnel");
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || "Erreur dashboard");
      setData(json.data);
    } catch (e: any) {
      setError(e.message || "Impossible de charger le dashboard institutionnel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = data?.stats || {};
  const alertes = data?.alertes || [];
  const syncs = data?.synchronisations || [];
  const modules = data?.modules || {};
  const lastSync = syncs[0];
  const executiveScore = useMemo(() => {
    const alerts = Number(stats.alertes_total || 0);
    const noGps = Number(stats.points_sans_gps || 0);
    const nonFunctional = Number(stats.points_non_fonctionnels || 0);
    const score = Math.max(0, 100 - Math.min(35, alerts) - Math.min(25, Math.round(noGps / 3)) - Math.min(30, Math.round(nonFunctional / 5)));
    return score;
  }, [stats.alertes_total, stats.points_sans_gps, stats.points_non_fonctionnels]);

  if (loading) return <div className="panel">Chargement du dashboard institutionnel...</div>;
  if (error) return <div className="notice-empty"><strong>Erreur :</strong> {error}</div>;
  if (!data) return <div className="notice-empty">Aucune donnée disponible.</div>;

  return (
    <div className="institutional-dashboard">
      <div className="institutional-hero panel">
        <div>
          <span className="role-badge">Pilotage institutionnel</span>
          <h2>Vue consolidée PSORE</h2>
          <p className="muted">Synthèse opérationnelle pour PTCS, DNH/DRHK et partenaires : ressources suivies, alertes, synchronisations et priorités terrain.</p>
          <div className="quick-actions">
            <button className="btn btn-soft" onClick={load}>Actualiser</button>
            <button className="btn btn-primary" onClick={() => download("xlsx")}>Exporter Excel</button>
            <button className="btn btn-soft" onClick={() => download("csv")}>Exporter CSV</button>
          </div>
        </div>
        <div className="executive-score">
          <small>Indice de situation</small>
          <strong>{executiveScore}/100</strong>
          <span>{executiveScore >= 75 ? "Situation globalement maîtrisée" : executiveScore >= 50 ? "Surveillance renforcée" : "Intervention prioritaire recommandée"}</span>
        </div>
      </div>

      <div className="grid-4" style={{ marginTop: 18 }}>
        <Kpi label="Points d’eau" value={fmt(stats.points_eau)} hint={`${fmt(stats.forages)} forages • ${fmt(stats.puits)} puits`} />
        <Kpi label="Piézomètres" value={fmt(stats.piezometres)} hint={`${fmt(stats.observations_piezo)} observations`} />
        <Kpi label="Pluviomètres" value={fmt(stats.stations_pluvio)} hint={`${fmt(stats.observations_pluvio)} observations`} />
        <Kpi label="Limnimètres" value={fmt(stats.stations_limni)} hint={`${fmt(stats.observations_limni)} observations`} />
        <Kpi label="Alertes" value={fmt(stats.alertes_total)} hint="Tous modules consolidés" />
        <Kpi label="À réhabiliter" value={fmt(stats.points_a_rehabiliter)} hint="Points d’eau prioritaires" />
        <Kpi label="Sans GPS" value={fmt(stats.points_sans_gps)} hint="Correction cartographique" />
        <Kpi label="Communes couvertes" value={fmt(stats.communes_couvertes)} hint={`Dernière donnée : ${date(stats.derniere_observation)}`} />
      </div>

      <div className="grid-3" style={{ marginTop: 18 }}>
        <MiniBarChart title="Couverture par module" data={data.charts.modules || []} />
        <MiniBarChart title="Alertes par module" data={data.charts.alertes_par_module || []} />
        <MiniBarChart title="Couverture territoriale" data={data.charts.couverture_territoriale || []} />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="panel">
          <h2>Lecture stratégique</h2>
          <div className="recommendation-list">
            {(data.recommandations || []).map((r: string, i: number) => <div className="recommendation" key={i}>{r}</div>)}
          </div>
        </div>
        <div className="panel">
          <h2>Supervision des synchronisations</h2>
          <div className="supervision-grid">
            <div><span>Dernière synchro</span><strong>{date(lastSync?.date_sync || stats.derniere_sync)}</strong></div>
            <div><span>Module</span><strong>{normalizeModule(lastSync?.module)}</strong></div>
            <div><span>Statut</span><strong>{val(lastSync?.statut)}</strong></div>
            <div><span>Enregistrements</span><strong>{fmt(lastSync?.nb_enregistrements)}</strong></div>
          </div>
          <div className="quick-actions"><Link className="btn btn-soft" href="/admin/synchronisation">Ouvrir la synchronisation</Link></div>
        </div>
      </div>

      <div className="grid-4 module-health" style={{ marginTop: 18 }}>
        {Object.entries(modules).map(([key, m]: any) => {
          const s = m.stats || m;
          const observations = s.observations ?? s.total ?? 0;
          const sites = s.sites ?? s.communes ?? 0;
          const alerts = s.alertes ?? s.alertes_qualite ?? s.non_fonctionnels ?? 0;
          return <div className="panel" key={key}>
            <h2>{m.label || normalizeModule(key)}</h2>
            <div className="module-health-row"><span>Sites / unités</span><strong>{fmt(sites)}</strong></div>
            <div className="module-health-row"><span>Observations / fiches</span><strong>{fmt(observations)}</strong></div>
            <div className="module-health-row"><span>Alertes</span><strong>{fmt(alerts)}</strong></div>
            <div className="quick-actions"><Link className="btn btn-soft" href={key === "points_eau" ? "/points-eau" : `/${key}`}>Voir le module</Link></div>
          </div>;
        })}
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <MiniBarChart title="Points d’eau par commune" data={data.charts.communes_points_eau || []} />
        <MiniBarChart title="Fonctionnalité des points d’eau" data={data.charts.fonctionnalite_points_eau || []} />
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Alertes et priorités</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th>Module</th><th>Niveau</th><th>Commune</th><th>Site</th><th>Date</th><th>Message</th></tr></thead><tbody>
          {alertes.slice(0, 20).map((a: any, i: number) => <tr key={`${a.module}-${i}`}><td>{normalizeModule(a.module)}</td><td><span className={badgeClass(a.niveau)}>{val(a.niveau)}</span></td><td>{val(a.commune)}</td><td>{val(a.site)}</td><td>{date(a.date)}</td><td>{val(a.message)}</td></tr>)}
          {!alertes.length && <tr><td colSpan={6}>Aucune alerte consolidée.</td></tr>}
        </tbody></table></div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Dernières observations hydrologiques</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th>Module</th><th>Date</th><th>Site</th><th>Commune</th><th>Valeur</th></tr></thead><tbody>
          {(data.dernieres_observations || []).slice(0, 15).map((r: any, i: number) => <tr key={i}><td>{r.module}</td><td>{date(r.date)}</td><td>{val(r.site)}</td><td>{val(r.commune)}</td><td>{val(r.valeur)} {val(r.unite) !== "--" ? r.unite : ""}</td></tr>)}
          {!data.dernieres_observations?.length && <tr><td colSpan={5}>Aucune observation récente disponible.</td></tr>}
        </tbody></table></div>
      </div>

      <p className="muted" style={{ marginTop: 14 }}>Source : {data.source}. Généré le {new Date(data.generated_at).toLocaleString("fr-FR")}.</p>
    </div>
  );
}
