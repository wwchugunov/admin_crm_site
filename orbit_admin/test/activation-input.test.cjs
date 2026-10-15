const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../owner/server.cjs');
test('Invalid build inputs do not consume an activation key or login challenge',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-activation-input-')),keys=setup(dir),store=new ProductStore(path.join(dir,'owner.sqlite')),server=createProductServer({store,...keys,allowLocalAdmin:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port;
 async function call(route,body){const response=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+keys.adminToken},body:JSON.stringify(body)});return {status:response.status,value:await response.json()};}
 for(const flow of ['key','login']){
  const email=flow+'@example.test',password='valid-test-password';const user=await call('/admin/users',{email,password,name:'Test',business:'Company',days:14,max_devices:2});assert.equal(user.status,201);
  const pair=crypto.generateKeyPairSync('ed25519'),public_key=pair.publicKey.export({type:'spki',format:'pem'});
  const invite=flow==='key'?(await call('/admin/invite',{user_id:user.value.id})).value:null;
  const challenge=await call(flow==='key'?'/v1/challenge':'/v1/auth/challenge',flow==='key'?{token:invite.token,public_key}:{login:email,password,public_key});assert.equal(challenge.status,200);
  const fields={challenge_id:challenge.value.challenge_id,signature:crypto.sign(null,Buffer.from(JSON.stringify(challenge.value)),pair.privateKey).toString('base64url'),platform:'darwin',version:'1.1.1',arch:'invalid'};
  const route=flow==='key'?'/v1/enroll':'/v1/auth/login';assert.equal((await call(route,fields)).status,400);
  assert.equal(store.db.prepare('SELECT count(*) n FROM devices WHERE user_id=?').get(user.value.id).n,0);
  assert.equal(store.db.prepare('SELECT count(*) n FROM sessions WHERE user_id=?').get(user.value.id).n,0);
  if(invite)assert.equal(store.db.prepare('SELECT used_at FROM invites WHERE user_id=?').get(user.value.id).used_at,null);
  assert.equal((await call(route,{...fields,arch:'x64'})).status,200);
 }
});
