const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');
const {signRequest}=require('../../../platform/core/request-proof.cjs');
const Permissions=require('../../../platform/shared/permissions.js');

async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-perms-'));
 const keys=setup(dir),store=new ProductStore(path.join(dir,'owner.sqlite')),server=createProductServer({store,...keys,allowLocalAdmin:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port;
 const call=async(route,body,token=keys.adminToken,key)=>{const raw=JSON.stringify(body);const r=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(key?signRequest('POST',route,raw,token,key):{})},body:raw});return{status:r.status,value:await r.json()};};
 const get=async(route,s)=>{const r=await fetch(url+route,{headers:{Authorization:'Bearer '+s.session,...signRequest('GET',route,'',s.session,s.key)}});return{status:r.status,value:await r.json()};};
 const login=async(login,password)=>{const pair=crypto.generateKeyPairSync('ed25519'),c=await call('/v1/auth/challenge',{login,password,public_key:pair.publicKey.export({type:'spki',format:'pem'})});assert.equal(c.status,200,JSON.stringify(c.value));const r=await call('/v1/auth/login',{challenge_id:c.value.challenge_id,signature:crypto.sign(null,Buffer.from(JSON.stringify(c.value)),pair.privateKey).toString('base64url'),platform:'darwin',arch:'x64',version:'1.3.0'});assert.equal(r.status,200,JSON.stringify(r.value));return{...r.value,key:pair.privateKey};};
 await call('/admin/users',{name:'Olena',email:'owner@example.test',password:'owner-password-123',business:'Studio',days:14,max_devices:5});
 const owner=await login('owner@example.test','owner-password-123'),business=owner.businesses[0].id,q='?business_id='+business;
 const as=(s)=>(route,body)=>call(route+q,body,s.session,s.key);
 return{call,get,login,owner,business,q,as,O:as(owner),ownerStore:store};
}

test('Every part of the app can be switched on or off for a team member, and the server enforces it',async t=>{
 const f=await fixture(t);
 // An employee starts with the schedule and clients only.
 assert.equal((await f.O('/v1/crm/users/add',{name:'Max',email:'max@example.test',password:'staff-password-123',role:'staff'})).status,200);
 const max=await f.login('max@example.test','staff-password-123'),M=f.as(max);
 const service=(await f.O('/v1/crm/service',{name:'Стрижка',duration:60,price:500})).value.value||(await f.get('/v1/crm/snapshot'+f.q,f.owner)).value.services[0].id;
 const client=(await M('/v1/crm/client',{name:'Анна'}));assert.equal(client.status,200,'anyone may add a client while booking');
 assert.equal((await M('/v1/crm/service',{name:'Фарбування',duration:60,price:900})).status,403,'no catalog by default');
 assert.equal((await M('/v1/crm/expense',{amount:100,category:'rent',date:'2026-10-01'})).status,403,'no finance by default');
 const snap=(await f.get('/v1/crm/snapshot'+f.q,max)).value;
 assert.equal(snap.perms.money,false);assert.deepEqual(snap.payments,[],'payments are hidden without money');
 // The owner switches catalog and money on.
 const users=(await f.get('/v1/crm/users'+f.q,f.owner)).value,id=users.find(u=>u.email==='max@example.test').id;
 assert.deepEqual(users.find(u=>u.id===id).perms,Permissions.PRESETS.staff);
 assert.equal((await f.O('/v1/crm/users/update',{id,role:'staff',stage:'active',perms:{...Permissions.PRESETS.staff,catalog:true,money:true}})).status,200);
 assert.equal((await M('/v1/crm/service',{name:'Фарбування',duration:60,price:900})).status,200,'catalog now allowed');
 const again=(await f.get('/v1/crm/snapshot'+f.q,max)).value;
 assert.equal(again.perms.catalog,true);assert.equal(again.perms.money,true);
 // An administrator without settings cannot change the company profile.
 assert.equal((await f.O('/v1/crm/users/add',{name:'Ira',email:'ira@example.test',password:'admin-password-123',role:'admin',perms:{...Permissions.PRESETS.admin,settings:false}})).status,200);
 const ira=await f.login('ira@example.test','admin-password-123'),I=f.as(ira);
 assert.equal((await I('/v1/crm/profile',{business:'Нова назва'})).status,403);
 assert.notEqual((await I('/v1/crm/service',{name:'Масаж',duration:60,price:700})).status,403);
 // Team management stays with the owner whatever the switches say.
 assert.equal((await I('/v1/crm/users/add',{name:'X',email:'x@example.test',password:'staff-password-123',role:'staff'})).status,403);
 assert.equal((await M('/v1/crm/users/update',{id,role:'admin',stage:'active'})).status,403);
});

