const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../api/server.cjs');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-web-booking-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Owner',email:'owner@example.test',business:'Studio',days:14,max_devices:2});
 const company=server.accounts.addBusiness(user,'Studio'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(company),{store}=server.accounts.businesses.get(business);
 store.set('website_enabled',true);store.set('work_days',[1,2,3,4,5,6,7]);store.set('timezone','UTC');
 const service=store.addService({name:'Visit',duration:30,price:100,capacity:1,required_resources:1,web_visible:true,bot_visible:true}),resource=store.addResource({name:'Specialist'});
 const date=new Date(Date.now()+2*86400000).toISOString().slice(0,10),start=store.slots(service,resource,date)[0];assert(start);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+server.address().port+'/v1/website/'+company;
 const call=async(suffix='',body)=>{const r=await fetch(base+suffix,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return{status:r.status,value:await r.json()};};
 const booking=()=>({request_id:crypto.randomUUID(),name:'New visitor',phone:'+380 (67) 123-45-67',consent:true,service_id:service,resource_id:resource,start});
 return{owner,server,store,user,company,service,resource,date,start,call,booking};
}
test('Website exposes only public catalogue, reuses phone clients and shares calendar',async t=>{
 const f=await fixture(t),hidden=f.store.addService({name:'Private',duration:30,price:100,capacity:1,required_resources:1,web_visible:false,bot_visible:false});
 const existing=f.store.addClient({name:'Existing name',phone:'+380671234567',notes:'Private notes'}),catalog=await f.call();assert.equal(catalog.status,200);assert(!JSON.stringify(catalog).includes('Private'));assert(!JSON.stringify(catalog).includes(existing));assert(!catalog.value.services.some(s=>s.id===hidden));
 assert((await f.call('?service_id='+f.service+'&date='+f.date)).value.slots.includes(f.start));
 const body=f.booking(),created=await f.call('/book',body);assert.equal(created.status,201);assert.equal(f.store.db.prepare('SELECT count(*) n FROM clients').get().n,1);assert.equal(f.store.db.prepare('SELECT name FROM clients WHERE id=?').get(existing).name,'Existing name');assert.equal(f.store.snapshot().appointments[0].id,created.value.appointment_id);
 assert(!(await f.call('?service_id='+f.service+'&date='+f.date)).value.slots.includes(f.start));
 const retry=await f.call('/book',body);assert.equal(retry.status,200);assert.deepEqual(retry.value,created.value);assert.equal((await f.call('/book',{...body,name:'Changed'})).status,409);assert.equal((await f.call('/book',f.booking())).status,409);assert.equal(f.store.snapshot().appointments.length,1);
});
test('Website validates consent, phone, visibility, working hours and license',async t=>{
 const f=await fixture(t),body=f.booking();for(const changes of[{consent:false},{phone:''},{phone:'abc1234567'},{people_count:0},{start:String(f.start)},{service_id:'missing'},{resource_id:'missing'}])assert.equal((await f.call('/book',{...body,...changes})).status,400);
 assert.equal((await f.call('/book',{...body,start:f.start+60000})).status,409);assert.equal(f.store.db.prepare('SELECT count(*) n FROM clients').get().n,0);
 f.store.set('website_enabled',false);assert.equal((await f.call()).status,404);assert.equal((await f.call('/book',body)).status,404);f.store.set('website_enabled',true);f.owner.db.prepare('UPDATE users SET expires=? WHERE id=?').run(Date.now()-1,f.user);assert.equal((await f.call('/book',body)).status,403);
});
test('Concurrent submissions and fresh handlers reuse persisted booking receipts',async t=>{
 const f=await fixture(t),body=f.booking(),results=await Promise.all([f.call('/book',body),f.call('/book',body)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,201]);assert.equal(results[0].value.appointment_id,results[1].value.appointment_id);
 const{WebsiteBooking}=require('../api/website-booking.cjs');f.server.accounts.websiteBooking=new WebsiteBooking(f.server.accounts);assert.deepEqual((await f.call('/book',body)).value,results[0].value);assert.equal(f.store.snapshot().appointments.length,1);
});
test('Public booking submission attempts are bounded',async t=>{
 const f=await fixture(t);for(let i=0;i<20;i++)assert.equal((await f.call('/book',{...f.booking(),consent:false})).status,400);assert.equal((await f.call('/book',f.booking())).status,429);
});
