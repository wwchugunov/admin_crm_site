const crypto=require('node:crypto');
// A 'failure' invoice stays payable at the bank (the client may retry the card), so it is withdrawn like an open one.
const OrbitI18n=require('../shared/i18n.js');
// monobank acquiring with the company's own token. The client pays on the monobank page and the money
// goes straight to the company's account; LOMVIKO only creates the invoice and records the result.
const API='https://api.monobank.ua';
const VALIDITY=3*86400;
const OPEN=['created','processing','hold'];
class Monobank{
 constructor({db,accounts,fail,publicUrl,request,api}){Object.assign(this,{db,accounts,fail,publicUrl:(publicUrl||'').replace(/\/$/,''),request:request||fetch,base:api||API});this.keyRefresh=new Map();this.polling=null;}
 async api(token,method,path,payload){
  let res;
  try{res=await this.request(this.base+path,{method,headers:{'X-Token':token,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(15000)});}
  catch{this.fail(502,'monobank не відповідає, спробуйте пізніше / monobank is not responding');}
  const text=await res.text();let data={};try{data=text?JSON.parse(text):{};}catch{}
  if(res.status===401||res.status===403)this.fail(400,'Токен monobank не підходить / The monobank token is not valid');
  if(!res.ok)this.fail(502,'monobank: '+String(data.errText||data.errorDescription||res.status).slice(0,200));
  return data;
 }
 token(runtime){const token=runtime.vault.get('monobank');if(!token)this.fail(400,'Спочатку підключіть monobank / Connect monobank first');return token;}
 status(runtime){return{connected:runtime.vault.has('monobank'),merchant:runtime.vault.has('monobank')?runtime.store.get('monobank_merchant'):null,webhook:Boolean(this.publicUrl)};}
 async connect(runtime,token){
  token=typeof token==='string'?token.trim():'';
  if(!/^[A-Za-z0-9_\-+/=.]{16,200}$/.test(token))this.fail(400,'Вставте токен з кабінету monobank / Paste the token from the monobank account');
  const details=await this.api(token,'GET','/api/merchant/details');
  runtime.vault.put('monobank',token);runtime.store.set('monobank_merchant',String(details.merchantName||details.merchantId||'monobank').slice(0,200));runtime.store.set('monobank_key',null);
  return this.status(runtime);
 }
 disconnect(runtime){runtime.vault.remove('monobank');runtime.store.set('monobank_merchant',null);runtime.store.set('monobank_key',null);}
 visit(store,id){
  const a=store.db.prepare('SELECT a.*,s.name service_name,c.chat_id,COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0) paid FROM appointments a JOIN services s ON s.id=a.service_id JOIN clients c ON c.id=a.client_id WHERE a.id=?').get(String(id||''));
  if(!a)this.fail(404,OrbitI18n.t('m551'));return a;
 }
 // Removes unpaid invoices of the visit at the bank, so only the newest link can be paid.
 // A 'failure' invoice stays payable at the bank (the client may retry the card), so it is withdrawn like an open one.
 async removeOpen(runtime,token,appointmentId){
  for(const link of runtime.store.db.prepare(`SELECT * FROM payment_links WHERE appointment_id=? AND provider='monobank' AND status IN ('created','processing','hold','failure')`).all(appointmentId)){
   try{await this.api(token,'POST','/api/merchant/invoice/remove',{invoiceId:link.invoice_id});runtime.store.db.prepare("UPDATE payment_links SET status='removed' WHERE id=? AND status IN ('created','processing','hold','failure')").run(link.id);}
   catch{await this.check(runtime,token,link).catch(()=>{});}
  }
 }
 async invoice(business,runtime,data){
  const store=runtime.store,token=this.token(runtime);
  if((store.get('currency')||'UAH')!=='UAH')this.fail(400,'monobank приймає оплату лише в гривнях / monobank accepts payments in UAH only');
  const a=this.visit(store,data?.appointment_id);if(a.status==='cancelled')this.fail(400,'Візит скасовано / The visit is cancelled');
  const due=a.total-a.paid;if(due<=0)this.fail(400,'Візит уже оплачено / The visit is already paid');
  const amount=data.amount===undefined||data.amount===null||data.amount===''?due:Math.round(Number(data.amount)*100);
  if(!Number.isSafeInteger(amount)||amount<100||amount>due)this.fail(400,'Сума має бути від 1 грн і не більша за борг / Amount must be at least 1 UAH and not above what is due');
  if(data.send&&!a.chat_id)this.fail(400,'Клієнт не підключений до Telegram-бота / The client is not connected to the Telegram bot');
  await this.removeOpen(runtime,token,a.id);
  const name=a.service_name.slice(0,128),payload={amount,ccy:980,merchantPaymInfo:{reference:a.id,destination:`${name} · ${business.name}`.slice(0,280),basketOrder:[{name,qty:1,sum:amount,total:amount,code:a.service_id.slice(0,64),unit:'послуга'}]},validity:VALIDITY,paymentType:'debit',...(this.publicUrl?{webHookUrl:`${this.publicUrl}/v1/pay/monobank/${business.id}`}:{})};
  const created=await this.api(token,'POST','/api/merchant/invoice/create',payload);
  if(typeof created.invoiceId!=='string'||!/^https:\/\/[^\s]+$/.test(created.pageUrl||''))this.fail(502,'monobank повернув неочікувану відповідь / Unexpected monobank reply');
  store.addPaymentLink({appointment_id:a.id,provider:'monobank',invoice_id:created.invoiceId,amount,url:created.pageUrl,expires:Date.now()+VALIDITY*1000});
  // The link exists even when Telegram fails, so the screen can still show it as QR or text.
  let sent=false,sendError=null;if(data.send){try{sent=await this.send(business,runtime,a,amount,created.pageUrl);}catch(e){sendError=e.message;}}
  return{url:created.pageUrl,amount,sent,sendError,telegram:Boolean(a.chat_id)};
 }
 // Sends the link to the client's Telegram chat through the company bot (hosted or self-hosted).
 async send(business,runtime,a,amount,url){
  if(!a.chat_id)this.fail(400,'Клієнт не підключений до Telegram-бота / The client is not connected to the Telegram bot');
  const telegram=runtime.telegram,chat=a.chat_id,currency=runtime.store.get('currency')||'UAH';
  const text=`${telegram.text(chat,'botPayInvoice')}\n${a.service_name} · ${(amount/100).toFixed(2)} ${currency}\n${runtime.store.get('business')||business.name}`;
  const payload={chat_id:chat,text,reply_markup:{inline_keyboard:[[{text:telegram.text(chat,'botPayButton'),url}]]}};
  if(this.accounts.botWorkers?.status(business).hosting==='external')this.accounts.botWorkers.queue(business.id,'sendMessage',payload);
  else{if(!runtime.vault.has('telegram'))this.fail(400,OrbitI18n.t('m514'));await telegram.call('sendMessage',payload);}
  return true;
 }
 // After a manual payment, a price change or a cancellation: an unpaid link asking for more than is
 // still due (or for a cancelled visit) is withdrawn at the bank, so the client cannot pay twice.
 async reconcile(runtime,appointmentId){
  const token=runtime.vault.get('monobank');if(!token)return;
  const a=runtime.store.db.prepare('SELECT a.status,a.total,COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0) paid FROM appointments a WHERE a.id=?').get(String(appointmentId||''));if(!a)return;
  const due=a.total-a.paid,stale=runtime.store.db.prepare(`SELECT id FROM payment_links WHERE appointment_id=? AND provider='monobank' AND status IN ('created','processing','hold','failure') AND (amount>? OR ?)`).get(String(appointmentId),Math.max(due,0),a.status==='cancelled'?1:0);
  if(stale)await this.removeOpen(runtime,token,String(appointmentId));
 }
 async cancel(runtime,data){
  const token=this.token(runtime),a=this.visit(runtime.store,data?.appointment_id);
  await this.removeOpen(runtime,token,a.id);return true;
 }
 apply(store,d){
  if(!d||typeof d.invoiceId!=='string'||typeof d.status!=='string')this.fail(400,'Invalid monobank status');
  if(d.ccy!==undefined&&Number(d.ccy)!==980)this.fail(400,'Unexpected currency');
  const paid=d.status==='success'?(d.finalAmount??d.amount):d.status==='reversed'?(d.finalAmount??0):0;
  const r=store.settlePaymentLink('monobank',d.invoiceId,{status:d.status,paid,modified:d.modifiedDate});
  if(r?.payment_id)this.accounts.fiscal?.queueFromStore(store,r.payment_id);
  return r;
 }
 async check(runtime,token,link){const d=await this.api(token,'GET','/api/merchant/invoice/status?invoiceId='+encodeURIComponent(link.invoice_id));return this.apply(runtime.store,{...d,invoiceId:link.invoice_id});}
 async publicKey(runtime,token,refresh){
  let key=!refresh&&runtime.store.get('monobank_key');
  if(!key){key=(await this.api(token,'GET','/api/merchant/pubkey')).key;if(typeof key!=='string')this.fail(502,'monobank key missing');runtime.store.set('monobank_key',key);}
  return Buffer.from(key,'base64').toString('utf8');
 }
 verify(pem,body,sign){try{return crypto.verify('sha256',Buffer.from(body,'utf8'),pem,Buffer.from(sign,'base64'));}catch{return false;}}
 // POST /v1/pay/monobank/<business id>: status callbacks signed by monobank (X-Sign, ECDSA).
 async handle(req,url,reply){
  const match=/^\/v1\/pay\/monobank\/([a-f0-9-]{36})$/.exec(url.pathname);if(!match)return false;
  if(req.method!=='POST')this.fail(405,'Method not allowed');
  const business=this.db.prepare('SELECT * FROM businesses WHERE id=?').get(match[1]);if(!business)this.fail(404,'Not found');
  const runtime=this.accounts.businesses.get(business),token=runtime.vault.get('monobank'),sign=String(req.headers['x-sign']||'');
  if(!token)return reply(200,{ok:true}),true;
  if(!sign||sign.length>512)this.fail(401,'Invalid signature');
  let valid=this.verify(await this.publicKey(runtime,token,false),req.rawBody,sign);
  if(!valid&&Date.now()-(this.keyRefresh.get(business.id)||0)>600000){this.keyRefresh.set(business.id,Date.now());valid=this.verify(await this.publicKey(runtime,token,true),req.rawBody,sign);}
  if(!valid)this.fail(401,'Invalid signature');
  this.apply(runtime.store,JSON.parse(req.rawBody));reply(200,{ok:true});return true;
 }
 // Fallback when a callback is lost: re-check open invoices of loaded companies every few minutes.
 poll(){
  if(this.polling)return this.polling;
  this.polling=(async()=>{for(const runtime of this.accounts.businesses.instances.values()){
   const token=runtime.vault.get('monobank');if(!token)continue;
   const links=runtime.store.db.prepare(`SELECT * FROM payment_links WHERE provider='monobank' AND status IN ('created','processing','hold','failure') AND created_at>? ORDER BY created_at LIMIT 20`).all(Date.now()-(VALIDITY+86400)*1000);
   for(const link of links)await this.check(runtime,token,link).catch(()=>{});
   for(const id of new Set(links.map(l=>l.appointment_id)))await this.reconcile(runtime,id).catch(()=>{});
  }})().finally(()=>{this.polling=null;});
  return this.polling;
 }
}
module.exports={Monobank,OPEN};
