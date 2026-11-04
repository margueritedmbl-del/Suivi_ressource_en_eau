const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
function load(file,mocks={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(n=>n in mocks?mocks[n]:require(n),m,m.exports);return m.exports;}
const p=load('lib/permissions.ts'),{NextRequest}=require('next/server');
for(const role of ['Public','Collecteur','Observateur']){assert(!p.isEnabledRole(role));assert(!p.canViewInternal(role));assert(!p.canSync(role));}
assert(p.canSync(p.ROLE_DNH));assert(!p.canAccessOuvrages(p.ROLE_DNH));assert(!p.canAccessSigDecisionnel(p.ROLE_DNH));assert(!p.canViewRestorations(p.ROLE_DNH));assert(!p.canViewFinances(p.ROLE_ADMIN));
(async()=>{
for(const role of ['Public','Collecteur','Observateur','DNH/DRHK','Administrateur PTCS','Super administrateur']){
 const chain={select(){return this},eq(){return this},maybeSingle:async()=>({data:{actif:true,roles:{nom_role:role}},error:null})};
 const auth=load('lib/auth-server.ts',{'@/lib/supabase-admin':{supabaseAdmin:{auth:{getUser:async()=>({data:{user:{id:'fixture',email:'fixture@example.invalid'}},error:null})},from:()=>chain}},'@/lib/permissions':p});
 const r=await auth.requireApiRole(new NextRequest('http://localhost/api/test',{headers:{Authorization:'Bearer fixture'}}),[role]);assert.equal(r.response?.status,p.isEnabledRole(role)?undefined:403);
}
for(const actor of [p.ROLE_ADMIN,p.ROLE_SUPER_ADMIN]){
 const chain={select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:'super',nom_role:p.ROLE_SUPER_ADMIN,roles:{nom_role:p.ROLE_SUPER_ADMIN}},error:null})};
 const policy=load('lib/user-management-policy.ts',{'@/lib/supabase-admin':{supabaseAdmin:{from:()=>chain}},'@/lib/permissions':p});
 assert.equal((await policy.checkManagedTarget(actor,'id','super'))?.status,actor===p.ROLE_ADMIN?403:undefined);assert.equal((await policy.checkAssignableRole(actor,'super'))?.status,actor===p.ROLE_ADMIN?403:undefined);
}
for(const path of ['create','update-role','reset-password']){
 let writes=0;
 const chain={select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:'role',nom_role:p.ROLE_ADMIN},error:null}),update(){writes++;return this}};
 const api=load(`app/api/admin/users/${path}/route.ts`,{'@/lib/auth-server':{requireApiRole:async()=>({ctx:{role:p.ROLE_ADMIN}})},'@/lib/permissions':p,'@/lib/supabase-admin':{supabaseAdmin:{from:()=>chain,auth:{admin:new Proxy({},{get:()=>()=>{writes++;throw Error('Forbidden auth mutation')}})}}},'@/lib/user-management-policy':{checkManagedTarget:async()=>new Response('',{status:403}),checkAssignableRole:async()=>null}});
 const r=await api.POST(new NextRequest('http://localhost/api/test',{method:'POST',body:JSON.stringify({user_id:'super',email:'super@example.invalid',password:'test-password',role_id:'role',actif:false}),headers:{'Content-Type':'application/json'}}));assert.equal(r.status,403);assert.equal(writes,0);
}
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function ui(file,superAdmin){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(n=>n==='@/components/auth/useRole'?{useRole:()=>({isSuperAdmin:superAdmin})}:require(n),m,m.exports);return renderToStaticMarkup(React.createElement(m.exports.default));}
assert(!ui('components/admin/RoleRules.tsx',false).includes('Super administrateur'));assert(ui('components/admin/RoleRules.tsx',true).includes('Super administrateur'));

const listApi=load('app/api/admin/users/route.ts',{'@/lib/permissions':p,'@/lib/auth-server':{requireApiRole:async()=>({ctx:{role:p.ROLE_ADMIN}})},'@/lib/supabase-admin':{supabaseAdmin:{from:table=>{const result=table==='roles'?[{id:'s',nom_role:p.ROLE_SUPER_ADMIN},{id:'d',nom_role:p.ROLE_DNH},{id:'p',nom_role:p.ROLE_PUBLIC}]:[{id:'s',roles:{nom_role:p.ROLE_SUPER_ADMIN}},{id:'d',roles:{nom_role:p.ROLE_DNH}}];return{select(){return this},order:async()=>({data:result,error:null})};}}}});
const listing=await (await listApi.GET(new NextRequest('http://localhost/api/admin/users'))).json();assert.deepEqual(listing.users.map(u=>u.id),['d']);assert.deepEqual(listing.roles.map(r=>r.id),['d']);
const sync=load('app/api/sync/_auth.ts',{'@/lib/permissions':p,'@/lib/auth-server':{requireApiRole:async(req,allowed)=>{assert(allowed.includes(p.ROLE_DNH));return{ctx:{role:p.ROLE_DNH}};}}});assert.equal((await sync.authorizeSync(new NextRequest('http://localhost/api/sync/pluviometrie'))).mode,'user');
console.log('OK: disabled roles denied server-side; DNH sync enabled, ouvrages/SIG/restoration denied; PTCS admin cannot assign/manage/reset Superadmin, including create-by-email. Simulated profiles, no external writes.');
})().catch(e=>{console.error(e);process.exitCode=1});
