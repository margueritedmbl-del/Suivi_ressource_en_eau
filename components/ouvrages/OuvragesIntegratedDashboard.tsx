"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Droplets, Gauge, MapPin, PanelsTopLeft, Sun, TestTube2, Waves, Tractor } from "lucide-react";
import IntegratedAssetsMap from "@/components/ouvrages/IntegratedAssetsMap";
import SecureDocumentButton from "@/components/ouvrages/SecureDocumentButton";
import foragesData from "@/public/data/referentiels/forages_exploitation_crr_pm.json";
import piezometresData from "@/public/data/referentiels/piezometres_reference.json";
import analysesData from "@/public/data/referentiels/analyses_eau_piezometres_manifest.json";
import microbarragesData from "@/public/data/referentiels/microbarrages_reference.json";
import { useRole } from "@/components/auth/useRole";
import { authFetch } from "@/lib/auth-client";

import agrData from "@/public/data/referentiels/infrastructures_agr_2026.json";

type Forage = { profondeur_foree_m?:number; debit_essai_courte_duree_m3h?:number|null; debit_maximal_essai_longue_duree_m3h?:number|null; alertes_source?:string[]; source_pages_pdf?:number[]; code:string; composante:string; commune:string; site:string; forage:string; latitude:number|null; longitude:number|null; hmt_m:number; cote_installation_pompe_m:number; debit_exploitation_m3h:number|null; nombre_modules:number; puissance_installee_kwc:number; marque_pompe:string; entreprise:string };
type Piezo = { code:string; commune:string; village:string; point_implantation:string; latitude:number; longitude:number; profondeur_totale_m?:number; niveau_statique_m?:number; debit_developpement_m3h?:number; rabattement_max_m?:number; analyse_eau_disponible:boolean };
type Microbarrage = { code:string; nom:string; commune:string; village:string; latitude:number; longitude:number; annee_construction:number; surface_bassin_versant_km2:number; surface_inondee_ha:number; surface_riziculture_ha:number; surface_maraichage_ha:number; nombre_exploitants:number; crue_projet_100ans_m3s:number; diagnostic_avant:string[]; travaux_realises:string[]; curage_surface_ha:number; curage_profondeur_m:number; curage_volume_estime_m3:number; lignes_cordons_pierreux:number; digue_filtrante_longueur_m:number;  cordons_pierreux_ml?:number; digue_filtrante_gabion_m3?:number; euphorbia_ml?:number; date_reception_provisoire?:string; taux_execution_pct?:number; statut_travaux:string; source:string };

type Tab = "forages"|"piezos"|"qualite"|"microbarrages"|"agr";

function fmt(v:any, digits=1){ if(v===null||v===undefined||v==="")return "—"; const n=Number(v); return Number.isFinite(n) ? n.toLocaleString("fr-FR",{maximumFractionDigits:digits}) : "—"; }
function money(v:number){ return `${Number(v||0).toLocaleString("fr-FR")} FCFA`; }

