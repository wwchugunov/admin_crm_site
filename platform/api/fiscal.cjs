const crypto=require('node:crypto');
// Fiscal receipts (ПРРО) through a licensed provider, Checkbox first. LOMVIKO never registers receipts with the
// tax service itself: the provider does, under the company's own licence key and cashier. The owner turns this on
// with an explicit statement that they are responsible for receipts; it is off for everyone else.
//
// What gets a receipt: a visit paid in cash or by card at the place (and the refund of such a payment), and a
// certificate or pass sold for cash or by card. Bank transfers, certificate and pass redemptions and online
// payments through monobank or LiqPay are left out: their money was received elsewhere.
const CHECKBOX='https://api.checkbox.in.ua';
const CLIENT={'X-Client-Name':'LOMVIKO','X-Client-Version':'2.4'};
const RETRY=[60e3,5*60e3,15*60e3,60*60e3,3*60*60e3,6*60*60e3];
const PROVIDERS=['checkbox'];
function receiptUrl(base,id){return `${base}/api/v1/receipts/${id}/html`;}
class Fiscal{
 constructor({accounts,fail,request,api,pause}){Object.assign(this,{accounts,fail,request:request||fetch,base:(api||CHECKBOX).replace(/\/$/,''),pause:pause||(ms=>new Promise(r=>setTimeout(r,ms)))});this.running=new Map();}
 settings(store){return{provider:store.get('fiscal_provider')||null,methods:store.get('fiscal_methods')||['cash','card'],telegram:store.get('fiscal_telegram')!==false,consent:store.get('fiscal_consent')||null,cashier:store.get('fiscal_cashier')||null};}
 status(runtime){const s=this.settings(runtime.store);return{connected:Boolean(s.provider&&runtime.vault.has('fiscal')),provider:s.provider,methods:s.methods,telegram:s.telegram,cashier:s.cashier,consent_at:s.consent?.at||null};}
 credentials(runtime){try{return JSON.parse(runtime.vault.get('fiscal')||'null');}catch{return null;}}
 async call(credentials,method,path,payload,extra={}){
  let res;
  try{res=await this.request(this.base+path,{method,headers:{...CLIENT,...(credentials?.token?{Authorization:'Bearer '+credentials.token}:{}),...(payload?{'Content-Type':'application/json'}:{}),...extra},body:payload?JSON.stringify(payload):undefined,redirect:'error',signal:AbortSignal.timeout(20000)});}
  catch{throw Object.assign(Error('Checkbox не відповідає / Checkbox is not responding'),{retry:true});}
  const text=await res.text();let data=null;try{data=text?JSON.parse(text):null;}catch{}
  if(res.ok)return data;
  const message=String(data?.message||(Array.isArray(data?.detail)?data.detail.map(d=>d.msg).join('; '):data?.detail)||res.status).slice(0,300);
  throw Object.assign(Error('Checkbox: '+message),{status:res.status,retry:res.status>=500||res.status===429,auth:res.status===401});
 }
 async signin(runtime,c){
  const r=c.pin?await this.call(null,'POST','/api/v1/cashier/signinPinCode',{pin_code:c.pin},{'X-License-Key':c.license}):await this.call(null,'POST','/api/v1/cashier/signin',{login:c.login,password:c.password});
  if(!r?.access_token)throw Error('Checkbox не видав токен / Checkbox returned no token');
  c.token=r.access_token;runtime.vault.put('fiscal',JSON.stringify(c));return c;
 }
 // Connecting checks the licence key and the cashier right away and records who accepted responsibility.
 async connect(runtime,user,data){
  if(data?.consent!==true)this.fail(400,'Підтвердіть, що відповідальність за чеки несете ви / Confirm that you are responsible for receipts');
  const provider=PROVIDERS.includes(data.provider)?data.provider:'checkbox';
  const text=(v,max)=>typeof v==='string'&&v.trim()&&v.length<=max?v.trim():'';
  const c={license:text(data.license_key,200),login:text(data.login,200),password:typeof data.password==='string'&&data.password.length<=200?data.password:'',pin:text(data.pin,20)};
  if(!c.license)this.fail(400,'Вставте ключ ліцензії каси з кабінету Checkbox / Paste the cash register licence key from Checkbox');
  if(!c.pin&&!(c.login&&c.password))this.fail(400,'Вкажіть PIN-код касира або логін і пароль / Enter the cashier PIN or login and password');
  let me;
  try{await this.signin(runtime,c);me=await this.call(c,'GET','/api/v1/cashier/me');}
  catch(e){runtime.vault.remove('fiscal');this.fail(400,e.status===401||e.status===403||e.status===422?'Checkbox не прийняв ці дані касира / Checkbox did not accept these cashier details':e.message);}
  const store=runtime.store;
  store.set('fiscal_provider',provider);store.set('fiscal_cashier',String(me?.full_name||me?.name||c.login||'Checkbox').slice(0,120));
  store.set('fiscal_consent',{at:Date.now(),user_id:user.id,name:user.name,text:'Відповідальність за видачу чеків несу я; фіскалізацію виконує провайдер ПРРО.'});
  this.configure(runtime,data);store.audit('fiscal.connected',provider);
  return this.status(runtime);
 }
 configure(runtime,data){
  if(Array.isArray(data?.methods))runtime.store.set('fiscal_methods',['cash','card'].filter(m=>data.methods.includes(m)));
  if(typeof data?.telegram==='boolean')runtime.store.set('fiscal_telegram',data.telegram);
  return this.status(runtime);
 }
 async disconnect(runtime){
  const c=this.credentials(runtime);if(c?.token)await this.call(c,'POST','/api/v1/cashier/signout').catch(()=>{});
  runtime.vault.remove('fiscal');for(const k of ['fiscal_provider','fiscal_cashier','fiscal_consent'])runtime.store.set(k,null);runtime.store.audit('fiscal.disconnected','');
 }
 // A visit payment just saved. Only cash and card taken at the place are fiscalised, and only the methods the owner chose.
 queuePayment(business,runtime,paymentId){
  const s=this.settings(runtime.store);if(!s.provider||!runtime.vault.has('fiscal'))return null;
  const p=runtime.store.db.prepare('SELECT p.*,s.name service_name,a.id visit FROM payments p JOIN appointments a ON a.id=p.appointment_id JOIN services s ON s.id=a.service_id WHERE p.id=?').get(paymentId);
  if(!p||!['cash','card'].includes(p.method)||!s.methods.includes(p.method))return null;
  const related=p.amount<0?runtime.store.db.prepare("SELECT f.id FROM fiscal_receipts f JOIN payments x ON x.id=f.source_id WHERE f.source='payment' AND f.kind='sell' AND f.status='done' AND x.appointment_id=? AND x.method=? ORDER BY f.created_at DESC LIMIT 1").get(p.visit,p.method)?.id||null:null;
  return this.enqueue(business,runtime,{source:'payment',source_id:p.id,kind:p.amount<0?'return':'sell',amount:Math.abs(p.amount),method:p.method,title:p.service_name,related});
 }
 queueSale(business,runtime,kind,id){
  const s=this.settings(runtime.store);if(!s.provider||!runtime.vault.has('fiscal'))return null;
  const row=runtime.store.db.prepare(kind==='certificate'?'SELECT id,price,method FROM certificates WHERE id=?':'SELECT p.id,p.price,p.method,s.name FROM passes p JOIN services s ON s.id=p.service_id WHERE p.id=?').get(id);
  if(!row||!row.price||!['cash','card'].includes(row.method)||!s.methods.includes(row.method))return null;
  return this.enqueue(business,runtime,{source:kind,source_id:row.id,kind:'sell',amount:row.price,method:row.method,title:kind==='certificate'?'Подарунковий сертифікат':`Абонемент: ${row.name}`});
 }
 enqueue(business,runtime,r){
  const id=crypto.randomUUID();
  runtime.store.db.prepare("INSERT OR IGNORE INTO fiscal_receipts(id,source,source_id,kind,amount,method,title,related_id,status,attempts,next_at,error,created_at) VALUES(?,?,?,?,?,?,?,?,'pending',0,0,'',?)").run(id,r.source,r.source_id,r.kind,r.amount,r.method,r.title.slice(0,120),r.related||null,Date.now());
  this.work(business,runtime).catch(()=>{});return id;
 }
 retry(business,runtime,data){
  if(!runtime.store.db.prepare("UPDATE fiscal_receipts SET status='pending',next_at=0,attempts=0,error='' WHERE id=? AND status='failed'").run(String(data?.id||'')).changes)this.fail(404,'Чек не знайдено / Receipt not found');
  this.work(business,runtime).catch(()=>{});return true;
 }
 // One worker per company, so receipts go out in order and a shift is opened once.
 work(business,runtime){
  const key=business.id;if(this.running.has(key))return this.running.get(key);
  const job=(async()=>{for(const row of runtime.store.db.prepare("SELECT * FROM fiscal_receipts WHERE status IN ('pending','sent') AND next_at<=? ORDER BY created_at LIMIT 20").all(Date.now()))await this.process(business,runtime,row);})().finally(()=>this.running.delete(key));
  this.running.set(key,job);return job;
 }
 async tick(){for(const [id,runtime] of this.accounts.businesses.instances){if(!runtime.vault.has('fiscal'))continue;const business=this.accounts.db.prepare('SELECT * FROM businesses WHERE id=?').get(id);if(business)await this.work(business,runtime).catch(()=>{});}}
 async withToken(runtime,fn){
  let c=this.credentials(runtime);if(!c)throw Error('ПРРО не підключено / Fiscal receipts are not connected');
  if(!c.token)c=await this.signin(runtime,c);
  try{return await fn(c);}catch(e){if(!e.auth)throw e;c=await this.signin(runtime,c);return fn(c);}
 }
 async openShift(c,runtime){
  const current=await this.call(c,'GET','/api/v1/cashier/shift');
  if(current?.status==='OPENED')return;
  if(!current||current.status==='CLOSED'){
   // Checkbox closes the shift with a Z-report by itself at the end of the business day.
   const day=new Intl.DateTimeFormat('en-CA',{timeZone:runtime.store.get('timezone')||'Europe/Kyiv'}).format(Date.now());
   await this.call(c,'POST','/api/v1/shifts',{auto_close_at:new Date(Date.parse(`${day}T23:50:00Z`)-this.zoneOffset(runtime,day)).toISOString()},{'X-License-Key':c.license});
  }
  for(let i=0;i<20;i++){const s=await this.call(c,'GET','/api/v1/cashier/shift');if(s?.status==='OPENED')return;await this.pause(1000);}
  throw Object.assign(Error('Checkbox не відкрив зміну / Checkbox did not open the shift'),{retry:true});
 }
 zoneOffset(runtime,day){const zone=runtime.store.get('timezone')||'Europe/Kyiv',probe=Date.parse(`${day}T12:00:00Z`);return Date.parse(new Date(probe).toLocaleString('en-US',{timeZone:zone})+' UTC')-probe;}
 async process(business,runtime,row){
  const db=runtime.store.db;
  try{
   const receipt=await this.withToken(runtime,async c=>{
    if(row.status==='pending'){
     await this.openShift(c,runtime);
     const payload={id:row.id,goods:[{good:{code:row.source_id.slice(0,32),name:row.title,price:row.amount},quantity:1000,...(row.kind==='return'?{is_return:true}:{})}],payments:[row.method==='cash'?{type:'CASH',value:row.amount}:{type:'CASHLESS',value:row.amount,label:'Картка'}],...(row.related_id?{related_receipt_id:row.related_id}:{})};
     try{await this.call(c,'POST','/api/v1/receipts/sell',payload);}
     catch(e){if(e.status!==409&&!(e.status===400&&/exist|існує/i.test(e.message)))throw e;}
     db.prepare("UPDATE fiscal_receipts SET status='sent' WHERE id=?").run(row.id);
    }
    for(let i=0;i<10;i++){const r=await this.call(c,'GET',`/api/v1/receipts/${row.id}`);if(r?.status==='DONE'||r?.status==='ERROR')return r;await this.pause(1500);}
    return null;
   });
   if(!receipt){db.prepare('UPDATE fiscal_receipts SET next_at=? WHERE id=?').run(Date.now()+60e3,row.id);return;}
   if(receipt.status==='ERROR')throw Object.assign(Error('Checkbox відхилив чек / Checkbox rejected the receipt'),{retry:false});
   db.prepare("UPDATE fiscal_receipts SET status='done',fiscal_code=?,is_test=?,done_at=?,error='' WHERE id=?").run(String(receipt.fiscal_code||''),receipt.is_test?1:0,Date.now(),row.id);
   await this.deliver(business,runtime,row,receipt).catch(()=>{});
  }catch(e){
   const attempts=row.attempts+1,give=e.retry===false||(e.status>=400&&e.status<500&&!e.auth&&e.status!==429)||attempts>RETRY.length;
   db.prepare("UPDATE fiscal_receipts SET status=?,attempts=?,next_at=?,error=? WHERE id=?").run(give?'failed':row.status,attempts,Date.now()+(RETRY[attempts-1]||RETRY.at(-1)),String(e.message).slice(0,300),row.id);
  }
 }
 // The client gets the receipt link in the company bot, if the owner wants that and the client is connected.
 async deliver(business,runtime,row,receipt){
  if(!this.settings(runtime.store).telegram||row.source!=='payment')return;
  const c=runtime.store.db.prepare('SELECT c.chat_id FROM payments p JOIN appointments a ON a.id=p.appointment_id JOIN clients c ON c.id=a.client_id WHERE p.id=?').get(row.source_id);
  if(!c?.chat_id)return;
  const telegram=runtime.telegram,url=receipt.tax_url||receiptUrl(this.base,row.id),en=telegram.language?.(c.chat_id)==='en';
  const payload={chat_id:c.chat_id,text:`${row.kind==='return'?(en?'Refund receipt':'Чек повернення'):(en?'Your receipt':'Ваш чек')} · ${(row.amount/100).toFixed(2)} ${runtime.store.get('currency')||'UAH'}\n${row.title}\n${runtime.store.get('business')||business.name}`,reply_markup:{inline_keyboard:[[{text:en?'Open receipt':'Відкрити чек',url}]]}};
  if(this.accounts.botWorkers?.status(business).hosting==='external')this.accounts.botWorkers.queue(business.id,'sendMessage',payload);
  else if(runtime.vault.has('telegram'))await telegram.call('sendMessage',payload);
 }
 recent(runtime){return runtime.store.db.prepare('SELECT * FROM fiscal_receipts ORDER BY created_at DESC LIMIT 50').all().map(r=>({...r,url:r.status==='done'?receiptUrl(this.base,r.id):null}));}
}
module.exports={Fiscal,receiptUrl};
