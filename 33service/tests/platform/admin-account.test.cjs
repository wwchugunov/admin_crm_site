const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const{setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs'),{totp}=require('../../../platform/api/admin-auth.cjs'),{signRequest}=require('../../../platform/core/request-proof.cjs');

async function fixture(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'orbit-admin-account-')),keys=setup(directory),store=new ProductStore(path.join(directory,'owner.sqlite')),server=createProductServer({store,...keys});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(directory,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port,secret=fs.readFileSync(path.join(directory,'admin-totp.secret'),'utf8'),base=Math.floor(Date.now()/30000);
 const session=async(fields,counter)=>{const pair=crypto.generateKeyPairSync('ed25519'),body=JSON.stringify({...fields,otp:totp(secret,counter),public_key:pair.publicKey.export({type:'spki',format:'pem'})}),proofToken=fields.login??fields.token;const r=await fetch(url+'/admin/session',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+proofToken,...signRequest('POST','/admin/session',body,proofToken,pair.privateKey)},body});return{status:r.status,value:await r.json(),key:pair.privateKey};};
 const call=async(s,route,data)=>{const body=data===undefined?undefined:JSON.stringify(data),method=data===undefined?'GET':'POST',token=s.value.session;const r=await fetch(url+route,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{}),...signRequest(method,route,body,token,s.key)},body});return{status:r.status,value:await r.json()};};
 return{keys,base,session,call,url,secret};
}

test('The owner can switch from the emergency key to email, password and authenticator code',async t=>{
 const f=await fixture(t);
 const byKey=await f.session({token:f.keys.adminToken},f.base-1);assert.equal(byKey.status,200,JSON.stringify(byKey.value));
 assert.deepEqual((await f.call(byKey,'/admin/snapshot')).value.adminAccount,{configured:false,login:'',updatedAt:null});
 assert.equal((await f.call(byKey,'/admin/account',{login:'not-an-email',password:'long-enough-password'})).status,400);
 assert.equal((await f.call(byKey,'/admin/account',{login:'owner@example.test',password:'short'})).status,400);
 assert.equal((await f.call(byKey,'/admin/account',{login:' Owner@Example.test ',password:'first-long-password'})).status,200);
 assert.equal((await f.call(byKey,'/admin/snapshot')).value.adminAccount.login,'owner@example.test');
 assert.equal((await f.session({login:'owner@example.test',password:'wrong-password-123'},f.base)).status,401);
 assert.equal((await f.session({login:'other@example.test',password:'first-long-password'},f.base)).status,401);
 const byPassword=await f.session({login:'OWNER@example.test',password:'first-long-password'},f.base);assert.equal(byPassword.status,200,'email is case-insensitive');
 assert.equal((await f.call(byPassword,'/admin/snapshot')).status,200);
 assert.equal((await f.call(byPassword,'/admin/account',{login:'owner@example.test',password:'second-long-password'})).status,403,'a change needs the current password');
 assert.equal((await f.call(byPassword,'/admin/account',{login:'owner@example.test',password:'second-long-password',current_password:'first-long-password'})).status,200);
 assert.equal((await f.session({login:'owner@example.test',password:'first-long-password'},f.base+1)).status,401,'the old password stops working');
 const again=await f.session({login:'owner@example.test',password:'second-long-password'},f.base+1);assert.equal(again.status,200);
 assert.equal((await f.session({login:'owner@example.test',password:'second-long-password'},f.base+1)).status,401,'a code cannot be reused');
});

test('Password sign-in still needs the authenticator code and a matching device proof',async t=>{
 const f=await fixture(t);
 const byKey=await f.session({token:f.keys.adminToken},f.base-1);await f.call(byKey,'/admin/account',{login:'owner@example.test',password:'first-long-password'});
 const forged=async()=>{const pair=crypto.generateKeyPairSync('ed25519'),body=JSON.stringify({login:'owner@example.test',password:'first-long-password',otp:totp(f.secret,f.base),public_key:pair.publicKey.export({type:'spki',format:'pem'})});const r=await fetch(f.url+'/admin/session',{method:'POST',headers:{'Content-Type':'application/json',...signRequest('POST','/admin/session',body,'someone-else',pair.privateKey)},body});return r.status;};
 assert.equal(await forged(),401,'the device proof must be bound to the same login');
 assert.equal((await f.session({login:'owner@example.test',password:'first-long-password'},f.base+5)).status,401,'a wrong code is rejected');
 assert.equal((await f.session({token:f.keys.adminToken},f.base)).status,200,'the emergency key keeps working');
});
