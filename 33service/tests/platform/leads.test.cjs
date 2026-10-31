const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const{setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');const{signRequest}=require('../../../platform/core/request-proof.cjs');
async function fixture(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'biz-leads-')),keys=setup(directory),store=new ProductStore(path.join(directory,'owner.sqlite')),sent=[];const server=createProductServer({store,...keys,allowLocalAdmin:true,mailTransportFactory:()=>({sendMail:async m=>{sent.push(m);return{accepted:[m.to]};},close(){}})});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(directory,{recursive:true,force:true});});const url='http://127.0.0.1:'+server.address().port;
 const call=async(route,data,token=keys.adminToken,key)=>{const body=JSON.stringify(data||{}),r=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(key?signRequest('POST',route,body,token,key):{})},body});return{status:r.status,value:await r.json()};};
 await call('/admin/mail/settings',{enabled:true,host:'smtp.gmail.com',port:465,secure:true,user:'owner@example.test',password:'fake-password',fromEmail:'owner@example.test',fromName:'LOMVIKO',replyTo:'',ownerEmail:'owner@example.test',siteUrl:'https://biz.example.test',apiUrl:'https://api.example.test',leadReceipt:true,ownerNotice:true});return{...keys,store,server,sent,url,call};}
test('A request from the site becomes a company with one click, even while registration is closed',async t=>{
 const f=await fixture(t);f.store.setProduct('registration',false);
 const lead=await f.call('/public/demo',{name:'Олена',email:'Olena@Salon.test',business:'Салон Олени',message:'Хочу спробувати',consent:true,language:'uk'});assert.equal(lead.status,201);
 const id=f.store.db.prepare('SELECT id FROM site_leads').get().id;
 const granted=await f.call('/admin/leads/grant',{id});assert.equal(granted.status,201,JSON.stringify(granted.value));
 const u=f.store.db.prepare('SELECT * FROM users WHERE email=?').get('olena@salon.test');assert.ok(u,'the user exists');assert.equal(u.stage,'trial');assert.ok(u.expires>Date.now()+29*86400000);
 assert.equal(f.store.db.prepare('SELECT b.name FROM businesses b JOIN memberships m ON m.business_id=b.id WHERE m.user_id=?').get(u.id).name,'Салон Олени');
 assert.equal(f.store.db.prepare('SELECT stage FROM site_leads WHERE id=?').get(id).stage,'granted');
 await f.server.mail.tick();const letter=f.sent.find(m=>m.to==='olena@salon.test'&&/доступ готовий/i.test(m.subject));assert.ok(letter,'access letter sent');assert.match(letter.text,/#access=/);
 assert.equal((await f.call('/admin/leads/grant',{id})).status,409,'a second click does not create a second account');
 assert.equal((await f.call('/admin/leads/grant',{id:'missing'})).status,404);
 assert.equal((await f.call('/admin/site/lead',{id,stage:'contacted'})).status,200);
});
test('Giving access with a chosen plan, end date and company name puts all three in the account and the letter',async t=>{
 const f=await fixture(t);
 await f.call('/public/demo',{name:'Чугунов Василь Васильович',email:'vasyl@studio.test',business:'non',consent:true,language:'uk'});
 const id=f.store.db.prepare('SELECT id FROM site_leads').get().id,expires=Date.now()+30*86400000;
 for(const bad of [{plan:'gold'},{expires:Date.now()-1000},{expires:Date.now()+5*366*86400000},{business:'   '}])assert.equal((await f.call('/admin/leads/grant',{id,...bad})).status,400,JSON.stringify(bad));
 const r=await f.call('/admin/leads/grant',{id,plan:'business',expires,business:'Студія Василя'});assert.equal(r.status,201,JSON.stringify(r.value));
 const u=f.store.db.prepare('SELECT * FROM users WHERE email=?').get('vasyl@studio.test');assert.equal(u.plan,'business');assert.equal(u.stage,'active');assert.equal(u.expires,expires);
 assert.equal(f.store.db.prepare('SELECT b.name FROM businesses b JOIN memberships m ON m.business_id=b.id WHERE m.user_id=?').get(u.id).name,'Студія Василя');
 await f.server.mail.tick();const letter=f.sent.find(m=>m.to==='vasyl@studio.test'&&/доступ готовий/i.test(m.subject));
 assert.match(letter.text,/Вітаємо, Василь!/);assert.match(letter.text,/Тариф: «Бізнес»/);assert.match(letter.text,/Доступ діє до/);assert.match(letter.text,/Логін: vasyl@studio\.test/);
 assert.equal((letter.html.match(/background:#0a8f74;color:#ffffff/g)||[]).length,1,'one green button');assert.match(letter.html,/Якщо кнопка не працює/);assert.doesNotMatch(letter.html,/>Задати пароль \(/,'the link note is not on the button');
});
