const {test}=require('node:test'),assert=require('node:assert/strict');const {Store}=require('../../../platform/core/store.cjs');
function fixture(t){const store=new Store(':memory:');t.after(()=>store.db.close());const service=store.addService({name:'Стрижка',duration:60,price:500}),resource=store.addResource({name:'Ірина'}),client=store.addClient({name:'Анна',phone:'+380671234567'});return{store,service,resource,client};}
const hour=3600000;
test('A visit that already happened can be written down: it counts as done and sends no reminders',t=>{
 const f=fixture(t),start=Math.floor((Date.now()-26*hour)/900000)*900000;
 const id=f.store.book({client_id:f.client,service_id:f.service,resource_ids:[f.resource],start});
 const a=f.store.db.prepare('SELECT * FROM appointments WHERE id=?').get(id);
 assert.equal(a.status,'completed');assert.equal(f.store.db.prepare('SELECT count(*) n FROM reminders WHERE appointment_id=?').get(id).n,0);
 assert.equal(f.store.db.prepare('SELECT count(*) n FROM reminder_deliveries WHERE appointment_id=?').get(id).n,0);
});
test('A visit going on right now stays open, and the 31-day limit and future-only moves still hold',t=>{
 const f=fixture(t),now=Math.floor((Date.now()-30*60000)/60000)*60000;
 const id=f.store.book({client_id:f.client,service_id:f.service,resource_ids:[f.resource],start:now});
 assert.equal(f.store.db.prepare('SELECT status FROM appointments WHERE id=?').get(id).status,'confirmed','still in progress, the team marks it');
 assert.throws(()=>f.store.book({client_id:f.client,service_id:f.service,resource_ids:[f.resource],start:Date.now()-32*24*hour}),/31/);
 const future=f.store.book({client_id:f.client,service_id:f.service,resource_ids:[f.resource],start:Math.ceil((Date.now()+48*hour)/900000)*900000});
 assert.throws(()=>f.store.reschedule({id:future,start:Date.now()-3*hour,resource_ids:[f.resource]}));
});
