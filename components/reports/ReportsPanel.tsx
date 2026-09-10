"use client";
import { useMemo, useState } from "react";
import { useRole } from "@/components/auth/useRole";
import { authFetch } from "@/lib/auth-client";

export default function ReportsPanel() {
  const { role, canAccessReports } = useRole();
  const [module, setModule] = useState("pluviometrie");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [sb, setSb] = useState("98");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const query = useMemo(() => { const p=new URLSearchParams({module}); if(module==="sous_bassin")p.set("sb",sb); if(start)p.set("start",start); if(end)p.set("end",end); return p.toString(); },[module,start,end,sb]);
  async function download(format:string){ if(!canAccessReports)return; setBusy(format);setMsg(""); try{ const endpoint=module==="points_eau"?"/api/reports/export-v2":"/api/reports/export-v4"; const r=await authFetch(`${endpoint}?${query}&format=${format}`); if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||`HTTP ${r.status}`);} const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;const cd=r.headers.get("content-disposition")||"",m=cd.match(/filename="?([^";]+)"?/i);a.download=m?.[1]||`psore_rapport.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}catch(e:any){setMsg(`Erreur : ${e?.message||"export impossible"}`)}finally{setBusy("")}}
  return <div className="panel"><h2>Rapports techniques — PSORE</h2><p><span className="role-badge">Rôle : {role}</span></p><p className="muted">Les rapports hydro utilisent une couche analytique commune : contrôle qualité, exclusion des doublons et données à vérifier, indicateurs piézométriques par commune, pluviométrie, niveaux des cours d’eau et cartographie harmonisée. Les points d’eau restent des fiches d’inventaire d’ouvrages.</p>{!canAccessReports&&<div className="notice-empty">Rapports techniques réservés aux rôles DNH/DRHK, Administrateur PTCS et Super administrateur.</div>}<div className="grid-2"><select className="input" value={module} onChange={e=>setModule(e.target.value)}><option value="pluviometrie">Pluviométrie</option><option value="piezometrie">Piézométrie</option><option value="limnimetrie">Limnimétrie</option><option value="points_eau">Points d'eau</option><option value="sous_bassin">Rapport intégré de sous-bassin</option></select>{module==="sous_bassin"&&<label><span>Identifiant du sous-bassin</span><input className="input" value={sb} onChange={e=>setSb(e.target.value.replace(/[^0-9]/g,""))} placeholder="Ex. 102"/></label>}{module!=="sous_bassin"&&<><label><span>Début</span><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label><span>Fin</span><input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label></>}</div><div className="report-grid" style={{marginTop:16}}>{["pdf","docx","xlsx","csv"].map(f=><button key={f} className="btn btn-primary" disabled={!canAccessReports||!!busy} onClick={()=>download(f)}>{busy===f?"Génération...":`Exporter ${f.toUpperCase()}`}</button>)}</div>{msg&&<div className="notice-empty">{msg}</div>}</div>;
}
