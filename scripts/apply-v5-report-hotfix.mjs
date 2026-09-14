import fs from 'node:fs';

function patchFile(path, transforms) {
  let src = fs.readFileSync(path, 'utf8');
  let changed = false;
  for (const [from, to, label] of transforms) {
    if (src.includes(from)) {
      src = src.replace(from, to);
      changed = true;
      console.log(`[report-hotfix] ${label}: applied`);
    } else {
      console.log(`[report-hotfix] ${label}: already applied or source changed`);
    }
  }
  if (changed) fs.writeFileSync(path, src);
}

patchFile('app/api/reports/export-v5-decision/route.ts', [
  ['fill(p,"#FFF")', 'fill(p,"#FFFFFF")', 'sub-basin PDF 3-digit fill color'],
  ['ink(p,"#FFF")', 'ink(p,"#FFFFFF")', 'sub-basin PDF 3-digit text color'],
]);

const oldPiezoSummary = 'const valid=a.st.filter((s:any)=>s.rate!==null),ev=valid.length?valid.reduce((x:any,s:any)=>x+s.evolution,0)/valid.length:null,rate=valid.length?valid.reduce((x:any,s:any)=>x+s.rate,0)/valid.length:null;return{cards:[["Niveau moyen",`${fmt(a.avg)} m`,C.blue],["Évolution moyenne",`${signed(ev)} m`,trend(rate).color],["Taux moyen",`${signed(rate,1)} %`,trend(rate).color],["Stations",String(a.st.length),C.cyan]],text:`L\'évolution moyenne du niveau est de ${signed(ev)} m (${signed(rate,1)} %), correspondant à une ${trend(rate).label.toLowerCase()}. La lecture doit être complétée par le détail des stations et leur contexte local.`}';
const newPiezoSummary = 'const valid=a.st.filter((s:any)=>s.rate!==null&&s.evolution!==null&&s.count>0),sw=valid.reduce((x:any,s:any)=>x+s.count,0),ev=sw?valid.reduce((x:any,s:any)=>x+s.evolution*s.count,0)/sw:null,rate=sw?valid.reduce((x:any,s:any)=>x+s.rate*s.count,0)/sw:null,cm=new Map<string,any[]>();for(const s of valid){const q=cm.get(s.commune)||[];q.push(s);cm.set(s.commune,q)}const cr=[...cm.values()].map(q=>{const w=q.reduce((x:any,s:any)=>x+s.count,0);return w?q.reduce((x:any,s:any)=>x+s.rate*s.count,0)/w:0}),avgComm=cr.length?cr.reduce((x:any,v:any)=>x+v,0)/cr.length:null,extreme=valid.filter((s:any)=>Math.abs(Number(s.rate))>100);return{cards:[["Niveau moyen",`${fmt(a.avg)} m`,C.blue],["Évolution moyenne",`${signed(ev)} m`,trend(rate).color],["Moyenne communes",`${signed(avgComm,1)} %`,C.cyan],["Taux global pondéré",`${signed(rate,1)} %`,trend(rate).color]],text:`L\'évolution moyenne pondérée du niveau est de ${signed(ev)} m (${signed(rate,1)} %). La moyenne des taux communaux est de ${signed(avgComm,1)} %. La tendance globale est ${trend(rate).label.toLowerCase()}. Le détail des stations permet d\'identifier les secteurs en remontée, stables ou en baisse.${extreme.length?` Attention : ${extreme.length} station(s) présentent une variation supérieure à 100 % et doivent être vérifiées avant toute interprétation opérationnelle.`:""}`}';

const oldRainSummary = 'if(m==="pluviometrie")return{cards:[["Pluie moyenne",`${fmt(a.avg,1)} mm`,C.blue],["Cumul",`${fmt(a.total,1)} mm`,C.cyan],["Jours pluvieux",String(a.rainy),C.green],["Maximum",`${fmt(a.max,1)} mm`,C.orange]],text:`La période totalise ${fmt(a.total,1)} mm pour une pluie moyenne observée de ${fmt(a.avg,1)} mm et ${a.rainy} jour(s) pluvieux. Les cumuls par station permettent d\'identifier les contrastes spatiaux.`};';
const newRainSummary = 'if(m==="pluviometrie"){const active=a.st.filter((s:any)=>s.count>0),avgCum=active.length?active.reduce((x:any,s:any)=>x+(Number(s.total)||0),0)/active.length:null,extreme=active.filter((s:any)=>(Number(s.max)||0)>150);return{cards:[["Cumul moyen stations",`${fmt(avgCum,1)} mm`,C.cyan],["Pluie moyenne observation",`${fmt(a.avg,1)} mm`,C.blue],["Jours pluvieux",String(a.rainy),C.green],["Maximum observé",`${fmt(a.max,1)} mm`,C.orange]],text:`Sur les ${active.length} station(s) disposant de données, le cumul moyen par station est de ${fmt(avgCum,1)} mm. La pluie moyenne par observation est de ${fmt(a.avg,1)} mm et ${a.rainy} jour(s) pluvieux sont recensés. Le maximum observé est de ${fmt(a.max,1)} mm.${extreme.length?` Attention : ${extreme.length} station(s) présentent une hauteur supérieure à 150 mm sur une observation ; ces valeurs doivent être vérifiées avant interprétation opérationnelle.`:""} Les cumuls par station permettent d\'identifier les contrastes spatiaux.`}};';

