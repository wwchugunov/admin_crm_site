const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const{setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs'),{totp}=require('../../../platform/api/admin-auth.cjs'),{signRequest}=require('../../../platform/core/request-proof.cjs');

async function fixture(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'orbit-admin-members-')),keys=setup(directory),store=new ProductStore(path.join(directory,'owner.sqlite')),server=createProductServer({store,...keys});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(directory,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port,secret=fs.readFileSync(path.join(directory,'admin-totp.secret'),'utf8'),base=Math.floor(Date.now()/30000);
 const session=async(fields,code)=>{const pair=crypto.generateKeyPairSync('ed25519'),body=JSON.stringify({...fields,otp:code,public_key:pair.publicKey.export({type:'spki',format:'pem'})}),proof=fields.login??fields.token;const r=await fetch(url+'/admin/session',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+proof,...signRequest('POST','/admin/session',body,proof,pair.privateKey)},body});return{status:r.status,value:await r.json(),key:pair.privateKey};};
 const call=async(s,route,data)=>{const body=data===undefined?undefined:JSON.stringify(data),method=data===undefined?'GET':'POST',token=s.value.session;const r=await fetch(url+route,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{}),...signRequest(method,route,body,token,s.key)},body});return{status:r.status,value:await r.json()};};
 const open=async(route,data)=>{const r=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return{status:r.status,value:await r.json()};};
 return{keys,secret,base,session,call,open};
}

test('The owner invites an administrator who sets a password and their own authenticator, then signs in',async t=>{
 const f=await fixture(t),owner=await f.session({token:f.keys.adminToken},totp(f.secret,f.base-1));assert.equal(owner.status,200);
 await f.call(owner,'/admin/account',{login:'owner@example.test',password:'owner-long-password'});
 const invited=await f.call(owner,'/admin/members/invite',{email:'Helper@Example.test',name:'Оксана'});
 assert.equal(invited.status,201,JSON.stringify(invited.value));assert.match(invited.value.link,/#invite=/);
 assert.equal((await f.call(owner,'/admin/members/invite',{email:'helper@example.test',name:'Again'})).status,409,'one invitation per email');
 assert.equal((await f.call(owner,'/admin/members/invite',{email:'owner@example.test',name:'Me'})).status,409);
 const token=invited.value.link.split('#invite=')[1];
 const info=await f.open('/admin/invite/info',{token});assert.equal(info.status,200);assert.equal(info.value.email,'helper@example.test');assert.match(info.value.uri,/^otpauth:\/\/totp\//);
 assert.equal((await f.open('/admin/invite/accept',{token,password:'helper-long-password',otp:'000000'})).status,401,'a wrong code does not activate');
 const counter=Math.floor(Date.now()/30000);
 assert.equal((await f.open('/admin/invite/accept',{token,password:'helper-long-password',otp:totp(info.value.secret,counter)})).status,200);
 assert.equal((await f.open('/admin/invite/info',{token})).status,404,'the link works once');
 assert.equal((await f.session({login:'helper@example.test',password:'helper-long-password'},totp(info.value.secret,counter))).status,401,'the same code cannot be reused');
 const helper=await f.session({login:'helper@example.test',password:'helper-long-password'},totp(info.value.secret,counter+1));
 assert.equal(helper.status,200,JSON.stringify(helper.value));
 const snap=await f.call(helper,'/admin/snapshot');assert.equal(snap.status,200);assert.equal(snap.value.adminMe.owner,false);assert.equal(snap.value.adminMembers[0].status,'active');
 assert.equal((await f.call(helper,'/admin/members/invite',{email:'third@example.test',name:'Третій'})).status,403,'only the owner manages administrators');
 assert.equal((await f.call(helper,'/admin/account',{login:'helper@example.test',password:'take-over-password'})).status,403,'an administrator cannot take over the owner sign-in');
 assert.equal((await f.session({login:'helper@example.test',password:'helper-long-password'},totp(f.secret,counter+1))).status,401,'the owner code does not work for another administrator');
 assert.equal((await f.call(owner,'/admin/members/delete',{id:invited.value.id})).status,200);
 assert.equal((await f.call(helper,'/admin/snapshot')).status,401,'removal ends the session at once');
});
