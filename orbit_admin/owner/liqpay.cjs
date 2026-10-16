const crypto=require('node:crypto');
const OrbitI18n=require('../src/ui/i18n.js');
// LiqPay (PrivatBank) with the company's own public and private keys. The client pays on the LiqPay
// page (card, Apple Pay, Google Pay, Privat24) and the money goes straight to the company's account;
// LOMVIKO only builds the payment link and records the result.
// Requests and callbacks: data = base64(JSON), signature = base64(hash(private + data + private)).
// LiqPay documents SHA-1 in its SDKs and SHA3-256 in newer pages, so callbacks are accepted with either.
const API='https://www.liqpay.ua';
const VALIDITY=3*86400000;
const OPEN=['created','processing','hold'];
// LiqPay statuses → the shared link statuses used by the store.
function state(status){
 if(status==='success'||status==='sandbox')return'success';
 if(status==='reversed')return'reversed';
 if(['failure','error'].includes(status))return'failure';
 if(status==='hold_wait')return'hold';
 return'processing';
}
const sign=(key,data,algo='sha1')=>crypto.createHash(algo).update(key+data+key).digest('base64');
class LiqPay{
 constructor({db,accounts,fail,publicUrl,request,api,sender}){Object.assign(this,{db,accounts,fail,publicUrl:(publicUrl||'').replace(/\/$/,''),request:request||fetch,base:api||API,sender});this.polling=null;}
 keys(runtime){const raw=runtime.vault.get('liqpay');if(!raw)this.fail(400,'Спочатку підключіть LiqPay / Connect LiqPay first');return JSON.parse(raw);}
 pack(keys,params){const data=Buffer.from(JSON.stringify({version:3,public_key:keys.public_key,...params})).toString('base64');return{data,signature:sign(keys.private_key,data)};}
 async api(keys,params){
  const body=new URLSearchParams(this.pack(keys,params));let res;
  try{res=await this.request(this.base+'/api/request',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),signal:AbortSignal.timeout(15000)});}
  catch{this.fail(502,'LiqPay не відповідає, спробуйте пізніше / LiqPay is not responding');}
  let data={};try{data=JSON.parse(await res.text());}catch{}
  if(data.result==='error'&&/public_key|private_key|signature/i.test(String(data.err_code||'')+String(data.err_description||'')))this.fail(400,'Ключі LiqPay не підходять. Перевірте публічний і приватний ключ / The LiqPay keys are not valid');
  return data;
 }
 status(runtime){const ok=runtime.vault.has('liqpay');return{connected:ok,merchant:ok?runtime.store.get('liqpay_merchant'):null,sandbox:ok?Boolean(runtime.store.get('liqpay_sandbox')):false,webhook:Boolean(this.publicUrl)};}
 async connect(runtime,data){
  const public_key=typeof data?.public_key==='string'?data.public_key.trim():'',private_key=typeof data?.private_key==='string'?data.private_key.trim():'';
  if(!/^[A-Za-z0-9_]{8,64}$/.test(public_key)||!/^[A-Za-z0-9_+/=]{8,128}$/.test(private_key))this.fail(400,'Вставте публічний і приватний ключі з кабінету LiqPay / Paste both keys from the LiqPay account');
  // A status request for an order that does not exist proves the keys without creating anything.
  const check=await this.api({public_key,private_key},{action:'status',order_id:'lomviko-check-'+crypto.randomUUID()});
  if(check.result==='error'&&/key|signature/i.test(String(check.err_code||'')))this.fail(400,'Ключі LiqPay не підходять / The LiqPay keys are not valid');
  runtime.vault.put('liqpay',JSON.stringify({public_key,private_key}));
  runtime.store.set('liqpay_merchant',public_key.startsWith('sandbox_')?'LiqPay (тестовий режим)':'LiqPay · '+public_key.slice(0,10)+'…');
  runtime.store.set('liqpay_sandbox',public_key.startsWith('sandbox_'));
  return this.status(runtime);
 }
 disconnect(runtime){runtime.vault.remove('liqpay');runtime.store.set('liqpay_merchant',null);runtime.store.set('liqpay_sandbox',null);}
 visit(store,id){return this.sender.visit(store,id);}
 // A checkout link cannot be withdrawn at LiqPay; it expires by itself. Locally it stops being offered.
 async removeOpen(runtime,appointmentId){runtime.store.db.prepare(`UPDATE payment_links SET status='removed' WHERE appointment_id=? AND provider='liqpay' AND status IN ('created','processing','hold')`).run(appointmentId);}
 async invoice(business,runtime,data){
  const store=runtime.store,keys=this.keys(runtime),currency=store.get('currency')||'UAH';
  if(!['UAH','USD','EUR'].includes(currency))this.fail(400,'LiqPay приймає оплату в гривнях, доларах або євро / LiqPay accepts UAH, USD or EUR');
  const a=this.visit(store,data?.appointment_id);if(a.status==='cancelled')this.fail(400,'Візит скасовано / The visit is cancelled');
  const due=a.total-a.paid;if(due<=0)this.fail(400,'Візит уже оплачено / The visit is already paid');
  const amount=data.amount===undefined||data.amount===null||data.amount===''?due:Math.round(Number(data.amount)*100);
  if(!Number.isSafeInteger(amount)||amount<100||amount>due)this.fail(400,'Сума має бути від 1 і не більша за борг / Amount must be at least 1 and not above what is due');
  if(data.send&&!a.chat_id)this.fail(400,'Клієнт не підключений до Telegram-бота / The client is not connected to the Telegram bot');
  await this.removeOpen(runtime,a.id);
  const orderId=crypto.randomUUID(),expires=Date.now()+VALIDITY,name=a.service_name.slice(0,128);
  const params={action:'pay',amount:(amount/100).toFixed(2),currency,description:`${name} · ${business.name}`.slice(0,250),order_id:orderId,language:'uk',expired_date:new Date(expires).toISOString().replace('T',' ').slice(0,19),rro_info:{items:[{amount:1,price:amount/100,cost:amount/100,id:a.service_id.slice(0,32)}]},...(this.publicUrl?{server_url:`${this.publicUrl}/v1/pay/liqpay/${business.id}`}:{})};
  const {data:packed,signature}=this.pack(keys,params);
  const url=`${this.base}/api/3/checkout?${new URLSearchParams({data:packed,signature})}`;
  store.addPaymentLink({appointment_id:a.id,provider:'liqpay',invoice_id:orderId,amount,url,expires});
  let sent=false,sendError=null;if(data.send){try{sent=await this.sender.send(business,runtime,a,amount,url);}catch(e){sendError=e.message;}}
  return{url,amount,sent,sendError,telegram:Boolean(a.chat_id)};
 }
 async cancel(runtime,data){this.keys(runtime);const a=this.visit(runtime.store,data?.appointment_id);await this.removeOpen(runtime,a.id);return true;}
 apply(store,d){
  if(!d||typeof d.order_id!=='string'||typeof d.status!=='string')this.fail(400,'Invalid LiqPay status');
  const s=state(d.status),amount=Math.round(Number(d.amount||0)*100),refunded=Math.round(Number(d.refund_amount||0)*100);
  const paid=s==='success'||s==='reversed'?Math.max(0,s==='reversed'&&!refunded?0:amount-refunded):0;
  const modified=d.end_date?new Date(Number(d.end_date)).toISOString():(d.create_date?new Date(Number(d.create_date)).toISOString():'');
  return store.settlePaymentLink('liqpay',d.order_id,{status:s,paid,modified});
 }
 verify(keys,data,signature){
  if(typeof data!=='string'||typeof signature!=='string'||data.length>20000)return false;
  const given=Buffer.from(signature);
  return['sha1','sha3-256'].some(algo=>{const own=Buffer.from(sign(keys.private_key,data,algo));return own.length===given.length&&crypto.timingSafeEqual(own,given);});
 }
 // POST /v1/pay/liqpay/<business id>: form fields data + signature from LiqPay.
 async handle(req,url,reply){
  const match=/^\/v1\/pay\/liqpay\/([a-f0-9-]{36})$/.exec(url.pathname);if(!match)return false;
  if(req.method!=='POST')this.fail(405,'Method not allowed');
  const business=this.db.prepare('SELECT * FROM businesses WHERE id=?').get(match[1]);if(!business)this.fail(404,'Not found');
  const runtime=this.accounts.businesses.get(business),raw=runtime.vault.get('liqpay');
  if(!raw)return reply(200,{ok:true}),true;
  const body=req.parsedBody||{},keys=JSON.parse(raw);
  if(!this.verify(keys,body.data,body.signature))this.fail(401,'Invalid signature');
  const d=JSON.parse(Buffer.from(body.data,'base64').toString('utf8'));
  if(d.public_key&&d.public_key!==keys.public_key)this.fail(401,'Foreign merchant');
  this.apply(runtime.store,d);reply(200,{ok:true});return true;
 }
 async check(runtime,keys,link){const d=await this.api(keys,{action:'status',order_id:link.invoice_id});if(d.status&&d.result!=='error')return this.apply(runtime.store,{...d,order_id:link.invoice_id});}
 async reconcile(runtime,appointmentId){
  if(!runtime.vault.has('liqpay'))return;
  const a=runtime.store.db.prepare('SELECT a.status,a.total,COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0) paid FROM appointments a WHERE a.id=?').get(String(appointmentId||''));if(!a)return;
  const stale=runtime.store.db.prepare(`SELECT id FROM payment_links WHERE appointment_id=? AND provider='liqpay' AND status IN ('created','processing','hold') AND (amount>? OR ?)`).get(String(appointmentId),Math.max(a.total-a.paid,0),a.status==='cancelled'?1:0);
  if(stale)await this.removeOpen(runtime,String(appointmentId));
 }
 // Fallback when a callback is lost; also catches payments made on a link that was withdrawn locally.
 poll(){
  if(this.polling)return this.polling;
  this.polling=(async()=>{for(const runtime of this.accounts.businesses.instances.values()){
   const raw=runtime.vault.get('liqpay');if(!raw)continue;const keys=JSON.parse(raw);
   const links=runtime.store.db.prepare(`SELECT * FROM payment_links WHERE provider='liqpay' AND status IN ('created','processing','hold','removed') AND created_at>? ORDER BY created_at LIMIT 20`).all(Date.now()-VALIDITY-86400000);
   for(const link of links)await this.check(runtime,keys,link).catch(()=>{});
   for(const id of new Set(links.map(l=>l.appointment_id)))await this.reconcile(runtime,id).catch(()=>{});
  }})().finally(()=>{this.polling=null;});
  return this.polling;
 }
}
module.exports={LiqPay,state,sign,OPEN};
