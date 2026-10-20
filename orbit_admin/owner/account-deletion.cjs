const crypto=require('node:crypto');
// Permanent account deletion (App Store 5.1.1(v), Google Play account deletion, GDPR art. 17).
// Deleting an account owner removes the owner, every team member of the account, every company
// with its CRM database, vault, bot and update backups. Deleting a team member removes only that
// person; the company data stays with the owner. Nothing that identifies the person stays behind:
// email, devices and the free-trial marker are erased too, so the same email or computer can
// register again. Only anonymous purchase references remain for accounting.
class AccountDeletion{
 constructor({store,accounts,fail}){Object.assign(this,{store,db:store.db,accounts,fail});}
 plan(userId){
  const user=this.db.prepare('SELECT * FROM users WHERE id=?').get(userId);if(!user)this.fail(404,'Користувача не знайдено / User not found');
  const owner=!user.account_id,users=owner?[user,...this.db.prepare('SELECT * FROM users WHERE account_id=?').all(user.id)]:[user];
  const businesses=owner?this.db.prepare('SELECT * FROM businesses WHERE account_id=?').all(user.id):[];
  return{user,owner,users,businesses};
 }
 delete(userId){
  const{user,owner,users,businesses}=this.plan(userId),ids=users.map(u=>u.id),emails=users.map(u=>u.email.toLowerCase());
  for(const b of businesses){const runtime=this.accounts.businesses.instances.get(b.id);if(runtime?.telegram.busy||this.accounts.botWorkers?.work.has(b.id))this.fail(409,'Бот компанії зараз працює, спробуйте за хвилину / Company bot is busy, try again in a minute');}
  const each=(sql,values)=>{const statement=this.db.prepare(sql);for(const v of values)statement.run(v);};
  // Tables left by the archived desktop app exist only in databases created before the web version.
  const legacy=table=>Boolean(this.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table));
  this.store.transaction(()=>{
   for(const b of businesses){for(const table of ['web_requests','bot_workers','bot_messages','bot_updates',...(legacy('update_backups')?['update_backups']:[]),'memberships'])this.db.prepare(`DELETE FROM ${table} WHERE business_id=?`).run(b.id);}
   each('DELETE FROM sessions WHERE user_id=?',ids);
   each('DELETE FROM login_challenges WHERE user_id=?',ids);
   const devices=ids.flatMap(id=>this.db.prepare('SELECT id FROM devices WHERE user_id=?').all(id).map(d=>d.id));
   each('DELETE FROM trial_consumptions WHERE device=?',devices);
   each('DELETE FROM trial_consumptions WHERE email_hash=?',emails.map(e=>crypto.createHash('sha256').update(e).digest('hex')));
   each('DELETE FROM sessions WHERE device_id IN(SELECT id FROM devices WHERE user_id=?)',ids);
   if(legacy('device_builds'))each('DELETE FROM device_builds WHERE device_id IN(SELECT id FROM devices WHERE user_id=?)',ids);
   each('DELETE FROM devices WHERE user_id=?',ids);
   each('DELETE FROM challenges WHERE invite_id IN(SELECT id FROM invites WHERE user_id=?)',ids);
   each('DELETE FROM invites WHERE user_id=?',ids);
   each('DELETE FROM memberships WHERE user_id=?',ids);
   each('DELETE FROM events WHERE user_id=?',ids);
   if(legacy('update_policies'))each('DELETE FROM update_policies WHERE scope=?',ids);
   if(legacy('update_backups'))each('DELETE FROM update_backups WHERE user_id=?',ids);
   each('DELETE FROM mail_outbox WHERE user_id=?',ids);
   each('DELETE FROM mail_outbox WHERE lower(recipient)=?',emails);
   each('DELETE FROM registration_pending WHERE lower(email)=?',emails);
   each('DELETE FROM site_leads WHERE lower(email)=?',emails);
   this.accounts.legal?.forget(ids,emails);
   if(this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='support_requests'").get()){
    const tickets=[...ids.flatMap(id=>this.db.prepare('SELECT id FROM support_requests WHERE user_id=?').all(id)),...emails.flatMap(e=>this.db.prepare('SELECT id FROM support_requests WHERE lower(email)=?').all(e))].map(r=>r.id);
    if(this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='support_messages'").get())each('DELETE FROM support_messages WHERE request_id=?',tickets);
    each('DELETE FROM support_requests WHERE id=?',tickets);
   }
   each("UPDATE purchases SET user_id='deleted' WHERE user_id=?",ids);
   // Booking page addresses become free again.
   if(this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='booking_pages'").get())each('DELETE FROM booking_pages WHERE business_id=?',businesses.map(b=>b.id));
   each('DELETE FROM businesses WHERE id=?',businesses.map(b=>b.id));
   // Team members first: they point to the owner through account_id.
   each('DELETE FROM users WHERE id=?',[...ids].reverse());
   this.store.event('account.deleted',null,null,'',owner?`owner:${users.length}:${businesses.length}`:'member');
  });
  for(const b of businesses)this.accounts.businesses.remove(b.id);
  return{deleted_users:ids.length,deleted_businesses:businesses.length,owner};
 }
}
module.exports={AccountDeletion};
