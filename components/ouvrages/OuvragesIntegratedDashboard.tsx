"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Droplets, Gauge, MapPin, PanelsTopLeft, Sun, TestTube2, Waves, Tractor } from "lucide-react";
import IntegratedAssetsMap from "@/components/ouvrages/IntegratedAssetsMap";
import SecureDocumentButton from "@/components/ouvrages/SecureDocumentButton";
import resumeData from "@/public/data/referentiels/referentiel_resume.json";
import foragesData from "@/public/data/referentiels/forages_exploitation_crr_pm.json";
import piezometresData from "@/public/data/referentiels/piezometres_reference.json";
import analysesData from "@/public/data/referentiels/analyses_eau_piezometres_manifest.json";
import microbarragesData from "@/public/data/referentiels/microbarrages_reference.json";
import { useRole } from "@/components/auth/useRole";
import { authFetch } from "@/lib/auth-client";

type Forage = { code:string; composante:string; commune:string; site:string; forage:string; latitude:number; longitude:number; hmt_m:number; cote_installation_pompe_m:number; debit_exploitation_m3h:number; nombre_modules:number; puissance_installee_kwc:number; marque_pompe:string; entreprise:string };
type Piezo = { code:string; commune:string; village:string; point_implantation:string; latitude:number; longitude:number; profondeur_totale_m?:number; niveau_statique_m?:number; debit_developpement_m3h?:number; rabattement_max_m?:number; analyse_eau_disponible:boolean };
type Microbarrage = { code:string; nom:string; commune:string; village:string; latitude:number; longitude:number; annee_construction:number; surface_bassin_versant_km2:number; surface_inondee_ha:number; surface_riziculture_ha:number; surface_maraichage_ha:number; nombre_exploitants:number; crue_projet_100ans_m3s:number; diagnostic_avant:string[]; travaux_realises:string[]; curage_surface_ha:number; curage_profondeur_m:number; curage_volume_estime_m3:number; lignes_cordons_pierreux:number; digue_filtrante_longueur_m:number;  cordons_pierreux_ml?:number; digue_filtrante_gabion_m3?:number; euphorbia_ml?:number; date_reception_provisoire?:string; taux_execution_pct?:number; statut_travaux:string; source:string };

type Tab = "forages"|"piezos"|"qualite"|"microbarrages";

function fmt(v:any, digits=1){ const n=Number(v); return Number.isFinite(n) ? n.toLocaleString("fr-FR",{maximumFractionDigits:digits}) : "—"; }
function money(v:number){ return `${Number(v||0).toLocaleString("fr-FR")} FCFA`; }

