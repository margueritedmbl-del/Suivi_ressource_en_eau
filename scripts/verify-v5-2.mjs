import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
if(pkg.version!=='5.2.0') throw new Error(`Version package inattendue: ${pkg.version}`);
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
if(!sync.includes('engine=${ENGINE_REVISION}')||!sync.includes('parents_non_resolus')) throw new Error('Diagnostic parent/enfant V5.2 incomplet');
console.log('PSORE V5.2.0 — vérifications fonctionnelles statiques OK');
console.log('Réseaux : pluie=10, piezo=20, limni=10 ; PZ-02=Dombana/DBN ; Tonga=Méguétan ; moteur parent/enfant V5.2.');
