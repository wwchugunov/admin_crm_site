const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../owner/server.cjs');
const {passwordHash}=require('../owner/accounts.cjs');
const {createAppServer}=require('../web/app-server.cjs');
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
// API and the browser app with one company (owner + staff); a "browser" keeps its own cookies.
async function fixture(t,{seats=2}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-web-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const api=createProductServer({store:owner,...keys,allowLocalAdmin:true});const apiPort=await listen(api);
 const user=owner.addUser({name:'Олена',email:'owner@lira.test',business:'Ліра',days:30,max_devices:seats,password_hash:passwordHash('owner-password-1')});
 const businessId=api.accounts.addBusiness(user,'Ліра'),store=api.accounts.businesses.get(owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(businessId)).store;
 const service=store.addService({name:'Стрижка',duration:60,price:900,capacity:1,required_resources:1}),olena=store.addResource({name:'Олена'});
 const app=createAppServer({apiUrl:`http://127.0.0.1:${apiPort}`,origin:'http://127.0.0.1:1'});const port=await listen(app);const origin=`http://127.0.0.1:${port}`;
 // The server checks Origin against its public address; tests talk to it on a random port.
 app.removeAllListeners('request');const real=createAppServer({apiUrl:`http://127.0.0.1:${apiPort}`,origin});app.on('request',(req,res)=>real.emit('request',req,res));
 t.after(async()=>{app.close();await api.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const browser=()=>{const jar=new Map();const send=async(pathname,body,headers={})=>{const response=await fetch(origin+pathname,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json',Origin:origin}),Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...headers},body:body===undefined?undefined:JSON.stringify(body)});for(const c of response.headers.getSetCookie()){const [pair]=c.split(';'),i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return response;};
  const call=async(channel,...args)=>{const r=await send('/web/call',{channel,args});const v=await r.json();if(!r.ok)throw Object.assign(Error(v.error),{status:r.status,signedOut:v.signedOut});return v.value;};return {send,call,jar};};
 return {owner,api,store,service,olena,businessId,browser,origin};
}
test('Web app: sign in, work with the company, sign out',async t=>{
 const f=await fixture(t),b=f.browser();
 const page=await b.send('/');assert.equal(page.status,200);assert.match(await page.text(),/web\.js/);assert.match(page.headers.get('content-security-policy'),/connect-src 'self'/);
 await assert.rejects(b.call('snapshot'),e=>e.status===401&&e.signedOut===true);
 await assert.rejects(b.call('account:login','','owner@lira.test','wrong-password-1'),e=>e.status===401);
 await b.call('account:login','','owner@lira.test','owner-password-1');
 assert.match(b.jar.get('lv_session'),/^[\w-]+\.[a-f0-9-]{36}\.[a-f0-9]{16}$/);
 const s=await b.call('snapshot');assert.equal(s.mode,'server');assert.equal(s.business_id,f.businessId);assert.equal(s.update,null);
 const client=await b.call('client:add',{name:'Анна',phone:'+380671112233',birthday:'1990-01-02'});
 const visit=await b.call('booking:add',{client_id:client,service_id:f.service,resource_ids:[f.olena],start:Date.now()+86400000});
 await b.call('booking:status',visit,'completed');
 // A store validation message reaches the person instead of a generic failure.
 await assert.rejects(b.call('client:add',{name:'X',email:'not-an-email'}),e=>e.status===400&&/email/i.test(e.message));
 await assert.rejects(b.call('drive:connect'),e=>e.status===404);
 const exported=await b.send('/web/export',{format:'json'});assert.equal(exported.status,200);assert.ok(JSON.parse(await exported.text()).tables.clients.length>=1);
 await b.call('account:logout');await assert.rejects(b.call('snapshot'),e=>e.status===401);
 // The device is labelled as a browser and is not asked to install desktop updates.
 assert.equal(f.owner.db.prepare('SELECT platform FROM devices').get().platform,'web');
});
test('Web app: requests from other sites are refused',async t=>{
 const f=await fixture(t),b=f.browser();await b.call('account:login','','owner@lira.test','owner-password-1');
 const r=await b.send('/web/call',{channel:'snapshot',args:[]},{Origin:'https://evil.example'});assert.equal(r.status,403);
});
test('Web app: owner and staff share one browser; a new browser takes the oldest browser seat',async t=>{
 const f=await fixture(t,{seats:2}),owner=f.browser();
 await owner.call('account:login','','owner@lira.test','owner-password-1');
 await owner.call('account:user:add',{name:'Майстер',email:'staff@lira.test',password:'staff-password-1',role:'staff'});
 await owner.call('account:logout');
 // Same browser, another person: a separate device, not "this computer belongs to someone else".
 await owner.call('account:login','','staff@lira.test','staff-password-1');
 const staff=await owner.call('snapshot');assert.equal(staff.role,'staff');assert.ok(staff.appointments.every(a=>!a.paid&&!a.cost));
 await assert.rejects(owner.call('service:add',{name:'X',duration:30,price:1}),e=>e.status===403);
 // Both seats are used (owner + staff); the owner opens a private window: the owner's old browser is signed out.
 const fresh=f.browser();await fresh.call('account:login','','owner@lira.test','owner-password-1');
 assert.equal(f.owner.db.prepare("SELECT count(*) n FROM devices WHERE revoked=0").get().n,2);
 assert.equal(f.owner.db.prepare("SELECT count(*) n FROM events WHERE event='device.replaced'").get().n,1);
 await owner.call('snapshot');
});
test('Web app: the owner\'s many browsers never lock a colleague out',async t=>{
 const f=await fixture(t,{seats:2}),first=f.browser();
 await first.call('account:login','','owner@lira.test','owner-password-1');
 await first.call('account:user:add',{name:'Майстер',email:'staff@lira.test',password:'staff-password-1',role:'staff'});
 await f.browser().call('account:login','','owner@lira.test','owner-password-1');
 // Both seats belong to the owner; the colleague's phone takes the owner's oldest one.
 const phone=f.browser();await phone.call('account:login','','staff@lira.test','staff-password-1');
 assert.equal((await phone.call('snapshot')).role,'staff');
 assert.deepEqual(f.owner.db.prepare("SELECT u.email,count(*) n FROM devices d JOIN users u ON u.id=d.user_id WHERE d.revoked=0 GROUP BY u.email ORDER BY u.email").all().map(r=>[r.email,r.n]),[['owner@lira.test',1],['staff@lira.test',1]]);
 await assert.rejects(first.call('snapshot'),e=>e.status===401);
});
test('Web app: a new business registers in the browser and lands in its workspace',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-web-reg-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite')),sent=[];
 const api=createProductServer({store:owner,...keys,allowLocalAdmin:true,mailTransportFactory:()=>({sendMail:async m=>{sent.push(m);return{accepted:[m.to]};},close(){}})});const apiPort=await listen(api);
 await fetch(`http://127.0.0.1:${apiPort}/admin/mail/settings`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+keys.adminToken},body:JSON.stringify({enabled:true,host:'smtp.gmail.com',port:465,secure:true,user:'owner@example.test',password:'fake-password',fromEmail:'owner@example.test',fromName:'LOMVIKO',replyTo:'',ownerEmail:'owner@example.test',siteUrl:'https://biz.example.test',apiUrl:'https://api.example.test',leadReceipt:true,ownerNotice:false})});
 const probe=require('node:http').createServer();const port=await listen(probe);probe.close();
 const app=createAppServer({apiUrl:`http://127.0.0.1:${apiPort}`,origin:`http://127.0.0.1:${port}`});await new Promise(r=>app.listen(port,'127.0.0.1',r));
 t.after(async()=>{app.close();await api.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const jar=new Map(),origin=`http://127.0.0.1:${port}`;
 const call=async(channel,...args)=>{const r=await fetch(origin+'/web/call',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')},body:JSON.stringify({channel,args})});for(const c of r.headers.getSetCookie()){const[p]=c.split(';'),i=p.indexOf('=');jar.set(p.slice(0,i),p.slice(i+1));}const v=await r.json();if(!r.ok)throw Object.assign(Error(v.error),{status:r.status});return v.value;};
 await call('account:register:start',{email:'new@salon.test',name:'Ірина',business:'Салон «Нова»',password:'new-salon-password',accept:true,language:'uk'});
 await api.mail.tick();const code=sent.findLast(m=>m.to==='new@salon.test').text.match(/\b\d{6}\b/)[0];
 await assert.rejects(call('account:register:confirm','000000'),e=>e.status===401);
 await call('account:register:confirm',code);
 const s=await call('snapshot');assert.equal(s.business,'Салон «Нова»');assert.equal(s.role,'owner');
 assert.equal(owner.db.prepare("SELECT stage FROM users WHERE email='new@salon.test'").get().stage,'trial');
});