patchFile('app/api/reports/export-v5-pro/route.ts', [
  ['fill:s.tendance.color.replace("#","")+"22"', 'fill:s.tendance.label.includes("Remontée")?"EAF7F0":s.tendance.label.includes("Baisse")?"FCECEC":"EAF4FA"', 'DOCX 6-digit trend shading'],
  [oldPiezoSummary, newPiezoSummary, 'weighted piezometric decision indicators with extreme-value warning'],
  [oldRainSummary, newRainSummary, 'rainfall decision KPIs use mean station cumulative instead of spatially summing gauges'],
  ['import {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,AlignmentType,ShadingType} from "docx";', 'import {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,AlignmentType,ShadingType,PageOrientation} from "docx";', 'DOCX landscape page orientation import'],
  ['new Document({sections:[{children}]})', 'new Document({sections:[{properties:{page:{size:{orientation:PageOrientation.LANDSCAPE},margin:{top:568,right:568,bottom:568,left:568}}},children}]})', 'DOCX landscape layout'],
  ['if(!pts.length){p.setFontSize(5);p.text("Aucune station géolocalisée",x+4,y+10);return}let minLon=', 'if(!pts.length){p.setFontSize(5);p.text("Aucune station géolocalisée",x+4,y+10);return}p.saveGraphicsState();p.rect(x,y,w,h);p.clip();p.discardPath();let minLon=', 'hydro PDF map clipping start'],
  ['p.text(s.code,xx+1.8,yy-1)}p.setFont("helvetica","normal")', 'p.text(s.code,xx+1.8,yy-1)}p.restoreGraphicsState();p.setFont("helvetica","normal")', 'hydro PDF map clipping end'],
]);

const pointMapWithBoundaries = 'features=communeFeatures(communes.length?communes:[...new Set(rows.map(r=>t(r.commune)).filter(Boolean))]),coords:number[][]=[];for(const f of features)for(const ring of rings(f.geometry))for(const q of ring)if(Array.isArray(q)&&q.length>=2)coords.push(q);';
const pointMapRawExtent = 'let minLon=Math.min(...coords.map(q=>q[0])),maxLon=Math.max(...coords.map(q=>q[0])),minLat=Math.min(...coords.map(q=>q[1])),maxLat=Math.max(...coords.map(q=>q[1]));const padx=(maxLon-minLon||.05)*.07,pady=(maxLat-minLat||.05)*.07;minLon-=padx;maxLon+=padx;minLat-=pady;maxLat+=pady;';
const pointMapStableExtent = 'let minLon=Math.min(...coords.map(q=>q[0])),maxLon=Math.max(...coords.map(q=>q[0])),minLat=Math.min(...coords.map(q=>q[1])),maxLat=Math.max(...coords.map(q=>q[1]));const cx=(minLon+maxLon)/2,cy=(minLat+maxLat)/2,spanLon=Math.max(maxLon-minLon,.35),spanLat=Math.max(maxLat-minLat,.28);minLon=cx-spanLon*.58;maxLon=cx+spanLon*.58;minLat=cy-spanLat*.58;maxLat=cy+spanLat*.58;';
patchFile('app/api/reports/export-points-eau-v5/route.ts', [
  [pointMapWithBoundaries, 'features=[] as any[],coords:number[][]=[];', 'point-water PDF map without distorted commune boundaries'],
  ['function status(r:PointEauRow){if(r.alerte_gps||r.alerte_ph_donnee)return"Rejetée";if(r.alerte_qualite_eau||r.alerte_photo)return"À vérifier";return"Validée"}', 'function status(r:PointEauRow){if(r.alerte_ph_donnee)return"Rejetée";if(r.alerte_gps||r.alerte_qualite_eau||r.alerte_photo)return"À vérifier";return"Validée"}', 'GPS alert remains usable for point-water inventory analytics'],
  ['if(!coords.length)return;let minLon=', 'if(!coords.length)return;p.saveGraphicsState();p.rect(x,y,w,h);p.clip();p.discardPath();let minLon=', 'point-water PDF map clipping start'],
  [pointMapRawExtent, pointMapStableExtent, 'point-water minimum map extent prevents oversized OSM tiles'],
  ['p.circle(qx,qy,.8,"FD")}p.setTextColor(95,111,130);p.setFontSize(4);p.text', 'p.circle(qx,qy,.8,"FD")}p.restoreGraphicsState();p.setTextColor(95,111,130);p.setFontSize(4);p.text', 'point-water PDF map clipping end'],
  ['territory=cs.length?cs.join(" + "):"Territoire sélectionné"', 'territory=cs.length?cs.join(" + "):s.communes>1?`${s.communes} communes`:t(rows[0]?.commune)||"Territoire PTCS"', 'point-water DOCX territory label'],
]);
