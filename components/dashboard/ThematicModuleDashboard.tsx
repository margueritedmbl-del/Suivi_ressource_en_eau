"use client";

import { useEffect, useMemo, useState } from "react";
import Kpi from "@/components/Kpi";
import LeafletMap from "@/components/map/LeafletMap";
import MiniBarChart from "@/components/dashboard/MiniBarChart";

type ModuleName = "pluviometrie" | "piezometrie" | "limnimetrie";

const moduleLabels: Record<ModuleName, string> = {
  pluviometrie: "Pluviométrie",
  piezometrie: "Piézométrie",
  limnimetrie: "Limnimétrie",
};

const valueLabels: Record<ModuleName, string> = {
  pluviometrie: "Pluie 24h",
  piezometrie: "Niveau statique",
  limnimetrie: "Hauteur d’eau",
};

const unitLabels: Record<ModuleName, string> = {
  pluviometrie: "mm",
  piezometrie: "m",
  limnimetrie: "m / cm",
};

function v(x: any) {
  return x === null || x === undefined || x === "" ? "--" : String(x);
}

function fmtNumber(x: any, unit = "") {
  if (x === null || x === undefined || x === "") return "--";
  const n = Number(x);
  if (!Number.isFinite(n)) return String(x);
  return `${Math.round(n * 100) / 100}${unit ? ` ${unit}` : ""}`;
}

function buildParams(filters: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, val] of Object.entries(filters)) {
    if (val && val !== "all") params.set(k, val);
  }
  return params;
}

function interpretation(module: ModuleName, stats: any) {
  const alerts = Number(stats.alertes || 0);
  const obs = Number(stats.observations || 0);
  const missingGps = Number(stats.sans_gps || 0);
  if (!obs) return "Aucune observation synchronisée pour ce filtre. Lancez une synchronisation ou élargissez la période.";
  if (alerts > 0) return `${alerts} observation(s) nécessitent une vérification. Priorité : contrôler les valeurs aberrantes et les coordonnées GPS manquantes.`;
  if (missingGps > 0) return `${missingGps} site(s) sans coordonnées GPS. La donnée est exploitable en tableau mais pas en cartographie.`;
  if (module === "pluviometrie") return "Les relevés pluviométriques filtrés ne présentent pas d’alerte automatique. Surveillez les cumuls extrêmes et les périodes sans collecte.";
  if (module === "piezometrie") return "Les mesures piézométriques filtrées sont cohérentes selon les contrôles automatiques. Suivez les tendances de baisse sur plusieurs campagnes.";
  return "Les lectures limnimétriques filtrées sont cohérentes selon les contrôles automatiques. Suivez les variations rapides entre matin et soir.";
}

export default function ThematicModuleDashboard({ module }: { module: ModuleName }) {
  const [json, setJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [commune, setCommune] = useState("all");
  const [site, setSite] = useState("all");
  const [alerte, setAlerte] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const params = useMemo(() => buildParams({ module, commune, site, alerte, start, end }), [module, commune, site, alerte, start, end]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/module?${params.toString()}`)
      .then((r) => r.json())
      .then(setJson)
      .finally(() => setLoading(false));
  }, [params]);

  const stats = json?.stats || {};
  const rows = json?.data || [];
  const filters = json?.filters || {};
  const exportQuery = params.toString();

  return (
    <>
      <div className="panel filters-panel">
        <div>
          <h2>Analyse dynamique — {moduleLabels[module]}</h2>
          <p className="muted">
            KPI, filtres, carte, évolution temporelle, tableau et exports. Source : {json?.source || "chargement"}
          </p>
        </div>

        <div className="filters-grid compact filters-grid-wide">
          <label>
            <span>Commune</span>
            <select className="input" value={commune} onChange={(e) => { setCommune(e.target.value); setSite("all"); }}>
              <option value="all">Toutes</option>
              {(filters.communes || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span>Site / station</span>
            <select className="input" value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="all">Tous</option>
              {(filters.sites || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            <span>Alerte</span>
            <select className="input" value={alerte} onChange={(e) => setAlerte(e.target.value)}>
              <option value="all">Toutes les données</option>
              <option value="yes">Alertes seulement</option>
              <option value="no">Sans alerte</option>
            </select>
          </label>
          <label>
            <span>Début</span>
            <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            <span>Fin</span>
            <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>

        <div className="quick-actions">
          <a className="btn btn-primary" href={`/api/export/csv?${exportQuery}`}>Exporter CSV</a>
          <a className="btn btn-soft" href={`/api/export/xlsx?${exportQuery}`}>Exporter Excel</a>
          <button className="btn btn-soft" onClick={() => { setCommune("all"); setSite("all"); setAlerte("all"); setStart(""); setEnd(""); }}>Réinitialiser</button>
        </div>
      </div>

      <div className="grid-4" style={{ marginTop: 18 }}>
        <Kpi label="Observations" value={v(stats.observations)} hint="Données synchronisées" />
        <Kpi label="Sites" value={v(stats.sites)} hint="Stations / ouvrages" />
        <Kpi label={`Moyenne ${unitLabels[module]}`} value={fmtNumber(stats.moyenne)} hint={valueLabels[module]} />
        <Kpi label="Alertes" value={v(stats.alertes)} hint="Contrôle qualité" />
      </div>

      <div className="grid-4" style={{ marginTop: 18 }}>
        <Kpi label="Minimum" value={fmtNumber(stats.minimum)} hint={valueLabels[module]} />
        <Kpi label="Maximum" value={fmtNumber(stats.maximum)} hint={valueLabels[module]} />
        <Kpi label="Sans GPS" value={v(stats.sans_gps)} hint="Sites non cartographiables" />
        <Kpi label="Dernière donnée" value={v(stats.derniere_observation)} hint="Date observation" />
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Interprétation automatique</h2>
        <p className="muted">{loading ? "Analyse en cours..." : interpretation(module, stats)}</p>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <MiniBarChart title="Répartition par commune" data={(json?.charts?.communes || []).slice(0, 10)} />
        <MiniBarChart title="Évolution récente" data={(json?.charts?.evolution || []).slice(-12)} />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <MiniBarChart title="Top sites / stations" data={(json?.charts?.sites || []).slice(0, 10)} />
        <MiniBarChart title="Alertes par type" data={(json?.charts?.alertes || []).slice(0, 10)} />
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Carte du module</h2>
        <LeafletMap module={module} />
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Données récentes</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th><th>Site</th><th>Commune</th><th>{valueLabels[module]}</th><th>Alerte</th><th>Observateur</th><th>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 150).map((r: any, i: number) => {
                const isAlert = Boolean(r.alerte_valeur || r.alerte_gps || r.alerte_donnee);
                return <tr key={r.id || i}>
                  <td>{v(r.date_observation)}</td>
                  <td>{v(r.code_site || r.code_station || r.code_piezo)}</td>
                  <td>{v(r.commune)}</td>
                  <td>{fmtNumber(r.valeur_observee || r.pluie_24h_mm || r.niveau_statique || r.hauteur_eau)}</td>
                  <td><span className={isAlert ? "badge danger" : "badge ok"}>{isAlert ? "À vérifier" : "OK"}</span></td>
                  <td>{v(r.observateur)}</td>
                  <td>{v(r.commentaire)}</td>
                </tr>;
              })}
              {!rows.length && <tr><td colSpan={7}>Aucune donnée pour les filtres sélectionnés.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
