const crypto=require('node:crypto');
const {Telegram}=require('../core/integrations.cjs');
// Messages for the company team (owner and administrators): a morning summary, instant news about
// online bookings, cancellations from the bot and online payments, and weekly/monthly reports.
// They come through the company's own Telegram bot and/or by email; each person chooses what to get.
const DEFAULTS={telegram:true,email:false,morning:true,morning_time:'08:00',booking:true,cancel:true,payment:true,weekly:true,monthly:true};
const DAY=86400000;
const money=(cents,cur)=>`${new Intl.NumberFormat('uk-UA',{maximumFractionDigits:0}).format(Math.round(cents/100))} ${cur==='UAH'?'грн':cur}`;
const clock=(ms,tz)=>new Intl.DateTimeFormat('uk-UA',{timeZone:tz,hour:'2-digit',minute:'2-digit'}).format(ms);
const dayName=(ms,tz)=>new Intl.DateTimeFormat('uk-UA',{timeZone:tz,weekday:'long',day:'numeric',month:'long'}).format(ms);
const localParts=(ms,tz)=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'}).formatToParts(ms).map(x=>[x.type,x.value]));return{date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,weekday:p.weekday};};
// Midnight of a local date in the company time zone.
function midnight(date,tz){let t=Date.parse(date+'T00:00:00Z');for(let i=0;i<3;i++){const p=localParts(t,tz),diff=Date.parse(p.date+'T'+p.time+':00Z')-Date.parse(date+'T00:00:00Z');t-=diff;}return t;}
const shift=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
class Notify{
 constructor({db,accounts,mail,fail}){
  Object.assign(this,{db,accounts,mail,fail});
  db.exec(`CREATE TABLE IF NOT EXISTS team_chats(business_id TEXT NOT NULL,user_id TEXT NOT NULL,chat_id TEXT NOT NULL,linked_at INTEGER NOT NULL,PRIMARY KEY(business_id,user_id));
   CREATE TABLE IF NOT EXISTS team_link_codes(code TEXT PRIMARY KEY,business_id TEXT NOT NULL,user_id TEXT NOT NULL,expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS notify_prefs(business_id TEXT NOT NULL,user_id TEXT NOT NULL,prefs TEXT NOT NULL,PRIMARY KEY(business_id,user_id));
   CREATE TABLE IF NOT EXISTS notify_sent(key TEXT PRIMARY KEY,at INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS notify_cursor(business_id TEXT PRIMARY KEY,payment_at INTEGER NOT NULL);`);
  // The bot hands "start team-<code>" and bookings/cancellations made in the bot to this module.
  Telegram.onTeamLink=(telegram,code,chat)=>this.linked(telegram,code,chat);
  Telegram.onEvent=(telegram,kind,id,extra)=>{const b=this.businessOf(telegram);if(b)this.event(b,kind,id,'bot',extra).catch(()=>{});};
 }
 prefs(businessId,userId){const row=this.db.prepare('SELECT prefs FROM notify_prefs WHERE business_id=? AND user_id=?').get(businessId,userId);return{...DEFAULTS,...(row?JSON.parse(row.prefs):{})};}
 botName(business,runtime){return this.accounts.botWorkers?.status(business)?.username||runtime.store.get('bot_username')||null;}
 status(business,user){
  const runtime=this.accounts.businesses.get(business),chat=this.db.prepare('SELECT linked_at FROM team_chats WHERE business_id=? AND user_id=?').get(business.id,user.id);
  return{telegram:Boolean(chat),bot:this.botName(business,runtime),email:user.email,mail:Boolean(this.mail?.configured?.()),prefs:this.prefs(business.id,user.id)};
 }
 save(business,user,data){
  const p={...this.prefs(business.id,user.id)};
  for(const k of ['telegram','email','morning','booking','cancel','payment','weekly','monthly'])if(data?.[k]!==undefined)p[k]=data[k]===true;
  if(data?.morning_time!==undefined){if(!/^(0[5-9]|1[0-2]):(00|30)$/.test(data.morning_time))this.fail(400,'Час зведення: з 05:00 до 12:30 / Summary time 05:00–12:30');p.morning_time=data.morning_time;}
  this.db.prepare('INSERT INTO notify_prefs VALUES(?,?,?) ON CONFLICT(business_id,user_id) DO UPDATE SET prefs=excluded.prefs').run(business.id,user.id,JSON.stringify(p));
  return this.status(business,user);
 }
 link(business,user){
  const runtime=this.accounts.businesses.get(business),bot=this.botName(business,runtime);
  if(!bot)this.fail(400,'Спочатку підключіть Telegram-бота компанії (Інтеграції) / Connect the company bot first');
  const code=crypto.randomBytes(12).toString('base64url');
  this.db.prepare('DELETE FROM team_link_codes WHERE expires<? OR (business_id=? AND user_id=?)').run(Date.now(),business.id,user.id);
  this.db.prepare('INSERT INTO team_link_codes VALUES(?,?,?,?)').run(code,business.id,user.id,Date.now()+15*60000);
  return{url:`https://t.me/${bot}?start=team-${code}`};
 }
 unlink(business,user){this.db.prepare('DELETE FROM team_chats WHERE business_id=? AND user_id=?').run(business.id,user.id);return this.status(business,user);}
 businessOf(telegram){for(const[id,r]of this.accounts.businesses.instances)if(r.telegram===telegram||r.store===telegram.store)return this.db.prepare('SELECT * FROM businesses WHERE id=?').get(id);return null;}
 async linked(telegram,code,chat){
  const row=this.db.prepare('SELECT * FROM team_link_codes WHERE code=? AND expires>?').get(String(code),Date.now()),business=row&&this.businessOf(telegram);
  if(!row||!business||business.id!==row.business_id){await telegram.send(chat,'Посилання застаріло. Відкрийте його ще раз у LOMVIKO: Налаштування → Сповіщення.');return;}
  this.db.prepare('DELETE FROM team_link_codes WHERE code=?').run(row.code);
  this.db.prepare('INSERT INTO team_chats VALUES(?,?,?,?) ON CONFLICT(business_id,user_id) DO UPDATE SET chat_id=excluded.chat_id,linked_at=excluded.linked_at').run(row.business_id,row.user_id,String(chat),Date.now());
  await telegram.send(chat,'✅ Готово! Сюди приходитимуть сповіщення LOMVIKO для вашої компанії: ранкове зведення, нові онлайн-записи, скасування й оплати. Що саме надсилати — у застосунку: Налаштування → Сповіщення.');
 }
 // Owner and administrators of a company with their choices.
 team(business){
  return this.db.prepare("SELECT u.id,u.email,u.name,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.business_id=? AND m.role IN ('owner','admin') AND u.stage!='blocked'").all(business.id)
   .map(u=>({...u,prefs:this.prefs(business.id,u.id),chat:this.db.prepare('SELECT chat_id FROM team_chats WHERE business_id=? AND user_id=?').get(business.id,u.id)?.chat_id||null}));
 }
 async deliver(business,runtime,member,{subject,text,dedupe}){
  if(dedupe){if(this.db.prepare('SELECT 1 FROM notify_sent WHERE key=?').get(dedupe))return false;this.db.prepare('INSERT INTO notify_sent VALUES(?,?)').run(dedupe,Date.now());}
  let sent=false;
  if(member.prefs.telegram&&member.chat){
   const payload={chat_id:member.chat,text};
   try{if(this.accounts.botWorkers?.status(business).hosting==='external')this.accounts.botWorkers.queue(business.id,'sendMessage',payload);else if(runtime.vault.has('telegram'))await runtime.telegram.call('sendMessage',payload);sent=true;}catch{}
  }
  if(member.prefs.email&&this.mail?.configured?.()){this.mail.enqueue('notice',member.email,'uk',{subject,lines:text.split('\n\n')},{dedupe:dedupe?'mail:'+dedupe:undefined,userId:member.id});sent=true;}
  return sent;
 }
 // Visits of a day in the company time zone (with specialist names).
 day(store,date,tz){const from=midnight(date,tz),to=midnight(shift(date,1),tz);return store.visits('a.start>=? AND a.start<?',[from,to]);}
 morningText(business,runtime,now){
  const store=runtime.store,tz=store.get('timezone')||'Europe/Kyiv',cur=store.get('currency')||'UAH',today=localParts(now,tz).date,yesterday=shift(today,-1);
  const visits=this.day(store,today,tz).filter(a=>a.status!=='cancelled'),planned=visits.filter(a=>a.status==='confirmed'||a.status==='completed');
  const lines=[`☀️ ${store.get('business')||business.name} · ${dayName(now,tz)}`];
  if(planned.length){
   lines.push(`Записів: ${planned.length} · очікується ${money(planned.reduce((s,a)=>s+a.total,0),cur)}`);
   const by=new Map();for(const a of planned)for(const r of a.resources){const e=by.get(r.name)||{n:0,first:a.start,last:a.end};e.n++;e.first=Math.min(e.first,a.start);e.last=Math.max(e.last,a.end);by.set(r.name,e);}
   lines.push([...by].map(([n,e])=>`• ${n} — ${e.n} (${clock(e.first,tz)}–${clock(e.last,tz)})`).join('\n'));
  }else lines.push('Сьогодні записів ще немає.');
  const gaps=this.freeWindows(store,today,tz,planned,now);if(gaps.length)lines.push('Вільні вікна: '+gaps.slice(0,5).join(' · '));
  // Birthdays today (29 February is greeted on the 28th in other years).
  const md=today.slice(5),leap=new Date(Date.UTC(Number(today.slice(0,4)),1,29)).getUTCMonth()===1,days=md==='02-28'&&!leap?['02-28','02-29']:[md];
  const born=store.db.prepare(`SELECT name,phone FROM clients WHERE substr(birthday,6) IN (${days.map(()=>'?').join(',')}) ORDER BY name`).all(...days);
  if(born.length)lines.push(`🎂 День народження: ${born.slice(0,5).map(c=>`${c.name}${c.phone?` (${c.phone})`:''}`).join(', ')}${born.length>5?` і ще ${born.length-5}`:''}`);
  const waiting=store.waitlist().filter(w=>w.date===today);if(waiting.length)lines.push(`Лист очікування на сьогодні: ${waiting.map(w=>`${w.client_name}${w.phone?` (${w.phone})`:''} — ${w.service_name}`).slice(0,5).join(', ')}${waiting.length>5?` і ще ${waiting.length-5}`:''}`);
  const y=this.day(store,yesterday,tz),done=y.filter(a=>a.status==='completed'),noShow=y.filter(a=>a.status==='no_show').length;
  const paid=store.db.prepare('SELECT COALESCE(sum(amount),0) s FROM payments WHERE at>=? AND at<?').get(midnight(yesterday,tz),midnight(today,tz)).s;
  const fresh=store.db.prepare("SELECT count(*) n FROM (SELECT c.client_id,min(a.start) first FROM appointment_clients c JOIN appointments a ON a.id=c.appointment_id WHERE a.status='completed' GROUP BY c.client_id) WHERE first>=? AND first<?").get(midnight(yesterday,tz),midnight(today,tz)).n;
  if(y.length)lines.push(`Вчора: візитів ${done.length}, отримано ${money(paid,cur)}${noShow?`, неявок ${noShow}`:''}${fresh?`, нових клієнтів ${fresh}`:''}`);
  return{subject:`Зведення на ${dayName(now,tz)}`,text:lines.join('\n\n')};
 }
 // Gaps of an hour or more in each working specialist's day.
 freeWindows(store,date,tz,visits,now=Date.now()){
  const start=store.get('work_start')||'09:00',end=store.get('work_end')||'18:00',open=midnight(date,tz)+(Number(start.slice(0,2))*60+Number(start.slice(3)))*60000,close=midnight(date,tz)+(Number(end.slice(0,2))*60+Number(end.slice(3)))*60000;
  if(!(store.get('work_days')||[1,2,3,4,5,6,7]).includes(new Date(date+'T12:00:00Z').getUTCDay()||7))return[];
  const out=[],from=Math.max(open,now);
  for(const r of store.catalogue().resources){
   if(!store.worksOn(r.id,date))continue;
   const busy=visits.filter(a=>a.resources.some(x=>x.id===r.id)).map(a=>[a.start,a.end]).sort((a,b)=>a[0]-b[0]);
   let t=from;for(const[s,e]of[...busy,[close,close]]){if(s-t>=3600000)out.push(`${r.name.split(' ')[0]} ${clock(t,tz)}–${clock(s,tz)}`);t=Math.max(t,e);}
  }
  return out;
 }
 // Weekly or monthly report for [from, to), compared with the period before.
 reportText(business,runtime,kind,now){
  const store=runtime.store,tz=store.get('timezone')||'Europe/Kyiv',cur=store.get('currency')||'UAH',today=localParts(now,tz).date;
  let first,last,label;
  if(kind==='weekly'){const wd=new Date(today+'T12:00:00Z').getUTCDay()||7;last=shift(today,1-wd);first=shift(last,-7);label=`тиждень ${first.slice(8)}.${first.slice(5,7)}–${shift(last,-1).slice(8)}.${shift(last,-1).slice(5,7)}`;}
  else{last=today.slice(0,8)+'01';const p=new Date(last+'T12:00:00Z');p.setUTCMonth(p.getUTCMonth()-1);first=p.toISOString().slice(0,10);label=new Intl.DateTimeFormat('uk-UA',{month:'long',year:'numeric',timeZone:'UTC'}).format(p);}
  const span=(a,b)=>{const from=midnight(a,tz),to=midnight(b,tz),v=store.visits('a.start>=? AND a.start<?',[from,to]);return{from,to,v,done:v.filter(x=>x.status==='completed'),paid:store.db.prepare('SELECT COALESCE(sum(amount),0) s FROM payments WHERE at>=? AND at<?').get(from,to).s};};
  const days=Math.round((Date.parse(last)-Date.parse(first))/DAY),cur_=span(first,last),prev=span(shift(first,-days),first);
  const revenue=cur_.done.reduce((s,a)=>s+a.total,0),before=prev.done.reduce((s,a)=>s+a.total,0);
  const change=before?` (${revenue>=before?'+':''}${Math.round((revenue-before)/before*100)}% до попереднього)`:'';
  const noShow=cur_.v.filter(a=>a.status==='no_show').length,cancelled=cur_.v.filter(a=>a.status==='cancelled').length;
  const fresh=store.db.prepare("SELECT count(*) n FROM (SELECT c.client_id,min(a.start) first FROM appointment_clients c JOIN appointments a ON a.id=c.appointment_id WHERE a.status='completed' GROUP BY c.client_id) WHERE first>=? AND first<?").get(cur_.from,cur_.to).n;
  const clients=new Set(cur_.done.flatMap(a=>a.clients.map(c=>c.id))).size;
  const lines=[`📊 ${store.get('business')||business.name} · ${label}`,`Виторг: ${money(revenue,cur)}${change}\nОтримано оплат: ${money(cur_.paid,cur)}`,`Візитів: ${cur_.done.length} · неявок: ${noShow} · скасувань: ${cancelled}\nКлієнтів: ${clients}, з них нових: ${fresh}`];
  // Load: busy minutes against the specialist's working time in the period.
  const ws=store.get('work_start')||'09:00',we=store.get('work_end')||'18:00',hours=(Number(we.slice(0,2))*60+Number(we.slice(3))-Number(ws.slice(0,2))*60-Number(ws.slice(3)));
  const workDays=store.get('work_days')||[1,2,3,4,5,6,7],rows=[];
  for(const r of store.catalogue().resources){
   let avail=0;for(let d=first;d<last;d=shift(d,1))if(workDays.includes(new Date(d+'T12:00:00Z').getUTCDay()||7)&&store.worksOn(r.id,d))avail+=hours;
   const mine=cur_.v.filter(a=>a.resources.some(x=>x.id===r.id)&&(a.status==='completed'||a.status==='confirmed')),done=mine.filter(a=>a.status==='completed');
   const busy=mine.reduce((s,a)=>s+(a.end-a.start)/60000,0);
   if(done.length||avail)rows.push({name:r.name,revenue:done.reduce((s,a)=>s+a.total,0),visits:done.length,load:avail?Math.round(busy/avail*100):0});
  }
  rows.sort((a,b)=>b.revenue-a.revenue);
  if(rows.length)lines.push('По спеціалістах:\n'+rows.map(r=>`• ${r.name} — ${money(r.revenue,cur)}, візитів ${r.visits}, завантаження ${r.load}%`).join('\n'));
  return{subject:`Звіт за ${label}`,text:lines.join('\n\n'),period:first};
 }
 // Instant news. Bookings, cancellations and moves come from the bot and the booking page.
 async event(business,kind,id,source,extra={}){
  const runtime=this.accounts.businesses.get(business),store=runtime.store,tz=store.get('timezone')||'Europe/Kyiv',cur=store.get('currency')||'UAH';
  const a=store.visits('a.id=?',[String(id)])[0];if(!a)return;
  const when=`${dayName(a.start,tz)}, ${clock(a.start,tz)}`,who=`${a.client_name}${a.phone?` · ${a.phone}`:''}`;
  const text=kind==='booking'?`🆕 Новий запис ${extra?.waitlist?'з листа очікування':source==='bot'?'через Telegram-бота':'онлайн'}\n${who}\n${a.service_name} · ${a.resource_name}\n${when} · ${money(a.total,cur)}`
   :kind==='reschedule'?`🔁 Клієнт переніс запис ${source==='page'?'за посиланням зі сторінки запису':'через бота'}\n${who}\n${a.service_name} · ${a.resource_name}\nБуло: ${extra?.from?`${dayName(extra.from,tz)}, ${clock(extra.from,tz)}`:'—'}\nСтало: ${when}`
   :kind==='review'?`⭐ Низька оцінка візиту: ${extra?.rating}/5\n${who}\n${a.service_name} · ${a.resource_name}\n${when}\nЗв’яжіться з клієнтом, поки враження свіже.`
   :source==='deposit'?`❌ Запис скасовано: передоплату не внесено вчасно\n${who}\n${a.service_name} · ${a.resource_name}\n${when}\nЧас знову вільний.`
   :`❌ Клієнт скасував запис ${source==='page'?'за посиланням зі сторінки запису':'через бота'}\n${who}\n${a.service_name} · ${a.resource_name}\n${when}\nЧас знову вільний.`;
  const subject=kind==='booking'?'Новий онлайн-запис':kind==='reschedule'?'Перенесення запису':kind==='review'?'Низька оцінка візиту':'Скасування запису';
  // A move is a change made by the client, like a cancellation: the same switch covers both.
  for(const m of this.team(business))if(m.prefs[kind==='booking'?'booking':'cancel'])await this.deliver(business,runtime,m,{subject,text,dedupe:`${kind}:${id}:${kind==='reschedule'?a.start+':':''}${m.id}`});
 }
 async test(business,user){
  const runtime=this.accounts.businesses.get(business),member=this.team(business).find(m=>m.id===user.id);
  if(!member)this.fail(403,'Сповіщення доступні власнику й адміністраторам / Owner and admins only');
  if(!(member.prefs.telegram&&member.chat)&&!(member.prefs.email&&this.mail?.configured?.()))this.fail(400,'Підключіть Telegram або увімкніть пошту / Connect Telegram or turn on email');
  await this.deliver(business,runtime,member,this.morningText(business,runtime,Date.now()));
  return{sent:true};
 }
 // Every minute: morning summaries and reports when their local time comes; new online payments.
 async tick(now=Date.now()){
  const businesses=this.db.prepare('SELECT DISTINCT b.* FROM businesses b JOIN memberships m ON m.business_id=b.id WHERE EXISTS(SELECT 1 FROM team_chats t WHERE t.business_id=b.id) OR EXISTS(SELECT 1 FROM notify_prefs p WHERE p.business_id=b.id)').all();
  for(const business of businesses){
   try{
    const runtime=this.accounts.businesses.get(business),store=runtime.store,tz=store.get('timezone')||'Europe/Kyiv',local=localParts(now,tz),team=this.team(business);
    for(const m of team){
     if(m.prefs.morning&&local.time>=m.prefs.morning_time&&local.time<'14:00')await this.deliver(business,runtime,m,{...this.morningText(business,runtime,now),dedupe:`morning:${business.id}:${m.id}:${local.date}`});
     if(m.prefs.weekly&&local.weekday==='Mon'&&local.time>='09:00'){const r=this.reportText(business,runtime,'weekly',now);await this.deliver(business,runtime,m,{...r,dedupe:`weekly:${business.id}:${m.id}:${r.period}`});}
     if(m.prefs.monthly&&local.date.endsWith('-01')&&local.time>='09:00'){const r=this.reportText(business,runtime,'monthly',now);await this.deliver(business,runtime,m,{...r,dedupe:`monthly:${business.id}:${m.id}:${r.period}`});}
    }
    // Online payments since the last look (the first look only remembers where we are).
    const cursor=this.db.prepare('SELECT payment_at FROM notify_cursor WHERE business_id=?').get(business.id);
    const rows=cursor?store.db.prepare("SELECT p.*,s.name service FROM payments p JOIN appointments a ON a.id=p.appointment_id JOIN services s ON s.id=a.service_id WHERE p.method IN ('monobank','liqpay') AND p.amount>0 AND p.at>? ORDER BY p.at").all(cursor.payment_at):[];
    const latest=rows.length?rows.at(-1).at:(cursor?.payment_at??now);
    this.db.prepare('INSERT INTO notify_cursor VALUES(?,?) ON CONFLICT(business_id) DO UPDATE SET payment_at=excluded.payment_at').run(business.id,latest);
    for(const p of rows){const a=store.visits('a.id=?',[p.appointment_id])[0],cur=store.get('currency')||'UAH';for(const m of team)if(m.prefs.payment)await this.deliver(business,runtime,m,{subject:'Онлайн-оплата',text:`💳 Оплата ${p.method==='liqpay'?'LiqPay':'monobank'}: ${money(p.amount,cur)}\n${a?`${a.client_name} · ${a.service_name}\n${dayName(a.start,tz)}, ${clock(a.start,tz)}`:p.service}`,dedupe:`payment:${p.id}:${m.id}`});}
   }catch(e){console.error('LOMVIKO notifications failed for a company');}
  }
  this.db.prepare('DELETE FROM notify_sent WHERE at<?').run(now-90*DAY);
 }
}
module.exports={Notify,DEFAULTS,midnight,localParts};
