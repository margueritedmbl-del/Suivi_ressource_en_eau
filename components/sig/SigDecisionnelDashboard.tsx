"use client";
import { useEffect, useMemo, useState } from "react";
import restorations from "@/public/data/decisionnel/restaurations_resume.json";
import microbarrages from "@/public/data/referentiels/microbarrages_reference.json";
import forages from "@/public/data/referentiels/forages_exploitation_crr_pm.json";
import piezos from "@/public/data/referentiels/piezometres_reference.json";
import { classifyPiezoEvolution, normalizeLocality } from "@/lib/piezo-reference";

function n(v:any){const x=Number(v);return Number.isFinite(x)?x:0}
function numeric(v:any){const x=Number(String(v??"").replace(",","."));return Number.isFinite(x)?x:null}
function format(x:number,d=0){return x.toLocaleString("fr-FR",{maximumFractionDigits:d})}
function val(r:any,...keys:string[]){for(const k of keys){if(r?.[k]!==undefined&&r?.[k]!==null&&r?.[k]!=="")return r[k]}return null}
function dateOf(r:any){return String(val(r,"date_observation","date_mesure","date")||"")}

export default function SigDecisionnelDashboard(){
  const [surfaceScenario,setSurfaceScenario]=useState(500);
  const [rayon,setRayon]=useState(2000);
  const [liveRows,setLiveRows]=useState<any[]>([]);
  const [liveError,setLiveError]=useState("");
  const data:any=restorations;
  const micro:any[]=Array.isArray(microbarrages)?microbarrages:(microbarrages as any).data||[];
  const fs:any[]=Array.isArray(forages)?forages:(forages as any).data||[];
  const pz:any[]=Array.isArray(piezos)?piezos:(piezos as any).data||[];

  useEffect(()=>{fetch("/api/dashboard/module?module=piezometrie",{cache:"no-store"}).then(r=>r.json()).then(j=>{if(j?.ok===false)throw new Error(j.error||"Erreur");setLiveRows(Array.isArray(j?.data)?j.data:[])}).catch(e=>setLiveError(e?.message||"Données actuelles indisponibles"))},[]);

  const technologies=useMemo(()=>Object.entries((data as any).technologies||{}).sort((a:any,b:any)=>Number(b[1])-Number(a[1])),[data]);
  const communes=useMemo(()=>Object.entries((data as any).communes||{}).sort((a:any,b:any)=>Number(b[1])-Number(a[1])),[data]);
  const currentSurface=n((data as any).surface_ha);
  const projected=currentSurface+n(surfaceScenario);
  const coverage=Math.min(100, Math.round((pz.length/20)*100));
  const pressureSites=fs.length;
  const priority=surfaceScenario>=1000?"Élevée":surfaceScenario>=500?"Modérée":"Exploratoire";

  const piezoComparison=useMemo(()=>pz.map((ref:any)=>{
    const key=normalizeLocality(ref.village);
    const matches=liveRows.filter(r=>{
      const code=String(val(r,"code_site","code_piezo")||"").toUpperCase();
      return code===String(ref.code).toUpperCase() || normalizeLocality(val(r,"nom_site","village","localite","site","code_site"))===key;
    }).sort((a,b)=>dateOf(b).localeCompare(dateOf(a)));
    const latest=matches[0]||null;
    const current=latest?numeric(val(latest,"niveau_statique","valeur_observee")):null;
    return {...ref,current,date_current:latest?dateOf(latest):null,...classifyPiezoEvolution(ref.niveau_statique_m,current)};
  }),[pz,liveRows]);
  const comparable=piezoComparison.filter(x=>x.current!==null);
  const meanDelta=comparable.length?comparable.reduce((s,x)=>s+Number(x.delta||0),0)/comparable.length:null;
  const trends=piezoComparison.reduce((a:any,x:any)=>{a[x.status]=(a[x.status]||0)+1;return a},{});

  return <div className="integrated-observatory">
    <section className="panel"><h2>Lecture territoriale intégrée</h2><p>Le SIG décisionnel croise les restaurations, les 4 micro-barrages réhabilités, les forages d’exploitation CRR/PM et le réseau piézométrique. Les indicateurs décrivent les données disponibles ; ils ne constituent pas, à eux seuls, une preuve de causalité hydrogéologique.</p>
      <div className="sig-decision-grid"><article><small>Restaurations recensées</small><b>{format(n((data as any).sites))}</b><span>parcelles/sites</span></article><article><small>Surface restaurée</small><b>{format(currentSurface,1)} ha</b><span>d’après le shapefile transmis</span></article><article><small>Micro-barrages</small><b>{micro.length}</b><span>réhabilités à 100 %</span></article><article><small>Réseau de suivi</small><b>{pz.length} PZ</b><span>+ {pressureSites} forages CRR/PM</span></article></div>
    </section>

    <section className="panel"><h2>Évolution piézométrique par rapport à l’état initial 2025</h2><p>Le rapprochement utilise le code interne lorsqu’il est disponible, puis le nom normalisé de la localité. Le niveau initial provient des essais de pompage ; le niveau actuel provient des observations synchronisées Epicollect5.</p>{liveError&&<div className="alert warn">{liveError}</div>}
      <div className="sig-decision-grid"><article><small>Sites comparables</small><b>{comparable.length}/20</b><span>avec mesure actuelle</span></article><article><small>Écart moyen NS</small><b>{meanDelta===null?"—":`${meanDelta>0?"+":""}${format(meanDelta,2)} m`}</b><span>positif = nappe plus profonde</span></article><article><small>Hausse / stable</small><b>{trends.Hausse||0} / {trends.Stable||0}</b><span>vs. état initial</span></article><article><small>Baisse</small><b>{trends.Baisse||0}</b><span>vs. état initial</span></article></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Localité</th><th>NS initial</th><th>NS actuel</th><th>Écart</th><th>Évolution</th><th>Date actuelle</th></tr></thead><tbody>{piezoComparison.map((x:any)=><tr key={x.code}><td><strong>{x.village}</strong></td><td>{numeric(x.niveau_statique_m)===null?"—":`${format(Number(x.niveau_statique_m),2)} m`}</td><td>{x.current===null?"—":`${format(x.current,2)} m`}</td><td>{x.delta===null?"—":`${x.delta>0?"+":""}${format(x.delta,2)} m`}</td><td>{x.status}</td><td>{x.date_current||"—"}</td></tr>)}</tbody></table></div>
    </section>

    <div className="sig-two-col"><section className="panel"><h2>Technologies de restauration</h2><ol className="sig-ranking">{technologies.slice(0,10).map(([k,v]:any)=><li key={String(k)}><strong>{String(k)}</strong> — {format(Number(v))} site(s)</li>)}</ol></section><section className="panel"><h2>Répartition communale</h2><ol className="sig-ranking">{communes.map(([k,v]:any)=><li key={String(k)}><strong>{String(k)}</strong> — {format(Number(v))} site(s)</li>)}</ol></section></div>
    <section className="panel"><h2>Scénario d’aide à la décision</h2><div className="filters-grid"><label>Surface additionnelle à restaurer (ha)<input type="number" min="0" step="50" value={surfaceScenario} onChange={e=>setSurfaceScenario(Number(e.target.value)||0)}/></label><label>Rayon d’influence à analyser (m)<select value={rayon} onChange={e=>setRayon(Number(e.target.value))}>{[250,500,1000,2000,5000,10000].map(v=><option key={v} value={v}>{v<1000?`${v} m`:`${v/1000} km`}</option>)}</select></label></div><div className="sig-decision-grid"><article><small>Surface projetée</small><b>{format(projected,1)} ha</b></article><article><small>Priorité indicative</small><b>{priority}</b></article><article><small>Couverture PZ de référence</small><b>{coverage}%</b></article><article><small>Rayon d’analyse</small><b>{rayon<1000?`${rayon} m`:`${rayon/1000} km`}</b></article></div><p className="decision-note">Les analyses d’impact devront contrôler simultanément la pluie, la saison, les prélèvements, la distance aux restaurations et micro-barrages, ainsi que la durée depuis la réhabilitation. Une corrélation spatiale ou temporelle ne sera pas interprétée automatiquement comme une causalité.</p></section>
  </div>;
}