export default function OuvragesIntegratedDashboard(){
  const { isSuperAdmin } = useRole();
  const [financials,setFinancials]=useState<Record<string,number>>({});
  const [tab,setTab]=useState<Tab>("forages");
  const [filter,setFilter]=useState("Tous");
  const [expanded,setExpanded]=useState<string|null>(null);
  const forages:Forage[]=Array.isArray(foragesData) ? foragesData as Forage[] : [];
  const piezos:Piezo[]=Array.isArray(piezometresData) ? piezometresData as Piezo[] : [];
  const barrages:Microbarrage[]=Array.isArray(microbarragesData) ? microbarragesData as Microbarrage[] : [];
  useEffect(()=>{
    if(!isSuperAdmin){ setFinancials({}); return; }
    let active=true;
    authFetch("/api/ouvrages/microbarrages/finances").then(async res=>{
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json=await res.json();
      if(!active) return;
      const mapped:Record<string,number>={};
      for(const row of (json.rows||[])) mapped[row.code]=Number(row.cout_execute_fcfa||0);
      setFinancials(mapped);
    }).catch(()=>{ if(active) setFinancials({}); });
    return()=>{active=false};
  },[isSuperAdmin]);

  const visibleForages=useMemo(()=>filter==="Tous"?forages:forages.filter(f=>f.composante===filter),[filter,forages]);
  const r:any=resumeData;
  const barrageTotals=useMemo(()=>({
    cout:Object.values(financials).reduce<number>((s,v)=>s+Number(v||0),0),
    curageHa:barrages.reduce((s,b)=>s+b.curage_surface_ha,0),
    curageM3:barrages.reduce((s,b)=>s+b.curage_volume_estime_m3,0),
    digues:barrages.reduce((s,b)=>s+Number(b.digue_filtrante_gabion_m3||0),0),
    beneficiaires:barrages.reduce((s,b)=>s+b.nombre_exploitants,0)
  }),[barrages,financials]);

  return <div className="integrated-observatory">
    <div className="build-version-badge">PSORE V4.4.1 · Données financières réservées au Super administrateur</div>
    <section className="integrated-kpis">
      <article><PanelsTopLeft/><span>Forages d’exploitation</span><strong>16</strong><small>8 CRR + 8 PM</small></article>
      <article><Gauge/><span>Débit nominal cumulé</span><strong>{fmt(r.forages_exploitation.debit_nominal_total_m3h)} m³/h</strong><small>Somme des débits recommandés</small></article>
      <article><Sun/><span>Équipement solaire</span><strong>{r.forages_exploitation.modules_pv} modules</strong><small>{fmt(r.forages_exploitation.puissance_installee_totale_kwc,2)} kWc calculés</small></article>
      <article><Droplets/><span>Piézomètres</span><strong>20</strong><small>20 essais de pompage</small></article>
      <article><Waves/><span>Micro-barrages</span><strong>4</strong><small>Travaux exécutés à 100 % et réceptionnés provisoirement</small></article>
      <article><TestTube2/><span>Analyses d’eau</span><strong>20/20</strong><small>Certificats référencés</small></article>
    </section>

    <IntegratedAssetsMap showFinancials={isSuperAdmin} financials={financials} />

    <section className="panel integrated-reference-note"><strong>Référentiel validé</strong><span>WGS 84 / UTM 29N — EPSG:32629</span><span>CIP = cote d’installation de la pompe</span><span>Nadiobougou : second forage = F2</span><span>Micro-barrages : quantités exécutées selon le rapport CEST n°03</span></section>

    <div className="map-tools ouvrages-tabs" role="tablist" aria-label="Catégories d’ouvrages">
      <button className={tab==="forages"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("forages")}>Forages CRR / PM</button>
      <button className={tab==="piezos"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("piezos")}>Piézomètres et essais</button>
      <button className={tab==="qualite"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("qualite")}>Analyses d’eau</button>
      <button className={tab==="microbarrages"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("microbarrages")}><Waves size={17}/> Micro-barrages</button>
    </div>

    {tab==="forages" && <section className="panel">
      <div className="panel-title-row"><div><h2>Forages d’exploitation</h2><p>Référentiel consolidé des composantes CRR et PM.</p></div><a className="btn btn-soft" href="/data/referentiels/forages_exploitation_crr_pm.csv" download><Download size={16}/> CSV</a></div>
      <div className="map-tools"><button className={filter==="Tous"?"btn btn-primary":"btn btn-soft"} onClick={()=>setFilter("Tous")}>Tous (16)</button><button className={filter==="CRR"?"btn btn-primary":"btn btn-soft"} onClick={()=>setFilter("CRR")}>CRR (8)</button><button className={filter==="PM"?"btn btn-primary":"btn btn-soft"} onClick={()=>setFilter("PM")}>PM (8)</button></div>
      <div className="table-wrap"><table><thead><tr><th>Code</th><th>Composante</th><th>Site</th><th>Forage</th><th>Débit</th><th>HMT</th><th>CIP</th><th>Solaire</th><th>Position</th></tr></thead><tbody>{visibleForages.map(f=><tr key={f.code}><td><strong>{f.code}</strong></td><td><span className={`tag ${f.composante.toLowerCase()}`}>{f.composante}</span></td><td>{f.commune} / {f.site}</td><td>{f.forage}</td><td>{fmt(f.debit_exploitation_m3h)} m³/h</td><td>{fmt(f.hmt_m)} m</td><td>{fmt(f.cote_installation_pompe_m)} m</td><td>{f.nombre_modules} modules · {fmt(f.puissance_installee_kwc,2)} kWc</td><td><MapPin size={14}/> {fmt(f.latitude,5)}, {fmt(f.longitude,5)}</td></tr>)}</tbody></table></div>
    </section>}

    {tab==="piezos" && <section className="panel">
      <div className="panel-title-row"><div><h2>Piézomètres et essais de pompage</h2><p>Coordonnées, caractéristiques initiales et résultats des essais.</p></div><a className="btn btn-soft" href="/data/referentiels/piezometres_reference.csv" download><Download size={16}/> CSV</a></div>
      <div className="table-wrap"><table><thead><tr><th>Code</th><th>Commune / site</th><th>Point</th><th>Profondeur</th><th>Niveau statique</th><th>Débit développement</th><th>Rabattement max.</th><th>Analyse eau</th><th>Documents</th></tr></thead><tbody>{piezos.map(p=><tr key={p.code}><td><strong>{p.code}</strong></td><td>{p.commune} / {p.village}</td><td>{p.point_implantation}</td><td>{fmt(p.profondeur_totale_m)} m</td><td>{fmt(p.niveau_statique_m)} m</td><td>{fmt(p.debit_developpement_m3h)} m³/h</td><td>{fmt(p.rabattement_max_m)} m</td><td><span className="tag ok">Référencée</span></td><td><SecureDocumentButton code={p.code} type="essai" label="Essai" /> <SecureDocumentButton code={p.code} type="analyse" label="Analyse" /></td></tr>)}</tbody></table></div>
    </section>}

    {tab==="qualite" && <section className="panel">
      <div className="panel-title-row"><div><h2>Disponibilité des analyses d’eau</h2><p>Les 20 certificats sont recensés. Leur ouverture dépend de la présence effective des fichiers dans Supabase Storage et des droits de l’utilisateur.</p></div><a className="btn btn-soft" href="/data/referentiels/analyses_eau_piezometres_manifest.json" download><Download size={16}/> Manifest</a></div>
      <div className="quality-grid">{(analysesData as any[]).map((a:any)=><article key={a.code}><TestTube2/><div><strong>{a.code} · {a.site}</strong><span>{a.commune}</span><small>Certificat référencé — paramètres à saisir ou valider</small><SecureDocumentButton code={a.code} type="analyse" label="Vérifier et ouvrir" /></div></article>)}</div>
    </section>}

    {tab==="microbarrages" && <section className="panel microbarrages-panel">
      <div className="panel-title-row"><div><h2>Micro-barrages réhabilités</h2><p>Le rapport mensuel n°03 de suivi-contrôle confirme un avancement de 100 % sur les quatre sites et la réception provisoire des travaux les 12–13 août 2025.</p></div><a className="btn btn-soft" href="/data/referentiels/microbarrages_reference.csv" download><Download size={16}/> CSV</a></div>
      <div className="microbarrage-summary">
        <article><Tractor/><span>Surface curée</span><strong>{fmt(barrageTotals.curageHa)} ha</strong><small>{fmt(barrageTotals.curageM3,0)} m³ estimés</small></article>
        <article><Waves/><span>Gabions de digues filtrantes</span><strong>{fmt(barrageTotals.digues,1)} m³</strong><small>Quantité exécutée recensée</small></article>
        <article><PanelsTopLeft/><span>Exploitants</span><strong>{fmt(barrageTotals.beneficiaires,0)}</strong><small>Référentiel socioéconomique APD</small></article>
        {isSuperAdmin && <article><Gauge/><span>Montant exécuté cumulé</span><strong>{money(barrageTotals.cout)}</strong><small>Visible uniquement en session Super administrateur</small></article>}
      </div>
      <div className="microbarrage-grid">{barrages.map(b=><article key={b.code} className="microbarrage-card">
        <div className="microbarrage-card-head"><div><span className="tag ok">{b.statut_travaux}</span><h3>{b.code} · {b.nom}</h3><p>{b.commune} / {b.village}</p></div><Waves/></div>
        <div className="microbarrage-kpis"><span><b>{fmt(b.surface_bassin_versant_km2)}</b> km² BV</span><span><b>{fmt(b.surface_inondee_ha)}</b> ha inondés</span><span><b>{fmt(b.crue_projet_100ans_m3s)}</b> m³/s Q100</span><span><b>{fmt(b.nombre_exploitants,0)}</b> exploitants</span></div>
        <p><strong>Curage :</strong> {b.curage_surface_ha>0 ? `${fmt(b.curage_surface_ha)} ha sur ${fmt(b.curage_profondeur_m,2)} m, soit environ ${fmt(b.curage_volume_estime_m3,0)} m³` : "aucun curage prévu dans l’APD"}</p>
        <p><strong>CES/DRS :</strong> {fmt(b.cordons_pierreux_ml,0)} ml de cordons pierreux{Number(b.digue_filtrante_gabion_m3||0)>0 ? ` et ${fmt(b.digue_filtrante_gabion_m3,1)} m³ de gabions de digue filtrante` : ""}.</p>
        <p>{isSuperAdmin && <><strong>Montant exécuté :</strong> {money(financials[b.code] || 0)} · </>}<strong>Réception provisoire :</strong> {b.date_reception_provisoire || "12–13 août 2025"}</p>
        <button className="btn btn-soft" onClick={()=>setExpanded(expanded===b.code?null:b.code)}>{expanded===b.code?"Masquer les détails":"Voir diagnostic et travaux"}</button>
        {expanded===b.code && <div className="microbarrage-details"><div><h4>Diagnostic avant réhabilitation</h4><ul>{b.diagnostic_avant.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div><h4>Travaux effectivement réalisés selon le rapport de contrôle</h4><ul>{b.travaux_realises.map((x,i)=><li key={i}>{x}</li>)}</ul></div><small>{b.source}</small></div>}
      </article>)}</div>
    </section>}

    <section className="panel integrated-next"><h2>Suivi opérationnel</h2><p>Le référentiel distingue désormais forages d’exploitation, piézomètres, qualité de l’eau et micro-barrages. Les prochaines observations temporelles devront documenter les niveaux de retenue, l’envasement, l’entretien, les volumes prélevés et l’évolution piézométrique autour des ouvrages.</p></section>
  </div>;
}
