"use client";
import { useMemo, useState } from "react";
import { useRole } from "@/components/auth/useRole";
import { authFetch } from "@/lib/auth-client";
import { downloadAuthenticated } from "@/lib/download-client";

const COMMUNES=["Doumba","Koula","Méguétan","Sirakorola"];

export default function ProtectedActions({formUrl,syncUrl,exportModule}:{formUrl:string;syncUrl:string;exportModule:string}){
  const{role,loading,canSync,canExportCsvXlsx,canExportAdvanced}=useRole();
  const[syncing,setSyncing]=useState(false);
  const[exporting,setExporting]=useState("");
  const[message,setMessage]=useState("");
  const[details,setDetails]=useState<any[]>([]);
  const[communes,setCommunes]=useState<string[]>([]);
  const[start,setStart]=useState("");
  const[end,setEnd]=useState("");

  const exportFilterLabel=useMemo(()=>communes.length?communes.join(" + "):"Toutes les communes",[communes]);
  function toggleCommune(c:string){setCommunes(v=>v.includes(c)?v.filter(x=>x!==c):[...v,c]);}

  async function synchronize(){setSyncing(true);setMessage("Synchronisation en cours…");setDetails([]);try{const response=await authFetch(syncUrl,{method:"POST"});const text=await response.text();let json:any={};try{json=text?JSON.parse(text):{};}catch{throw new Error(`Réponse serveur invalide (HTTP ${response.status}).`);}if(!response.ok||!json.ok){if(response.status===401)throw new Error("Session expirée ou absente. Reconnectez-vous puis relancez la synchronisation.");if(response.status===403)throw new Error(`Votre rôle (${role}) n'autorise pas cette synchronisation.`);throw new Error(json.error||`Erreur HTTP ${response.status}`);}const results=Array.isArray(json.results)?json.results:[];setDetails(results);const total=results.reduce((s:number,r:any)=>s+Number(r.upserted||0),0);const fetched=results.reduce((s:number,r:any)=>s+Number(r.fetched||0),0);const failures=results.filter((r:any)=>r.status==="error");const rejected=results.reduce((s:number,r:any)=>s+Number(r.rejected||0),0);setMessage(failures.length?`Synchronisation terminée avec ${failures.length} erreur(s) · ${total}/${fetched} intégré(s).`:`Synchronisation réussie · ${total}/${fetched} intégré(s)${rejected?` · ${rejected} non exploitable(s)`:""}.`);window.dispatchEvent(new CustomEvent("psore-sync-complete",{detail:{module:exportModule}}));}catch(e:any){setMessage(e.message||"Erreur de synchronisation");}finally{setSyncing(false);}}

  async function exportFile(format:string){
    setExporting(format);setMessage("");
    try{
      let endpoint:string;
      if(exportModule==="points_eau")endpoint="/api/reports/export-points-eau-v5";
      else if(format==="pdf")endpoint="/api/reports/export-v5-pdf-safe";
      else endpoint="/api/reports/export-v5-decision";
      const params=new URLSearchParams({module:exportModule,format});
      if(exportModule==="points_eau")params.set("scope","analytic");
      if(communes.length)params.set("communes",communes.join(","));
      if(start)params.set("start",start);
      if(end)params.set("end",end);
      await downloadAuthenticated(`${endpoint}?${params.toString()}`,`PSORE_${exportModule}.${format}`);
      setMessage(`Export généré — ${exportFilterLabel}${start||end?` · période ${start||"début"} → ${end||"fin"}`:""}.`);
    }catch(e:any){setMessage(e.message||"Export impossible")}finally{setExporting("")}
  }

  return <div>
    <p><span className="role-badge">Rôle : {loading?"chargement...":role}</span></p>
    {!loading&&!canSync&&<div className="notice-empty">Accès consultation : les formulaires et synchronisations sont réservés aux rôles autorisés.</div>}
    <div className="quick-actions">{canSync&&<a className="btn btn-primary" href={formUrl} target="_blank" rel="noreferrer">Ouvrir formulaire</a>}{canSync&&<button className="btn btn-soft" type="button" disabled={syncing} onClick={synchronize}>{syncing?"Synchronisation…":"Synchroniser"}</button>}</div>

    {(canExportCsvXlsx||canExportAdvanced)&&<div className="panel" style={{marginTop:12,padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"baseline",flexWrap:"wrap"}}>
        <div><strong>Périmètre de l’export</strong><div className="muted" style={{fontSize:13,marginTop:3}}>Choisissez une, plusieurs ou les quatre communes. Aucune sélection = toutes les communes.</div></div>
        <div className="role-badge">{exportFilterLabel}</div>
      </div>
      <div className="report-grid" style={{marginTop:10}}>{COMMUNES.map(c=><label key={c} className="btn btn-soft" style={{cursor:"pointer",justifyContent:"flex-start"}}><input type="checkbox" checked={communes.includes(c)} onChange={()=>toggleCommune(c)} style={{marginRight:8}}/>{c}</label>)}</div>
      <div className="grid-2" style={{marginTop:10}}><label><span>Début — facultatif</span><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label><span>Fin — facultatif</span><input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label></div>
      <div className="quick-actions" style={{marginTop:12}}>{canExportCsvXlsx&&["csv","xlsx"].map(f=><button key={f} type="button" className="btn btn-soft" disabled={!!exporting} onClick={()=>exportFile(f)}>{exporting===f?"Téléchargement…":f.toUpperCase()}</button>)}{canExportAdvanced&&["docx","pdf"].map(f=><button key={f} type="button" className="btn btn-soft" disabled={!!exporting} onClick={()=>exportFile(f)}>{exporting===f?"Téléchargement…":f.toUpperCase()}</button>)}</div>
    </div>}

    {message&&<div className="sync-inline-status" role="status"><strong>{message}</strong>{details.length>0&&<div style={{marginTop:8,display:"grid",gap:5}}>{details.map((r:any,i:number)=><div key={`${r.source}-${i}`} style={{fontSize:13}}><b>{r.label||r.source}</b> : {r.status==="error"?`ERREUR — ${r.error||"échec"}`:`${r.upserted}/${r.fetched} intégré(s), ${r.pages||0} page(s), ${r.mode||"?"}${r.linked?`, ${r.linked} lié(s) au parent`:""}${r.rejected?`, ${r.rejected} rejet(s)`:""}`}</div>)}</div>}</div>}
  </div>;
}
