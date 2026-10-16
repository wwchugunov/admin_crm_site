const crypto=require('node:crypto');
// Support requests ("звернення") from the app. Each gets a number (№1001, №1002 …) and a thread of
// messages. The customer sees their own requests in the app (Налаштування → Підтримка), the team
// answers in the admin panel; both sides also get emails. Statuses follow common help-desk practice:
//  open    — received, the team is on it        (customer sees «Розглядаємо»)
//  waiting — the team replied, waiting for you  («Чекаємо на вашу відповідь»)
//  solved  — the team marked it solved; a customer reply reopens it; closes itself after 7 days
//  closed  — final; a new message starts a new request linked to this one
const TOPICS=['problem','question','idea','billing'];
const STATUSES=['open','waiting','solved','closed'];
const DAY=86400000,AUTO_CLOSE=7*DAY,KEEP=365*DAY;
const email=v=>typeof v==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())&&v.trim().length<=254?v.trim().toLowerCase():null;
const clip=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
class Support{
 constructor({store,mail,fail}){Object.assign(this,{store,db:store.db,mail,fail});
  this.db.exec('CREATE TABLE IF NOT EXISTS support_requests(id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,business TEXT NOT NULL,topic TEXT NOT NULL,message TEXT NOT NULL,details TEXT NOT NULL,language TEXT NOT NULL,stage TEXT NOT NULL,created_at INTEGER NOT NULL)');
  const columns=this.db.prepare('PRAGMA table_info(support_requests)').all().map(c=>c.name);
  for(const [name,type] of [['number','INTEGER'],['user_id','TEXT'],['status',"TEXT NOT NULL DEFAULT 'open'"],['updated_at','INTEGER NOT NULL DEFAULT 0'],['unread','INTEGER NOT NULL DEFAULT 0'],['rating','TEXT'],['rating_comment','TEXT'],['solved_at','INTEGER'],['parent_id','TEXT']])
   if(!columns.includes(name)){this.db.exec(`ALTER TABLE support_requests ADD COLUMN ${name} ${type}`);
    // Requests saved before numbering: number them in order and map the old stages.
    if(name==='number'){let n=1000;for(const r of this.db.prepare('SELECT id FROM support_requests ORDER BY created_at').all())this.db.prepare('UPDATE support_requests SET number=? WHERE id=?').run(++n,r.id);}
    if(name==='status')this.db.exec("UPDATE support_requests SET status=CASE stage WHEN 'answered' THEN 'waiting' WHEN 'closed' THEN 'closed' ELSE 'open' END");
    if(name==='updated_at')this.db.exec('UPDATE support_requests SET updated_at=created_at');}
  this.db.exec('CREATE UNIQUE INDEX IF NOT EXISTS support_number ON support_requests(number);CREATE INDEX IF NOT EXISTS support_user ON support_requests(user_id);CREATE TABLE IF NOT EXISTS support_messages(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,author TEXT NOT NULL,name TEXT NOT NULL,text TEXT NOT NULL,created_at INTEGER NOT NULL);CREATE INDEX IF NOT EXISTS support_thread ON support_messages(request_id,created_at)');
 }
 // Address customers can write to when the app cannot reach the server.
 contact(){if(!this.mail?.configured())return null;const c=this.mail.settings();return c.replyTo||c.fromEmail||null;}
 mailSettings(){return this.mail?.configured()?this.mail.settings():null;}
 nextNumber(){return(this.db.prepare('SELECT max(number) n FROM support_requests').get().n||1000)+1;}
 // user: the signed-in account, when the request comes from the app; null for the public form.
 create(data,user=null){
  if(!data||typeof data!=='object'||Array.isArray(data))this.fail(400,'Некоректне звернення / Invalid request');
  const address=email(data.email)||email(user?.email),message=clip(data.message,4000),topic=TOPICS.includes(data.topic)?data.topic:'question',language=data.language==='en'?'en':'uk';
  if(!address)this.fail(400,'Вкажіть пошту, на яку ми зможемо відповісти / Enter an email we can reply to');
  if(message.length<5)this.fail(400,'Опишіть, будь ласка, що сталося / Please describe what happened');
  if(this.db.prepare('SELECT count(*) n FROM support_requests WHERE email=? AND created_at>?').get(address,Date.now()-3600000).n>=5)this.fail(429,'Ви вже надіслали кілька звернень — ми все отримали і відповімо найближчим часом / We already received your messages and will reply soon');
  if(this.db.prepare('SELECT count(*) n FROM support_requests WHERE created_at>?').get(Date.now()-60000).n>=30)this.fail(429,'Забагато звернень, спробуйте за хвилину / Too many requests; try in a minute');
  const parent=data.parent_id&&user?this.db.prepare('SELECT id FROM support_requests WHERE id=? AND user_id=?').get(String(data.parent_id),user.id):null;
  const now=Date.now(),row={id:crypto.randomUUID(),email:address,name:clip(data.name,120)||user?.name||'',business:clip(data.business,160),topic,message,details:clip(data.details,8000),language,created_at:now};
  let number;
  this.store.transaction(()=>{
   number=this.nextNumber();
   this.db.prepare("INSERT INTO support_requests(id,email,name,business,topic,message,details,language,stage,created_at,number,user_id,status,updated_at,unread,parent_id) VALUES(?,?,?,?,?,?,?,?,'open',?,?,?,'open',?,0,?)").run(row.id,row.email,row.name,row.business,row.topic,row.message,row.details,row.language,row.created_at,number,user?.id||null,now,parent?.id||null);
   const c=this.mailSettings();
   if(c?.ownerEmail)this.mail.enqueue('support-team',c.ownerEmail,'uk',{...row,number,parent:parent?this.db.prepare('SELECT number FROM support_requests WHERE id=?').get(parent.id).number:null},{dedupe:'support-team:'+row.id,replyTo:row.email,expires:now+7*DAY});
   if(c)this.mail.enqueue('support-receipt',row.email,language,{name:row.name,topic,number},{dedupe:'support-receipt:'+row.id,expires:now+DAY});
   this.store.event('support.request.created');
  });
  return{ok:true,id:row.id,number};
 }
 thread(r){
  const first={author:'client',name:r.name,text:r.message,created_at:r.created_at};
  return[first,...this.db.prepare('SELECT author,name,text,created_at FROM support_messages WHERE request_id=? ORDER BY created_at').all(r.id)];
 }
 view(r,team=false){
  const v={id:r.id,number:r.number,topic:r.topic,status:r.status,unread:Boolean(r.unread),rating:r.rating||null,created_at:r.created_at,updated_at:r.updated_at,messages:this.thread(r),parent:r.parent_id?this.db.prepare('SELECT number FROM support_requests WHERE id=?').get(r.parent_id)?.number||null:null};
  return team?{...v,email:r.email,name:r.name,business:r.business,details:r.details,rating_comment:r.rating_comment||'',user_id:r.user_id}:v;
 }
 own(user,id){const r=this.db.prepare('SELECT * FROM support_requests WHERE id=? AND user_id=?').get(String(id||''),user.id);if(!r)this.fail(404,'Звернення не знайдено / Request not found');return r;}
 // Customer side (signed in).
 mine(user){return{requests:this.db.prepare('SELECT * FROM support_requests WHERE user_id=? ORDER BY updated_at DESC LIMIT 50').all(user.id).map(r=>this.view(r)),contact:this.contact()};}
 read(user,data){this.own(user,data?.id);this.db.prepare('UPDATE support_requests SET unread=0 WHERE id=?').run(String(data.id));return{ok:true};}
 reply(user,data){
  const r=this.own(user,data?.id),text=clip(data?.text,4000);
  if(text.length<1)this.fail(400,'Напишіть повідомлення / Write a message');
  if(r.status==='closed')this.fail(409,'Це звернення вже закрите. Створіть нове — ми побачимо попередню переписку / This request is closed; start a new one');
  const now=Date.now();
  this.store.transaction(()=>{
   this.db.prepare('INSERT INTO support_messages VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),r.id,'client',r.name,text,now);
   this.db.prepare("UPDATE support_requests SET status='open',stage='open',unread=0,updated_at=?,solved_at=NULL WHERE id=?").run(now,r.id);
   const c=this.mailSettings();
   if(c?.ownerEmail)this.mail.enqueue('support-team',c.ownerEmail,'uk',{...r,message:text,details:'',number:r.number,followUp:true},{dedupe:'support-team:'+r.id+':'+now,replyTo:r.email,expires:now+7*DAY});
  });
  return{ok:true};
 }
 rate(user,data){
  const r=this.own(user,data?.id);if(!['solved','closed'].includes(r.status))this.fail(409,'Оцінити можна після відповіді / Rate after the reply');
  if(!['good','bad'].includes(data?.rating))this.fail(400,'Invalid rating');
  this.db.prepare('UPDATE support_requests SET rating=?,rating_comment=? WHERE id=?').run(data.rating,clip(data.comment,1000),r.id);return{ok:true};
 }
 // Team side (admin panel).
 list(){return this.db.prepare('SELECT * FROM support_requests ORDER BY CASE status WHEN \'open\' THEN 0 WHEN \'waiting\' THEN 1 WHEN \'solved\' THEN 2 ELSE 3 END,updated_at DESC LIMIT 300').all().map(r=>this.view(r,true));}
 answer(data,teamName='LOMVIKO'){
  const r=this.db.prepare('SELECT * FROM support_requests WHERE id=?').get(String(data?.id||''));if(!r)this.fail(404,'Not found');
  const text=clip(data?.text,8000);if(text.length<1)this.fail(400,'Напишіть відповідь / Write a reply');
  const now=Date.now(),status=data.solve?'solved':'waiting';
  this.store.transaction(()=>{
   this.db.prepare('INSERT INTO support_messages VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),r.id,'team',clip(teamName,120)||'LOMVIKO',text,now);
   this.db.prepare('UPDATE support_requests SET status=?,stage=?,unread=1,updated_at=?,solved_at=? WHERE id=?').run(status,status,now,data.solve?now:null,r.id);
   if(this.mailSettings())this.mail.enqueue('support-reply',r.email,r.language,{name:r.name,number:r.number,text,team:clip(teamName,120)||'LOMVIKO',solved:Boolean(data.solve),account:Boolean(r.user_id)},{dedupe:'support-reply:'+r.id+':'+now,userId:r.user_id,expires:now+7*DAY});
  });
  return{ok:true};
 }
 status(data){
  const status=data?.status==='new'?'open':data?.status==='answered'?'waiting':data?.status;
  if(!STATUSES.includes(status))this.fail(400,'Invalid status');
  if(!this.db.prepare('UPDATE support_requests SET status=?,stage=?,updated_at=?,solved_at=CASE WHEN ?=\'solved\' THEN ? ELSE solved_at END WHERE id=?').run(status,status,Date.now(),status,Date.now(),String(data.id||'')).changes)this.fail(404,'Not found');
  return{ok:true};
 }
 stage(data){return this.status({id:data?.id,status:data?.stage});}
 // Solved requests close themselves after 7 days; closed ones are kept 12 months (privacy policy).
 cleanup(now=Date.now()){
  this.db.prepare("UPDATE support_requests SET status='closed',stage='closed' WHERE status='solved' AND solved_at<?").run(now-AUTO_CLOSE);
  const old=this.db.prepare("SELECT id FROM support_requests WHERE status='closed' AND updated_at<?").all(now-KEEP);
  for(const r of old)this.erase(r.id);
 }
 erase(id){this.db.prepare('DELETE FROM support_messages WHERE request_id=?').run(id);this.db.prepare('DELETE FROM support_requests WHERE id=?').run(id);}
 remove(data){this.erase(String(data?.id||''));return{ok:true};}
 // Signed-in app routes: /v1/support/*. Works even when access has ended, so people can always reach us.
 async handle(req,url,reply,accounts){
  if(!url.pathname.startsWith('/v1/support/'))return false;
  const {user}=accounts.session(req,{anyStage:true}),d=req.parsedBody||{},route=url.pathname.slice(12);
  if(req.method==='GET'&&route==='list')return reply(200,this.mine(user)),true;
  if(req.method!=='POST')this.fail(404,'Not found');
  if(route==='create')return reply(201,this.create(d,user)),true;
  if(route==='reply')return reply(200,this.reply(user,d)),true;
  if(route==='read')return reply(200,this.read(user,d)),true;
  if(route==='rate')return reply(200,this.rate(user,d)),true;
  this.fail(404,'Not found');
 }
}
module.exports={Support,TOPICS,STATUSES};
