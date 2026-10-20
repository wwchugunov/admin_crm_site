const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');

// A fake Checkbox that follows the official API: cashier sign-in, shift, sell receipt, receipt status.
async function checkbox(t){
 const state={shift:null,receipts:new Map(),calls:[],fail:0};
 const server=http.createServer(async(req,res)=>{
  let body='';for await(const c of req)body+=c;const data=body?JSON.parse(body):null;state.calls.push({method:req.method,url:req.url,headers:req.headers,data});
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  if(state.fail){state.fail--;return send(503,{message:'temporarily unavailable'});}
  if(req.url==='/api/v1/cashier/signin')return data.password==='right'?send(200,{access_token:'token-1',token_type:'bearer'}):send(403,{message:'Invalid credentials'});
  if(req.headers.authorization!=='Bearer token-1')return send(401,{message:'Not authenticated'});
  if(req.url==='/api/v1/cashier/me')return send(200,{full_name:'Олена Касир'});
  if(req.url==='/api/v1/cashier/shift')return send(200,state.shift);
  if(req.url==='/api/v1/shifts'&&req.method==='POST'){if(req.headers['x-license-key']!=='licence-1')return send(403,{message:'bad licence'});state.shift={id:'s1',status:'OPENED'};state.autoClose=data.auto_close_at;return send(202,state.shift);}
  if(req.url==='/api/v1/receipts/sell'){if(data.goods[0].good.price>1e7)return send(422,{message:'Сума завелика'});state.receipts.set(data.id,data);return send(201,{id:data.id,status:'CREATED'});}
  const m=/^\/api\/v1\/receipts\/([-a-f0-9]+)$/.exec(req.url);
  if(m)return state.receipts.has(m[1])?send(200,{id:m[1],status:'DONE',fiscal_code:'TEST'+state.receipts.size,is_test:true}):send(404,{message:'not found'});
  send(404,{message:'unknown'});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 return{state,url:'http://127.0.0.1:'+server.address().port};
}
async function fixture(t){
 const cb=await checkbox(t);process.env.CH_CHECKBOX_API=cb.url;t.after(()=>{delete process.env.CH_CHECKBOX_API;});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-fiscal-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const userId=owner.addUser({name:'Олена',email:'olena@example.test',business:'Ліра',days:30,max_devices:2}),user=owner.db.prepare('SELECT * FROM users WHERE id=?').get(userId);
 const id=server.accounts.addBusiness(userId,'Ліра'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id),runtime=server.accounts.businesses.get(business),store=runtime.store;
 store.set('timezone','Europe/Kyiv');store.set('work_start','08:00');store.set('work_end','21:00');store.set('work_days',[1,2,3,4,5,6,7]);
 const sent=[];runtime.vault.put('telegram','000000:test');runtime.telegram.call=async(method,payload)=>{if(method==='sendMessage')sent.push(payload);return{};};
 const service=store.addService({name:'Стрижка',duration:60,price:900}),resource=store.addResource({name:'Олена'}),client=store.addClient({name:'Марія',phone:'+380671112233'});
 store.db.prepare('UPDATE clients SET chat_id=? WHERE id=?').run('777',client);
 let days=1;const visit=()=>store.book({client_id:client,service_id:service,resource_ids:[resource],start:Date.parse(new Date(Date.now()+ ++days*86400000).toISOString().slice(0,10)+'T07:00:00Z')});
 const fiscal=server.accounts.fiscal;fiscal.pause=async()=>{};
 t.after(async()=>{await server.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 return{cb,fiscal,business,runtime,store,user,visit,sent};
}
const receipts=store=>store.db.prepare('SELECT * FROM fiscal_receipts ORDER BY created_at').all();

test('Connecting needs the owner to accept responsibility and checks the cashier at Checkbox',async t=>{
 const f=await fixture(t);
 await assert.rejects(f.fiscal.connect(f.runtime,f.user,{license_key:'licence-1',login:'cashier',password:'right'}),/відповідальність/);
 await assert.rejects(f.fiscal.connect(f.runtime,f.user,{license_key:'licence-1',login:'cashier',password:'wrong',consent:true}),/не прийняв/);
 assert.equal(f.runtime.vault.has('fiscal'),false,'nothing is kept after a failed check');
 const status=await f.fiscal.connect(f.runtime,f.user,{license_key:'licence-1',login:'cashier',password:'right',consent:true});
 assert.deepEqual([status.connected,status.cashier,status.methods.join()],[true,'Олена Касир','cash,card']);
 assert.equal(f.store.get('fiscal_consent').user_id,f.user.id);
 assert(!JSON.stringify(f.store.snapshot({all:true})).includes('licence-1'),'secrets stay in the vault');
});

test('Cash and card visit payments get receipts, transfers do not; a refund refers to the sale; the client gets the link',async t=>{
 const f=await fixture(t);await f.fiscal.connect(f.runtime,f.user,{license_key:'licence-1',login:'cashier',password:'right',consent:true});
 const a=f.visit(),cash=f.store.payment({appointment_id:a,amount:500,method:'cash'});
 await f.fiscal.queuePayment(f.business,f.runtime,cash)&&await f.fiscal.work(f.business,f.runtime);
 let r=receipts(f.store);assert.equal(r.length,1);assert.deepEqual([r[0].status,r[0].kind,r[0].amount,r[0].fiscal_code,r[0].is_test],['done','sell',50000,'TEST1',1]);
 const sold=f.cb.state.receipts.get(r[0].id);
 assert.deepEqual([sold.goods[0].good.name,sold.goods[0].good.price,sold.goods[0].quantity,sold.payments[0].type,sold.payments[0].value],['Стрижка',50000,1000,'CASH',50000]);
 assert.ok(f.cb.state.autoClose,'the shift is opened with an automatic close');
 const message=f.sent.find(m=>m.chat_id==='777');assert.match(message.text,/Ваш чек · 500\.00/);assert.match(message.reply_markup.inline_keyboard[0][0].url,/\/api\/v1\/receipts\/[-a-f0-9]+\/html$/);
 const transfer=f.store.payment({appointment_id:a,amount:100,method:'transfer'});assert.equal(f.fiscal.queuePayment(f.business,f.runtime,transfer),null);
 const card=f.store.payment({appointment_id:a,amount:300,method:'card'});await f.fiscal.queuePayment(f.business,f.runtime,card)&&await f.fiscal.work(f.business,f.runtime);
 const refund=f.store.payment({appointment_id:a,amount:-200,method:'cash'});await f.fiscal.queuePayment(f.business,f.runtime,refund)&&await f.fiscal.work(f.business,f.runtime);
 r=receipts(f.store);assert.equal(r.length,3);
 const back=f.cb.state.receipts.get(r[2].id);assert.equal(back.goods[0].is_return,true);assert.equal(back.related_receipt_id,r[0].id,'the refund points at the cash sale');
 assert.equal(f.cb.state.receipts.get(r[1].id).payments[0].type,'CASHLESS');
});

test('Certificate sales are fiscalised; failures retry, rejected receipts wait for a manual retry; methods can be limited',async t=>{
 const f=await fixture(t);await f.fiscal.connect(f.runtime,f.user,{license_key:'licence-1',login:'cashier',password:'right',consent:true});
 const cert=f.store.sellCertificate({amount:1000,method:'card'});
 f.cb.state.fail=1;await f.fiscal.queueSale(f.business,f.runtime,'certificate',cert.id)&&await f.fiscal.work(f.business,f.runtime);
 let r=receipts(f.store)[0];assert.deepEqual([r.status,r.attempts,r.title],['pending',1,'Подарунковий сертифікат']);assert.match(r.error,/temporarily/);
 f.store.db.prepare('UPDATE fiscal_receipts SET next_at=0').run();await f.fiscal.tick();
 assert.equal(receipts(f.store)[0].status,'done','the background tick sends it');
 const a=f.visit();
 f.store.db.prepare('UPDATE appointments SET total=? WHERE id=?').run(2e7,a);
 const big=f.store.payment({appointment_id:a,amount:150000,method:'cash'});await f.fiscal.queuePayment(f.business,f.runtime,big)&&await f.fiscal.work(f.business,f.runtime);
 r=receipts(f.store).find(x=>x.source_id===big);assert.equal(r.status,'failed');assert.match(r.error,/Сума завелика/);
 assert.throws(()=>f.fiscal.retry(f.business,f.runtime,{id:'nope'}),/не знайдено/);
 f.fiscal.configure(f.runtime,{methods:['card']});
 const cash=f.store.payment({appointment_id:f.visit(),amount:100,method:'cash'});assert.equal(f.fiscal.queuePayment(f.business,f.runtime,cash),null,'cash is off now');
 await f.fiscal.disconnect(f.runtime);assert.equal(f.fiscal.status(f.runtime).connected,false);
 const later=f.store.payment({appointment_id:f.visit(),amount:100,method:'card'});assert.equal(f.fiscal.queuePayment(f.business,f.runtime,later),null);
});

test('Online payments get receipts only when the owner turns them on; a bank refund refers to the online sale',async t=>{
 const f=await fixture(t);await f.fiscal.connect(f.runtime,f.user,{license_key:'licence-1',login:'cashier',password:'right',consent:true});
 const link=(a,id)=>f.store.addPaymentLink({appointment_id:a,provider:'monobank',invoice_id:id,amount:90000,url:'https://pay.example/'+id,expires:Date.now()+86400000});
 const first=f.visit();link(first,'inv-1');
 const off=f.store.settlePaymentLink('monobank','inv-1',{status:'success',paid:90000});
 assert.equal(f.fiscal.queueFromStore(f.store,off.payment_id),null,'online is off by default: the bank may issue its own receipt');
 f.fiscal.configure(f.runtime,{methods:['cash','card','online']});
 const second=f.visit();link(second,'inv-2');
 const paid=f.store.settlePaymentLink('monobank','inv-2',{status:'success',paid:90000});
 await f.fiscal.queueFromStore(f.store,paid.payment_id)&&await f.fiscal.work(f.business,f.runtime);
 let r=receipts(f.store).find(x=>x.source_id===paid.payment_id);assert.equal(r.status,'done');
 assert.equal(f.cb.state.receipts.get(r.id).payments[0].type,'CASHLESS');
 const back=f.store.settlePaymentLink('monobank','inv-2',{status:'reversed',paid:30000});
 await f.fiscal.queueFromStore(f.store,back.payment_id)&&await f.fiscal.work(f.business,f.runtime);
 const ret=receipts(f.store).find(x=>x.source_id===back.payment_id);
 assert.deepEqual([ret.kind,ret.amount,f.cb.state.receipts.get(ret.id).related_receipt_id],['return',60000,r.id]);
});
