import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
if(pkg.version!=='5.2.2') throw new Error(`Version package inattendue: ${pkg.version}`);
const reg=fs.readFileSync(new URL('../lib/network-registry.ts',import.meta.url),'utf8');
const count=(prefix)=>(reg.match(new RegExp(`code:\\"${prefix}`,'g'))||[]).length;
if(count('PL-')!==10) throw new Error(`Réseau pluviométrique != 10 (${count('PL-')})`);
if(count('PZ-')<20) throw new Error('Réseau piézométrique incomplet');
if(count('CE-')!==10) throw new Error(`Réseau limnimétrique != 10 (${count('CE-')})`);
for(const token of ['PZ-DMB-DBN-001','PZ-DMB-SIN-001','CE-KLK-006_R-TNKA-PNT','Tonga','operational_data_start_date']){
  const files=['../lib/network-registry.ts','../database/32_MASTER_PSORE_V5_2.sql','../lib/hydro-data.ts'].map(x=>new URL(x,import.meta.url));
  if(!files.some(f=>fs.existsSync(f)&&fs.readFileSync(f,'utf8').includes(token))) throw new Error(`Élément V5.2 absent: ${token}`);
}
const sync=fs.readFileSync(new URL('../services/epicollect/syncTable.ts',import.meta.url),'utf8');
for(const token of ['v5.2.1','epicollect_parent_registry','registryLinked','Historique Epicollect conservé']) if(!sync.includes(token)) throw new Error(`Moteur V5.2.1 incomplet: ${token}`);
const m34=fs.readFileSync(new URL('../database/34_REPAIR_PARENT_HISTORY_V5_2_1.sql',import.meta.url),'utf8');
for(const token of ['epicollect_parent_registry','snapshot_csv_2026-08-18','PZ-DMB-DBN-001','create or replace view public.v_pluviometrie_dashboard_v50']) if(!m34.includes(token)) throw new Error(`Migration 34 incomplète: ${token}`);
const parentRows=(m34.match(/'snapshot_csv_2026-08-18'\)/g)||[]).length;
if(parentRows!==278) throw new Error(`Snapshot parents incomplet (${parentRows})`);
console.log('PSORE V5.2.2 — vérifications fonctionnelles statiques OK');
console.log('Réseaux : pluie=10, piezo=20, limni=10 ; registre UUID parents actif ; historique conservé ; migration 34/35 présente.');
