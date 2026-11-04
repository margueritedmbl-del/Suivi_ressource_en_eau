const fs=require('node:fs');
const assert=require('node:assert/strict');
const ts=require('typescript');
function load(file,mocks={}){
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
 return module.exports;
}
(async()=>{
 const permissions=load('lib/permissions.ts');
 for(const role of ['DNH/DRHK','Administrateur PTCS','Super administrateur'])assert.equal(permissions.canExportCsvXlsx(role),true);
 for(const role of ['Public','Observateur','Collecteur'])assert.equal(permissions.canExportCsvXlsx(role),false);
 assert.equal(permissions.canManageUsers('Collecteur'),false);
 const {toCsv}=load('services/exports/csv.ts');
 assert.equal(toCsv([{a:'x"y'},{b:0}]),'"a","b"\n"x""y",""\n"","0"');
 const rows=[{code_pe:'PE1',date_collecte:'2025-01-01',commune:'Koula',village:'Ancien'},{code_pe:'PE1',date_collecte:'2026-01-01',commune:'Koula',village:'Actualisé',alerte_gps:true},{commune:'Koula',village:'Sans code A'},{commune:'Koula',village:'Sans code B'}];
 const auth={requireApiRole:async()=>({ctx:{role:'Administrateur PTCS'}})};
 const analytics={readPointEauRows:async()=>({rows,source:'fixture de test'}),applyPointEauFilters:r=>r};
 const route=load('app/api/reports/export-points-eau-v5/route.ts',{'@/lib/auth-server':auth,'@/lib/permissions':permissions,'@/services/points-eau/analytics':analytics});
 const {NextRequest}=require('next/server');
 global.fetch=async()=>new Response('',{status:503});
 for(const format of ['csv','xlsx','docx','pdf']){
  const response=await route.GET(new NextRequest(`http://localhost/api/reports/export-points-eau-v5?format=${format}&start=2030-01-01&end=2030-02-01`));
  assert.equal(response.status,200);
  const buffer=Buffer.from(await response.arrayBuffer());assert.ok(buffer.length>0);
  if(format==='csv'){const csv=buffer.toString();assert.ok(csv.includes('Actualisé'));assert.ok(!csv.includes('Ancien'));assert.ok(csv.includes('Sans code A'));assert.ok(csv.includes('Sans code B'))}
  else if(format==='pdf')assert.equal(buffer.subarray(0,4).toString(),'%PDF');
  else assert.equal(buffer.subarray(0,2).toString(),'PK');
 }
 const denied=load('app/api/points-eau/export/route.ts',{'@/lib/auth-server':{requireApiRole:async()=>({response:new Response('Unauthorized',{status:401})})},'@/lib/permissions':permissions,'@/services/points-eau/analytics':analytics,'@/services/exports/csv':{toCsv}});
 assert.equal((await denied.GET(new NextRequest('http://localhost/api/points-eau/export'))).status,401);
 console.log('OK : droits, CSV hétérogène, inventaire sans filtre temporel, dernières fiches, fiches sans code, quatre formats et refus anonyme. Données et accès simulés.');
})().catch(error=>{console.error(error);process.exitCode=1});
