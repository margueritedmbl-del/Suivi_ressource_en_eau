const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
function load(file,mocks={}){const mod={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(n=>n in mocks?mocks[n]:require(n),mod,mod.exports);return mod.exports;}
const infra=load('lib/infrastructure-finances.ts');const agr=load('lib/agr-finances.ts',{'./infrastructure-finances':infra});
assert.equal(infra.infrastructureFinances.length,8);assert.equal(agr.agrFinances.length,16);
for(const r of infra.infrastructureFinances){assert.equal(r.total,r.forage+r.amenagement+(r.equipement??0)+r.semences);assert.equal(r.devise,"FCFA");assert.equal(r.base_fiscale,"HT");}
const sum=(type,key)=>infra.infrastructureFinances.filter(r=>r.type===type).reduce((s,r)=>s+(r[key]??0),0);
assert.equal(sum('PM','total'),280474066);assert.equal(sum('CRR','total'),545088834);assert.equal(sum('PM','forage'),142040000);assert.equal(sum('CRR','forage'),141965000);
assert(infra.infrastructureFinances.filter(r=>r.type==='PM').every(r=>r.equipement===null));assert(!agr.agrFinances.some(r=>r.code.startsWith('CRR')));
(async()=>{const {NextRequest}=require('next/server');for(const denied of [true,false]){const route=load('app/api/ouvrages/agr/finances/route.ts',{'@/lib/auth-server':{requireApiRole:async()=>denied?{response:new Response('',{status:401})}:{ctx:{role:'Super administrateur'}}},'@/lib/permissions':{ROLE_SUPER_ADMIN:'Super administrateur'},'@/lib/agr-finances':agr,'@/lib/infrastructure-finances':infra});for(const suffix of ['', '?format=csv','?format=csv&scope=sites']){const r=await route.GET(new NextRequest('http://localhost/api/ouvrages/agr/finances'+suffix));assert.equal(r.status,denied?401:200);if(!denied){assert(r.headers.get('cache-control').includes('no-store'));const body=await r.text();assert(body.includes(suffix.includes('scope=sites')?'CRR-DOUMBA':'AGR-EXISTANT-15'));}}}await checkRoles();console.log('OK: 8 site totals and 16 AGR costs, source totals reconciled, confirmed FCFA HT, blank equipment retained, protected JSON and CSV. Auth simulated.');})().catch(e=>{console.error(e);process.exitCode=1});

async function checkRoles(){
 const {NextRequest}=require('next/server'),permissions=load('lib/permissions.ts');
 for(const role of ['Public','Observateur','Collecteur','DNH/DRHK','Administrateur PTCS','Super administrateur']){
  const profile={actif:true,roles:{nom_role:role}};
  const chain={select(){return this},eq(){return this},async maybeSingle(){return{data:profile,error:null}}};
  const auth=load('lib/auth-server.ts',{'@/lib/supabase-admin':{supabaseAdmin:{auth:{getUser:async()=>({data:{user:{id:'test',email:'test@example.invalid'}},error:null})},from:()=>chain}},'@/lib/permissions':permissions});
  const route=load('app/api/ouvrages/agr/finances/route.ts',{'@/lib/auth-server':auth,'@/lib/permissions':permissions,'@/lib/agr-finances':agr,'@/lib/infrastructure-finances':infra});
  for(const suffix of ['', '?format=csv','?format=csv&scope=sites']){const r=await route.GET(new NextRequest('http://localhost/api/ouvrages/agr/finances'+suffix,{headers:{authorization:'Bearer simulated-test-token'}}));assert.equal(r.status,role==='Super administrateur'?200:403,role+suffix);if(role!=='Super administrateur')assert(!(await r.text()).includes('68508357'));}
 }
}
