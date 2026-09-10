export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType, TextRun } from "docx";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { requireApiRole } from "@/lib/auth-server";
import { ROLE_DNH, ROLE_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { loadHydroRows, loadOfficialStations } from "@/lib/hydro-data";
import { stationMetaByCode, displayStationCode, type HydroModule, networkTotal } from "@/lib/network-registry";
import { readPointEauRows, cleanRowsForPublic, applyPointEauFilters } from "@/services/points-eau/analytics";

type Hydro = "pluviometrie" | "piezometrie" | "limnimetrie";
const HYDRO: Hydro[] = ["pluviometrie", "piezometrie", "limnimetrie"];
const CFG: Record<Hydro, { value: string; unit: string; label: string; date: string }> = {
  pluviometrie: { value: "pluie_24h_mm", unit: "mm", label: "Précipitations journalières", date: "date_observation" },
  piezometrie: { value: "niveau_statique", unit: "m", label: "Profondeur du niveau statique", date: "date_observation" },
  limnimetrie: { value: "hauteur_eau", unit: "cm", label: "Hauteur d’eau du cours d’eau", date: "date_observation" },
};
const COLORS = { navy: "#0B2545", blue: "#0877B9", cyan: "#37B6D4", purple: "#58369A", orange: "#D97706", green: "#1F9D63", red: "#C2413A", gray: "#5F6F82", light: "#EEF5FB" };
const text = (v: any) => String(v ?? "").trim();
const n = (v: any) => { if (v === null || v === undefined || v === "") return null; const x = Number(String(v).replace(",", ".")); return Number.isFinite(x) ? x : null; };
const fr = (v: any, d = 2) => { const x = n(v); return x === null ? "Non renseigné" : x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }); };
const day = (v: any) => text(v).slice(0, 10);
const validGps = (r: any) => { const la = n(r.latitude), lo = n(r.longitude); return la !== null && lo !== null && la >= -90 && la <= 90 && lo >= -180 && lo <= 180; };
const stationCode = (m: Hydro, r: any) => { const c = text(r.code_site || r.code_station || r.code_piezo); const meta = stationMetaByCode(m as HydroModule, c); return meta ? displayStationCode(m as HydroModule, meta.code) : c; };
const obsHour = (r: any) => { const v = r.heure_observation ?? r.heure ?? r.time ?? r.timestamp ?? r.date_observation; const s = text(v); const m = s.match(/(?:T|\s)(\d{1,2}:\d{2})/); return m ? m[1].slice(0, 5) : text(r.heure_observation || r.heure || r.time).slice(0, 5); };
const obsKey = (m: Hydro, r: any) => `${text(r.code_site || r.code_station || r.code_piezo)}|${day(r.date_observation)}|${obsHour(r)}`;

function iqrBounds(rows: any[], key: string) {
  const xs = rows.map(r => n(r[key])).filter((x): x is number => x !== null).sort((a, b) => a - b);
  if (xs.length < 4) return null;
  const q = (p: number) => xs[Math.min(xs.length - 1, Math.floor((xs.length - 1) * p))];
  const q1 = q(.25), q3 = q(.75), iqr = q3 - q1;
  return { low: q1 - 1.5 * iqr, high: q3 + 1.5 * iqr };
}

function qualityHydro(rows: any[], m: Hydro) {
  const cfg = CFG[m];
  const bounds = iqrBounds(rows, cfg.value);
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(obsKey(m, r), (counts.get(obsKey(m, r)) || 0) + 1);
  const now = new Date().toISOString().slice(0, 10);
  return rows.map(r => {
    const code = text(r.code_site || r.code_station || r.code_piezo);
    const d = day(r[cfg.date]);
    const v = n(r[cfg.value]);
    const duplicate = (counts.get(obsKey(m, r)) || 0) > 1;
    const incomplete = !code || !/^\d{4}-\d{2}-\d{2}/.test(d) || v === null;
    const gps = !validGps(r);
    const future = d > now;
    const atypical = Boolean(bounds && v !== null && (v < bounds.low || v > bounds.high));
    let status = "Validée";
    if (duplicate) status = "Doublon potentiel";
    else if (incomplete) status = "À vérifier";
    else if (future || gps || atypical) status = "À vérifier";
    return { ...r, __status: status, __duplicate: duplicate, __gpsBad: gps, __future: future, __atypical: atypical };
  });
}

