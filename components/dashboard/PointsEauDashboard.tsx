"use client";

import { useEffect, useMemo, useState } from "react";
import Kpi from "@/components/Kpi";
import LeafletMap from "@/components/map/LeafletMap";
import MiniBarChart from "@/components/dashboard/MiniBarChart";

type Api = any;

const selectFields = [
  ["commune", "Commune"],
  ["village", "Village"],
  ["type_infrastructure", "Type"],
  ["statut_fonctionnalite", "Fonctionnalité"],
  ["equipement", "Équipement"],
  ["organe_gestion", "Organe de gestion"],
  ["priorite_rehabilitation", "Priorité"],
];

const filterMap: Record<string, string> = {
  commune: "communes",
  village: "villages",
  type_infrastructure: "types",
  statut_fonctionnalite: "fonctionnalites",
  equipement: "equipements",
  organe_gestion: "organes",
  priorite_rehabilitation: "priorites",
};

function val(v: any) {
  return v === null || v === undefined || v === "" ? "--" : String(v);
}

function priorityClass(value: any) {
  return val(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function buildQuery(filters: Record<string, string>) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && v !== "all" && p.set(k, v));
  return p.toString();
}

function AlertList({ title, rows, field }: { title: string; rows: any[]; field?: string }) {
  return (
    <div className="quality-card">
      <strong>{title}</strong>
      <span>{rows?.length || 0} cas</span>
      <div className="quality-list">
        {(rows || []).slice(0, 5).map((r: any, i: number) => (
          <small key={`${r.id || r.source_entry_id || r.code_pe || i}-${title}`}>
            {val(r.commune)} / {val(r.village)} — {val(r.code_pe)}{field ? ` — ${val(r[field])}` : ""}
          </small>
        ))}
      </div>
    </div>
  );
}

