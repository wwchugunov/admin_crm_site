const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Store}=require('../../../platform/core/store.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
for (const entity of ['service','resource']) {
 test(`Deleting ${entity} preserves visits and excludes it from all new bookings`,t=>{
  const store=new Store(':memory:');t.after(()=>store.db.close());
  const service=store.addService({name:'Consultation',duration:30,price:100,web_visible:true});
  const resource=store.addResource({name:'Olena'});const client=store.addClient({name:'Anna'});
  const start=Date.now()+2*86400000;
  const booking=store.book({client_id:client,service_id:service,resource_id:resource,start});
  store[entity==='service'?'deleteService':'deleteResource']({id:entity==='service'?service:resource});
  const snapshot=store.snapshot();assert.equal(snapshot.appointments.length,1);assert.equal(snapshot.appointments[0].id,booking);assert.equal(snapshot.appointments[0].service_name,'Consultation');assert.equal(snapshot.appointments[0].resource_name,'Olena');
  assert.equal(snapshot[entity==='service'?'services':'resources'].length,0);
  assert.throws(()=>store.book({client_id:client,service_id:service,resource_id:resource,start:start+3600000}));
  assert.deepEqual(store.availableResources(service,'any',start+3600000),[]);
  assert.deepEqual(store.slots(service,resource,new Date(start).toISOString().slice(0,10)),[]);
  if(entity==='service'){const row=store.db.prepare('SELECT * FROM services WHERE id=?').get(service);assert.equal(row.bot_visible,0);assert.equal(row.web_visible,0);assert.throws(()=>store.updateService({id:service,name:'Revived',duration:30,price:100}));}
  const copy=new Store(':memory:');t.after(()=>copy.db.close());copy.restore(store.export());assert.equal(copy.snapshot().appointments.length,1);assert.equal(copy.snapshot()[entity==='service'?'services':'resources'].length,0);
  store.status(booking,'completed');assert.equal(store.snapshot().appointments[0].status,'completed');
 });
}
test('Old databases and backups migrate without changing appointment totals',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'catalog-migrate-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const filename=path.join(dir,'old.sqlite');let store=new Store(filename);
 const service=store.addService({name:'Consultation',duration:30,price:100});const resource=store.addResource({name:'Olena'});const client=store.addClient({name:'Anna'});store.book({client_id:client,service_id:service,resource_id:resource,start:Date.now()+86400000,total:80});
 const oldBackup=store.export();for(const table of ['services','resources']){for(const row of oldBackup.tables[table])delete row.archived;store.db.exec(`ALTER TABLE ${table} DROP COLUMN archived`);}store.db.close();
 store=new Store(filename);t.after(()=>store.db.close());assert.equal(store.snapshot().services.length,1);assert.equal(store.snapshot().appointments[0].price,8000);store.restore(oldBackup);assert.equal(store.snapshot().appointments[0].price,8000);assert.equal(store.snapshot().resources.length,1);
});