function qualitySummary(rows: any[]) {
  return {
    total: rows.length,
    valid: rows.filter(r => r.__status === "Validée").length,
    verify: rows.filter(r => r.__status === "À vérifier").length,
    duplicates: rows.filter(r => r.__status === "Doublon potentiel").length,
    atypical: rows.filter(r => r.__atypical).length,
    gps: rows.filter(r => r.__gpsBad).length,
    future: rows.filter(r => r.__future).length,
  };
}

function piezoEvolution(rows: any[]) {
  const by = new Map<string, any[]>();
  for (const r of rows.filter(x => x.__status === "Validée")) {
    const c = text(r.code_site || r.code_station || r.code_piezo); const v = n(r.niveau_statique); const d = day(r.date_observation);
    if (!c || v === null || !d) continue;
    const a = by.get(c) || []; a.push({ d, v }); by.set(c, a);
  }
  const out: any[] = [];
  for (const [code, a] of by) {
    a.sort((x, y) => x.d.localeCompare(y.d));
    if (a.length < 2) continue;
    const first = a[0], last = a[a.length - 1];
    const delta = first.v - last.v;
    const rate = first.v !== 0 ? delta / first.v * 100 : null;
    out.push({ code, first: first.v, last: last.v, delta, rate, count: a.length, firstDate: first.d, lastDate: last.d });
  }
  return out;
}

function weighted(values: { value: number; weight: number }[]) { const w = values.reduce((a, x) => a + x.weight, 0); return w ? values.reduce((a, x) => a + x.value * x.weight, 0) / w : null; }

function piezoCommunes(rows: any[]) {
  const station = piezoEvolution(rows);
  const communeByCode = new Map<string, string>();
  for (const r of rows) { const c = text(r.code_site || r.code_station || r.code_piezo); if (c && !communeByCode.has(c)) communeByCode.set(c, text(r.commune) || "Non renseignée"); }
  const by = new Map<string, any>();
  for (const s of station) {
    const commune = communeByCode.get(s.code) || "Non renseignée";
    const z = by.get(commune) || { commune, stations: 0, observations: 0, deltas: [], rates: [] };
    z.stations++; z.observations += s.count; z.deltas.push({ value: s.delta, weight: s.count }); if (s.rate !== null) z.rates.push({ value: s.rate, weight: s.count }); by.set(commune, z);
  }
  return Array.from(by.values()).map(z => ({ ...z, delta: weighted(z.deltas), rate: weighted(z.rates) })).sort((a, b) => (b.rate ?? -Infinity) - (a.rate ?? -Infinity));
}

function piezoGlobal(rows: any[], communes: any[]) {
  const stations = piezoEvolution(rows);
  const allRates = stations.filter(x => x.rate !== null).map(x => ({ value: x.rate, weight: x.count }));
  const allDelta = stations.map(x => ({ value: x.delta, weight: x.count }));
  return { deltaStations: weighted(allDelta), rateStations: weighted(allRates), deltaCommunes: communes.length ? communes.reduce((a, x) => a + (x.delta || 0), 0) / communes.length : null, rateCommunes: communes.length ? communes.filter(x => x.rate !== null).reduce((a, x) => a + x.rate, 0) / communes.filter(x => x.rate !== null).length : null, stations: stations.length };
}

function moduleStats(rows: any[], m: Hydro) {
  const cfg = CFG[m]; const valid = rows.filter(r => r.__status === "Validée");
  const vals = valid.map(r => n(r[cfg.value])).filter((x): x is number => x !== null);
  const stationSet = new Set(valid.map(r => stationCode(m, r)).filter(Boolean));
  return { observations: valid.length, stations: stationSet.size, average: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, min: vals.length ? Math.min(...vals) : null, max: vals.length ? Math.max(...vals) : null, last: valid.map(r => day(r[cfg.date])).sort().pop() || "Non renseigné" };
}