test('Plans: everything is open while sales are off or during a trial; with sales on a plan limits features',async t=>{
 const f=await fixture(t),store=f.ownerStore;
 const sell=()=>f.O('/v1/crm/certificate',{amount:500,method:'cash'});
 assert.equal((await sell()).status,200,'sales off: all features');
 store.setProduct('sales',true);
 const owner=store.db.prepare("SELECT id FROM users WHERE email='owner@example.test'").get().id;
 store.db.prepare("UPDATE users SET stage='trial',plan='start' WHERE id=?").run(owner);
 assert.equal((await sell()).status,200,'trial: all features');
 store.db.prepare("UPDATE users SET stage='active',plan='start' WHERE id=?").run(owner);
 const refused=await sell();assert.equal(refused.status,403);assert.match(refused.value.error,/Про/);
 assert.equal((await f.O('/v1/crm/expense',{amount:100,category:'rent',date:'2026-10-01'})).status,403,'reports need Business');
 assert.equal((await f.get('/v1/crm/snapshot'+f.q,f.owner)).value.plan.id,'start');
 store.db.prepare("UPDATE users SET plan='business' WHERE id=?").run(owner);
 assert.notEqual((await f.O('/v1/crm/expense',{amount:100,category:'rent',date:'2026-10-01'})).status,403);
 assert.equal((await sell()).status,403);
 store.db.prepare("UPDATE users SET plan='pro' WHERE id=?").run(owner);
 assert.equal((await sell()).status,200);
 // The admin switch publishes or hides the offer together with sales.
 assert.equal((await f.call('/admin/product',{sales:false})).status,200);
 assert.equal(store.db.prepare("SELECT disabled FROM document_switches WHERE kind='site-offer'").get().disabled,1);
 assert.equal((await f.call('/admin/product',{sales:true})).status,200);
 assert.equal(store.db.prepare("SELECT disabled FROM document_switches WHERE kind='site-offer'").get().disabled,0);
});

test('When a subscription ends the whole team loses write access; renewing brings it back',async t=>{
 const f=await fixture(t),store=f.ownerStore;
 await f.O('/v1/crm/users/add',{name:'Max',email:'max@example.test',password:'staff-password-123',role:'staff'});
 const max=await f.login('max@example.test','staff-password-123'),M=f.as(max);
 const owner=store.db.prepare("SELECT id FROM users WHERE email='owner@example.test'").get().id;
 store.db.prepare("UPDATE users SET expires=? WHERE id=?").run(Date.now()-86400000,owner);
 assert.equal((await M('/v1/crm/client',{name:'Анна'})).status,403,'employee blocked');
 assert.equal((await f.O('/v1/crm/client',{name:'Анна'})).status,403,'owner read-only');
 assert.equal((await f.get('/v1/crm/snapshot'+f.q,f.owner)).status,200,'owner can still look and export');
 store.db.prepare("UPDATE users SET expires=? WHERE id=?").run(Date.now()-31*86400000,owner);
 assert.equal((await f.get('/v1/crm/snapshot'+f.q,f.owner)).status,403,'after 30 days nothing is open');
 store.db.prepare("UPDATE users SET expires=?,stage='active' WHERE id=?").run(Date.now()+30*86400000,owner);
 assert.equal((await M('/v1/crm/client',{name:'Анна'})).status,200,'renewed');
});

test('The owner-line switch is stored like the other product switches and reaches the public site', async () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'owner-switch-'));setup(dir);const store=new ProductStore(path.join(dir,'owner.sqlite'));
 try{assert.equal(store.product().owner,true);store.setProduct('owner',false);assert.equal(store.product().owner,false);assert.throws(()=>store.setProduct('owner','no'));}
 finally{store.db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
