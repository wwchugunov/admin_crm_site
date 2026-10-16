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
  return deleted;
 }
}
module.exports={Retention};