function limniStations(rows: any[]) {
  const by = new Map<string, any>();
  for (const r of rows.filter(x => x.__status === "Validée")) {
    const code = stationCode("limnimetrie", r); const z = by.get(code) || { code, coursEau: text(r.cours_eau || r.nom_cours_eau || r.nom_site || r.localite) || "Cours d’eau non renseigné", commune: text(r.commune), values: [] as number[] };
    const v = n(r.hauteur_eau); if (v !== null) z.values.push(v); if (text(r.cours_eau || r.nom_cours_eau || r.nom_site)) z.coursEau = text(r.cours_eau || r.nom_cours_eau || r.nom_site); by.set(code, z);
  }
  return Array.from(by.values()).map(z => ({ ...z, moyenne: z.values.length ? z.values.reduce((a: number, b: number) => a + b, 0) / z.values.length : null, mesures: z.values.length }));
}

function rainfall(rows: any[]) {
  const valid = rows.filter(r => r.__status === "Validée"); const vals = valid.map(r => n(r.pluie_24h_mm)).filter((x): x is number => x !== null); const byMonth = new Map<string, number>();
  for (const r of valid) { const d = day(r.date_observation); const v = n(r.pluie_24h_mm); if (d && v !== null) byMonth.set(d.slice(0, 7), (byMonth.get(d.slice(0, 7)) || 0) + v); }
  const days = new Set(valid.filter(r => (n(r.pluie_24h_mm) || 0) >= 0.1).map(r => day(r.date_observation))).size;
  return { average: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, total: vals.reduce((a, b) => a + b, 0), min: vals.length ? Math.min(...vals) : null, max: vals.length ? Math.max(...vals) : null, rainyDays: days, monthly: Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value })) };
}

