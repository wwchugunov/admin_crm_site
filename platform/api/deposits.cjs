const OrbitI18n=require('../shared/i18n.js');
const {Telegram}=require('../core/integrations.cjs');
// Prepayment for online bookings. A service may ask for one; when a client books it on the booking page or in
// the bot and the company has monobank or LiqPay connected, the visit waits 30 minutes for the payment. Paid —
// it stays; unpaid — it is cancelled, the time is free again and the team hears about it.
const WAIT=30*60000;
class Deposits{
 constructor({accounts}){this.accounts=accounts;this.running=false;
  // The bot asks for the prepayment right after a booking it made.
  Telegram.depositFor=async(telegram,id)=>{const b=this.accounts.notify?.businessOf?.(telegram);if(!b)return null;return this.request(b,this.accounts.businesses.get(b),id);};
 }
 provider(runtime){return runtime.vault.has('monobank')?this.accounts.monobank:this.accounts.liqpay&&runtime.vault.has('liqpay')?this.accounts.liqpay:null;}
 // Returns {amount,url,until} when the visit now waits for a prepayment, otherwise null.
 async request(business,runtime,appointmentId){
  const store=runtime.store,a=store.db.prepare('SELECT a.id,a.total,a.status,s.deposit FROM appointments a JOIN services s ON s.id=a.service_id WHERE a.id=?').get(appointmentId);
  if(!a||a.status!=='confirmed'||!a.deposit)return null;
  const provider=this.provider(runtime);if(!provider)return null;
  const amount=Math.min(a.deposit,a.total);if(amount<100)return null;
  const until=Date.now()+WAIT;
  store.requireDeposit(a.id,amount,until);
  try{const r=await provider.invoice(business,runtime,{appointment_id:a.id,amount:amount/100});return{amount,url:r.url,until};}
  catch{store.db.prepare('UPDATE appointments SET deposit_until=NULL WHERE id=?').run(a.id);return null;}
 }
 // Every minute: unpaid prepayments past their time cancel the visit.
 async tick(now=Date.now()){
  if(this.running)return;this.running=true;
  try{for(const[id,runtime]of this.accounts.businesses.instances){
   const expired=runtime.store.expiredDeposits(now);if(!expired.length)continue;
   const business=this.accounts.db.prepare('SELECT * FROM businesses WHERE id=?').get(id);
   for(const visit of expired){
    try{runtime.store.status(visit,'cancelled');}catch{continue;}
    if(business)this.accounts.notify?.event(business,'cancel',visit,'deposit').catch(()=>{});
    const c=runtime.store.db.prepare('SELECT c.chat_id FROM appointments a JOIN clients c ON c.id=a.client_id WHERE a.id=?').get(visit);
    if(c?.chat_id&&business){const payload={chat_id:c.chat_id,text:runtime.telegram.text(c.chat_id,'botDepositExpired'),reply_markup:{inline_keyboard:[[runtime.telegram.button(c.chat_id,'botBook','book')]]}};
     try{if(this.accounts.botWorkers?.status(business).hosting==='external')this.accounts.botWorkers.queue(business.id,'sendMessage',payload);else if(runtime.vault.has('telegram'))await runtime.telegram.call('sendMessage',payload);}catch{}}
   }
  }}finally{this.running=false;}
 }
}
module.exports={Deposits,WAIT};
