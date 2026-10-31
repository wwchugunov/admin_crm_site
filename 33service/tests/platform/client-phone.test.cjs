const {test}=require('node:test'),assert=require('node:assert/strict');const {Store}=require('../../../platform/core/store.cjs');
test('Client phones must be real numbers and are saved in one format; emails need a real domain',t=>{
 const s=new Store(':memory:');t.after(()=>s.db.close());
 const phone=id=>s.db.prepare('SELECT phone FROM clients WHERE id=?').get(id).phone;
 assert.equal(phone(s.addClient({name:'A',phone:'067 123 45 67'})),'+380671234567');
 assert.equal(phone(s.addClient({name:'B',phone:'+38 (067) 123-45-67'})),'+380671234567');
 assert.equal(phone(s.addClient({name:'C',phone:'380501112233'})),'+380501112233');
 assert.equal(phone(s.addClient({name:'D',phone:'+48 512 345 678'})),'+48512345678');
 assert.equal(phone(s.addClient({name:'E',phone:''})),'','a phone stays optional');
 for(const bad of ['0000000000','00000','+380000000000','+380 00 123 45 67','1111111111','abc123','+3806712345678','12345'])assert.throws(()=>s.addClient({name:'X',phone:bad}),/телефон/i,bad);
 for(const bad of ['a@b.c','name@gmail','name gmail.com','@gmail.com'])assert.throws(()=>s.addClient({name:'X',email:bad}),/email/i,bad);
 assert.ok(s.addClient({name:'F',email:'name@gmail.com'}));
});
test('An old client with a number saved before the check can still be edited',t=>{
 const s=new Store(':memory:');t.after(()=>s.db.close());
 const id=s.addClient({name:'Old'});s.db.prepare("UPDATE clients SET phone='000' WHERE id=?").run(id);
 s.updateClient({id,name:'Old renamed',phone:'000'});assert.equal(s.db.prepare('SELECT name FROM clients WHERE id=?').get(id).name,'Old renamed');
 assert.throws(()=>s.updateClient({id,name:'Old',phone:'0000000000'}),/телефон/i);
});
