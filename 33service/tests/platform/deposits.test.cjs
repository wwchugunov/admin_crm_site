const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-deposit-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Олена',email:'olena@example.test',business:'Ліра',days:30,max_devices:2});
 const id=server.accounts.addBusiness(user,'Ліра'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id),runtime=server.accounts.businesses.get(business),store=runtime.store;
 store.set('timezone','Europe/Kyiv');store.set('work_start','08:00');store.set('work_end','21:00');store.set('work_days',[1,2,3,4,5,6,7]);
 const invoices=[];runtime.vault.put('monobank','test-token-1234567890');
 server.accounts.monobank.invoice=async(b,r,data)=>{invoices.push(data);return{url:'https://pay.example/'+invoices.length};};
 const sent=[];runtime.vault.put('telegram','000000:test');runtime.telegram.call=async(m,p)=>{if(m==='sendMessage')sent.push(p);return{};};
 const events=[];server.accounts.notify.event=async(...a)=>{events.push(a.slice(1,4));};
 const resource=store.addResource({name:'Олена'}),client=store.addClient({name:'Марія',phone:'+380671112233'});
 let n=0;const visit=(service)=>store.book({client_id:client,service_id:service,resource_ids:[resource],start:Date.parse(new Date(Date.now()+ ++n*86400000).toISOString().slice(0,10)+'T07:00:00Z')});
 t.after(async()=>{await server.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 return{server,business,runtime,store,invoices,events,visit,client,deposits:server.accounts.deposits};
}
test('An online booking of a service with a prepayment waits 30 minutes, then is cancelled if unpaid',async t=>{
 const f=await fixture(t),cut=f.store.addService({name:'Стрижка',duration:60,price:800,deposit:200}),free=f.store.addService({name:'Консультація',duration:30,price:300});
 assert.equal(await f.deposits.request(f.business,f.runtime,f.visit(free)),null,'no prepayment set — nothing asked');
 const a=f.visit(cut),d=await f.deposits.request(f.business,f.runtime,a);
 assert.deepEqual([d.amount,d.url,f.invoices[0].amount],[20000,'https://pay.example/1',200]);
 assert(d.until>Date.now()+29*60000&&d.until<=Date.now()+30*60000);
 await f.deposits.tick(Date.now());assert.equal(f.store.visits('a.id=?',[a])[0].status,'confirmed','still within the time');
 await f.deposits.tick(Date.now()+31*60000);
 assert.equal(f.store.visits('a.id=?',[a])[0].status,'cancelled');assert.deepEqual(f.events[0],['cancel',a,'deposit']);
});
test('A paid prepayment keeps the visit; without monobank or LiqPay nothing is asked',async t=>{
 const f=await fixture(t),cut=f.store.addService({name:'Стрижка',duration:60,price:800,deposit:200});
 const a=f.visit(cut);await f.deposits.request(f.business,f.runtime,a);
 f.store.payment({appointment_id:a,amount:200,method:'cash'});
 assert.equal(f.store.visits('a.id=?',[a])[0].deposit_until,null);
 await f.deposits.tick(Date.now()+31*60000);assert.equal(f.store.visits('a.id=?',[a])[0].status,'confirmed');
 f.runtime.vault.remove('monobank');assert.equal(await f.deposits.request(f.business,f.runtime,f.visit(cut)),null);
 f.store.updateService({id:cut,name:'Стрижка',duration:60,price:800,deposit:0});assert.equal(f.store.db.prepare('SELECT deposit FROM services WHERE id=?').get(cut).deposit,0);
});
