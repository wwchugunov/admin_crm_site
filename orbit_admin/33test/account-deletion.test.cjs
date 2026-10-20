const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../owner/server.cjs');
const {signRequest}=require('../src/request-proof.cjs');

async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-account-deletion-'));
 const keys=setup(dir),store=new ProductStore(path.join(dir,'owner.sqlite')),server=createProductServer({store,...keys,allowLocalAdmin:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port;
 const call=async(route,body,token=keys.adminToken,key)=>{const raw=JSON.stringify(body);const r=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(key?signRequest('POST',route,raw,token,key):{})},body:raw});return{status:r.status,value:await r.json()};};
 const login=async(login,password)=>{const pair=crypto.generateKeyPairSync('ed25519'),c=await call('/v1/auth/challenge',{login,password,public_key:pair.publicKey.export({type:'spki',format:'pem'})});assert.equal(c.status,200,JSON.stringify(c.value));const r=await call('/v1/auth/login',{challenge_id:c.value.challenge_id,signature:crypto.sign(null,Buffer.from(JSON.stringify(c.value)),pair.privateKey).toString('base64url'),platform:'darwin',arch:'x64',version:'1.3.0'});assert.equal(r.status,200,JSON.stringify(r.value));return{...r.value,key:pair.privateKey};};
 const owner=(await call('/admin/users',{name:'Olena',email:'owner@example.test',password:'owner-password-123',business:'Studio',days:14,max_devices:3})).value.id;
 const session=await login('owner@example.test','owner-password-123'),business=session.businesses[0].id;
 assert.equal((await call('/v1/crm/client?business_id='+business,{name:'Client'},session.session,session.key)).status,200);
 assert.equal((await call('/v1/crm/users/add?business_id='+business,{name:'Max',email:'staff@example.test',password:'staff-password-123',role:'staff'},session.session,session.key)).status,200);
 const companyDir=path.join(dir,'businesses',business);assert(fs.existsSync(path.join(companyDir,'crm.sqlite')));
 const count=(sql,...v)=>store.db.prepare(sql).get(...v).n;
 return{dir,store,call,login,owner,session,business,companyDir,count};
}

test('An owner deletes their account from the app: owner, team, companies and files are erased',async t=>{
 const f=await fixture(t),staff=await f.login('staff@example.test','staff-password-123');
 assert.equal((await f.call('/v1/account/delete',{password:'wrong-password-123'},f.session.session,f.session.key)).status,403,'the current password is required');
 assert.equal((await f.call('/v1/account/delete',{password:'owner-password-123'},f.session.session)).status,401,'an unsigned request is rejected');
 const done=await f.call('/v1/account/delete',{password:'owner-password-123'},f.session.session,f.session.key);
 assert.equal(done.status,200,JSON.stringify(done.value));assert.deepEqual(done.value,{deleted_users:2,deleted_businesses:1,owner:true});
 for(const table of ['users','businesses','memberships','devices','sessions','invites','login_challenges'])assert.equal(f.count(`SELECT count(*) n FROM ${table}`),0,table+' is empty');
 assert.equal(f.count("SELECT count(*) n FROM events WHERE user_id IS NOT NULL"),0,'no personal events remain');
 assert.equal(f.count("SELECT count(*) n FROM events WHERE event='account.deleted'"),1,'an anonymous audit record remains');
 assert.equal(fs.existsSync(f.companyDir),false,'the company database and vault are erased');
 assert.equal((await f.call('/v1/crm/client?business_id='+f.business,{name:'Ghost'},staff.session,staff.key)).status,401,'team sessions stop working');
 assert.equal((await f.call('/v1/auth/challenge',{login:'owner@example.test',password:'owner-password-123',public_key:crypto.generateKeyPairSync('ed25519').publicKey.export({type:'spki',format:'pem'})})).status,401,'the login is gone');
 assert.equal((await f.call('/admin/users',{name:'Olena',email:'owner@example.test',password:'owner-password-123',business:'Studio again',days:14,max_devices:3})).status,201,'the email can be registered again');
});

test('A team member deletes only themselves; the company stays with the owner',async t=>{
 const f=await fixture(t),staff=await f.login('staff@example.test','staff-password-123');
 const done=await f.call('/v1/account/delete',{password:'staff-password-123'},staff.session,staff.key);
 assert.deepEqual(done.value,{deleted_users:1,deleted_businesses:0,owner:false});
 assert.equal(f.count("SELECT count(*) n FROM users WHERE email='staff@example.test'"),0);
 assert.equal(f.count('SELECT count(*) n FROM businesses'),1);assert(fs.existsSync(f.companyDir));
 assert.equal((await f.call('/v1/crm/client?business_id='+f.business,{name:'Still works'},f.session.session,f.session.key)).status,200);
});

test('The product owner deletes a user permanently only after typing their email',async t=>{
 const f=await fixture(t);
 assert.equal((await f.call('/admin/user/delete',{id:f.owner})).status,400);
 assert.equal((await f.call('/admin/user/delete',{id:f.owner,confirm:'other@example.test'})).status,400);
 assert.equal(f.count('SELECT count(*) n FROM users'),2,'nothing deleted without confirmation');
 const done=await f.call('/admin/user/delete',{id:f.owner,confirm:' OWNER@example.test '});
 assert.equal(done.status,200);assert.equal(done.value.deleted_users,2);
 assert.equal(f.count('SELECT count(*) n FROM users'),0);assert.equal(fs.existsSync(f.companyDir),false);
 assert.equal((await f.call('/admin/user/delete',{id:f.owner,confirm:'owner@example.test'})).status,404);
 assert.equal((await f.call('/v1/crm/client?business_id='+f.business,{name:'Ghost'},f.session.session,f.session.key)).status,401);
});

test('A revoked device is signed out at once and can sign in again with the password while a seat is free',async t=>{
 const f=await fixture(t),device=f.store.db.prepare('SELECT id FROM devices WHERE user_id=?').get(f.owner).id;
 assert.equal((await f.call('/admin/revoke',{device_id:device})).status,200);
 assert.equal((await f.call('/v1/crm/client?business_id='+f.business,{name:'After revoke'},f.session.session,f.session.key)).status,401,'the session ends immediately');
 // Same installation key as before: sign in through the original key pair.
 const again=async()=>{const c=await f.call('/v1/auth/challenge',{login:'owner@example.test',password:'owner-password-123',public_key:crypto.createPublicKey(f.session.key).export({type:'spki',format:'pem'})});return f.call('/v1/auth/login',{challenge_id:c.value.challenge_id,signature:crypto.sign(null,Buffer.from(JSON.stringify(c.value)),f.session.key).toString('base64url'),platform:'win32',arch:'x64',version:'1.2.0'});};
 const r=await again();assert.equal(r.status,200,JSON.stringify(r.value));assert.equal(r.value.device_id,device);
 assert.equal(f.store.db.prepare('SELECT revoked FROM devices WHERE id=?').get(device).revoked,0);
 assert.equal(f.count("SELECT count(*) n FROM events WHERE event='device.reactivated'"),1);
 
});
