"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";
import ManualDataImport from "@/components/admin/ManualDataImport";

function formatDuration(ms: any) { const n=Number(ms||0); if(!n)return "—"; return n<1000?`${n} ms`:`${(n/1000).toFixed(1)} s`; }
async function parseResponse(response: Response) {
  const text = await response.text();
  let json:any={};
  try { json=text?JSON.parse(text):{}; } catch { throw new Error(`Réponse serveur non JSON (HTTP ${response.status}).`); }
  if (!response.ok || !json.ok) {
    if (response.status===401) throw new Error("Authentification requise ou session expirée. Reconnectez-vous.");
    if (response.status===403) throw new Error("Votre rôle ne permet pas cette opération.");
    throw new Error(json.error || `Erreur HTTP ${response.status}`);
  }
  return json;
}

export default function SyncLogs() {
  const [logs,setLogs]=useState<any[]>([]); const [loading,setLoading]=useState(false); const [message,setMessage]=useState(""); const [diagnostic,setDiagnostic]=useState<any>(null);
  async function loadLogs(){ const r=await authFetch("/api/admin/sync-logs"); const j=await parseResponse(r); setLogs(j.data||[]); }
  async function runSync(path:string,label:string){ setLoading(true);setMessage(`Synchronisation ${label} en cours…`);try{const j=await parseResponse(await authFetch(path,{method:"POST"}));const rs=j.results||[];const total=rs.reduce((s:number,r:any)=>s+Number(r.upserted||r.count||0),0);const errs=rs.filter((r:any)=>r.status==="error");setMessage(errs.length?`${label} terminé avec ${errs.length} erreur(s) : ${total} intégré(s). Consultez le journal ci-dessous.`:`${label} terminé : ${total} enregistrement(s) synchronisé(s).`);await loadLogs();}catch(e:any){setMessage(`Erreur ${label} : ${e.message}`);}finally{setLoading(false)}}
  async function loadDiagnostic(probe=false){try{setMessage(probe?"Test direct des sources Epicollect5 en cours…":message);const r=await authFetch(`/api/sync/diagnostic${probe?"?probe=1":""}`);const j=await parseResponse(r);setDiagnostic(j);if(probe)setMessage("Test Epicollect5 terminé : comparez Total API et Données exploitables ci-dessous.");}catch(e:any){setMessage(`Diagnostic indisponible : ${e.message}`);}}
  useEffect(()=>{loadLogs().catch((e:any)=>setMessage(`Historique indisponible : ${e.message}`));loadDiagnostic();},[]);
  const actions=[["/api/sync/all","Tout"],["/api/sync/points-eau","Points d'eau"],["/api/sync/pluviometrie","Pluviométrie"],["/api/sync/piezometrie","Piézométrie"],["/api/sync/limnimetrie","Limnimétrie"]] as const;
  return <><ManualDataImport onCompleted={()=>loadLogs()}/><div style={{height:18}}/><div className="panel"><h2>Synchronisation Epicollect5</h2><p style={{color:"#64748b"}}>Utilisez ces boutons depuis une session connectée. L’ouverture directe d’une URL <code>/api/sync/…</code> dans un nouvel onglet sans jeton renvoie volontairement « Authentification requise ».</p><div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"14px 0"}}>{actions.map(([p,l])=><button key={p} className={l==="Tout"?"btn btn-primary":"btn btn-soft"} disabled={loading} onClick={()=>runSync(p,l)}>{loading?"Patientez…":`Synchroniser ${l}`}</button>)}<button className="btn btn-primary" disabled={loading} onClick={()=>runSync("/api/sync/all?full=1","Réparation complète parents/enfants")}>Réparer et resynchroniser tout</button></div>{message&&<p><strong>{message}</strong></p>}{diagnostic&&<div className="panel" style={{margin:"14px 0",padding:14}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><h3 style={{margin:0}}>Diagnostic moteur {diagnostic.engine}</h3><button className="btn btn-soft" disabled={loading} onClick={()=>loadDiagnostic(true)}>Tester les sources Epicollect5</button></div><div className="table-wrap"><table className="table"><thead><tr><th>Module</th><th>Source</th><th>Type</th><th>Total API</th><th>Données exploitables</th><th>Parent</th><th>Liaison directe</th><th>Registre UUID</th></tr></thead><tbody>{(diagnostic.sources||[]).map((s:any)=><tr key={`${s.module}-${s.type_source}`}><td>{s.module}</td><td>{s.libelle}</td><td>{s.type_source}</td><td>{s.probe?.ok?(s.probe.total??"?"):s.probe?.error?`Erreur ${s.probe.status||""}`:"—"}</td><td>{s.donnees_exploitables??"—"}</td><td>{s.parent_form_ref?"Sous-formulaire fils":"Formulaire principal"}</td><td>{s.relation_parent_enfant?`${s.relation_parent_enfant.linked??0}/${s.relation_parent_enfant.total??0}`:"—"}</td><td>{s.registre_parent?`${s.registre_parent.enfants_lies_registre??0}/${s.relation_parent_enfant?.total??0}`:"—"}</td></tr>)}</tbody></table></div></div>}<h2>Historique des synchronisations</h2><div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Module</th><th>Source</th><th>Pages</th><th>Récupérés</th><th>Synchronisés</th><th>Durée</th><th>Statut</th><th>Message</th></tr></thead><tbody>{logs.map(l=><tr key={l.id}><td>{l.date_sync}</td><td>{l.module}</td><td>{l.source}</td><td>{l.page_count??"—"}</td><td>{l.fetched_count??"—"}</td><td>{l.upserted_count??l.nb_enregistrements}</td><td>{formatDuration(l.duration_ms)}</td><td>{l.statut}</td><td>{l.message}</td></tr>)}{!logs.length&&<tr><td colSpan={9}>Aucune synchronisation enregistrée.</td></tr>}</tbody></table></div></div></>;
}
