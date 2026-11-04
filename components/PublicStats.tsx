"use client";
import {usePublicOverview} from "@/components/PublicOverviewProvider";
const labels={pluviometrie:"Pluviométrie",piezometrie:"Piézométrie",limnimetrie:"Limnimétrie"};
const fmt=(n:number|null)=>n===null?"Indisponible":n.toLocaleString("fr-FR");
export default function PublicStats(){
 const {data,error}=usePublicOverview();
 if(!data)return <div className="notice-empty" role="status">{error||"Chargement des statistiques publiques…"}</div>;
 return <>{error&&<p role="status">{error} Dernières données conservées.</p>}<div className="grid-4">
 <div className="kpi"><div className="label">Points d’eau</div><div className="value">{fmt(data.points.count)}</div><p className="hint">Fiches d’inventaire distinctes</p><small>Source : {data.points.source}</small></div>
 {Object.entries(labels).map(([key,label])=>{const m=data.modules[key];return <div className="kpi" key={key}><div className="label">{label}</div><div className="value">{fmt(m.measurements)}</div><p className="hint">Mesures disponibles, toutes dates opérationnelles</p><p className="hint">{m.network} stations du réseau · {m.stations===null?"suivi indisponible":`${m.stations} avec mesures`}</p><small>Dernière mesure : {m.lastDate||"non disponible"}</small></div>;})}
 </div><p className="muted">Actualisation : {new Date(data.generatedAt).toLocaleString("fr-FR",{timeZone:"Africa/Bamako"})} (Bamako). Les dates futures sont exclues.</p></>;
}
