"use client";
import {useState} from "react";
import {usePublicOverview} from "@/components/PublicOverviewProvider";
const labels={pluviometrie:"Pluie",piezometrie:"Nappe",limnimetrie:"Cours d’eau"};
const shortDate=(d:string)=>`${d.slice(8,10)}/${d.slice(5,7)}`;
export default function HydroTrend(){
 const {data,error}=usePublicOverview(),[module,setModule]=useState<keyof typeof labels>("pluviometrie");
 if(!data)return <div className="notice-empty" role="status">{error||"Chargement des tendances…"}</div>;
 const m=data.modules[module],series=m.series,values=series.filter(p=>p.value!==null).map(p=>p.value as number),low=values.length?Math.min(...values):0,high=values.length?Math.max(...values):1,min=module==="pluviometrie"?0:low-(high-low||1)*.1,max=high+(high-low||1)*.1,span=max-min||1;
 const X=(i:number)=>48+i*290/29,Y=(v:number)=>190-(v-min)/span*155;
 const parts:string[]=[];let segment="";series.forEach((p,i)=>{if(p.value===null){if(segment)parts.push(segment);segment="";}else segment+=`${segment?"L":"M"}${X(i)},${Y(p.value)} `;});if(segment)parts.push(segment);
 return <div className="public-hydro-trend"><div className="map-tools" role="group" aria-label="Indicateur hydrologique">{Object.entries(labels).map(([key,label])=><button key={key} className={key===module?"btn btn-primary":"btn btn-soft"} aria-pressed={module===key} onClick={()=>setModule(key as keyof typeof labels)}>{label}</button>)}</div>
 <p>30 derniers jours : {shortDate(data.period.start)} – {shortDate(data.period.end)} · {m.unit}</p>
 {error&&<p role="status">{error} Dernières données conservées.</p>}
 {m.status!=="ok"?<div className="notice-empty">Source temporairement indisponible.</div>:!values.length?<div className="notice-empty">Aucune mesure exploitable sur cette période.</div>:<svg viewBox="0 0 360 225" style={{width:"100%",height:"auto",background:"#f8fafc",borderRadius:18}} role="img" aria-label={`${labels[module]} : moyenne journalière du réseau, en ${m.unit}, du ${data.period.start} au ${data.period.end}`}>
 {[0,.5,1].map(t=>{const v=min+t*span;return <g key={t}><line x1="48" x2="343" y1={Y(v)} y2={Y(v)} stroke="#dbe4ef"/><text x="42" y={Y(v)+4} textAnchor="end" fontSize="10" fill="#475569">{v.toLocaleString("fr-FR",{maximumFractionDigits:1})}</text></g>;})}
 {module==="pluviometrie"?series.map((p,i)=>p.value===null?null:<rect key={p.date} x={X(i)-3} y={Y(p.value)} width="6" height={Math.max(1,Y(0)-Y(p.value))} fill="#0077b6"><title>{`${p.date} : ${p.value.toFixed(2)} ${m.unit} · ${p.stations} station(s)`}</title></rect>):<>{parts.map((d,i)=><path key={i} d={d} fill="none" stroke="#5b2a86" strokeWidth="2"/>)}{series.map((p,i)=>p.value===null?null:<circle key={p.date} cx={X(i)} cy={Y(p.value)} r="3" fill="#5b2a86"><title>{`${p.date} : ${p.value.toFixed(2)} ${m.unit} · ${p.stations} station(s)`}</title></circle>)}</>}
 {[0,14,29].map(i=><text key={i} x={X(i)} y="213" textAnchor="middle" fontSize="10" fill="#475569">{shortDate(series[i]?.date||data.period.end)}</text>)}
 </svg>}
 <p className="muted">{module==="pluviometrie"?"Pluie journalière moyenne des stations disponibles (mm), sans additionner les pluviomètres.":module==="piezometrie"?"Profondeur moyenne du niveau statique (m) : une hausse indique une nappe plus profonde.":"Hauteur d’eau moyenne (cm), après moyenne des lectures de chaque station."} Moyenne par station puis par jour du réseau. L’effectif peut varier selon les jours ; les lacunes ne valent pas zéro.</p>
 {values.length>0&&<details><summary>Données et effectifs journaliers</summary><div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Moyenne ({m.unit})</th><th>Stations</th></tr></thead><tbody>{series.map(p=><tr key={p.date}><td>{shortDate(p.date)}</td><td>{p.value===null?"—":p.value.toLocaleString("fr-FR",{maximumFractionDigits:2})}</td><td>{p.stations}</td></tr>)}</tbody></table></div></details>}
 </div>;
}