function csv(rows: any[]) { if (!rows.length) return "Aucune donnée\n"; const h = Object.keys(rows[0]); const q = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`; return [h.map(q).join(";"), ...rows.map(r => h.map(k => q(r[k])).join(";"))].join("\n"); }
function rgb(hex: string) { const h = hex.replace("#", ""); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)] as [number,number,number]; }
function ink(p: jsPDF, c: string) { p.setTextColor(...rgb(c)); } function fill(p: jsPDF, c: string) { p.setFillColor(...rgb(c)); } function stroke(p: jsPDF, c: string) { p.setDrawColor(...rgb(c)); }
function card(p: jsPDF, x: number, y: number, w: number, label: string, value: string, color: string) { fill(p,"#FFFFFF"); stroke(p,"#D9E5EF"); p.roundedRect(x,y,w,21,3,3,"FD"); fill(p,color); p.roundedRect(x,y,3,21,2,2,"F"); ink(p,COLORS.gray); p.setFontSize(6.2); p.text(label,x+6,y+6); ink(p,COLORS.navy); p.setFont("helvetica","bold"); p.setFontSize(11.5); p.text(value,x+6,y+16); p.setFont("helvetica","normal"); }
function header(p: jsPDF, title: string, period: string) { fill(p,COLORS.navy); p.rect(0,0,297,27,"F"); ink(p,"#FFFFFF"); p.setFont("helvetica","bold"); p.setFontSize(16); p.text(title,12,11); p.setFont("helvetica","normal"); p.setFontSize(7); p.text(period,12,19); }
function axes(p: jsPDF,x:number,y:number,w:number,h:number,xLabel:string,yLabel:string,max:number) { stroke(p,"#D9E5EF"); p.line(x,y+h,x+w,y+h); p.line(x,y,x,y+h); for(let i=0;i<=4;i++){const yy=y+h-i*h/4; stroke(p,"#E8EEF4"); p.line(x,yy,x+w,yy); ink(p,COLORS.gray); p.setFontSize(4.8); p.text(fr(max*i/4,1),x-11,yy+1);} ink(p,COLORS.gray); p.setFontSize(5.5); p.text(xLabel,x+w/2-10,y+h+8); p.text(yLabel,x-1,y-4); }
function barChart(p:jsPDF,title:string,items:{label:string,value:number}[],x:number,y:number,w:number,h:number,xLabel:string,yLabel:string,color:string){ ink(p,COLORS.navy); p.setFont("helvetica","bold"); p.setFontSize(8.5); p.text(title,x,y-4); if(!items.length){ink(p,COLORS.gray);p.setFontSize(6.5);p.text("Aucune donnée validée",x+3,y+8);return;} const max=Math.max(...items.map(i=>Math.abs(i.value)),1); axes(p,x+13,y,w-18,h-13,xLabel,yLabel,max); const bw=(w-22)/items.length*.68; items.slice(0,10).forEach((it,i)=>{const bh=Math.abs(it.value)/max*(h-13); fill(p,it.value>=0?color:COLORS.red); p.rect(x+15+i*(w-18)/items.length,y+h-13-bh,bw,bh,"F"); ink(p,COLORS.gray); p.setFontSize(4.5); p.text(it.label.slice(0,12),x+15+i*(w-18)/items.length,y+h-8);}); }
function qualityTable(p:jsPDF,q:any,x:number,y:number){ ink(p,COLORS.navy);p.setFont("helvetica","bold");p.setFontSize(8.5);p.text("Contrôle qualité des données",x,y);p.setFont("helvetica","normal");ink(p,COLORS.gray);p.setFontSize(6);p.text(`Reçues : ${q.total} · Validées : ${q.valid} · À vérifier : ${q.verify} · Doublons potentiels : ${q.duplicates}`,x,y+8);p.text(`Valeurs atypiques : ${q.atypical} · GPS absents/invalides : ${q.gps} · Dates futures : ${q.future}`,x,y+15);p.text("Les données à vérifier et doublons sont conservés dans la source mais exclus des indicateurs validés.",x,y+22); }
function footer(p:jsPDF){const total=p.getNumberOfPages();for(let i=1;i<=total;i++){p.setPage(i);ink(p,COLORS.gray);p.setFontSize(5);p.text(`PSORE • PTCS – Enabel – DNH/DRHK • Production : ${new Date().toISOString().slice(0,10)}`,12,204);p.text(`Page ${i}/${total}`,276,204);}}

function latestPointsEau(rows:any[]) { const clean = cleanRowsForPublic(rows); const by = new Map<string, any>(); for(const r of clean){const code=text(r.code_pe||r.source_entry_id||r.id); if(!code) continue; const prev=by.get(code); if(!prev || day(r.date_collecte)>day(prev.date_collecte)) by.set(code,r);} return Array.from(by.values()); }

function geoRings(g:any){ if(!g)return []; if(g.type==="Polygon")return[g.coordinates?.[0]||[]]; if(g.type==="MultiPolygon")return(g.coordinates||[]).map((p:any)=>p?.[0]||[]); return []; }
function pointInRing(pt:any,ring:any[]){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(((a[1]>pt[1])!==(b[1]>pt[1]))&&(pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1]||1e-12)+a[0]))inside=!inside;}return inside;}
function inside(pt:any,g:any){if(!pt||!g)return false;if(g.type==="Polygon")return pointInRing(pt,g.coordinates?.[0]||[]);if(g.type==="MultiPolygon")return(g.coordinates||[]).some((p:any)=>pointInRing(pt,p?.[0]||[]));return false;}
async function subBasin(sbId:string){
  const sb:any=JSON.parse(readFileSync(join(process.cwd(),"public/data/decisionnel/sous_bassins_data.json"),"utf8"));
  const rest:any=JSON.parse(readFileSync(join(process.cwd(),"public/data/decisionnel/restaurations_data.json"),"utf8"));
  const feature=(sb.features||[]).find((f:any)=>String(f?.properties?.HydroID??f?.properties?.OBJECTID)===String(sbId)); if(!feature) throw new Error(`Sous-bassin SB-${sbId} introuvable`);
  const centroid=(g:any)=>{const pts:any[]=[];const walk=(x:any)=>{if(Array.isArray(x)&&typeof x[0]==="number")pts.push(x);else if(Array.isArray(x))x.forEach(walk)};walk(g?.coordinates);return pts.length?[pts.reduce((a,p)=>a+p[0],0)/pts.length,pts.reduce((a,p)=>a+p[1],0)/pts.length]:null;};
  const restor=(rest.features||[]).filter((r:any)=>{const c=centroid(r.geometry);return c&&inside(c,feature.geometry)}).map((r:any)=>({area:n(r.properties?.Surf_ha)||0,technology:text(r.properties?."Méthode de"||r.properties?."MÃ©thode d"||r.properties?."Méthode d")||"Technologie non renseignée",commune:text(r.properties?.commune_2||r.properties?.Commune||r.properties?.commune)||"Non renseignée"}));
  const modules:any={};
  for(const m of HYDRO){const loaded=await loadHydroRows(m);const q=qualityHydro(loaded.rows.filter((r:any)=>validGps(r)&&inside([n(r.longitude),n(r.latitude)],feature.geometry)),m);modules[m]={rows:q,quality:qualitySummary(q)};}
  const stationMap=new Map<string,any>();
  for(const m of HYDRO){const official=await loadOfficialStations(m);for(const s of official){const code=text(s.code_site||s.code_station||s.code_piezo);if(!code||!validGps(s)||!inside([n(s.longitude),n(s.latitude)],feature.geometry))continue;stationMap.set(`${m}|${code}`,s);}}
  const restArea=restor.reduce((a,r)=>a+r.area,0); const basinHa=Math.abs(n(feature.properties?.Shape_Area)||0)/10000;
  const tech=new Map<string,any>();for(const r of restor){const z=tech.get(r.technology)||{technology:r.technology,sites:0,area:0};z.sites++;z.area+=r.area;tech.set(r.technology,z);}
  const communes=HYDRO.includes("piezometrie")?piezoCommunes(modules.piezometrie.rows):[]; const pg=piezoGlobal(modules.piezometrie.rows,communes); const rain=rainfall(modules.pluviometrie.rows); const lim=limniStations(modules.limnimetrie.rows);
  return {id:sbId,feature,basinHa,restArea,density:basinHa?restArea/basinHa*100:0,restCount:restor.length,technologies:Array.from(tech.values()).sort((a,b)=>b.area-a.area),communes,pg,rain,lim,modules,stationCount:stationMap.size};
}

function subRows(d:any){return [{Sous_bassin:`SB-${d.id}`,Surface_ha:d.basinHa,Surface_restauree_ha:d.restArea,Densite_restauration_pct:d.density,Sites_restaures:d.restCount,Remontee_statique_m:d.pg.deltaCommunes,Taux_moyen_communes_pct:d.pg.rateCommunes,Taux_global_stations_pct:d.pg.rateStations,Pluviometrie_moyenne_mm:d.rain.average,Pluviometrie_cumul_mm:d.rain.total,Niveau_moyen_cours_eau_cm:d.lim.length?d.lim.reduce((a,b)=>a+(b.moyenne||0),0)/d.lim.length:null}]}

export async function GET(req:NextRequest){
  const auth=await requireApiRole(req,[ROLE_DNH,ROLE_ADMIN,ROLE_SUPER_ADMIN]); if("response" in auth)return auth.response;
  const sp=req.nextUrl.searchParams; const module=sp.get("module")||"pluviometrie"; const format=(sp.get("format")||"pdf").toLowerCase(); const start=sp.get("start")||""; const end=sp.get("end")||"";
  try{
    if(module==="sous_bassin"){
      const sb=sp.get("sb"); if(!sb)return NextResponse.json({ok:false,error:"Identifiant de sous-bassin requis"},{status:400}); const d=await subBasin(sb); const summary=subRows(d);
      if(format==="csv"){const rows=summary.concat(d.communes.map((x:any)=>({Commune:x.commune,Stations:x.stations,Observations:x.observations,Remontee_m:x.delta,Taux_pct:x.rate})));return new Response(csv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="psore_SB-${sb}_synthese.csv"`}})}
      if(format==="xlsx"){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(summary),"Synthèse");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(d.technologies),"Technologies restauration");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(d.communes),"Piézométrie par commune");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(d.rain.monthly),"Pluviométrie mensuelle");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(d.lim),"Limnimétrie par station");return new Response(XLSX.write(wb,{type:"array",bookType:"xlsx"}),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="psore_SB-${sb}_synthese.xlsx"`}})}
      if(format==="docx"){const children:any[]=[new Paragraph({text:`PSORE — Rapport intégré du sous-bassin SB-${sb}`,heading:HeadingLevel.TITLE}),new Paragraph(`Surface : ${fr(d.basinHa)} ha · restaurée : ${fr(d.restArea)} ha · densité : ${fr(d.density)} % · sites : ${d.restCount}.`),new Paragraph(`Remontée moyenne : ${fr(d.pg.deltaCommunes)} m · taux moyen des communes : ${fr(d.pg.rateCommunes)} % · taux global stations : ${fr(d.pg.rateStations)} %.`),new Paragraph(`Pluviométrie moyenne : ${fr(d.rain.average)} mm · cumul : ${fr(d.rain.total)} mm · min : ${fr(d.rain.min)} mm · max : ${fr(d.rain.max)} mm · jours pluvieux : ${d.rain.rainyDays}.`),new Paragraph({text:"Technologies de restauration",heading:HeadingLevel.HEADING_1})];for(const x of d.technologies)children.push(new Paragraph(`• ${x.technology} : ${x.sites} site(s), ${fr(x.area)} ha.`));children.push(new Paragraph({text:"Piézométrie par commune",heading:HeadingLevel.HEADING_1}));for(const x of d.communes)children.push(new Paragraph(`• ${x.commune} : ${x.stations} station(s), ${x.observations} mesures, remontée ${fr(x.delta)} m, taux ${fr(x.rate)} %.`));children.push(new Paragraph({text:"Limnimétrie",heading:HeadingLevel.HEADING_1}));for(const x of d.lim)children.push(new Paragraph(`• ${x.code} — cours d’eau : ${x.coursEau} — niveau moyen : ${fr(x.moyenne)} cm (${x.mesures} mesures).`));const b=await Packer.toBuffer(new Document({sections:[{children}]}));return new Response(new Uint8Array(b),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":`attachment; filename="psore_SB-${sb}_synthese.docx"`}})}
      const p=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});header(p,`PSORE — Rapport intégré du sous-bassin SB-${sb}`,"Synthèse intégrée des eaux souterraines, pluviométrie, cours d’eau et restauration");card(p,12,33,43,"Surface du sous-bassin",`${fr(d.basinHa)} ha`,COLORS.blue);card(p,58,33,43,"Surface restaurée",`${fr(d.restArea)} ha`,COLORS.green);card(p,104,33,43,"Densité restauration",`${fr(d.density)} %`,COLORS.orange);card(p,150,33,43,"Sites restaurés",String(d.restCount),COLORS.purple);card(p,196,33,43,"Remontée statique",`${fr(d.pg.deltaCommunes)} m (${fr(d.pg.rateCommunes)} %)`,COLORS.cyan);card(p,242,33,43,"Pluie moyenne",`${fr(d.rain.average)} mm`,COLORS.blue);
      barChart(p,"Taux de remontée du niveau statique par commune",d.communes.slice(0,10).map((x:any)=>({label:x.commune,value:x.rate||0})),12,68,132,70,"Commune","Taux (%)",COLORS.cyan);barChart(p,"Technologies de restauration",d.technologies.slice(0,10).map((x:any)=>({label:x.technology,value:x.area})),151,68,134,70,"Technologie","Superficie (ha)",COLORS.green);qualityTable(p,{total:d.modules.piezometrie.quality.total+d.modules.pluviometrie.quality.total+d.modules.limnimetrie.quality.total,valid:d.modules.piezometrie.quality.valid+d.modules.pluviometrie.quality.valid+d.modules.limnimetrie.quality.valid,verify:d.modules.piezometrie.quality.verify+d.modules.pluviometrie.quality.verify+d.modules.limnimetrie.quality.verify,duplicates:d.modules.piezometrie.quality.duplicates+d.modules.pluviometrie.quality.duplicates+d.modules.limnimetrie.quality.duplicates,atypical:d.modules.piezometrie.quality.atypical+d.modules.pluviometrie.quality.atypical+d.modules.limnimetrie.quality.atypical,gps:d.modules.piezometrie.quality.gps+d.modules.pluviometrie.quality.gps+d.modules.limnimetrie.quality.gps,future:d.modules.piezometrie.quality.future+d.modules.pluviometrie.quality.future+d.modules.limnimetrie.quality.future},12,150);p.setFontSize(7);ink(p,COLORS.gray);p.text(`Taux global calculé sur les stations : ${fr(d.pg.rateStations)} % · moyenne des taux communaux : ${fr(d.pg.rateCommunes)} %.`,12,180);p.text(`Limnimétrie : les niveaux indiqués sont mesurés au droit des stations implantées sur les cours d’eau. ${d.lim.length} station(s) analysée(s).`,12,186);footer(p);return new Response(p.output("arraybuffer"),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="psore_SB-${sb}_synthese.pdf"`}});
    }
    if(!HYDRO.includes(module as Hydro)){
      if(module!=="points_eau")return NextResponse.json({ok:false,error:"Module invalide"},{status:400});
      const loaded=await readPointEauRows();let rows=applyPointEauFilters(cleanRowsForPublic(loaded.rows),sp);rows=latestPointsEau(rows);const q={total:rows.length,valid:rows.length,verify:rows.filter(r=>r.alerte_gps||r.alerte_qualite_eau||r.alerte_ph_donnee||r.alerte_temperature).length,duplicates:0,atypical:0,gps:rows.filter(r=>r.alerte_gps).length,future:0};const detail=rows.map(r=>({Code:r.code_pe,Village:r.village,Commune:r.commune,"Date collecte / mise à jour":r.date_collecte,Type:r.type_infrastructure,Fonctionnalité:r.statut_fonctionnalite,"Besoin de réhabilitation":r.besoin_rehabilitation,"Statut qualité":q.verify?"À vérifier":"Validée"}));if(format==="csv")return new Response(csv(detail),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename="psore_points_eau_inventaire.csv""}});if(format==="xlsx"){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(detail),"Inventaire");return new Response(XLSX.write(wb,{type:"array",bookType:"xlsx"}),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":"attachment; filename=psore_points_eau_inventaire.xlsx""}})}
      return NextResponse.json({ok:false,error:"PDF/DOCX points d’eau : utiliser l’export v2 existant pendant cette migration."},{status:400});
    }
    const m=module as Hydro;const loaded=await loadHydroRows(m);let raw=loaded.rows;if(start)raw=raw.filter(r=>day(r.date_observation)>=start);if(end)raw=raw.filter(r=>day(r.date_observation)<=end);const qrows=qualityHydro(raw,m),q=qualitySummary(qrows),stats=moduleStats(qrows,m);const communes=m==="piezometrie"?piezoCommunes(qrows):[];const pg=m==="piezometrie"?piezoGlobal(qrows,communes):null;const rain=m==="pluviometrie"?rainfall(qrows):null;const lim=m==="limnimetrie"?limniStations(qrows):null;
    const detail=qrows.map(r=>{const out:any={Code:stationCode(m,r),Localité:text(r.nom_site||r.localite||r.village),Commune:text(r.commune),Date:day(r.date_observation),"Heure":obsHour(r),Valeur:n(r[CFG[m].value]),Unité:CFG[m].unit,"Statut du contrôle":r.__status};if(m==="limnimetrie")out["Cours d’eau"]=text(r.cours_eau||r.nom_cours_eau||r.nom_site);return out;});
    if(format==="csv")return new Response(csv(detail),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="psore_${m}_valide.csv"`}});
    if(format==="xlsx"){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{Indicateur:"Observations validées",Valeur:q.valid},{Indicateur:"À vérifier",Valeur:q.verify},{Indicateur:"Doublons potentiels",Valeur:q.duplicates},{Indicateur:"Valeurs atypiques",Valeur:q.atypical},{Indicateur:"GPS absents/invalides",Valeur:q.gps},{Indicateur:"Dates futures",Valeur:q.future},...(pg?[{Indicateur:"Remontée moyenne (m)",Valeur:pg.deltaCommunes},{Indicateur:"Taux moyen des communes (%)",Valeur:pg.rateCommunes},{Indicateur:"Taux global stations (%)",Valeur:pg.rateStations}]:[]),...(rain?[{Indicateur:"Pluviométrie moyenne (mm)",Valeur:rain.average},{Indicateur:"Cumul (mm)",Valeur:rain.total},{Indicateur:"Minimum (mm)",Valeur:rain.min},{Indicateur:"Maximum (mm)",Valeur:rain.max},{Indicateur:"Jours pluvieux",Valeur:rain.rainyDays}]:[])]),"Synthèse");if(pg)XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(communes),"Piézo par commune");if(lim)XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(lim),"Cours d’eau par station");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(detail),"Données");return new Response(XLSX.write(wb,{type:"array",bookType:"xlsx"}),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="psore_${m}_rapport.xlsx"`}})}
    if(format==="docx"){const children:any[]=[new Paragraph({text:`PSORE — ${CFG[m].label}`,heading:HeadingLevel.TITLE}),new Paragraph(`Période : ${start||"début disponible"} → ${end||stats.last}`),new Paragraph(`Contrôle qualité : ${q.valid} validées · ${q.verify} à vérifier · ${q.duplicates} doublons potentiels.`)];if(pg)children.push(new Paragraph(`Remontée moyenne : ${fr(pg.deltaCommunes)} m (${fr(pg.rateCommunes)} %) · taux global stations : ${fr(pg.rateStations)} %.`));if(rain)children.push(new Paragraph(`Pluviométrie moyenne : ${fr(rain.average)} mm · cumul : ${fr(rain.total)} mm · min : ${fr(rain.min)} mm · max : ${fr(rain.max)} mm · jours pluvieux : ${rain.rainyDays}.`));if(lim)children.push(new Paragraph({text:"Niveau des cours d’eau par station",heading:HeadingLevel.HEADING_1}),...lim.map(x=>new Paragraph(`• ${x.code} — cours d’eau : ${x.coursEau} — niveau moyen : ${fr(x.moyenne)} cm (${x.mesures} mesures).`)));if(pg)children.push(new Paragraph({text:"Évolution par commune",heading:HeadingLevel.HEADING_1}),...communes.map(x=>new Paragraph(`• ${x.commune} : remontée ${fr(x.delta)} m ; taux ${fr(x.rate)} % ; ${x.stations} station(s), ${x.observations} mesures.`)));const b=await Packer.toBuffer(new Document({sections:[{children}]}));return new Response(new Uint8Array(b),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":`attachment; filename="psore_${m}_rapport.docx"`}})}
    const p=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});header(p,`PSORE — ${CFG[m].label}`,`Période : ${start||"début disponible"} → ${end||stats.last}`);card(p,12,33,42,"Observations validées",String(q.valid),COLORS.blue);card(p,57,33,42,"À vérifier",String(q.verify),COLORS.orange);if(pg){card(p,102,33,42,"Remontée moyenne",`${fr(pg.deltaCommunes)} m (${fr(pg.rateCommunes)} %)`,COLORS.cyan);card(p,147,33,42,"Taux global stations",`${fr(pg.rateStations)} %`,COLORS.green);}else if(rain){card(p,102,33,42,"Pluie moyenne",`${fr(rain.average)} mm`,COLORS.blue);card(p,147,33,42,"Cumul",`${fr(rain.total)} mm`,COLORS.green);}else if(lim){card(p,102,33,42,"Stations",String(lim.length),COLORS.purple);card(p,147,33,42,"Niveau moyen",`${fr(lim.length?lim.reduce((a,b)=>a+(b.moyenne||0),0)/lim.length:null)} cm`,COLORS.cyan);}card(p,192,33,42,"Doublons",String(q.duplicates),COLORS.red);card(p,238,33,47,"Dernière donnée",stats.last,COLORS.purple);
    if(pg){barChart(p,"Taux de remontée du niveau statique par commune",communes.slice(0,10).map(x=>({label:x.commune,value:x.rate||0})),12,66,132,76,"Commune","Taux (%)",COLORS.cyan);barChart(p,"Variation absolue par commune",communes.slice(0,10).map(x=>({label:x.commune,value:x.delta||0})),151,66,134,76,"Commune","Remontée (m)",COLORS.green);qualityTable(p,q,12,151);p.setFontSize(6.5);ink(p,COLORS.gray);p.text(`Taux global calculé sur les stations : ${fr(pg.rateStations)} % · moyenne des taux communaux : ${fr(pg.rateCommunes)} %.`,12,183);}else if(rain){barChart(p,"Précipitations mensuelles cumulées",rain.monthly.slice(-12),12,66,132,76,"Mois","Précipitations (mm)",COLORS.blue);barChart(p,"Statistiques pluviométriques",[{label:"Moyenne",value:rain.average||0},{label:"Minimum",value:rain.min||0},{label:"Maximum",value:rain.max||0}],151,66,134,76,"Indicateur","mm",COLORS.green);qualityTable(p,q,12,151);}else if(lim){barChart(p,"Niveau moyen des cours d’eau par station",lim.slice(0,10).map(x=>({label:x.code,value:x.moyenne||0})),12,66,132,76,"Station","Hauteur d’eau (cm)",COLORS.cyan);qualityTable(p,q,12,151);ink(p,COLORS.navy);p.setFontSize(7);p.text("Les mesures limnimétriques représentent le niveau du cours d’eau au droit de la station où elles sont réalisées.",151,151);let yy=160;for(const x of lim.slice(0,8)){ink(p,COLORS.gray);p.text(`${x.code} — ${x.coursEau} : ${fr(x.moyenne)} cm`,151,yy);yy+=6;}}footer(p);return new Response(p.output("arraybuffer"),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="psore_${m}_rapport.pdf"`}});
  }catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Génération du rapport impossible"},{status:500});}
}
