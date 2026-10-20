const OrbitI18n = require('../shared/i18n.js');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {isIP}=require('node:net');
const { DatabaseSync } = require('node:sqlite');
const {AdminAuth,totp,base32}=require('./admin-auth.cjs');
const {PublicSite}=require('./public-site.cjs');
const {Mailer}=require('./mail.cjs');
const {Registration}=require('./registration.cjs');
const {PasswordReset}=require('./password-reset.cjs');
const {BotWorkers}=require('./bot-workers.cjs');
const { Accounts, passwordHash } = require('./accounts.cjs');
const {Documents,MAX_SIZE:DOCUMENT_MAX,unavailable}=require('./documents.cjs');
const {accountExpiry,PERPETUAL_EXPIRY}=require('./entitlements.cjs');
const {AccountDeletion}=require('./account-deletion.cjs');
const {Monobank}=require('./monobank.cjs');
const {Fiscal}=require('./fiscal.cjs');
const {Lapsed}=require('./lapsed.cjs');
const {Deposits}=require('./deposits.cjs');
const {LiqPay}=require('./liqpay.cjs');
const {BookingPage}=require('./booking-page.cjs');
const {Notify}=require('./notify.cjs');
const {Support}=require('./support.cjs');
const {Retention}=require('./retention.cjs');
const {Legal}=require('./legal.cjs');
const {AdminMembers}=require('./admin-members.cjs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const id = () => crypto.randomUUID();
function fail(status, message) { const error = Error(message); error.status = status; throw error; }
function string(value, max = 200) { if (typeof value !== 'string' || !value.trim() || value.length > max) fail(400, OrbitI18n.t('m533')); return value.trim(); }
function body(req) { if(req.parsedBody!==undefined)return Promise.resolve(req.parsedBody);return new Promise((resolve, reject) => { const chunks = []; let length = 0; req.on('data', c => { length += c.length; if (length > 4*1024*1024) { reject(Object.assign(Error(OrbitI18n.t('m670')), { status: 413 })); req.destroy(); } else chunks.push(c); }); req.on('end', () => { try { req.rawBody=Buffer.concat(chunks).toString();req.parsedBody=String(req.headers['content-type']||'').startsWith('application/x-www-form-urlencoded')?Object.fromEntries(new URLSearchParams(req.rawBody)):JSON.parse(req.rawBody||'{}');resolve(req.parsedBody); } catch { reject(Object.assign(Error(OrbitI18n.t('m671')), { status: 400 })); } }); req.on('error', reject); }); }
function setup(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const tokenPath = path.join(directory, 'admin.secret'), privatePath = path.join(directory, 'publisher-private.pem');
  if (!fs.existsSync(tokenPath)) fs.writeFileSync(tokenPath, crypto.randomBytes(32).toString('base64url'), { mode: 0o600 });
  if (!fs.existsSync(privatePath)) { const key = crypto.generateKeyPairSync('ed25519'); fs.writeFileSync(privatePath, key.privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 }); }
  const privateKey = fs.readFileSync(privatePath, 'utf8'), publicKey = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' });
  fs.writeFileSync(path.join(directory, 'publisher-public.pem'), publicKey);
  return { adminToken: fs.readFileSync(tokenPath, 'utf8').trim(), privateKey, publicKey };
}
class ProductStore {
  constructor(filename) {
    this.directory=filename===':memory:'?fs.mkdtempSync(path.join(require('node:os').tmpdir(),'orbit-owner-')):path.dirname(filename);
    this.db = new DatabaseSync(filename); this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL COLLATE NOCASE UNIQUE,business TEXT NOT NULL,stage TEXT NOT NULL,created_at INTEGER NOT NULL,expires INTEGER NOT NULL,max_devices INTEGER NOT NULL CHECK(max_devices BETWEEN 1 AND 100));
      CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),public_key TEXT NOT NULL,platform TEXT NOT NULL,version TEXT NOT NULL,activated_at INTEGER NOT NULL,last_seen INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS invites(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),token_hash TEXT NOT NULL UNIQUE,expires INTEGER NOT NULL,used_at INTEGER,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY,invite_id TEXT NOT NULL REFERENCES invites(id),public_key TEXT NOT NULL,nonce TEXT NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),device_id TEXT,event TEXT NOT NULL,platform TEXT NOT NULL DEFAULT '',at INTEGER NOT NULL,details TEXT NOT NULL DEFAULT '');
      CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS event_time ON events(at);
      CREATE INDEX IF NOT EXISTS user_devices ON devices(user_id);`);
  }
  transaction(fn) { const depth=this.transactionDepth||0,savepoint='owner_'+depth;this.db.exec(depth?'SAVEPOINT '+savepoint:'BEGIN IMMEDIATE');this.transactionDepth=depth+1;try{const value=fn();this.db.exec(depth?'RELEASE '+savepoint:'COMMIT');return value;}catch(e){this.db.exec(depth?'ROLLBACK TO '+savepoint:'ROLLBACK');if(depth)this.db.exec('RELEASE '+savepoint);throw e;}finally{this.transactionDepth=depth;} }
  event(event, user = null, device = null, platform = '', details = '') { const eventId = id(); this.db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?)').run(eventId, user, device, event, platform, Date.now(), details); return eventId; }
  addUser(data) {
    const email = string(data.email, 254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, OrbitI18n.t('m658'));
    if(this.db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'Цей email вже зареєстровано / Email already registered');
    const days = Number(data.days || 14), seats = Number(data.max_devices || 2);
    if (!Number.isInteger(days) || days < 1 || days > 3650 || !Number.isInteger(seats) || seats < 1 || seats > 100) fail(400, OrbitI18n.t('m672'));
    const userId = id(); this.transaction(() => { this.db.prepare('INSERT INTO users(id,name,email,business,stage,created_at,expires,max_devices,password_hash,account_id) VALUES(?,?,?,?,?,?,?,?,?,?)').run(userId, string(data.name, 120), email, string(data.business, 120), 'trial', Date.now(), Number.isSafeInteger(data.expires) && data.expires > Date.now() ? data.expires : Date.now() + days * 86400000, seats,data.password_hash||'',data.account_id||null); this.event('user.created', userId); }); return userId;
  }
  invite(userId) {
    if (!this.db.prepare('SELECT id FROM users WHERE id=?').get(userId)) fail(404, OrbitI18n.t('m641'));
    const token = crypto.randomBytes(32).toString('base64url'), invitation = id();
    this.db.prepare('INSERT INTO invites VALUES(?,?,?,?,NULL,?)').run(invitation, userId, hash(token), Date.now() + 86400000, Date.now()); this.event('invite.created', userId); return { token, expires: Date.now() + 86400000 };
  }
  findInvite(token, forActivation = false) {
    if (typeof token !== 'string' || token.length > 128) fail(401, OrbitI18n.t('m673'));
    const row = this.db.prepare('SELECT i.*,u.stage,u.expires user_expires,u.max_devices FROM invites i JOIN users u ON u.id=i.user_id WHERE token_hash=?').get(hash(token));
    if (!row || row.expires < Date.now() || !['trial','active'].includes(row.stage) || (forActivation && row.used_at)) fail(401, OrbitI18n.t('m674')); return row;
  }
  snapshot() {
    const users = this.db.prepare(`SELECT u.id,u.name,u.email,u.business,u.stage,u.created_at,u.expires,u.max_devices,u.account_id,(u.expires=?) perpetual,(SELECT count(*) FROM devices d WHERE d.user_id=u.id AND d.revoked=0) active_devices,(SELECT max(last_seen) FROM devices d WHERE d.user_id=u.id) last_seen,(SELECT count(*) FROM events e WHERE e.user_id=u.id AND e.event='download.completed') downloads FROM users u ORDER BY created_at DESC`).all(PERPETUAL_EXPIRY);
    return { users, businesses:this.db.prepare('SELECT b.*,u.name owner_name FROM businesses b JOIN users u ON u.id=b.account_id ORDER BY b.name').all(), devices: this.db.prepare('SELECT d.id,d.user_id,d.platform,d.version,d.activated_at,d.last_seen,d.revoked,u.name user_name,u.business FROM devices d JOIN users u ON u.id=d.user_id ORDER BY last_seen DESC').all(), events: this.db.prepare('SELECT e.*,u.name user_name,u.email FROM events e LEFT JOIN users u ON u.id=e.user_id ORDER BY at DESC LIMIT 500').all() };
  }
}
function createProductServer({ store, adminToken, privateKey, publicKey, businessDirectory=path.join(store.directory,'businesses'), telegramFactory,allowLocalAdmin=false,documentDirectory=path.join(store.directory,'documents'),mailTransportFactory,allowLocalMail=false,trustProxy=false }) {
  const rates = new Map();
  const administrator=new AdminAuth({directory:store.directory,token:adminToken,db:store.db,local:allowLocalAdmin});
  const members=new AdminMembers({db:store.db,mail:null,adminUrl:process.env.CH_PRODUCT_ADMIN_URL||(process.env.CH_APP_ADMIN_DOMAIN?'https://'+process.env.CH_APP_ADMIN_DOMAIN:''),totp,base32});administrator.members=members;
  const website=new PublicSite(store);
  const documents=new Documents(store,documentDirectory);website.documents=documents;
  const mail=new Mailer(store,{transportFactory:mailTransportFactory,allowLocalOrigins:allowLocalMail});website.mail=mail;members.mail=mail;
  const support=new Support({store,mail,fail});
  function admin(req){return administrator.verify(req);}
  const accounts=new Accounts({store,directory:businessDirectory,body,fail,string,telegramFactory});
  const registration=new Registration({store,accounts,mail,fail,string});
  const reset=new PasswordReset({store,mail,fail,string,key:registration.key});
  const botWorkers=new BotWorkers({store,accounts,fail});accounts.botWorkers=botWorkers;
  const deletion=new AccountDeletion({store,accounts,fail});accounts.deletion=deletion;
  const retention=new Retention({store,accounts,mail});
  const legal=new Legal({store,fail});accounts.legal=legal;registration.legal=legal;
  const monobank=new Monobank({db:store.db,accounts,fail,api:process.env.CH_MONOBANK_API,publicUrl:process.env.CH_API_URL||(process.env.CH_API_DOMAIN?'https://'+process.env.CH_API_DOMAIN:'')});accounts.monobank=monobank;
  const liqpay=new LiqPay({db:store.db,accounts,fail,api:process.env.CH_LIQPAY_API,sender:monobank,publicUrl:process.env.CH_API_URL||(process.env.CH_API_DOMAIN?'https://'+process.env.CH_API_DOMAIN:'')});accounts.liqpay=liqpay;
  // Fiscal receipts through Checkbox for companies that switched them on; failed ones are retried in the background.
  const fiscal=new Fiscal({accounts,fail,api:process.env.CH_CHECKBOX_API,vchasnoApi:process.env.CH_VCHASNO_API});accounts.fiscal=fiscal;
  const lapsed=new Lapsed({accounts,fail});accounts.lapsed=lapsed;
  const deposits=new Deposits({accounts});accounts.deposits=deposits;
  // Morning summaries, reports and instant news for the company team (Telegram and email).
  const notify=new Notify({db:store.db,accounts,mail,fail});accounts.notify=notify;
  // Booking pages live on the website domain (lomviko.com/b/<address>); the API domain serves them too.
  const bookingPage=new BookingPage({db:store.db,accounts,fail,booking:accounts.websiteBooking,publicUrl:process.env.CH_BOOKING_URL||(process.env.CH_WEBSITE_DOMAIN?'https://'+process.env.CH_WEBSITE_DOMAIN:(process.env.CH_API_URL||(process.env.CH_API_DOMAIN?'https://'+process.env.CH_API_DOMAIN:'')))});accounts.bookingPage=bookingPage;

  const server = http.createServer(async (req, res) => {
    const reply = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
    try {
      const forwarded=trustProxy&&typeof req.headers['x-forwarded-for']==='string'?req.headers['x-forwarded-for'].split(',').at(-1).trim():'';req.clientAddress=isIP(forwarded)?forwarded:req.socket.remoteAddress;
      const url = new URL(req.url, 'http://localhost'); const route = url.pathname;req.rawBody='';
      if(req.method==='PUT'&&route==='/admin/documents/file'){
        administrator.uploadSession(req);const size=Number(req.headers['content-length']);if(!Number.isSafeInteger(size)||size<1||size>DOCUMENT_MAX)fail(413,'Document must be at most 25 MiB');const temporary=documents.temporary(),digest=crypto.createHash('sha256');let fd=fs.openSync(temporary,'wx',0o600),received=0;
        try{for await(const chunk of req){received+=chunk.length;if(received>size)fail(413,'Invalid document size');digest.update(chunk);fs.writeFileSync(fd,chunk);}if(received!==size)fail(400,'Incomplete document');fs.fsyncSync(fd);fs.closeSync(fd);fd=null;const hex=digest.digest('hex');administrator.verifyUpload(req,hex);const p=url.searchParams;return reply(201,documents.add(temporary,{kind:p.get('kind'),language:p.get('language'),title:p.get('title'),filename:p.get('filename'),activate:p.get('activate')!=='0'},size,hex));}finally{if(fd!==null)fs.closeSync(fd);fs.rmSync(temporary,{force:true});}
      }
      if(['POST','PUT'].includes(req.method))await body(req);
      if (req.method === 'GET' && route === '/healthz') { store.db.prepare('SELECT 1').get(); return reply(200, { status: 'ok' }); }
      if(req.method==='POST'&&route==='/admin/session')return reply(200,administrator.login(req,req.parsedBody));
      // Invitation link for a new administrator: the single-use token is the credential.
      if(req.method==='POST'&&route==='/admin/invite/info')return reply(200,members.info(req.clientAddress||req.socket.remoteAddress,req.parsedBody));
      if(req.method==='POST'&&route==='/admin/invite/accept')return reply(200,members.accept(req.clientAddress||req.socket.remoteAddress,req.parsedBody));
      if (route.startsWith('/admin/')) {
        const session=admin(req);
        const inviter=()=>session?.name||administrator.account().login||'LOMVIKO';
        if(req.method==='POST'&&route==='/admin/account'){administrator.owner(session);return reply(200,administrator.setAccount(req.parsedBody));}
        if(req.method==='POST'&&route==='/admin/members/invite'){administrator.owner(session);return reply(201,members.invite(req.parsedBody,administrator.account().login,inviter()));}
        if(req.method==='POST'&&route==='/admin/members/resend'){administrator.owner(session);return reply(200,members.resend(req.parsedBody?.id,inviter()));}
        if(req.method==='POST'&&route==='/admin/support/stage')return reply(200,support.stage(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/support/status')return reply(200,support.status(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/support/reply')return reply(200,support.answer(req.parsedBody,req.parsedBody?.team||session?.name||'LOMVIKO'));
        if(req.method==='POST'&&route==='/admin/support/delete')return reply(200,support.remove(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/members/delete'){administrator.owner(session);members.remove(req.parsedBody?.id);administrator.endMember(req.parsedBody?.id);return reply(200,{ok:true});}
        if(req.method==='POST'&&route==='/admin/documents/activate')return reply(200,documents.activate(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/documents/delete')return reply(200,documents.delete(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/documents/switch')return reply(200,documents.setEnabled(req.parsedBody));
        if(req.method==='GET'&&route==='/admin/documents/file')return await documents.send(res,documents.owned({id:url.searchParams.get('id')||'',kind:url.searchParams.get('kind')||undefined}));
        if (req.method === 'GET' && route === '/admin/snapshot') return reply(200, {...store.snapshot(),adminAccount:administrator.account(),adminMembers:members.list(),supportRequests:support.list(),adminMe:{owner:!session?.member,name:session?.name||null},documents:documents.list(),documentsDisabled:documents.disabledKinds(),licenses:store.db.prepare(`SELECT d.id,d.user_id,d.platform,d.version,d.revoked,u.name,u.business,COALESCE(a.expires,u.expires) expires,COALESCE(a.stage,u.stage) stage FROM devices d JOIN users u ON u.id=d.user_id LEFT JOIN users a ON a.id=u.account_id`).all(),invites:store.db.prepare('SELECT id,user_id,expires,used_at,created_at FROM invites ORDER BY created_at DESC LIMIT 200').all(),website:website.admin(),security:website.security(),mail:mail.admin(),bots:store.db.prepare('SELECT * FROM businesses').all().map(b=>({business_id:b.id,business:b.name,...botWorkers.status(b)}))});
        if(req.method==='POST'&&route==='/admin/mail/settings')return reply(200,mail.save(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/mail/verify')return reply(200,await mail.verify());
        if(req.method==='POST'&&route==='/admin/mail/test'){const c=mail.settings();if(!mail.configured())fail(400,'Configure SMTP first');mail.enqueue('test',c.fromEmail,req.parsedBody.language||'uk',{});return reply(201,{queued:true});}
        if(req.method==='POST'&&route==='/admin/mail/retry')return reply(200,mail.retry(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/mail/access'){if(!mail.accessReady())fail(400,'Configure SMTP and public website/API URLs first');const u=store.db.prepare('SELECT * FROM users WHERE id=?').get(req.parsedBody.user_id);if(!u)fail(404,'User not found');accounts.allowed(u);return reply(201,store.transaction(()=>{store.db.prepare('UPDATE invites SET expires=0 WHERE user_id=? AND used_at IS NULL').run(u.id);const invite=store.invite(u.id);mail.access(u,invite,u.stage==='trial'?'demo':'access',req.parsedBody.language);return{queued:true};}));}
        if(req.method==='POST'&&route==='/admin/purchase'){const d=req.parsedBody;if(d.confirmed!==true)fail(400,'Confirm receipt of payment first');if(!mail.accessReady())fail(400,'Configure SMTP and public website/API URLs first');const reference=string(d.reference,120),u=store.db.prepare('SELECT * FROM users WHERE id=? AND account_id IS NULL').get(d.user_id),days=Number(d.days),seats=Number(d.max_devices);if(!u||u.stage==='blocked')fail(400,'Select an unblocked business owner');if(!Number.isInteger(days)||days<1||days>3650||!Number.isInteger(seats)||seats<1||seats>100)fail(400,'Invalid subscription period or device limit');const existing=store.db.prepare('SELECT * FROM purchases WHERE reference=?').get(reference);if(existing){if(existing.user_id!==u.id||existing.days!==days||existing.seats!==seats)fail(409,'Payment reference already used');return reply(200,{ok:true,repeated:true});}return reply(201,store.transaction(()=>{// Paying early never loses days: the new period starts where the current trial or subscription ends.
const expires=Math.max(Date.now(),['active','trial'].includes(u.stage)?u.expires:0)+days*86400000;store.db.prepare("UPDATE users SET stage='active',expires=?,max_devices=? WHERE id=?").run(expires,seats,u.id);store.db.prepare('INSERT INTO purchases VALUES(?,?,?,?,?)').run(reference,u.id,days,seats,Date.now());store.db.prepare('UPDATE invites SET expires=0 WHERE user_id=? AND used_at IS NULL').run(u.id);const invite=store.invite(u.id);mail.access({...u,stage:'active',expires},invite,'purchase',d.language,{days,reference});store.event('purchase.confirmed',u.id);return{ok:true,queued:true};}));}
        if(req.method==='POST'&&route==='/admin/site/draft')return reply(200,website.save(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/site/publish')return reply(200,website.publish(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/site/lead')return reply(200,website.updateLead(req.parsedBody));
        if(req.method==='POST'&&route==='/admin/site/lead/delete')return reply(200,website.deleteLead(req.parsedBody));
        if(req.method==='GET'&&route==='/admin/site/export')return reply(200,{format:'ch-site',version:1,...website.admin(),leads:store.db.prepare('SELECT * FROM site_leads ORDER BY created_at DESC').all()});
        if(req.method==='POST'&&route==='/admin/invite/revoke'){const data=req.parsedBody,row=store.db.prepare('SELECT * FROM invites WHERE id=?').get(string(data.id,64));if(!row)fail(404,'Key not found');store.db.prepare('UPDATE invites SET expires=0 WHERE id=?').run(row.id);store.event('invite.revoked',row.user_id);return reply(200,{ok:true});}
        if(req.method==='POST'&&route==='/admin/demo'){const data=req.parsedBody,days=Number(data.days||14);if(!Number.isInteger(days)||days<1||days>30)fail(400,'Demo duration must be 1–30 days');const password=crypto.randomBytes(24).toString('base64url'),userId=store.addUser({...data,days,max_devices:1,password_hash:passwordHash(password)});accounts.addBusiness(userId,data.business);const invite=store.invite(userId);invite.expires=Math.min(invite.expires,Date.now()+days*86400000);store.db.prepare('UPDATE invites SET expires=? WHERE token_hash=?').run(Math.min(invite.expires,Date.now()+days*86400000),hash(invite.token));store.event('demo.created',userId);const emailed=mail.access(store.db.prepare('SELECT * FROM users WHERE id=?').get(userId),invite,'demo',data.language);return reply(201,{id:userId,login:data.email,password,...invite,email:emailed?'queued':'not-configured'});}
        if (req.method === 'POST' && route === '/admin/users') {const data=await body(req);const encoded=passwordHash(data.password||crypto.randomBytes(24).toString('base64url'));let business;if(data.business_id){business=store.db.prepare('SELECT * FROM businesses WHERE id=?').get(data.business_id);if(!business)fail(404,OrbitI18n.t('m664'));if(!['admin','staff'].includes(data.role))fail(400,OrbitI18n.t('m678'));}const userId=store.addUser({...data,password_hash:encoded,account_id:business?.account_id,business:business?.name||data.business});if(business)store.db.prepare('INSERT INTO memberships VALUES(?,?,?)').run(userId,business.id,data.role);else accounts.addBusiness(userId,data.business);return reply(201,{id:userId});}
        if(req.method==='POST'&&route==='/admin/password'){const data=await body(req);accounts.setPassword(string(data.user_id,64),data.password);return reply(200,{ok:true});}
        if(req.method==='POST'&&route==='/admin/business'){const data=await body(req);return reply(201,{id:accounts.addBusiness(data.user_id,data.name)});}
        if(route.startsWith('/admin/business/')){
          const business=store.db.prepare('SELECT * FROM businesses WHERE id=?').get(url.searchParams.get('business_id'));if(!business)fail(404,OrbitI18n.t('m664'));const runtime=accounts.businesses.get(business);
          if(req.method==='GET'&&route==='/admin/business/config'){const s=runtime.store.snapshot();return reply(200,{business:s.business,industry:s.industry,currency:s.currency,timezone:s.timezone,logo:s.logo,phone:s.phone,address:s.address,work_start:s.work_start,work_end:s.work_end,work_days:s.work_days,website_enabled:s.website_enabled,services:s.services,resources:s.resources});}
          const data=await body(req);if(req.method==='POST'&&route==='/admin/business/profile'){runtime.store.saveProfile(data);store.db.prepare('UPDATE businesses SET name=? WHERE id=?').run(runtime.store.get('business'),business.id);return reply(200,{ok:true});}
          if(req.method==='POST'&&route==='/admin/business/service'){if(data.id)runtime.store.updateService(data);else runtime.store.addService(data);return reply(200,{ok:true});}
          if(req.method==='POST'&&route==='/admin/business/resource'){runtime.store.addResource(data);return reply(200,{ok:true});}fail(404,OrbitI18n.t('m652'));
        }
        if (req.method === 'POST' && route === '/admin/user') {
          const data = await body(req); const user = store.db.prepare('SELECT * FROM users WHERE id=?').get(string(data.id, 64)); if (!user) fail(404, OrbitI18n.t('m641'));
          const stages = ['lead', 'trial', 'active', 'blocked']; if (!stages.includes(data.stage)) fail(400, OrbitI18n.t('m544'));
          const expires = accountExpiry(data), seats = Number(data.max_devices);
          if (!Number.isSafeInteger(expires) || expires <= 0 || !Number.isInteger(seats) || seats < 1 || seats > 100) fail(400, OrbitI18n.t('m679'));
          store.transaction(() => { store.db.prepare('UPDATE users SET stage=?,expires=?,max_devices=? WHERE id=?').run(data.stage, expires, seats, data.id); if(data.stage==='blocked')store.db.prepare('DELETE FROM sessions WHERE user_id=? OR user_id IN(SELECT id FROM users WHERE account_id=?)').run(data.id,data.id);store.event('user.updated', data.id, null, '', data.stage); }); return reply(200, { ok: true });
        }
        // Permanent deletion; the panel must repeat the user's email so a misclick cannot erase an account.
        if (req.method === 'POST' && route === '/admin/user/delete') { const data = await body(req), user = store.db.prepare('SELECT * FROM users WHERE id=?').get(string(data.id, 64)); if (!user) fail(404, OrbitI18n.t('m641')); if (typeof data.confirm !== 'string' || data.confirm.trim().toLowerCase() !== user.email.toLowerCase()) fail(400, 'Введіть email користувача для підтвердження / Type the user email to confirm'); return reply(200, deletion.delete(user.id)); }
        if (req.method === 'POST' && route === '/admin/revoke') { const data = await body(req); const device = store.db.prepare('SELECT * FROM devices WHERE id=?').get(string(data.device_id, 64)); if (!device) fail(404, OrbitI18n.t('m680')); store.db.prepare('UPDATE devices SET revoked=1 WHERE id=?').run(device.id); store.db.prepare('DELETE FROM sessions WHERE device_id=?').run(device.id);store.event('device.revoked', device.user_id, device.id); return reply(200, { ok: true }); }
        if (req.method === 'GET' && route === '/admin/export') { const data = {}; for (const table of ['users', 'devices', 'events','businesses','memberships','site_content','site_history','site_leads','security_rejections','purchases']) data[table] = store.db.prepare(`SELECT * FROM ${table}`).all().map(row=>{const copy={...row};delete copy.password_hash;return copy;}); return reply(200, { format: 'orbit-owner', version: 1, exported_at: new Date().toISOString(), tables: data }); }
        fail(404, OrbitI18n.t('m652'));
      }
      // Signed-in requests are counted per session, so colleagues behind one office router do not share a limit.
      const bearer = (req.headers.authorization || '').replace(/^Bearer /, ''), address = bearer && bearer.length <= 200 ? 'session:' + crypto.createHash('sha256').update(bearer).digest('hex') : req.clientAddress, now = Date.now(), rate = rates.get(address) || { count: 0, start: now };
      if (now - rate.start > 60000) { rate.count = 0; rate.start = now; } rate.count++; rates.set(address, rate); if (rate.count > 120) fail(429, OrbitI18n.t('m681'));
      if(req.method==='GET'&&route==='/public/site')return reply(200,website.public());
      const documentMatch=/^\/public\/documents\/([a-z-]+)\/([a-z]{2})$/.exec(route);
      if(documentMatch&&['GET','HEAD'].includes(req.method)){let row;try{row=documents.resolve(documentMatch[1],documentMatch[2]);}catch(error){if(error.status!==404)throw error;return unavailable(res,documentMatch[2],req.method==='HEAD');}return await documents.send(res,row,req.method==='HEAD');}
      if(req.method==='POST'&&route==='/public/access'){const d=req.parsedBody;if(!d||typeof d.token!=='string'||d.token.length>128)fail(401,'Invalid or expired access key');const encoded=passwordHash(d.password);return reply(200,store.transaction(()=>{const i=store.findInvite(d.token,true),u=store.db.prepare('SELECT * FROM users WHERE id=?').get(i.user_id);accounts.allowed(u);store.db.prepare('UPDATE invites SET used_at=? WHERE id=?').run(Date.now(),i.id);store.db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(encoded,u.id);store.db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);store.event('password.set.by.email',u.id);return{ok:true,login:u.email};}));}
      if(req.method==='POST'&&route==='/public/demo')return reply(201,website.lead(req.parsedBody));
      if(req.method==='POST'&&route==='/public/support')return reply(201,support.create(req.parsedBody));
      if(await bookingPage.handle(req,url,res,reply))return;
      if(await botWorkers.handle(req,url,reply))return;
      if(await support.handle(req,url,reply,accounts))return;
      if(await legal.handle(req,url,reply,accounts))return;
      if(await monobank.handle(req,url,reply))return;
      if(await liqpay.handle(req,url,reply))return;
      if(await registration.handle(req,url,reply))return;
      if(await reset.handle(req,url,reply))return;
      if(await accounts.handle(req,res,url,reply))return;
      if (req.method === 'GET' && route === '/v1/info') return reply(200, { product: 'LOMVIKO', public_key: publicKey, protocol: 2,support:support.contact() });
      fail(404, OrbitI18n.t('m652'));
    } catch (error) { if(!error.status&&error.constructor===Error&&!error.code&&new URL(req.url,'http://localhost').pathname.startsWith('/v1/crm/'))error.status=400; if(!error.status&&!error.code?.startsWith?.('SQLITE_CONSTRAINT'))console.error('LOMVIKO request failed:',new URL(req.url,'http://localhost').pathname,error.stack||error.message); if([401,403,409,429].includes(error.status))website.reject(new URL(req.url,'http://localhost').pathname,error.status);if (!res.headersSent && !res.destroyed) reply(error.status || (error.code?.startsWith('SQLITE_CONSTRAINT')||[19,2067,1555].includes(error.errcode) ? 409 : 500), { error: error.status ? error.message : OrbitI18n.t('m689'),...(error.update?{update:error.update}:{}) }); else res.destroy(); }
  });
  const maintenance = setInterval(() => { const now = Date.now(); store.db.prepare('DELETE FROM requests WHERE at<?').run(now - 20*60000); store.db.prepare('DELETE FROM challenges WHERE expires<?').run(now);accounts.cleanup();registration.cleanup();reset.cleanup();administrator.cleanup();members.cleanup();website.cleanup();support.cleanup();if(now-(retention.last||0)>3600000){retention.last=now;try{retention.tick(now);}catch{console.error('LOMVIKO retention cycle failed');}} for (const [address, r] of rates) if (now - r.start > 60000) rates.delete(address); }, 60000); maintenance.unref();
  const mailTimer=setInterval(()=>mail.tick().catch(()=>{}),5000);mailTimer.unref();
  const notifyTimer=setInterval(()=>notify.tick().catch(()=>{}),60000);notifyTimer.unref();
  const payTimer=setInterval(()=>{monobank.poll().catch(()=>{});liqpay.poll().catch(()=>{});},180000);payTimer.unref();
  const fiscalTimer=setInterval(()=>{fiscal.tick().catch(()=>{});deposits.tick().catch(()=>{});},60000);fiscalTimer.unref();
  const lapsedTimer=setInterval(()=>lapsed.tick().catch(()=>{}),3600000);lapsedTimer.unref();
  server.once('listening',()=>mail.tick().catch(()=>{}));
  let botWork = null, stopping = false;
  function tickBots() {
    if (stopping) return Promise.resolve();
    if (botWork) return botWork;
    botWork = Promise.resolve().then(async () => {
      for (const business of store.db.prepare("SELECT b.* FROM businesses b JOIN users u ON u.id=b.account_id WHERE u.stage!='blocked' AND u.expires>?").all(Date.now())) accounts.businesses.get(business);
      await accounts.businesses.tick(businessId => {
        const business = store.db.prepare('SELECT * FROM businesses WHERE id=?').get(businessId);
        const user = business && store.db.prepare('SELECT * FROM users WHERE id=?').get(business.account_id);
        return user && user.stage !== 'blocked' && user.expires > Date.now() && !store.db.prepare('SELECT business_id FROM bot_workers WHERE business_id=?').get(businessId);
      });
    }).catch(() => { console.error('LOMVIKO bot worker cycle failed'); }).finally(() => { botWork = null; });
    return botWork;
  }
  const bots = setInterval(tickBots, 10000); bots.unref();
  server.once('listening', tickBots);
  let resolveDisposed; server.disposed = new Promise(resolve => { resolveDisposed = resolve; });
  server.on('close', () => {
    stopping = true; clearInterval(maintenance); clearInterval(bots);clearInterval(mailTimer);clearInterval(payTimer);clearInterval(fiscalTimer);clearInterval(lapsedTimer);
    Promise.all([botWork,mail.close()]).finally(() => { accounts.close(); resolveDisposed(); });
  });
  server.shutdown = async () => {
    stopping = true; clearInterval(maintenance); clearInterval(bots);clearInterval(mailTimer);
    await new Promise((resolve, reject) => server.close(error => error && error.code!=='ERR_SERVER_NOT_RUNNING' ? reject(error) : resolve()));
    await server.disposed;
  };
  server.mail=mail;server.retention=retention;server.documents=documents;server.website=website;server.tickBots = tickBots; server.accounts = accounts;
  server.requestTimeout = 15*60000; server.headersTimeout = 10000;
  return server;
}
module.exports = { setup, ProductStore, createProductServer };
if (require.main === module) {
  const directory = path.resolve(process.env.ORBIT_OWNER_DATA || path.join(process.cwd(), '.owner-data')); const keys = setup(directory);
  const store = new ProductStore(path.join(directory, 'owner.sqlite'));
  const port = Number(process.env.PORT || 4545), host = process.env.ORBIT_OWNER_HOST || '127.0.0.1';
  const server = createProductServer({ store, ...keys, allowLocalMail:process.env.CH_LOCAL_TEST_MODE==='1',trustProxy:process.env.ORBIT_TRUST_PROXY==='1' });
  let stopping = false;
  const stop = async () => { if (stopping) return; stopping = true; const deadline = setTimeout(() => process.exit(1), 55000); try { await server.shutdown(); store.db.close(); clearTimeout(deadline); } catch { console.error('LOMVIKO shutdown failed'); process.exitCode = 1; clearTimeout(deadline); } };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
  server.listen(port, host, () => console.log(`LOMVIKO product server: ${host}:${server.address().port}. Credentials remain in protected files under ${directory}.`));
}
