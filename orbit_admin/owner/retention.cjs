// Storage limits from the privacy policy and the offer: after access ends the owner can view and
// export data for 30 days (a reminder goes out a week before that closes); 3 months after the end
// the account is deleted with all company data. Blocked and perpetual accounts are not touched.
const DAY=86400000,EXPORT=30*DAY,REMIND=23*DAY,KEEP=90*DAY;
class Retention{
 constructor({store,accounts,mail}){Object.assign(this,{store,db:store.db,accounts,mail});}
 tick(now=Date.now()){
  const owners=this.db.prepare("SELECT * FROM users WHERE account_id IS NULL AND stage IN ('trial','active') AND expires<?").all(now-REMIND);
  let deleted=0;
  for(const u of owners){
   if(u.expires<now-KEEP){try{this.accounts.deletion.delete(u.id);deleted++;}catch{}}
   else if(u.expires>now-EXPORT&&this.mail?.configured())this.mail.enqueue('account-expiring',u.email,'uk',{name:u.name,exportUntil:new Date(u.expires+EXPORT).toLocaleDateString('uk-UA'),deleteOn:new Date(u.expires+KEEP).toLocaleDateString('uk-UA')},{dedupe:`expiring:${u.id}:${u.expires}`,userId:u.id,expires:now+3*DAY});
  }
  if(deleted)this.store.event('account.retention.deleted',null,null,'',String(deleted));
  this.remind(now);
  return deleted;
 }
 // Before access ends the owner hears 7, 3 and 1 day ahead; on the day it ends, a letter says the data is safe and how to continue.
 remind(now=Date.now()){
  if(!this.mail?.configured())return;
  const kyiv=(ms)=>new Date(ms).toLocaleString('uk-UA',{timeZone:'Europe/Kyiv',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});
  const owners=this.db.prepare("SELECT * FROM users WHERE account_id IS NULL AND stage IN ('trial','active') AND expires<253402300799000 AND expires>? AND expires<?").all(now-2*DAY,now+7*DAY+3600000);
  for(const u of owners){
   const left=u.expires-now,business=this.db.prepare('SELECT name FROM businesses WHERE account_id=? ORDER BY rowid LIMIT 1').get(u.id)?.name||u.business;
   if(left<=0){this.mail.enqueue('trial-ended',u.email,'uk',{name:u.name,business,until:kyiv(u.expires)},{dedupe:`ended:${u.id}:${u.expires}`,userId:u.id,expires:now+2*DAY});continue;}
   const days=[1,3,7].find((d)=>left<=d*DAY);
   if(days)this.mail.enqueue('trial-ending',u.email,'uk',{name:u.name,business,days,stage:u.stage,until:kyiv(u.expires)},{dedupe:`ending:${u.id}:${u.expires}:${days}`,userId:u.id,expires:now+DAY});
  }
 }
}
module.exports={Retention};
