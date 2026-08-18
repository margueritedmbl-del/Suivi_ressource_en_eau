"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

export default function DocumentsManager(){
  const [type,setType]=useState("analyse"); const [files,setFiles]=useState<FileList|null>(null); const [status,setStatus]=useState<any>(null); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  async function refresh(){try{const r=await authFetch("/api/admin/documents/status");setStatus(await r.json())}catch(e:any){setMessage(e?.message||"Statut indisponible")}}
  useEffect(()=>{refresh()},[]);
  async function upload(){if(!files?.length)return;setLoading(true);setMessage("");try{const fd=new FormData();fd.set("type",type);Array.from(files).forEach(f=>fd.append("files",f));const r=await authFetch("/api/admin/documents/upload",{method:"POST",body:fd});const j=await r.json();const ok=(j.results||[]).filter((x:any)=>x.ok).length;const ko=(j.results||[]).filter((x:any)=>!x.ok).length;setMessage(`${ok} fichier(s) transféré(s), ${ko} échec(s).`);await refresh()}catch(e:any){setMessage(e?.message||"Téléversement impossible") }finally{setLoading(false)}}
  return <div className="panel"><h2>Documents techniques des piézomètres</h2><p>Charge les certificats d’analyse ou les fiches d’essai directement dans le bucket privé Supabase. Les fichiers doivent être nommés PZ-01.pdf … PZ-20.pdf.</p>
    <div className="filters-grid"><label><span>Type</span><select className="input" value={type} onChange={e=>setType(e.target.value)}><option value="analyse">Analyses d’eau</option><option value="essai">Essais de pompage</option></select></label><label><span>PDF</span><input className="input" type="file" accept="application/pdf" multiple onChange={e=>setFiles(e.target.files)}/></label></div>
    <div className="quick-actions"><button className="btn btn-primary" disabled={loading||!files?.length} onClick={upload}>{loading?"Transfert…":"Téléverser vers Supabase"}</button><button className="btn btn-soft" onClick={refresh}>Actualiser le statut</button></div>{message&&<p className="muted">{message}</p>}
    {status?.rows&&<><div className="grid-4"><article className="kpi"><span>Analyses disponibles</span><strong>{status.stats?.analyses||0}/20</strong></article><article className="kpi"><span>Essais disponibles</span><strong>{status.stats?.essais||0}/20</strong></article></div><div className="table-wrap"><table className="table"><thead><tr><th>Code</th><th>Site</th><th>Analyse</th><th>Essai</th></tr></thead><tbody>{status.rows.map((x:any)=><tr key={x.code}><td>{x.code}</td><td>{x.site}</td><td>{x.analyse?"Disponible":"Absent"}</td><td>{x.essai?"Disponible":"Absent"}</td></tr>)}</tbody></table></div></>}
  </div>
}
