const crypto = require('node:crypto');
// Launch offer: everyone who registers before it ends uses LOMVIKO free until 1 March 2027 (Kyiv); later sign-ups get 30 days.
const FREE_UNTIL=Date.parse('2027-03-01T00:00:00+02:00');
const trialEnd=()=>Math.max(Date.now()+30*86400000,FREE_UNTIL);
const fs = require('node:fs');
const path = require('node:path');
const {passwordHash} = require('./accounts.cjs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
class Registration {
  constructor({store,accounts,mail,fail,string}) {
    Object.assign(this,{store,db:store.db,accounts,mail,fail,string});
    const file=path.join(store.directory,'registration.secret');
    try{fs.writeFileSync(file,crypto.randomBytes(32),{mode:0o600,flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
    this.key=fs.readFileSync(file);
    this.db.exec(`CREATE TABLE IF NOT EXISTS registration_pending(id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,business TEXT NOT NULL,password_hash TEXT NOT NULL,public_key TEXT NOT NULL,code_hash TEXT NOT NULL,expires INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS trial_consumptions(device TEXT PRIMARY KEY,email_hash TEXT NOT NULL UNIQUE,started_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS registration_limits(bucket TEXT PRIMARY KEY,at INTEGER NOT NULL,count INTEGER NOT NULL);`);
    // Whether the person ticked "I accept the offer and the privacy policy" (apps from 1.5.3 on).
    if(!this.db.prepare('PRAGMA table_info(registration_pending)').all().some(c=>c.name==='accepted'))this.db.exec('ALTER TABLE registration_pending ADD COLUMN accepted INTEGER NOT NULL DEFAULT 0');
  }
  proof(data,publicKey,body) {
    if(typeof data.signature!=='string'||data.signature.length>150||!crypto.verify(null,Buffer.from(JSON.stringify(body)),publicKey,Buffer.from(data.signature,'base64url')))this.fail(401,'Потрібне підтвердження пристрою / Device proof required');
  }
  limit(address,email) {
    const now=Date.now();
    for(const bucket of [hash('ip:'+address),hash('email:'+email)]) {
      const row=this.db.prepare('SELECT * FROM registration_limits WHERE bucket=?').get(bucket);
      if(row&&now-row.at<3600000&&row.count>=5)this.fail(429,'Забагато спроб реєстрації. Спробуйте пізніше / Too many registration attempts');
      this.db.prepare('INSERT INTO registration_limits VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET at=CASE WHEN ?-at>=3600000 THEN ? ELSE at END,count=CASE WHEN ?-at>=3600000 THEN 1 ELSE count+1 END').run(bucket,now,now,now,now);
    }
  }
  async handle(req,url,reply) {
    if(req.method!=='POST'||!['/v1/register/start','/v1/register/confirm'].includes(url.pathname))return false;
    const data=req.parsedBody||{};
    if(url.pathname.endsWith('/start')) {
      if(this.store.product&&!this.store.product().registration)this.fail(403,'Реєстрацію тимчасово закрито. Залиште заявку на сайті — ми напишемо, щойно відкриємо / Registration is closed for now');
      if(!this.mail.configured())this.fail(503,'Підтвердження пошти ще не налаштовано / Email verification is not configured');
      const email=this.string(data.email,254).toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))this.fail(400,'Перевірте email / Invalid email');
      this.limit((req.clientAddress || req.socket.remoteAddress),email);
      let key;try{key=crypto.createPublicKey(this.string(data.public_key,1000));}catch{this.fail(400,'Invalid device key');}
      if(key.asymmetricKeyType!=='ed25519')this.fail(400,'Invalid device key');
      const fields={email:data.email,name:data.name,business:data.business,password:data.password,public_key:data.public_key,timestamp:data.timestamp,request_id:data.request_id};
      // Newer apps sign the acceptance together with the form; older ones keep the previous signature.
      if(data.accept!==undefined){if(data.accept!==true)this.fail(400,'Щоб зареєструватися, прийміть Публічну оферту і Політику конфіденційності / Accept the offer and the privacy policy to register');fields.accept=true;}
      if(!Number.isSafeInteger(data.timestamp)||Math.abs(Date.now()-data.timestamp)>15*60000||!/^[-a-f0-9]{36}$/.test(data.request_id||''))this.fail(401,'Registration request expired');
      this.proof(data,key,fields);
      const device=hash(key.export({type:'spki',format:'der'}));
      const existing=this.db.prepare('SELECT name FROM users WHERE email=?').get(email);
      if(existing||this.db.prepare('SELECT device FROM trial_consumptions WHERE device=? OR email_hash=?').get(device,hash(email))){
        passwordHash(data.password);
        // The response stays identical so the API never reveals which emails exist; the owner of the address learns why no code arrives.
        const kind=existing?'registration-exists':'registration-trial-used',name=existing?existing.name:(typeof data.name==='string'?data.name.trim().slice(0,120):'');
        try{this.mail.enqueue(kind,email,data.language,{name},{dedupe:`${kind}:${hash(email)}:${Math.floor(Date.now()/3600000)}`,expires:Date.now()+3600000});}catch{}
        reply(201,{registration_id:crypto.randomUUID(),expires:Date.now()+15*60000});return true;
      }
      const name=this.string(data.name,120),business=this.string(data.business,120),encoded=passwordHash(data.password);
      const id=crypto.randomUUID(),code=String(crypto.randomInt(0,1000000)).padStart(6,'0');
      this.store.transaction(()=>{
        if(this.db.prepare('SELECT id FROM requests WHERE id=?').get(data.request_id))this.fail(409,'Request already used');
        this.db.prepare('INSERT INTO requests VALUES(?,?)').run(data.request_id,Date.now());
        this.db.prepare('DELETE FROM registration_pending WHERE email=?').run(email);
        this.db.prepare('INSERT INTO registration_pending(id,email,name,business,password_hash,public_key,code_hash,expires,attempts,created_at) VALUES(?,?,?,?,?,?,?,?,0,?)').run(id,email,name,business,encoded,key.export({type:'spki',format:'pem'}),this.codeHash(id,code),Date.now()+15*60000,Date.now());
        if(data.accept===true)this.db.prepare('UPDATE registration_pending SET accepted=1 WHERE id=?').run(id);
        this.mail.enqueue('registration',email,data.language,{name,code},{dedupe:'registration:'+id,expires:Date.now()+15*60000});
        this.store.event('registration.requested');
      });
      reply(201,{registration_id:id,expires:Date.now()+15*60000});return true;
    }
    const pending=this.db.prepare('SELECT * FROM registration_pending WHERE id=?').get(this.string(data.registration_id,64));
    if(!pending||pending.expires<=Date.now()||pending.attempts>=5)this.fail(401,'Код недійсний або прострочений. Почніть реєстрацію знову / Code expired; register again');
    this.proof(data,pending.public_key,{registration_id:data.registration_id,code:data.code});
    this.db.prepare('UPDATE registration_pending SET attempts=attempts+1 WHERE id=?').run(pending.id);
    if(typeof data.code!=='string'||!/^\d{6}$/.test(data.code)||!crypto.timingSafeEqual(Buffer.from(this.codeHash(pending.id,data.code)),Buffer.from(pending.code_hash)))this.fail(401,'Невірний код підтвердження / Incorrect verification code');
    const userId=this.store.transaction(()=>{
      const device=hash(crypto.createPublicKey(pending.public_key).export({type:'spki',format:'der'}));
      if(this.db.prepare('SELECT device FROM trial_consumptions WHERE device=? OR email_hash=?').get(device,hash(pending.email)))this.fail(409,'Trial already used');
      const id=this.store.addUser({name:pending.name,email:pending.email,business:pending.business,days:30,expires:trialEnd(),max_devices:10,password_hash:pending.password_hash});
      this.accounts.addBusiness(id,pending.business);
      this.db.prepare('INSERT INTO trial_consumptions VALUES(?,?,?)').run(device,hash(pending.email),Date.now());
      this.db.prepare('DELETE FROM registration_pending WHERE id=?').run(pending.id);
      this.store.event('trial.started',id,null,'',`until ${new Date(trialEnd()).toISOString().slice(0,10)}; verified email`);
      this.legal?.record({userId:id,email:pending.email,method:pending.accepted?'registration-checkbox+email-code':'registration-email-code',ip:req.clientAddress||req.socket?.remoteAddress,device:device,app:String(data.version||'')});
      try{this.mail.enqueue('welcome',pending.email,data.language,{name:pending.name,business:pending.business,until_ms:trialEnd()},{userId:id,dedupe:'welcome:'+id});}catch{}
      const c=this.mail.settings();if(c.ownerNotice)this.mail.enqueue('trial-started',c.ownerEmail||c.fromEmail,data.language,{name:pending.name,email:pending.email,business:pending.business},{userId:id,dedupe:'trial:'+id});
      return id;
    });
    reply(201,{ok:true,user_id:userId,login:pending.email,trial_days:Math.round((trialEnd()-Date.now())/86400000)});return true;
  }
  cleanup(){this.db.prepare('DELETE FROM registration_pending WHERE expires<?').run(Date.now());this.db.prepare('DELETE FROM registration_limits WHERE at<?').run(Date.now()-86400000);}
  codeHash(id,code){return crypto.createHmac('sha256',this.key).update(id+':'+code).digest('hex');}
}
module.exports={Registration,FREE_UNTIL};
