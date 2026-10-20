const crypto=require('node:crypto');
const i18n=require('../shared/i18n.js');
const fs=require('node:fs');
const path=require('node:path');
const {verifyRequest}=require('../core/request-proof.cjs');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
class BotWorkers{
 constructor({store,accounts,fail}){Object.assign(this,{store,db:store.db,accounts,fail});this.db.exec(`CREATE TABLE IF NOT EXISTS bot_workers(business_id TEXT PRIMARY KEY REFERENCES businesses(id),token_hash TEXT NOT NULL,public_key TEXT NOT NULL,username TEXT NOT NULL DEFAULT '',last_seen INTEGER NOT NULL DEFAULT 0,offset INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS bot_messages(id TEXT PRIMARY KEY,business_id TEXT NOT NULL REFERENCES businesses(id),method TEXT NOT NULL,payload TEXT NOT NULL,at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS bot_updates(id TEXT PRIMARY KEY,business_id TEXT NOT NULL REFERENCES businesses(id),at INTEGER NOT NULL);`);this.work=new Map();}
 status(business){const r=this.accounts.businesses.get(business),worker=this.db.prepare('SELECT * FROM bot_workers WHERE business_id=?').get(business.id);return worker?{hosting:'external',connected:worker.last_seen>Date.now()-90000,username:null,last_seen:worker.last_seen,state:worker.last_seen>Date.now()-90000?i18n.t('botExternalOnline'):i18n.t('botExternalWaiting')}:{hosting:'hosted',connected:r.vault.has('telegram'),username:r.store.get('bot_username'),state:r.telegram.state};}
 create(business,url){
  const origin=new URL(url);if(origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/'||!(origin.protocol==='https:'||(origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname))))this.fail(400,'Use a trusted HTTPS API origin');
  const runtime=this.accounts.businesses.get(business);
  if(runtime.telegram.busy||this.work.has(business.id))this.fail(409,'Бот зайнятий. Спробуйте за кілька секунд / Bot busy; try again');
  const pair=crypto.generateKeyPairSync('ed25519'),token=crypto.randomBytes(32).toString('base64url');
  this.store.transaction(()=>{this.db.prepare('DELETE FROM bot_messages WHERE business_id=?').run(business.id);this.db.prepare('INSERT INTO bot_workers(business_id,token_hash,public_key) VALUES(?,?,?) ON CONFLICT(business_id) DO UPDATE SET token_hash=excluded.token_hash,public_key=excluded.public_key,last_seen=0').run(business.id,hash(token),pair.publicKey.export({type:'spki',format:'pem'}));runtime.vault.remove('telegram');runtime.store.set('bot_hosting','external');this.store.event('bot.external.prepared',business.account_id,null,'',business.id);});
  return {config:{api:url,business_id:business.id,token,private_key:pair.privateKey.export({type:'pkcs8',format:'pem'})},worker:fs.readFileSync(path.join(__dirname,'../worker/telegram-worker.cjs'),'utf8')};
 }
 // Outgoing message for a self-hosted bot; the worker delivers it on its next poll.
 queue(businessId,method,payload){if(this.db.prepare('SELECT count(*) n FROM bot_messages WHERE business_id=?').get(businessId).n>=1000)this.fail(429,'Bot delivery queue full');this.db.prepare('INSERT INTO bot_messages VALUES(?,?,?,?,?)').run(crypto.randomUUID(),businessId,method,JSON.stringify(payload),Date.now());}
 detach(business){if(this.work.has(business.id))this.fail(409,'External bot request is running; try again');this.db.prepare('DELETE FROM bot_messages WHERE business_id=?').run(business.id);this.db.prepare('DELETE FROM bot_workers WHERE business_id=?').run(business.id);this.accounts.businesses.get(business).store.set('bot_hosting','hosted');}
 async handle(req,url,reply){
  if(!url.pathname.startsWith('/v1/bot/'))return false;
  if(req.method!=='POST'||!['/v1/bot/updates','/v1/bot/poll'].includes(url.pathname))this.fail(404,'Not found');
  const business=this.db.prepare('SELECT * FROM businesses WHERE id=?').get(url.searchParams.get('business_id'));
  if(!business)this.fail(401,'Invalid worker');
  const worker=this.db.prepare('SELECT * FROM bot_workers WHERE business_id=?').get(business.id),token=(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!worker||token.length>200||!crypto.timingSafeEqual(Buffer.from(hash(token)),Buffer.from(worker.token_hash)))this.fail(401,'Invalid worker');
  this.accounts.allowed(this.db.prepare('SELECT * FROM users WHERE id=?').get(business.account_id));
  verifyRequest(req,req.rawBody,token,worker.public_key,this.db);
  if(this.work.has(business.id))this.fail(409,'Worker request already in progress');
  const work=this.process(req,business,worker,url);this.work.set(business.id,work);
  try{reply(200,await work);}finally{this.work.delete(business.id);}return true;
 }
 async process(req,business,worker,url){
  const data=req.parsedBody||{},runtime=this.accounts.businesses.get(business),telegram=runtime.telegram;
  if(data.ack!==undefined&&(!Array.isArray(data.ack)||data.ack.length>100))this.fail(400,'Invalid acknowledgements');
  const updates=data.updates||[];if(!Array.isArray(updates)||updates.length>20)this.fail(400,'Invalid updates');
  if(data.username!==undefined&&!/^[A-Za-z0-9_]{5,64}$/.test(data.username))this.fail(400,'Invalid bot username');
  for(const id of data.ack||[]){if(typeof id!=='string')this.fail(400,'Invalid acknowledgement');this.db.prepare('DELETE FROM bot_messages WHERE id=? AND business_id=?').run(id,business.id);}
  const original=telegram.call;
  telegram.call=async(method,payload)=>{if(!['sendMessage','answerCallbackQuery','setMyCommands'].includes(method))throw Error('Unsupported worker operation');const count=this.db.prepare('SELECT count(*) n FROM bot_messages WHERE business_id=?').get(business.id).n;if(count>=1000)throw Error('Bot delivery queue full');this.db.prepare('INSERT INTO bot_messages VALUES(?,?,?,?,?)').run(crypto.randomUUID(),business.id,method,JSON.stringify(payload),Date.now());return true;};
  let offset=worker.offset;
  try{
   for(const update of updates){if(!Number.isSafeInteger(update.update_id)||update.update_id<0)this.fail(400,'Invalid update id');const id=business.id+':'+update.update_id;if(this.db.prepare('SELECT id FROM bot_updates WHERE id=?').get(id))continue;this.db.prepare('INSERT INTO bot_updates VALUES(?,?,?)').run(id,business.id,Date.now());offset=Math.max(offset,update.update_id+1);await telegram.handle(update);}
   await telegram.reminders();
  }finally{telegram.call=original;}
  if(data.username)runtime.store.set('bot_username',data.username);
  this.db.prepare('UPDATE bot_workers SET last_seen=?,offset=?,username=CASE WHEN ? IS NULL THEN username ELSE ? END WHERE business_id=?').run(Date.now(),offset,data.username||null,data.username||null,business.id);
  return{offset,messages:this.db.prepare('SELECT id,method,payload FROM bot_messages WHERE business_id=? ORDER BY at LIMIT 50').all(business.id).map(r=>({...r,payload:JSON.parse(r.payload)}))};
 }
}
module.exports={BotWorkers};
