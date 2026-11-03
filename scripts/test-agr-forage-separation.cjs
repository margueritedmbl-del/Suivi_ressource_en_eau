const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const agr=read('public/data/referentiels/infrastructures_agr_2026.json'),wells=read('public/data/referentiels/forages_exploitation_crr_pm.json');
assert.equal(agr.length,16);assert(!agr.some(a=>['CRR','CCR'].includes(a.type)));
assert.equal(wells.length,34);assert.equal(new Set(wells.map(w=>w.code)).size,34);
const added=wells.filter(w=>w.source_pages_pdf?.some(p=>[166,168,170].includes(p)));
assert.equal(added.length,18);assert.equal(added.filter(w=>w.composante==='EP').length,1);
assert.equal(added.filter(w=>w.debit_exploitation_m3h!==null).length,5);
assert(added.every(w=>w.volume_preleve_m3===null&&w.latitude===null&&w.longitude===null));
assert(added.every(w=>agr.some(a=>a.code===w.agr_code&&a.forages_reference.includes(w.code))));
assert.equal(added.reduce((s,w)=>s+w.nombre_modules,0),356);
assert(!JSON.stringify(agr).includes('montant_ht_fcfa'));assert(!JSON.stringify(agr).includes('receptionne_source'));
function evaluate(file,mocks={}){const filename=path.join(root,file),code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;const mod=new Module(filename,module);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));const real=mod.require.bind(mod);mod.require=id=>id in mocks?mocks[id]:id.startsWith('@/public/')?require(path.join(root,id.slice(2))):real(id);mod._compile(code,filename);return mod.exports;}
const finances=evaluate('lib/agr-finances.ts').agrFinances;
for(const superAdmin of [false,true])for(const tab of ['agr','forages']){
 let i=0;const hooks={...React,useEffect:()=>{},useMemo:f=>f(),useState:initial=>{const n=i++;return[initial==='forages'?tab:n===1&&superAdmin?Object.fromEntries(finances.map(f=>[f.code,f])):initial,()=>{}];}};
 const component=evaluate('components/ouvrages/OuvragesIntegratedDashboard.tsx',{react:hooks,'@/components/auth/useRole':{useRole:()=>({isSuperAdmin:superAdmin})},'@/lib/auth-client':{authFetch:()=>{throw Error('Unexpected render request');}},'@/components/ouvrages/IntegratedAssetsMap':{__esModule:true,default:()=>null},'@/components/ouvrages/SecureDocumentButton':{__esModule:true,default:()=>null}}).default;
 const html=renderToStaticMarkup(React.createElement(component));
 if(tab==='agr'){assert(html.includes('<th>Superficie</th>'));assert(!html.includes('CRR-DOUMBA-F1'));assert(!html.includes('<th>Essai court</th>'));assert.equal(html.includes('Montant HT et périmètre'),superAdmin);assert.equal(html.includes('Exporter les coûts HT'),superAdmin);}
 else{assert(html.includes('CRR-DOUMBA-F1'));assert(html.includes('EP-MGT-TANABOUGOU-F1'));assert(html.includes('<th>Essai court</th>'));assert(!html.includes('<th>Superficie</th>'));}
}
(async()=>{const denied={status:403};const api=evaluate('app/api/ouvrages/agr/finances/route.ts',{'next/server':{NextResponse:{json:()=>{throw Error('Financial disclosure');}}},'@/lib/auth-server':{requireApiRole:async()=>({response:denied})},'@/lib/permissions':{ROLE_SUPER_ADMIN:'superadmin'},'@/lib/agr-finances':{agrFinances:finances}});assert.equal(await api.GET({}),denied);console.log('OK: 16 AGR sans CRR, 34 forages, liens, absence de faux volumes, rendu séparé et coûts protégés.');})().catch(e=>{console.error(e);process.exitCode=1;});
