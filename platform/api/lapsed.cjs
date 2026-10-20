const crypto=require('node:crypto');
const OrbitI18n=require('../shared/i18n.js');
// "Not seen lately": clients whose last completed visit is older than the company's limit (and, if the owner
// wants, older than their own usual gap), with nothing booked ahead. The owner writes invitation templates
// and either sends them by hand or lets LOMVIKO send one per absence, during the day, through the company bot.
const DEFAULT_TEMPLATE={id:'default',title:'Запрошення',text:'{name}, давно вас не бачили! Запишіться на зручний час — це займе хвилину.'};
const MAX_TEMPLATES=10,AUTO_BATCH=30,AUTO_HOURS=[10,19];
class Lapsed{
 constructor({accounts,fail}){Object.assign(this,{accounts,fail});this.running=false;}
 settings(store){
  const s=store.get('lapsed_settings')||{};
  return{days:store.get('lapsed_days')||30,rhythm:s.rhythm!==false,templates:Array.isArray(s.templates)&&s.templates.length?s.templates:[DEFAULT_TEMPLATE],auto:Boolean(s.auto),auto_template:s.auto_template||'default'};
 }
 save(store,data){
  const days=Number(data.days);if(!Number.isInteger(days)||days<3||days>365)this.fail(400,'Вкажіть від 3 до 365 днів / Enter from 3 to 365 days');
  const raw=Array.isArray(data.templates)?data.templates:[];if(!raw.length||raw.length>MAX_TEMPLATES)this.fail(400,`Потрібно від 1 до ${MAX_TEMPLATES} шаблонів / Between 1 and ${MAX_TEMPLATES} templates`);
  const templates=raw.map(t=>{const title=String(t?.title||'').trim().slice(0,60),text=String(t?.text||'').trim();if(!title||!text||text.length>1000)this.fail(400,'У шаблоні потрібні назва й текст до 1000 символів / A template needs a title and text up to 1000 characters');return{id:/^[a-z0-9-]{1,40}$/.test(t.id||'')?t.id:crypto.randomUUID().slice(0,8),title,text};});
  if(new Set(templates.map(t=>t.id)).size!==templates.length)this.fail(400,'Шаблони повторюються / Templates repeat');
  const auto=data.auto===true,autoTemplate=templates.some(t=>t.id===data.auto_template)?data.auto_template:templates[0].id;
  store.set('lapsed_days',days);store.set('lapsed_settings',{rhythm:data.rhythm!==false,templates,auto,auto_template:autoTemplate});
  return this.settings(store);
 }
 // The same rule the app shows; "invited" means invited after the last visit, so each absence gets one invitation.
 clients(store,now=Date.now()){
  const s=this.settings(store),rhythm=s.rhythm?store.rhythms():new Map();
  return store.db.prepare("SELECT c.id,c.name,c.chat_id,c.invited_at,(SELECT max(a.start) FROM appointment_clients p JOIN appointments a ON a.id=p.appointment_id WHERE p.client_id=c.id AND a.status='completed') last,(SELECT count(*) FROM appointment_clients p JOIN appointments a ON a.id=p.appointment_id WHERE p.client_id=c.id AND a.status='confirmed' AND a.start>?) ahead FROM clients c").all(now)
   .filter(c=>c.last&&!c.ahead)
   .map(c=>({...c,away:Math.floor((now-c.last)/86400000),usual:rhythm.get(c.id)||0}))
   .filter(c=>c.away>=Math.max(s.days,Math.round(c.usual*1.5)));
 }
 text(store,business,template,client){
  const name=String(client.name||'').split(/\s+/)[0]||'';
  return template.text.replaceAll('{name}',name).replaceAll("{ім'я}",name).replaceAll('{імʼя}',name).replaceAll('{business}',store.get('business')||business.name).replaceAll('{компанія}',store.get('business')||business.name).replaceAll('{days}',String(client.away??'')).replaceAll('{днів}',String(client.away??''));
 }
 async send(business,runtime,client,templateId){
  const {store,telegram,vault}=runtime,s=this.settings(store),template=s.templates.find(t=>t.id===templateId)||s.templates[0];
  if(!client.chat_id)this.fail(400,'Клієнт не підключений до Telegram-бота / The client is not connected to the Telegram bot');
  const payload={chat_id:client.chat_id,text:this.text(store,business,template,client),reply_markup:{inline_keyboard:[[telegram.button(client.chat_id,'botBook','book')]]}};
  if(this.accounts.botWorkers?.status(business).hosting==='external')this.accounts.botWorkers.queue(business.id,'sendMessage',payload);
  else{if(!vault.has('telegram'))this.fail(400,OrbitI18n.t('m514'));await telegram.call('sendMessage',payload);}
  store.markInvited(client.id);
 }
 async invite(business,runtime,data){
  const c=runtime.store.db.prepare('SELECT id,name,chat_id FROM clients WHERE id=?').get(String(data?.id||''));if(!c)this.fail(404,OrbitI18n.t('clientMissing'));
  const away=this.clients(runtime.store).find(x=>x.id===c.id)?.away;
  await this.send(business,runtime,{...c,away},data?.template_id);return{sent:true};
 }
 // Everyone not seen lately who has the bot and has not been invited since their last visit.
 async inviteAll(business,runtime,data){
  let sent=0;
  for(const c of this.clients(runtime.store).filter(c=>c.chat_id&&!(c.invited_at>c.last))){try{await this.send(business,runtime,c,data?.template_id);sent++;}catch{}}
  return{sent};
 }
 // Hourly: companies with automatic invitations send them between 10:00 and 19:00 their time.
 async tick(now=Date.now()){
  if(this.running)return;this.running=true;
  try{for(const [id,runtime] of this.accounts.businesses.instances){
   const s=this.settings(runtime.store);if(!s.auto)continue;
   const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:runtime.store.get('timezone')||'Europe/Kyiv',hour:'2-digit',hourCycle:'h23'}).format(now));
   if(hour<AUTO_HOURS[0]||hour>=AUTO_HOURS[1])continue;
   // Only companies with access: an expired trial sends nothing.
   const business=this.accounts.db.prepare("SELECT b.* FROM businesses b JOIN users u ON u.id=b.account_id WHERE b.id=? AND u.stage IN ('trial','active') AND u.expires>?").get(id,Date.now());if(!business)continue;
   for(const c of this.clients(runtime.store,now).filter(c=>c.chat_id&&!(c.invited_at>c.last)).slice(0,AUTO_BATCH))await this.send(business,runtime,c,s.auto_template).catch(()=>{});
  }}finally{this.running=false;}
 }
}
module.exports={Lapsed,DEFAULT_TEMPLATE};
