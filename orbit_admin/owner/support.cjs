const crypto=require('node:crypto');
// Messages from customers to the LOMVIKO team, sent from the app ("Підтримка") or from an error.
// The team gets an email it can answer directly; the customer gets a short confirmation.
const TOPICS=['problem','question','idea','billing'];
const email=v=>typeof v==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())&&v.trim().length<=254?v.trim().toLowerCase():null;
const clip=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
class Support{
 constructor({store,mail,fail}){Object.assign(this,{store,db:store.db,mail,fail});
  this.db.exec('CREATE TABLE IF NOT EXISTS support_requests(id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,business TEXT NOT NULL,topic TEXT NOT NULL,message TEXT NOT NULL,details TEXT NOT NULL,language TEXT NOT NULL,stage TEXT NOT NULL,created_at INTEGER NOT NULL)');}
 // Address customers can write to when the app cannot reach the server.
 contact(){if(!this.mail?.configured())return null;const c=this.mail.settings();return c.replyTo||c.fromEmail||null;}
 create(data){
  if(!data||typeof data!=='object'||Array.isArray(data))this.fail(400,'Некоректне звернення / Invalid request');
  const address=email(data.email),message=clip(data.message,4000),topic=TOPICS.includes(data.topic)?data.topic:'question',language=data.language==='en'?'en':'uk';
  if(!address)this.fail(400,'Вкажіть пошту, на яку ми зможемо відповісти / Enter an email we can reply to');
  if(message.length<5)this.fail(400,'Опишіть, будь ласка, що сталося / Please describe what happened');
  if(this.db.prepare('SELECT count(*) n FROM support_requests WHERE email=? AND created_at>?').get(address,Date.now()-3600000).n>=5)this.fail(429,'Ви вже надіслали кілька звернень — ми все отримали і відповімо найближчим часом / We already received your messages and will reply soon');
  if(this.db.prepare('SELECT count(*) n FROM support_requests WHERE created_at>?').get(Date.now()-60000).n>=30)this.fail(429,'Забагато звернень, спробуйте за хвилину / Too many requests; try in a minute');
  const row={id:crypto.randomUUID(),email:address,name:clip(data.name,120),business:clip(data.business,160),topic,message,details:clip(data.details,8000),language,stage:'new',created_at:Date.now()};
  this.store.transaction(()=>{
   this.db.prepare('INSERT INTO support_requests VALUES(?,?,?,?,?,?,?,?,?,?)').run(row.id,row.email,row.name,row.business,row.topic,row.message,row.details,row.language,row.stage,row.created_at);
   const c=this.mail?.configured()?this.mail.settings():null;
   if(c?.ownerEmail)this.mail.enqueue('support-team',c.ownerEmail,'uk',row,{dedupe:'support-team:'+row.id,replyTo:row.email,expires:Date.now()+7*86400000});
   if(c)this.mail.enqueue('support-receipt',row.email,language,{name:row.name,topic},{dedupe:'support-receipt:'+row.id,expires:Date.now()+86400000});
   this.store.event('support.request.created');
  });
  return{ok:true,id:row.id};
 }
 list(){return this.db.prepare('SELECT * FROM support_requests ORDER BY created_at DESC LIMIT 300').all();}
 stage(data){if(!['new','answered','closed'].includes(data?.stage))this.fail(400,'Invalid stage');if(!this.db.prepare('UPDATE support_requests SET stage=? WHERE id=?').run(data.stage,String(data.id||'')).changes)this.fail(404,'Not found');return{ok:true};}
 // Answered or closed messages are kept for 12 months, as the privacy policy says.
 cleanup(){this.db.prepare("DELETE FROM support_requests WHERE stage!='new' AND created_at<?").run(Date.now()-365*86400000);}
 remove(data){this.db.prepare('DELETE FROM support_requests WHERE id=?').run(String(data?.id||''));return{ok:true};}
}
module.exports={Support,TOPICS};
