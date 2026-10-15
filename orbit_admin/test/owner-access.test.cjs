const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../owner/server.cjs');
const {provisionOwner}=require('../tools/provision-owner.cjs');
const {PERPETUAL_EXPIRY}=require('../owner/entitlements.cjs');
const {signRequest}=require('../src/request-proof.cjs');
test('Personal perpetual account is idempotent, uses ordinary short leases, and can be blocked',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-owner-access-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const first=await provisionOwner(dir,'owner@example.test'),again=await provisionOwner(dir,'owner@example.test');assert.equal(first.created,true);assert.equal(again.created,false);assert.equal(first.user_id,again.user_id);
 const keys=setup(dir),store=new ProductStore(path.join(dir,'owner.sqlite')),server=createProductServer({store,...keys,allowLocalAdmin:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();store.db.close();});
 const pair=crypto.generateKeyPairSync('ed25519'),url='http://127.0.0.1:'+server.address().port;
 async function call(route,body,token=keys.adminToken,key){const raw=JSON.stringify(body);const response=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(key?signRequest('POST',route,raw,token,key):{})},body:raw});return {status:response.status,value:await response.json()};}
 assert.equal((await call('/admin/password',{user_id:first.user_id,password:'owner-test-password'})).status,200);
 const challenge=await call('/v1/auth/challenge',{login:'owner@example.test',password:'owner-test-password',public_key:pair.publicKey.export({type:'spki',format:'pem'})});
 const login=await call('/v1/auth/login',{challenge_id:challenge.value.challenge_id,signature:crypto.sign(null,Buffer.from(JSON.stringify(challenge.value)),pair.privateKey).toString('base64url'),platform:'darwin',arch:'x64',version:'1.1.0'});assert.equal(login.status,200);
 const lease=JSON.parse(Buffer.from(login.value.license.split('.')[0],'base64url'));assert(lease.expires<=Date.now()+300000);assert.equal(lease.trial,false);assert.equal(login.value.businesses.length,1);
 const user=store.snapshot().users[0];assert.equal(user.expires,PERPETUAL_EXPIRY);assert.equal(user.perpetual,1);
 assert.equal((await call('/v1/crm/client?business_id='+first.business_id,{name:'Owner test'},login.value.session,pair.privateKey)).status,200);
 assert.equal((await call('/admin/user',{id:user.id,stage:'trial',perpetual:true,max_devices:10})).status,400);
 assert.equal((await call('/admin/user',{id:user.id,stage:'blocked',expires:user.expires,max_devices:10})).status,200);
 assert.equal((await call('/v1/crm/client?business_id='+first.business_id,{name:'Blocked'},login.value.session,pair.privateKey)).status,401);
});
