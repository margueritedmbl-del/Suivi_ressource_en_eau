"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Droplets, Gauge, MapPin, PanelsTopLeft, Sun, TestTube2 } from "lucide-react";
import IntegratedAssetsMap from "@/components/ouvrages/IntegratedAssetsMap";
import SecureDocumentButton from "@/components/ouvrages/SecureDocumentButton";
import resumeData from "@/public/data/referentiels/referentiel_resume.json";
import foragesData from "@/public/data/referentiels/forages_exploitation_crr_pm.json";
import piezometresData from "@/public/data/referentiels/piezometres_reference.json";
import analysesData from "@/public/data/referentiels/analyses_eau_piezometres_manifest.json";

type Forage = { code:string; composante:string; commune:string; site:string; forage:string; latitude:number; longitude:number; hmt_m:number; cote_installation_pompe_m:number; debit_exploitation_m3h:number; nombre_modules:number; puissance_installee_kwc:number; marque_pompe:string; entreprise:string };
type Piezo = { code:string; commune:string; village:string; point_implantation:string; latitude:number; longitude:number; profondeur_totale_m?:number; niveau_statique_m?:number; debit_developpement_m3h?:number; rabattement_max_m?:number; analyse_eau_disponible:boolean };

function fmt(v:any, digits=1){ const n=Number(v); return Number.isFinite(n) ? n.toLocaleString("fr-FR",{maximumFractionDigits:digits}) : "—"; }

export default function OuvragesIntegratedDashboard(){
  const data = { ok: true, resume: resumeData, forages: foragesData, piezometres: piezometresData, analyses: analysesData };
  const [tab,setTab]=useState<"forages"|"piezos"|"qualite">("forages"); const [filter,setFilter]=useState("Tous");
  const forages:Forage[]=data?.forages||[]; const piezos:Piezo[]=data?.piezometres||[];
  const visibleForages=useMemo(()=>filter==="Tous"?forages:forages.filter(f=>f.composante===filter),[filter,forages]);
  const r=data.resume;
  return <div className="integrated-observatory">
    <section className="integrated-kpis">
      <article><PanelsTopLeft/><span>Forages d’exploitation</span><strong>16</strong><small>8 CRR + 8 PM</small></article>
      <article><Gauge/><span>Débit nominal cumulé</span><strong>{fmt(r.forages_exploitation.debit_nominal_total_m3h)} m³/h</strong><small>Somme des débits recommandés</small></article>
      <article><Sun/><span>Équipement solaire</span><strong>{r.forages_exploitation.modules_pv} modules</strong><small>{fmt(r.forages_exploitation.puissance_installee_totale_kwc,2)} kWc calculés</small></article>
      <article><Droplets/><span>Piézomètres</span><strong>20</strong><small>20 essais de pompage</small></article>
      <article><TestTube2/><span>Analyses d’eau</span><strong>20/20</strong><small>Certificats disponibles</small></article>
    </section>

    <IntegratedAssetsMap />

    <section className="panel integrated-reference-note"><strong>Référentiel validé</strong><span>WGS 84 / UTM 29N — EPSG:32629</span><span>CIP = cote d’installation de la pompe</span><span>Nadiobougou : second forage = F2</span></section>

    <div className="map-tools">
      <button className={tab==="forages"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("forages")}>Forages CRR / PM</button>
      <button className={tab==="piezos"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("piezos")}>Piézomètres et essais</button>
      <button className={tab==="qualite"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("qualite")}>Analyses d’eau</button>
    </div>

    {tab==="forages" && <section className="panel">
      <div className="panel-title-row"><div><h2>Forages d’exploitation</h2><p>Référentiel consolidé des composantes CRR et PM.</p></div><a className="btn btn-soft" href="/data/referentiels/forages_exploitation_crr_pm.csv" download><Download size={16}/> CSV</a></div>
      <div className="map-tools"><button className={filter==="Tous"?"btn btn-primary":"btn btn-soft"} onClick={()=>setFilter("Tous")}>Tous (16)</button><button className={filter==="CRR"?"btn btn-primary":"btn btn-soft"} onClick={()=>setFilter("CRR")}>CRR (8)</button><button className={filter==="PM"?"btn btn-primary":"btn btn-soft"} onClick={()=>setFilter("PM")}>PM (8)</button></div>
      <div className="table-wrap"><table><thead><tr><th>Code</th><th>Composante</th><th>Site</th><th>Forage</th><th>Débit</th><th>HMT</th><th>CIP</th><th>Solaire</th><th>Position</th></tr></thead><tbody>{visibleForages.map(f=><tr key={f.code}><td><strong>{f.code}</strong></td><td><span className={`tag ${f.composante.toLowerCase()}`}>{f.composante}</span></td><td>{f.commune} / {f.site}</td><td>{f.forage}</td><td>{fmt(f.debit_exploitation_m3h)} m³/h</td><td>{fmt(f.hmt_m)} m</td><td>{fmt(f.cote_installation_pompe_m)} m</td><td>{f.nombre_modules} modules · {fmt(f.puissance_installee_kwc,2)} kWc</td><td><MapPin size={14}/> {fmt(f.latitude,5)}, {fmt(f.longitude,5)}</td></tr>)}</tbody></table></div>
    </section>}

    {tab==="piezos" && <section className="panel">
      <div className="panel-title-row"><div><h2>Piézomètres et essais de pompage</h2><p>Coordonnées, caractéristiques initiales et résultats des essais.</p></div><a className="btn btn-soft" href="/data/referentiels/piezometres_reference.csv" download><Download size={16}/> CSV</a></div>
      <div className="table-wrap"><table><thead><tr><th>Code</th><th>Commune / site</th><th>Point</th><th>Profondeur</th><th>Niveau statique</th><th>Débit développement</th><th>Rabattement max.</th><th>Analyse eau</th><th>Documents</th></tr></thead><tbody>{piezos.map(p=><tr key={p.code}><td><strong>{p.code}</strong></td><td>{p.commune} / {p.village}</td><td>{p.point_implantation}</td><td>{fmt(p.profondeur_totale_m)} m</td><td>{fmt(p.niveau_statique_m)} m</td><td>{fmt(p.debit_developpement_m3h)} m³/h</td><td>{fmt(p.rabattement_max_m)} m</td><td><span className="tag ok">Disponible</span></td><td><SecureDocumentButton code={p.code} type="essai" label="Essai" /> <SecureDocumentButton code={p.code} type="analyse" label="Analyse" /></td></tr>)}</tbody></table></div>
    </section>}

    {tab==="qualite" && <section className="panel">
      <div className="panel-title-row"><div><h2>Disponibilité des analyses d’eau</h2><p>Les 20 certificats sont recensés et protégés dans Supabase Storage. Les paramètres analytiques doivent être saisis ou validés avant exploitation statistique.</p></div><a className="btn btn-soft" href="/data/referentiels/analyses_eau_piezometres_manifest.json" download><Download size={16}/> Manifest</a></div>
      <div className="quality-grid">{(data.analyses||[]).map((a:any)=><article key={a.code}><TestTube2/><div><strong>{a.code} · {a.site}</strong><span>{a.commune}</span><small>{a.statut_extraction}</small><SecureDocumentButton code={a.code} type="analyse" label="Ouvrir le certificat" /></div></article>)}</div>
    </section>}

    <section className="panel integrated-next"><h2>Suivi opérationnel préparé</h2><p>Les migrations SQL créent les tables de suivi et le registre sécurisé des documents. Les PDF sont servis par URL signée depuis Supabase Storage et ne sont plus inclus dans GitHub.</p></section>
  </div>;
}
