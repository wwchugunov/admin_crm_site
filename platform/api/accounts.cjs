const OrbitI18n = require('../shared/i18n.js');
const crypto=require('node:crypto');
const {verifyRequest}=require('../core/request-proof.cjs');
const {Businesses}=require('./businesses.cjs');
const {WebsiteBooking}=require('./website-booking.cjs');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function passwordHash(password){if(typeof password!=='string'||password.length<12||password.length>128)throw Object.assign(Error(OrbitI18n.t('m639')),{status:400});const salt=crypto.randomBytes(16);return `${salt.toString('base64url')}.${crypto.scryptSync(password,salt,32).toString('base64url')}`;}
function passwordValid(password,stored){if(typeof password!=='string'||password.length>128||!stored)return false;try{const[salt,value]=stored.split('.');const expected=Buffer.from(value,'base64url'),actual=crypto.scryptSync(password,Buffer.from(salt,'base64url'),32);return expected.length===actual.length&&crypto.timingSafeEqual(actual,expected);}catch{return false;}}
const FINANCE={
 '/v1/crm/expense':(store,d)=>store.addExpense(d),'/v1/crm/expense/delete':(store,d)=>store.deleteExpense(d),
 '/v1/crm/material':(store,d)=>store.addMaterial(d),'/v1/crm/material/update':(store,d)=>store.updateMaterial(d),'/v1/crm/material/delete':(store,d)=>store.deleteMaterial(d),'/v1/crm/material/move':(store,d)=>store.materialMove(d),
 '/v1/crm/certificate':(store,d)=>store.sellCertificate(d),'/v1/crm/certificate/void':(store,d)=>store.voidCertificate(d),
 '/v1/crm/pass':(store,d)=>store.sellPass(d),'/v1/crm/pass/void':(store,d)=>store.voidPass(d),
 '/v1/crm/payroll':(store,d)=>d.month?store.payroll(...store.monthRange(d.month)):store.payroll(d.from,d.to),
};
class Accounts {
  constructor({store,directory,body,fail,string,telegramFactory}){
    Object.assign(this,{store,db:store.db,body,fail,string});this.businesses=new Businesses(directory,{telegramFactory});this.failures=new Map();this.websiteBooking=new WebsiteBooking(this);
    for(const[column,definition]of[['password_hash',"TEXT NOT NULL DEFAULT ''"],['account_id','TEXT REFERENCES users(id)']])if(!this.db.prepare('PRAGMA table_info(users)').all().some(c=>c.name===column))this.db.exec(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
    this.db.exec(`CREATE TABLE IF NOT EXISTS businesses(id TEXT PRIMARY KEY,name TEXT NOT NULL,account_id TEXT NOT NULL REFERENCES users(id));
      CREATE TABLE IF NOT EXISTS memberships(user_id TEXT NOT NULL REFERENCES users(id),business_id TEXT NOT NULL REFERENCES businesses(id),role TEXT NOT NULL CHECK(role IN ('owner','admin','staff')),PRIMARY KEY(user_id,business_id));
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),device_id TEXT NOT NULL REFERENCES devices(id),expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS login_challenges(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),public_key TEXT NOT NULL,nonce TEXT NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS web_requests(id TEXT PRIMARY KEY,business_id TEXT NOT NULL REFERENCES businesses(id),appointment_id TEXT NOT NULL,at INTEGER NOT NULL);`);
    for(const u of this.db.prepare('SELECT * FROM users WHERE account_id IS NULL').all())if(!this.db.prepare('SELECT * FROM memberships WHERE user_id=?').get(u.id))this.addBusiness(u.id,u.business);
    for(const b of this.db.prepare('SELECT * FROM businesses').all())this.businesses.get(b);
  }
  account(user){if(!user)return null;return user.account_id?this.db.prepare('SELECT * FROM users WHERE id=?').get(user.account_id):user;}
  // After access ends the owner can still sign in, view and export data for 30 days (offer, p. 5.2).
  readable(user){const a=this.account(user);if(!a||!['trial','active'].includes(a.stage)||user?.stage==='blocked'||a.expires+30*86400000<=Date.now())this.fail(403,OrbitI18n.t('m682'));return a;}
  // A phone typed by staff must look like a phone, and one number belongs to one client card.
  clientPhone(store,data){const phone=String(data?.phone||'').trim();if(!phone)return data;const digits=phone.replace(/\D/g,'');if(!/^\+?[\d\s()-]+$/.test(phone)||digits.length<7||digits.length>15)this.fail(400,'Перевірте номер телефону, наприклад +380 67 123 45 67 / Check the phone number');const same=store.db.prepare('SELECT id,name,phone FROM clients WHERE id<>?').all(String(data.id||'')).find(c=>c.phone&&c.phone.replace(/\D/g,'').slice(-9)===digits.slice(-9));if(same)this.fail(409,`Цей телефон уже є в картці «${same.name}» / This phone already belongs to ${same.name}`);return data;}
  allowed(user){const a=this.account(user);if(!a||!['trial','active'].includes(a.stage)||user?.stage==='blocked'||a.expires<=Date.now())this.fail(403,OrbitI18n.t('m640'));return a;}
  setPassword(userId,password){const encoded=passwordHash(password);if(!this.db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(encoded,userId).changes)this.fail(404,OrbitI18n.t('m641'));this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);this.store.event('password.changed',userId);}
  addBusiness(userId,name){const user=this.db.prepare('SELECT * FROM users WHERE id=?').get(userId);if(!user)this.fail(404,OrbitI18n.t('m641'));const account=this.account(user),id=crypto.randomUUID();this.db.prepare('INSERT INTO businesses VALUES(?,?,?)').run(id,this.string(name,120),account.id);this.db.prepare("INSERT INTO memberships VALUES(?,?,'owner')").run(userId,id);this.store.event('business.created',userId,null,'',name);return id;}
  memberships(userId){return this.db.prepare('SELECT b.id,b.name,m.role FROM memberships m JOIN businesses b ON b.id=m.business_id WHERE m.user_id=? ORDER BY b.name').all(userId);}
  session(req,{anyStage=false}={}){const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(token.length>200)this.fail(401,OrbitI18n.t('m567'));const session=this.db.prepare('SELECT s.*,d.revoked FROM sessions s JOIN devices d ON d.id=s.device_id WHERE s.token_hash=?').get(hash(token));if(!session||session.expires<=Date.now()||session.revoked)this.fail(401,OrbitI18n.t('m642'));const user=this.db.prepare('SELECT * FROM users WHERE id=?').get(session.user_id);if(!anyStage)this.allowed(user);const device=this.db.prepare('SELECT * FROM devices WHERE id=?').get(session.device_id);verifyRequest(req,req.rawBody,token,device.public_key,this.db);if(Date.now()-device.last_seen>600000)this.db.prepare('UPDATE devices SET last_seen=? WHERE id=?').run(Date.now(),device.id);return{user,session,device};}
  tenant(req,url,roles,read=false){const auth=this.session(req,{anyStage:read});if(read)this.readable(auth.user);const businessId=url.searchParams.get('business_id');const membership=this.db.prepare('SELECT b.*,m.role FROM memberships m JOIN businesses b ON b.id=m.business_id WHERE m.user_id=? AND b.id=?').get(auth.user.id,businessId);if(!membership)this.fail(403,OrbitI18n.t('m643'));if(roles&&!roles.includes(membership.role))this.fail(403,OrbitI18n.t('m106'));return{...auth,business:membership,runtime:this.businesses.get(membership)};}
  // Address the request came to, for links when no public address is configured (local runs).
  origin(req){const host=String(req.headers.host||'');return /^[a-z0-9.:\[\]-]{1,200}$/i.test(host)?'http://'+host:'';}
  async handle(req,res,url,reply){const route=url.pathname;
    if(req.method==='POST'&&route==='/v1/auth/challenge'){
      const data=await this.body(req),login=this.string(data.login,254).toLowerCase(),key=hash(`${(req.clientAddress || req.socket.remoteAddress)}:${login}`),attempt=this.failures.get(key)||{count:0,at:Date.now()};if(Date.now()-attempt.at>900000){attempt.count=0;attempt.at=Date.now();}if(attempt.count>=5)this.fail(429,OrbitI18n.t('m644'));
      const user=this.db.prepare('SELECT * FROM users WHERE email=?').get(login);if(!user||!passwordValid(data.password,user.password_hash)){attempt.count++;this.failures.set(key,attempt);this.fail(401,OrbitI18n.t('m645'));}this.readable(user);this.failures.delete(key);
      let publicKey;try{publicKey=crypto.createPublicKey(this.string(data.public_key,1000));}catch{this.fail(400,OrbitI18n.t('m646'));}if(publicKey.asymmetricKeyType!=='ed25519')this.fail(400,OrbitI18n.t('m647'));const id=crypto.randomUUID(),nonce=crypto.randomBytes(32).toString('base64url');this.db.prepare('INSERT INTO login_challenges VALUES(?,?,?,?,?)').run(id,user.id,publicKey.export({type:'spki',format:'pem'}),nonce,Date.now()+300000);reply(200,{challenge_id:id,nonce});return true;
    }
    if(req.method==='POST'&&route==='/v1/auth/login'){
      const data=await this.body(req),challenge=this.db.prepare('SELECT * FROM login_challenges WHERE id=?').get(this.string(data.challenge_id,64));if(!challenge||challenge.expires<=Date.now())this.fail(401,OrbitI18n.t('m648'));const proof=Buffer.from(JSON.stringify({challenge_id:challenge.id,nonce:challenge.nonce}));if(typeof data.signature!=='string'||data.signature.length>150||!crypto.verify(null,proof,challenge.public_key,Buffer.from(data.signature,'base64url')))this.fail(401,OrbitI18n.t('m649'));
      const user=this.db.prepare('SELECT * FROM users WHERE id=?').get(challenge.user_id),account=this.readable(user),device=hash(crypto.createPublicKey(challenge.public_key).export({type:'spki',format:'der'})),token=crypto.randomBytes(32).toString('base64url'),platform=this.string(data.platform,30),buildVersion=String(data.version||'web').slice(0,30);
      this.store.transaction(()=>{const existing=this.db.prepare('SELECT * FROM devices WHERE id=?').get(device);if(existing&&existing.user_id!==user.id)this.fail(403,OrbitI18n.t('m650'));let seats=this.db.prepare('SELECT count(*) n FROM devices d JOIN users u ON u.id=d.user_id WHERE COALESCE(u.account_id,u.id)=? AND d.revoked=0').get(account.id).n;
      // A browser is cheap to lose (private window, cleared cookies): its seat goes to the person's newest browser.
      // Someone with no browser yet takes the oldest browser of whoever holds the most, so one person's
      // many windows never lock a colleague out and everyone keeps at least one.
      if((!existing||existing.revoked)&&seats>=account.max_devices&&platform==='web'){const old=this.db.prepare("SELECT id FROM devices WHERE user_id=? AND platform='web' AND revoked=0 ORDER BY last_seen LIMIT 1").get(user.id)||this.db.prepare("SELECT d.id FROM devices d JOIN users u ON u.id=d.user_id WHERE COALESCE(u.account_id,u.id)=? AND d.platform='web' AND d.revoked=0 AND d.user_id=(SELECT d2.user_id FROM devices d2 JOIN users u2 ON u2.id=d2.user_id WHERE COALESCE(u2.account_id,u2.id)=? AND d2.platform='web' AND d2.revoked=0 GROUP BY d2.user_id HAVING count(*)>1 ORDER BY count(*) DESC LIMIT 1) ORDER BY d.last_seen LIMIT 1").get(account.id,account.id);if(old){this.db.prepare('UPDATE devices SET revoked=1 WHERE id=?').run(old.id);this.db.prepare('DELETE FROM sessions WHERE device_id=?').run(old.id);this.store.event('device.replaced',user.id,old.id,platform);seats--;}}
      if((!existing||existing.revoked)&&seats>=account.max_devices)this.fail(403,OrbitI18n.t('m651'));
      // A revoked device is signed out at once; signing in again with the current password takes a free seat back.
      if(existing?.revoked){this.db.prepare('UPDATE devices SET revoked=0 WHERE id=?').run(device);this.store.event('device.reactivated',user.id,device,platform,buildVersion);}if(!existing){this.db.prepare('INSERT INTO devices VALUES(?,?,?,?,?,?,?,0)').run(device,user.id,challenge.public_key,platform,buildVersion,Date.now(),Date.now());this.store.event('device.activated',user.id,device,platform,buildVersion);}else this.db.prepare('UPDATE devices SET last_seen=?,version=?,platform=? WHERE id=?').run(Date.now(),buildVersion,platform,device);this.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hash(token),user.id,device,Date.now()+7*86400000);this.db.prepare('DELETE FROM login_challenges WHERE id=?').run(challenge.id);this.store.event('user.login',user.id,device,platform);});
      reply(200,{session:token,user:{id:user.id,name:user.name,email:user.email},device_id:device,businesses:this.memberships(user.id)});return true;
    }
    if(route==='/v1/auth/logout'&&req.method==='POST'){const{session}=this.session(req);this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);reply(200,{ok:true});return true;}
    // Self-service deletion from the app: a signed session plus the current password.
    if(route==='/v1/account/delete'&&req.method==='POST'){const{user}=this.session(req,{anyStage:true}),data=await this.body(req),key=hash('delete:'+user.id),attempt=this.failures.get(key)||{count:0,at:Date.now()};if(attempt.count>=5)this.fail(429,OrbitI18n.t('m644'));if(!passwordValid(data.password,user.password_hash)){attempt.count++;this.failures.set(key,attempt);this.fail(403,'Невірний пароль / Wrong password');}this.failures.delete(key);reply(200,this.deletion.delete(user.id));return true;}
    if(route==='/v1/auth/me'&&req.method==='GET'){const{user}=this.session(req);reply(200,{user:{id:user.id,name:user.name,email:user.email},businesses:this.memberships(user.id)});return true;}
    if(route.startsWith('/v1/crm/')){
      const viewOnly=['/v1/crm/snapshot','/v1/crm/book','/v1/crm/client','/v1/crm/status','/v1/crm/reschedule','/v1/crm/waitlist','/v1/crm/waitlist/remove'].includes(route),ctx=this.tenant(req,url,viewOnly?null:['owner','admin'],req.method==='GET'&&['/v1/crm/snapshot','/v1/crm/export'].includes(route)),{store,vault,telegram}=ctx.runtime;
      if(req.method==='GET'&&route==='/v1/crm/snapshot'){const known=url.searchParams.get('revision'),snapshot=store.snapshot(url.searchParams.get('window')!=='1'?{all:true}:known?{revision:known,from:Number(url.searchParams.get('from'))}:{});if(ctx.business.role==='staff'&&!snapshot.unchanged){for(const c of snapshot.clients){c.stats.paid=0;c.stats.due=0;}snapshot.payments=[];snapshot.payment_links=[];for(const a of snapshot.appointments){a.cost=0;a.paid=0;}this.hideMoney(snapshot);}reply(200,{...snapshot,business_id:ctx.business.id,role:ctx.business.role,account:{id:ctx.user.id,name:ctx.user.name},subscription:(a=>a?{stage:a.stage,expires:a.expires>=253402300799000?null:a.expires}:null)(this.account(ctx.user)),businesses:this.memberships(ctx.user.id),integrations:{telegram:this.botWorkers?this.botWorkers.status(ctx.business):{connected:vault.has('telegram'),username:store.get('bot_username'),state:telegram.state},monobank:this.monobank?this.monobank.status(ctx.runtime):{connected:false},lapsed:this.lapsed?this.lapsed.settings(store):null,fiscal:this.fiscal?this.fiscal.status(ctx.runtime):{connected:false},liqpay:this.liqpay?this.liqpay.status(ctx.runtime):{connected:false},booking:this.bookingPage?this.bookingPage.status(ctx.business,ctx.runtime,this.origin(req)):null,notifications:this.notify&&ctx.business.role!=='staff'?this.notify.status(ctx.business,ctx.user):null,website:{enabled:Boolean(store.get('website_enabled')),path:`/v1/website/${ctx.business.id}`}}});return true;}
      if(req.method==='GET'&&route==='/v1/crm/export'){reply(200,store.export());return true;}
      if(req.method==='GET'&&route==='/v1/crm/users'){reply(200,this.db.prepare('SELECT u.id,u.name,u.email,u.stage,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.business_id=?').all(ctx.business.id));return true;}
      if(req.method!=='POST')this.fail(404,OrbitI18n.t('m652'));const data=await this.body(req);let value;
      if(route==='/v1/crm/client')value=store.addClient(this.clientPhone(store,data));
      else if(route==='/v1/crm/book'){if(ctx.business.role==='staff'){delete data.total;delete data.cost;}value=store.book(data);}
      else if(route==='/v1/crm/status'){value=store.status(data.id,data.status);this.monobank?.reconcile(ctx.runtime,data.id).catch(()=>{});this.liqpay?.reconcile(ctx.runtime,data.id).catch(()=>{});}
      else if(route==='/v1/crm/reschedule')value=store.reschedule(data);
      else if(route==='/v1/crm/waitlist')value=store.addWait({...data,source:'app'});
      else if(route==='/v1/crm/waitlist/remove')value=store.removeWait(data);
      else if(route==='/v1/crm/lapsed/days')value=store.setLapsedDays(data.days);
      // "We haven't seen you for a while": a message from the company bot with a booking button.
      else if(route==='/v1/crm/lapsed/invite')value=await this.lapsed.invite(ctx.business,ctx.runtime,data);
      else if(route==='/v1/crm/lapsed/invite-all')value=await this.lapsed.inviteAll(ctx.business,ctx.runtime,data);
      else if(route==='/v1/crm/lapsed/settings')value=this.lapsed.save(store,data);
      else if(route==='/v1/crm/service/delete')value=store.deleteService(data);
      else if(route==='/v1/crm/resource/delete')value=store.deleteResource(data);
      else if(route==='/v1/crm/service')value=store.addService(data);
      else if(route==='/v1/crm/service/update')value=store.updateService(data);
      else if(route==='/v1/crm/resource')value=store.addResource(data);
      else if(route==='/v1/crm/resource/update')value=store.updateResource(data);
      else if(route==='/v1/crm/absence')value=store.addAbsence(data);
      else if(route==='/v1/crm/absence/delete')value=store.deleteAbsence(data);
      else if(route==='/v1/crm/client/update')value=store.updateClient(this.clientPhone(store,data));
      else if(route==='/v1/crm/client/delete')value=store.deleteClient(data);
      else if(route==='/v1/crm/visit/update'){value=store.updateVisit(data);this.monobank?.reconcile(ctx.runtime,data.id).catch(()=>{});this.liqpay?.reconcile(ctx.runtime,data.id).catch(()=>{});}
      else if(route==='/v1/crm/payment'){value=store.payment(data);this.fiscal?.queuePayment(ctx.business,ctx.runtime,value);this.monobank?.reconcile(ctx.runtime,data.appointment_id).catch(()=>{});this.liqpay?.reconcile(ctx.runtime,data.appointment_id).catch(()=>{});}
      else if(route==='/v1/crm/profile'){store.saveProfile(data);this.db.prepare('UPDATE businesses SET name=? WHERE id=?').run(store.get('business'),ctx.business.id);}
      else if(route==='/v1/crm/liqpay/connect'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m656'));value=await this.liqpay.connect(ctx.runtime,data);}
      else if(route==='/v1/crm/liqpay/disconnect'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m656'));this.liqpay.disconnect(ctx.runtime);}
      else if(route==='/v1/crm/liqpay/invoice')value=await this.liqpay.invoice(ctx.business,ctx.runtime,data);
      // Older months and a client's full history, loaded only when the owner opens them.
      else if(route==='/v1/crm/range'){value=store.range(data.from,data.to);if(ctx.business.role==='staff'){value.payments=[];for(const a of value.appointments){a.cost=0;a.paid=0;}this.hideMoney(value);}}
      // Expenses, stock, certificates, passes and pay: owners and administrators only.
      else if(FINANCE[route]){value=FINANCE[route](store,data);if(route==='/v1/crm/certificate')this.fiscal?.queueSale(ctx.business,ctx.runtime,'certificate',value.id);if(route==='/v1/crm/pass')this.fiscal?.queueSale(ctx.business,ctx.runtime,'pass',value);}
      // Fiscal receipts: only the owner connects or disconnects the provider and accepts responsibility.
      else if(route==='/v1/crm/fiscal/connect'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m656'));value=await this.fiscal.connect(ctx.runtime,ctx.user,data);}
      else if(route==='/v1/crm/fiscal/disconnect'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m656'));await this.fiscal.disconnect(ctx.runtime);}
      else if(route==='/v1/crm/fiscal/settings'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m656'));value=this.fiscal.configure(ctx.runtime,data);}
      else if(route==='/v1/crm/fiscal/retry')value=this.fiscal.retry(ctx.business,ctx.runtime,data);
      else if(route==='/v1/crm/client/history'){value=store.clientHistory(data.id);if(ctx.business.role==='staff')for(const a of value){a.cost=0;a.paid=0;}}
      // Team notifications: each owner/administrator links their own Telegram and picks what to receive.
      else if(route==='/v1/crm/notify/link')value=this.notify.link(ctx.business,ctx.user);
      else if(route==='/v1/crm/notify/unlink')value=this.notify.unlink(ctx.business,ctx.user);
      else if(route==='/v1/crm/notify/save')value=this.notify.save(ctx.business,ctx.user,data);
      else if(route==='/v1/crm/notify/test')value=await this.notify.test(ctx.business,ctx.user);
      else if(route==='/v1/crm/booking/save'){if(ctx.business.role==='staff')this.fail(403,OrbitI18n.t('m656'));value=this.bookingPage.save(ctx.business,ctx.runtime,data,this.origin(req));}
      else if(route==='/v1/crm/liqpay/cancel')value=await this.liqpay.cancel(ctx.runtime,data);
      else if(route==='/v1/crm/monobank/connect'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m656'));value=await this.monobank.connect(ctx.runtime,data.token);}
      else if(route==='/v1/crm/monobank/disconnect'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m656'));this.monobank.disconnect(ctx.runtime);}
      else if(route==='/v1/crm/monobank/invoice')value=await this.monobank.invoice(ctx.business,ctx.runtime,data);
      else if(route==='/v1/crm/monobank/cancel')value=await this.monobank.cancel(ctx.runtime,data);
      else if(route==='/v1/crm/telegram/external'){value=this.botWorkers.create(ctx.business,data.api_url);}
      else if(route==='/v1/crm/telegram/connect'){const me=await telegram.call('getMe',{},data.token);for(const[id,r]of this.businesses.instances)if(id!==ctx.business.id&&r.store.get('bot_username')===me.username&&r.vault.has('telegram'))this.fail(409,OrbitI18n.t('m653'));value=await telegram.connect(data.token);this.botWorkers?.detach(ctx.business);}
      else if(route==='/v1/crm/telegram/disconnect'){if(telegram.busy)this.fail(409,OrbitI18n.t('m654'));this.botWorkers?.detach(ctx.business);vault.remove('telegram');store.set('bot_username',null);}
      else if(route==='/v1/crm/telegram/check'&&this.botWorkers?.status(ctx.business).hosting==='external'){value=this.botWorkers.status(ctx.business);}
      else if(route==='/v1/crm/telegram/check'){const me=await telegram.call('getMe');value={username:me.username,ok:true};}
      else if(route==='/v1/crm/telegram/link'){const client=store.db.prepare('SELECT * FROM clients WHERE id=?').get(data.id);if(!client||client.chat_id||(!vault.has('telegram')&&this.botWorkers?.status(ctx.business).hosting!=='external'))this.fail(400,OrbitI18n.t('m655'));const token=crypto.randomBytes(24).toString('base64url');store.db.prepare('UPDATE clients SET link_code=? WHERE id=?').run(token,client.id);value=`https://t.me/${store.get('bot_username')}?start=${token}`;}
      else if(route==='/v1/crm/users/add'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m656'));if(!['admin','staff'].includes(data.role))this.fail(400,OrbitI18n.t('m657'));const email=this.string(data.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))this.fail(400,OrbitI18n.t('m658'));if(this.db.prepare('SELECT id FROM users WHERE email=?').get(email))this.fail(409,'Цей email вже зареєстровано / Email already registered');const encoded=passwordHash(data.password),id=crypto.randomUUID(),account=this.account(ctx.user);this.store.transaction(()=>{this.db.prepare('INSERT INTO users(id,name,email,business,stage,created_at,expires,max_devices,password_hash,account_id) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,this.string(data.name,120),email,ctx.business.name,'active',Date.now(),account.expires,account.max_devices,encoded,account.id);this.db.prepare('INSERT INTO memberships VALUES(?,?,?)').run(id,ctx.business.id,data.role);this.store.event('user.created',id);});value=id;}
      else if(route==='/v1/crm/users/update'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m659'));if(data.id===ctx.user.id)this.fail(400,OrbitI18n.t('m660'));const member=this.db.prepare('SELECT u.* FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.business_id=? AND u.id=?').get(ctx.business.id,data.id);if(!member||this.account(member).id!==this.account(ctx.user).id)this.fail(403,OrbitI18n.t('m661'));if(!['admin','staff'].includes(data.role)||!['active','blocked'].includes(data.stage))this.fail(400,OrbitI18n.t('m662'));this.db.prepare('UPDATE memberships SET role=? WHERE business_id=? AND user_id=?').run(data.role,ctx.business.id,data.id);this.db.prepare('UPDATE users SET stage=? WHERE id=?').run(data.stage,data.id);if(data.password)this.setPassword(data.id,data.password);this.store.event('user.updated',data.id);}
      else if(route==='/v1/crm/business/add'){if(ctx.business.role!=='owner')this.fail(403,OrbitI18n.t('m663'));value=this.addBusiness(ctx.user.id,data.name);}
      else this.fail(404,OrbitI18n.t('m652'));reply(200,{value:value??null});return true;
    }
    if(await this.websiteBooking.handle(req,url,reply))return true;
    return false;
  }
  // Staff see the stock but not money: no expenses, voucher sales, purchase prices or anyone's pay.
  hideMoney(v){v.fiscal_receipts=[];v.expenses=[];v.certificates=[];v.passes=[];for(const m of v.materials||[])m.unit_cost=0;for(const r of v.resources||[]){r.pay_percent=0;r.pay_daily=0;}for(const s of v.services||[])s.pay_percent=null;}
  cleanup(){const now=Date.now();this.db.prepare('DELETE FROM login_challenges WHERE expires<?').run(now);this.db.prepare('DELETE FROM sessions WHERE expires<?').run(now);for(const[k,v]of this.failures)if(now-v.at>900000)this.failures.delete(k);}
  close(){this.businesses.close();}
}
module.exports={Accounts,passwordHash,passwordValid};
