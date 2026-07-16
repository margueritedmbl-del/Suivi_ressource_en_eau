"use client";
import { useEffect, useState } from "react";
export default function PublicStats() {
  const [stats, setStats] = useState<any>(null);
  useEffect(()=>{fetch("/api/public/stats").then(r=>r.json()).then(j=>setStats(j.data))},[]);
  if(!stats) return <div className="panel">Chargement des statistiques publiques...</div>;
  return <div className="grid-4">
    <div className="kpi"><div className="label">Points d'eau</div><div className="value">{stats.points_eau}</div><p className="hint">Inventaire agrégé</p></div>
    <div className="kpi"><div className="label">Pluviométrie</div><div className="value">{stats.pluviometrie}</div><p className="hint">Observations agrégées</p></div>
    <div className="kpi"><div className="label">Piézométrie</div><div className="value">{stats.piezometrie}</div><p className="hint">Observations agrégées</p></div>
    <div className="kpi"><div className="label">Limnimétrie</div><div className="value">{stats.limnimetrie}</div><p className="hint">Observations agrégées</p></div>
  </div>
}
