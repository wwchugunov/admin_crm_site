const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../owner/server.cjs');
const {midnight}=require('../owner/notify.cjs');
const TZ='Europe/Kyiv',kyiv=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ}).format(ms);
test('Booking page clients are marked as coming from the page; the morning summary names birthdays',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-client-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Олена',email:'o@example.test',business:'Ліра',days:30,max_devices:2});
 const id=server.accounts.addBusiness(user,'Ліра'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id),runtime=server.accounts.businesses.get(business),store=runtime.store;
 store.set('timezone',TZ);store.set('work_days',[1,2,3,4,5,6,7]);
 const service=store.addService({name:'Стрижка',duration:60,price:900,web_visible:true,bot_visible:true});store.addResource({name:'Олена'});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const page=server.accounts.bookingPage;page.save(business,runtime,{slug:'lira-test',enabled:true});
 const date=kyiv(Date.now()+2*86400000),start=store.slots(service,'any',date)[0];
 const r=await fetch(`http://127.0.0.1:${server.address().port}/b/lira-test/book`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:page.token('lira-test',Date.now()-5000),request_id:crypto.randomUUID(),name:'Марія',phone:'+380671112233',consent:true,service_id:service,resource_id:'any',start})});
 assert.equal(r.status,201);
 assert.equal(store.snapshot().clients[0].source,'page');
 // A birthday today shows in the owner's morning summary.
 const today=kyiv(Date.now());
 store.addClient({name:'Софія Іменинниця',phone:'+380501112233',birthday:`1990-${today.slice(5)}`});
 const text=server.accounts.notify.morningText(business,runtime,midnight(today,TZ)+8*3600000).text;
 assert.match(text,/🎂 День народження: Софія Іменинниця \(\+380501112233\)/);
});