export default function PointsEauDashboard() {
  const [json, setJson] = useState<Api | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const qs = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/points-eau${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then(setJson)
      .finally(() => setLoading(false));
  }, [qs]);

  const stats = json?.stats || {};
  const data = useMemo(() => {
    const rows = json?.data || [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r: any) => [r.code_pe, r.commune, r.village, r.localite, r.type_infrastructure, r.recommandation].some((x) => String(x || "").toLowerCase().includes(q)));
  }, [json, search]);

  const exportCsv = `/api/points-eau/export?format=csv${qs ? `&${qs}` : ""}`;
  const exportXlsx = `/api/points-eau/export?format=xlsx${qs ? `&${qs}` : ""}`;

  return (
    <>
      <div className="filters-panel panel">
        <div>
          <h2>Filtres dynamiques</h2>
          <p className="muted">Source : {json?.source || "chargement"}. Les données personnelles sont retirées des API publiques et des exports.</p>
        </div>
        <div className="filters-grid">
          {selectFields.map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <select className="input" value={filters[key] || "all"} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}>
                <option value="all">Tous</option>
                {(json?.filters?.[filterMap[key]] || []).map((x: string) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          ))}
          <label>
            <span>Recherche</span>
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Code, village, commune..." />
          </label>
        </div>
        <div className="quick-actions">
          <button className="btn btn-soft" onClick={() => { setFilters({}); setSearch(""); }}>Réinitialiser</button>
          <a className="btn btn-primary" href={exportCsv}>Exporter CSV filtré</a>
          <a className="btn btn-soft" href={exportXlsx}>Exporter Excel filtré</a>
        </div>
      </div>

      <div className="grid-4" style={{ marginTop: 18 }}>
        <Kpi label="Points d’eau" value={val(stats.total)} hint="Inventaire consolidé" />
        <Kpi label="Forages" value={val(stats.forages)} hint="Ouvrages motorisés ou PMH" />
        <Kpi label="Puits" value={val(stats.puits)} hint="Traditionnels / améliorés" />
        <Kpi label="Taux fonctionnalité" value={`${val(stats.taux_fonctionnalite)}%`} hint="Hors non renseignés" />
        <Kpi label="Non fonctionnels" value={val(stats.non_fonctionnels)} hint="Priorité technique" />
        <Kpi label="À réhabiliter" value={val(stats.a_rehabiliter)} hint="Score ou besoin renseigné" />
        <Kpi label="Sans GPS" value={val(stats.sans_gps)} hint={`${val(stats.avec_gps)} avec GPS`} />
        <Kpi label="Alertes qualité" value={val(stats.alertes_qualite)} hint="pH / odeur / anomalies" />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <MiniBarChart title="Points d’eau par commune" data={(json?.charts?.communes || []).slice(0, 8)} />
        <MiniBarChart title="État de fonctionnalité" data={json?.charts?.fonctionnalite || []} />
        <MiniBarChart title="Type d’équipement" data={(json?.charts?.equipements || []).slice(0, 8)} />
        <MiniBarChart title="Priorité de réhabilitation" data={json?.charts?.priorites || []} />
        <MiniBarChart title="Organe de gestion" data={json?.charts?.organes || []} />
        <MiniBarChart title="Qualité des données" data={json?.charts?.qualite_donnees || []} />
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Priorités de réhabilitation</h2>
        <p className="muted">Classement automatique selon fonctionnalité, gouvernance, besoin déclaré, problèmes signalés, qualité de l’eau et complétude GPS.</p>
        <div className="priority-strip">
          {(json?.top_priorites || []).slice(0, 8).map((r: any, i: number) => (
            <div className="priority-card" key={r.id || i}>
              <b>{val(r.code_pe)}</b>
              <span>{val(r.commune)} / {val(r.village)}</span>
              <strong className={`priority priority-${priorityClass(r.priorite_rehabilitation)}`}>{val(r.priorite_rehabilitation)} · score {val(r.score_priorite)}</strong>
              <small>{val(r.recommandation || r.problemes || "Aucune recommandation")}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Contrôle qualité des données</h2>
        <div className="quality-grid">
          <AlertList title="GPS manquants" rows={json?.controles?.gps_manquants || []} />
          <AlertList title="pH hors plage" rows={json?.controles?.ph_hors_plage || []} field="ph" />
          <AlertList title="Température anormale" rows={json?.controles?.temperature_anormale || []} field="temperature_c" />
          <AlertList title="Photos manquantes" rows={json?.controles?.photos_manquantes || []} />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Cartographie thématique — Points d’eau</h2>
        <p className="muted">Couches privées : type, fonctionnalité, réhabilitation, équipement, organe de gestion, qualité de l’eau et qualité des données.</p>
        <LeafletMap module="points_eau" />
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Tableau détaillé</h2>
        {loading && <p className="muted">Chargement des données...</p>}
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Code</th><th>Commune</th><th>Village</th><th>Type</th><th>Fonctionnalité</th><th>Équipement</th><th>Organe</th><th>pH</th><th>GPS</th><th>Priorité</th><th>Recommandation</th></tr></thead>
            <tbody>
              {data.slice(0, 300).map((r: any, i: number) => (
                <tr key={r.id || i}>
                  <td>{val(r.code_pe)}</td><td>{val(r.commune)}</td><td>{val(r.village)}</td><td>{val(r.type_infrastructure)}</td><td>{val(r.statut_fonctionnalite)}</td><td>{val(r.equipement)}</td><td>{val(r.organe_gestion)}</td><td>{val(r.ph)}</td><td>{r.alerte_gps ? "Non" : "Oui"}</td><td><span className={`priority priority-${priorityClass(r.priorite_rehabilitation)}`}>{val(r.priorite_rehabilitation)}</span></td><td>{val(r.recommandation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">Affichage limité aux 300 premières lignes filtrées pour préserver les performances. Les exports contiennent toutes les lignes filtrées.</p>
      </div>
    </>
  );
}
