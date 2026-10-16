const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../owner/server.cjs');
const {provisionOwner}=require('../tools/provision-owner.cjs');
const {signRequest}=require('../src/request-proof.cjs');
test('For 30 days after access ends the owner can view and export, but not change data',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-expired-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const first=await provisionOwner(dir,'owner@example.test');
 const keys=setup(dir),store=new ProductStore(path.join(dir,'owner.sqlite')),server=createProductServer({store,...keys,allowLocalAdmin:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();store.db.close();});
 const pair=crypto.generateKeyPairSync('ed25519'),url='http://127.0.0.1:'+server.address().port;
 async function call(route,body,token=keys.adminToken,key){const raw=body===undefined?'':JSON.stringify(body),method=body===undefined?'GET':'POST';const response=await fetch(url+route,{method,headers:{...(raw?{'Content-Type':'application/json'}:{}),Authorization:'Bearer '+token,...(key?signRequest(method,route,raw,token,key):{})},...(raw?{body:raw}:{})});return{status:response.status,value:await response.json()};}
 await call('/admin/password',{user_id:first.user_id,password:'owner-test-password'});
 const expire=days=>store.db.prepare("UPDATE users SET expires=?,stage='active' WHERE id=?").run(Date.now()-days*86400000,first.user_id);
 expire(5);
 const challenge=await call('/v1/auth/challenge',{login:'owner@example.test',password:'owner-test-password',public_key:pair.publicKey.export({type:'spki',format:'pem'})});
 const login=await call('/v1/auth/login',{challenge_id:challenge.value.challenge_id,signature:crypto.sign(null,Buffer.from(JSON.stringify(challenge.value)),pair.privateKey).toString('base64url'),platform:'darwin',arch:'x64',version:'1.5.0'});
 assert.equal(login.status,200,JSON.stringify(login.value));
 const s=login.value.session,b='?business_id='+first.business_id;
 assert.equal((await call('/v1/crm/snapshot'+b,undefined,s,pair.privateKey)).status,200);
 assert.equal((await call('/v1/crm/export'+b,undefined,s,pair.privateKey)).status,200);
 assert.equal((await call('/v1/crm/client'+b,{name:'Change'},s,pair.privateKey)).status,403);
 expire(31);
 assert.equal((await call('/v1/crm/export'+b,undefined,s,pair.privateKey)).status,403);
});
