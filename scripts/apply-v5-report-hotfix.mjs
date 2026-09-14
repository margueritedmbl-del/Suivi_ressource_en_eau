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
const newPiezoSummary = 'const valid=a.st.filter((s:any)=>s.rate!==null&&s.evolution!==null&&s.count>0),sw=valid.reduce((x:any,s:any)=>x+s.count,0),ev=sw?valid.reduce((x:any,s:any)=>x+s.evolution*s.count,0)/sw:null,rate=sw?valid.reduce((x:any,s:any)=>x+s.rate*s.count,0)/sw:null,cm=new Map<string,any[]>();for(const s of valid){const q=cm.get(s.commune)||[];q.push(s);cm.set(s.commune,q)}const cr=[...cm.values()].map(q=>{const w=q.reduce((x:any,s:any)=>x+s.count,0);return w?q.reduce((x:any,s:any)=>x+s.rate*s.count,0)/w:0}),avgComm=cr.length?cr.reduce((x:any,v:any)=>x+v,0)/cr.length:null;return{cards:[["Niveau moyen",`${fmt(a.avg)} m`,C.blue],["Évolution moyenne",`${signed(ev)} m`,trend(rate).color],["Moyenne communes",`${signed(avgComm,1)} %`,C.cyan],["Taux global pondéré",`${signed(rate,1)} %`,trend(rate).color]],text:`L\'évolution moyenne pondérée du niveau est de ${signed(ev)} m (${signed(rate,1)} %). La moyenne des taux communaux est de ${signed(avgComm,1)} %. La tendance globale est ${trend(rate).label.toLowerCase()}. Le détail des stations permet d\'identifier les secteurs en remontée, stables ou en baisse.`}';

patchFile('app/api/reports/export-v5-pro/route.ts', [
  ['fill:s.tendance.color.replace("#","")+"22"', 'fill:s.tendance.label.includes("Remontée")?"EAF7F0":s.tendance.label.includes("Baisse")?"FCECEC":"EAF4FA"', 'DOCX 6-digit trend shading'],
  [oldPiezoSummary, newPiezoSummary, 'weighted piezometric decision indicators'],
]);

const pointMapWithBoundaries = 'features=communeFeatures(communes.length?communes:[...new Set(rows.map(r=>t(r.commune)).filter(Boolean))]),coords:number[][]=[];for(const f of features)for(const ring of rings(f.geometry))for(const q of ring)if(Array.isArray(q)&&q.length>=2)coords.push(q);';
patchFile('app/api/reports/export-points-eau-v5/route.ts', [
  [pointMapWithBoundaries, 'features=[] as any[],coords:number[][]=[];', 'point-water PDF map without distorted commune boundaries'],
]);