export default function OuvragesIntegratedDashboard(){
  const { isSuperAdmin } = useRole();
  const [financials,setFinancials]=useState<Record<string,number>>({});
  const [agrFinancials,setAgrFinancials]=useState<Record<string,any>>({});
  const [agrExportError,setAgrExportError]=useState("");
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

  useEffect(()=>{let active=true;if(!isSuperAdmin){setAgrFinancials({});return;}authFetch("/api/ouvrages/agr/finances").then(async res=>{if(!res.ok)throw new Error(`HTTP ${res.status}`);return res.json();}).then(j=>{if(active)setAgrFinancials(Object.fromEntries((j.rows||[]).map((x:any)=>[x.code,x])));}).catch(()=>{if(active)setAgrFinancials({});});return()=>{active=false};},[isSuperAdmin]);
  async function downloadAgrCosts(){setAgrExportError("");try{const res=await authFetch("/api/ouvrages/agr/finances?format=csv");if(!res.ok)throw new Error(`HTTP ${res.status}`);const url=URL.createObjectURL(await res.blob());const a=document.createElement("a");a.href=url;a.download="agr-couts-ht.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e:any){setAgrExportError(e.message||"Export indisponible");}}
  const knownFlows=forages.filter(f=>f.debit_exploitation_m3h!==null&&Number.isFinite(f.debit_exploitation_m3h));
  const totalFlow=knownFlows.reduce((sum,f)=>sum+(f.debit_exploitation_m3h??0),0);
  const solarModules=forages.reduce((sum,f)=>sum+Number(f.nombre_modules||0),0);
  const solarKwc=forages.reduce((sum,f)=>sum+Number(f.puissance_installee_kwc||0),0);
  const visibleForages=useMemo(()=>filter==="Tous"?forages:forages.filter(f=>f.composante===filter),[filter,forages]);
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
      <article><PanelsTopLeft/><span>Forages d’exploitation</span><strong>{forages.length}</strong><small>{forages.filter(f=>f.composante==="CRR").length} CRR + {forages.filter(f=>f.composante==="PM").length} PM + {forages.filter(f=>f.composante==="EP").length} EP</small></article>
      <article><Tractor/><span>AGR (PM, BIA, EP, UAB)</span><strong>{agrData.length}</strong><small>Sites aménagés, distincts des forages</small></article>
      <article><Gauge/><span>Débits d’exploitation renseignés</span><strong>{fmt(totalFlow)} m³/h</strong><small>{knownFlows.length}/{forages.length} débits renseignés; aucun volume mesuré déduit</small></article>
      <article><Sun/><span>Équipement solaire</span><strong>{solarModules} modules</strong><small>{fmt(solarKwc,2)} kWc théoriques calculés depuis les modules</small></article>
      <article><Droplets/><span>Piézomètres</span><strong>20</strong><small>20 essais de pompage</small></article>
      <article><Waves/><span>Micro-barrages</span><strong>4</strong><small>Travaux exécutés à 100 % et réceptionnés provisoirement</small></article>
      <article><TestTube2/><span>Analyses d’eau</span><strong>20/20</strong><small>Certificats référencés</small></article>
    </section>

    <IntegratedAssetsMap showFinancials={isSuperAdmin} financials={financials} />

    <section className="panel integrated-reference-note"><strong>Référentiels et sources</strong><span>Forages antérieurs : UTM 29N / WGS 84; sites AGR : longitude/latitude du fichier GPS</span><span>CIP = cote d’installation de la pompe</span><span>Nadiobougou : second forage = F2</span><span>Micro-barrages : quantités exécutées selon le rapport CEST n°03</span></section>

    <div className="map-tools ouvrages-tabs" role="tablist" aria-label="Catégories d’ouvrages">
      <button className={tab==="forages"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("forages")}>Forages CRR / PM / EP</button>
      <button className={tab==="piezos"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("piezos")}>Piézomètres et essais</button>
      <button className={tab==="qualite"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("qualite")}>Analyses d’eau</button>
      <button className={tab==="microbarrages"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("microbarrages")}><Waves size={17}/> Micro-barrages</button>
      <button className={tab==="agr"?"btn btn-primary":"btn btn-soft"} onClick={()=>setTab("agr")}>AGR (PM, BIA, EP, UAB) · {agrData.length}</button>
    </div>

    {tab==="agr" && <section className="panel">
      <div className="panel-title-row"><div><h2>AGR (PM, BIA, EP, UAB)</h2><p>PM : périmètre maraîcher · BIA : boutique d’intrants agricoles · EP : étang piscicole · UAB : unité d’aliment bétail. Les CRR restent dans le référentiel des forages.</p></div><a className="btn btn-soft" href="/data/referentiels/infrastructures_agr_2026.csv" download><Download size={16}/> CSV AGR</a></div>
      <p>Superficies et équipements : fichier GPS AGR VF. Les coûts disponibles portent sur les périmètres de travaux indiqués; une tranche d’aménagement ne représente pas le coût complet.</p>
      {isSuperAdmin&&<button className="btn btn-soft" onClick={downloadAgrCosts}>Exporter les coûts HT</button>}{agrExportError&&<p role="alert">{agrExportError}</p>}
      <div className="table-wrap"><table><thead><tr><th>Site / code</th><th>Commune</th><th>Type</th><th>Superficie</th><th>Équipements / adduction</th><th>Forages liés</th>{isSuperAdmin&&<th>Montant HT et périmètre</th>}</tr></thead><tbody>{agrData.map(a=><tr key={a.code}><td><strong>{a.site}</strong><br/>{a.code}</td><td>{a.commune}</td><td>{a.type}</td><td>{fmt(a.surface_ha,2)}{a.surface_ha!==null?" ha":""}</td><td>{a.equipement_interne||"Non renseigné"}<br/>{a.systeme_adduction||""}</td><td>{a.forages_reference.join(", ")||"Non concerné / non renseigné"}{a.points_a_verifier&&<details><summary>Réserves source</summary>{a.points_a_verifier.map((v,i)=><p key={i}>{v}</p>)}</details>}</td>{isSuperAdmin&&<td>{agrFinancials[a.code]?<>{money(agrFinancials[a.code].montant_ht_fcfa)}<p>{agrFinancials[a.code].perimetre}</p><small>{agrFinancials[a.code].methode} · PDF p.{agrFinancials[a.code].source_pages_pdf.join(", ")} · {agrFinancials[a.code].reserve}</small></>:"Non renseigné"}</td>}</tr>)}</tbody></table></div>
    </section>}

    {tab==="forages" && <section className="panel">
      <div className="panel-title-row"><div><h2>Forages d’exploitation</h2><p>Référentiel par forage CRR, PM et EP. Débits d’essai, maxima d’essai long et débit d’exploitation restent distincts.</p></div><a className="btn btn-soft" href="/data/referentiels/forages_exploitation_crr_pm.csv" download><Download size={16}/> CSV forages</a></div>
      <div className="map-tools">{["Tous","CRR","PM","EP"].map(v=><button key={v} className={filter===v?"btn btn-primary":"btn btn-soft"} onClick={()=>setFilter(v)}>{v} ({v==="Tous"?forages.length:forages.filter(f=>f.composante===v).length})</button>)}</div>
      <p className="notice-empty">Aucun volume prélevé n’est déduit des seuls débits. Un volume mesuré exige des index de compteur datés; une estimation exige un débit et une durée documentés. Les 18 nouveaux forages sont rattachés au site AGR sans coordonnées individuelles validées.</p>
      <div className="table-wrap"><table><thead><tr><th>Code / source</th><th>Composante / site</th><th>Forage</th><th>Débit d’exploitation</th><th>Essai court</th><th>Maximum essai long</th><th>Profondeur / HMT / CIP</th><th>Pompe / solaire</th><th>Qualité / position</th></tr></thead><tbody>{visibleForages.map(f=><tr key={f.code}><td><strong>{f.code}</strong>{f.source_pages_pdf&&<small> · Rapport PDF p.{f.source_pages_pdf.join(", ")}</small>}</td><td>{f.composante}<br/>{f.commune} / {f.site}</td><td>{f.forage}</td><td>{fmt(f.debit_exploitation_m3h)} m³/h</td><td>{fmt(f.debit_essai_courte_duree_m3h)} m³/h</td><td>{fmt(f.debit_maximal_essai_longue_duree_m3h)} m³/h</td><td>{fmt(f.profondeur_foree_m)} / {fmt(f.hmt_m)} / {fmt(f.cote_installation_pompe_m)} m</td><td>{f.marque_pompe}<br/>{f.nombre_modules} modules · {fmt(f.puissance_installee_kwc,2)} kWc calculés</td><td>{f.latitude===null||f.longitude===null?"Coordonnées individuelles non renseignées; site AGR identifié":`${fmt(f.latitude,5)}, ${fmt(f.longitude,5)}`}{f.alertes_source&&<details><summary>Réserves de la source</summary>{f.alertes_source.map((v,i)=><p key={i}>{v}</p>)}</details>}</td></tr>)}</tbody></table></div>
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
