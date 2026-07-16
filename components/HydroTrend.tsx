"use client";
import { useEffect, useState } from "react";

export default function HydroTrend() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/dashboard/global").then(r => r.json()).then(j => setData(j.data)).catch(() => setData(null)); }, []);
  if (!data) return <div className="notice-empty">Chargement des tendances...</div>;

  const values = [
    { label: "Pluie", value: Number(data.observations_pluvio || 0) },
    { label: "Piézo", value: Number(data.observations_piezo || 0) },
    { label: "Limni", value: Number(data.observations_limni || 0) },
    { label: "Points", value: Number(data.points_eau || 0) },
  ];
  const max = Math.max(...values.map(v => v.value), 1);
  return <div>
    <div className="chart">{values.map(v => <div key={v.label} className="bar" title={`${v.label}: ${v.value}`} style={{ height: `${Math.max(8, (v.value / max) * 100)}%` }} />)}</div>
    <div className="notice-empty">Synthèse dynamique : pluie cumulée, piézométrie, limnimétrie et points suivis. Les indicateurs avancés sont configurables en mode Administrateur PTCS.</div>
  </div>;
}
