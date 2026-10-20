const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../api/server.cjs');
// A product server with captured mail and one trial owner.
async function fixture(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ch-reset-test-')),store=new ProductStore(path.join(directory,'owner.sqlite')),keys=setup(directory),sent=[];const server=createProductServer({store,...keys,allowLocalAdmin:true,mailTransportFactory:()=>({verify:async()=>true,sendMail:async m=>{sent.push(m);return{accepted:[m.to],messageId:m.messageId};},close(){}})});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(directory,{recursive:true,force:true});});const url='http://127.0.0.1:'+server.address().port;const call=async(route,data,admin=false)=>{const r=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+keys.adminToken}:{})},body:JSON.stringify(data)});return{status:r.status,value:await r.json()};};assert.equal((await call('/admin/mail/settings',{enabled:true,host:'smtp.gmail.com',port:465,secure:true,user:'sender@example.test',password:'fake-test-app-password',fromEmail:'sender@example.test',fromName:'LOMVIKO',replyTo:'',ownerEmail:'',siteUrl:'https://crm.example.test',apiUrl:'https://api.example.test',leadReceipt:false,ownerNotice:false},true)).status,200);const id=store.addUser({name:'Олена',email:'owner@example.test',business:'Салон',days:30,max_devices:10,password_hash:require('../api/accounts.cjs').passwordHash('old-password-123')});return{store,server,sent,call,id};}
const code=m=>/(\d{6})/.exec(m.text)[1];

test('Forgot password: a code by email sets a new password once; unknown emails get the same answer and no letter',async t=>{
  const f=await fixture(t);
  const unknown=await f.call('/v1/password/reset/start',{email:'nobody@example.test'});
  assert.equal(unknown.status,201);assert(unknown.value.reset_id);
  const start=await f.call('/v1/password/reset/start',{email:'OWNER@example.test',language:'uk'});
  assert.equal(start.status,201);await f.server.mail.tick();
  assert.equal(f.sent.length,1);assert.match(f.sent[0].subject,/код для зміни пароля/);assert(!/macOS|Windows|завантаж/i.test(f.sent[0].text));
  assert.equal((await f.call('/v1/password/reset/confirm',{reset_id:unknown.value.reset_id,code:'000000',password:'new-password-123'})).status,401);
  assert.equal((await f.call('/v1/password/reset/confirm',{reset_id:start.value.reset_id,code:'000000',password:'new-password-123'})).status,401);
  const ok=await f.call('/v1/password/reset/confirm',{reset_id:start.value.reset_id,code:code(f.sent[0]),password:'new-password-123'});
  assert.equal(ok.status,200);assert.equal(ok.value.login,'owner@example.test');
  assert.equal((await f.call('/v1/password/reset/confirm',{reset_id:start.value.reset_id,code:code(f.sent[0]),password:'another-pass-123'})).status,401);
  const {passwordValid}=require('../api/accounts.cjs');const hash=f.store.db.prepare('SELECT password_hash FROM users WHERE id=?').get(f.id).password_hash;
  assert(passwordValid('new-password-123',hash));
});

test('Owners hear 7, 3 and 1 day before access ends and once when it ends; early payment extends from the trial end',async t=>{
  const f=await fixture(t),day=86400000,now=Date.now();
  for(const left of [6.5*day,2.5*day,0.5*day,-0.5*day]){f.store.db.prepare('UPDATE users SET expires=? WHERE id=?').run(now+left,f.id);f.server.retention.remind(now);f.server.retention.remind(now);}
  await f.server.mail.tick();await f.server.mail.tick();
  assert.deepEqual(f.sent.map(m=>m.subject),['LOMVIKO — пробного періоду залишилось 7 днів','LOMVIKO — пробного періоду залишилось 3 дні','LOMVIKO — безкоштовний місяць закінчується завтра','LOMVIKO — доступ завершився, дані збережено']);
  assert(f.sent.every(m=>m.text.includes('https://app.lomviko.com')));
  const trialEnd=now+20*day;f.store.db.prepare("UPDATE users SET stage='trial',expires=? WHERE id=?").run(trialEnd,f.id);
  assert.equal((await f.call('/admin/purchase',{user_id:f.id,reference:'LV-1',days:30,max_devices:10,confirmed:true,language:'uk'},true)).status,201);
  assert.equal(f.store.db.prepare('SELECT expires FROM users WHERE id=?').get(f.id).expires,trialEnd+30*day);
  await f.server.mail.tick();const paid=f.sent.at(-1);
  assert.match(paid.subject,/оплату отримано/);assert(paid.text.includes('№ LV-1'));assert(paid.text.includes('30 днів'));assert(!/macOS|downloads|Сервер CRM|T\d\d:\d\d/.test(paid.text));
});
