// "Forgot password" for the web app: a six-digit code goes to the account's email; with it the person
// sets a new password and every old session ends. The answer to /start never reveals whether the
// email exists, and both the address and the email are rate-limited like registration.
const crypto = require('node:crypto');
const {passwordHash} = require('./accounts.cjs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const TTL = 15 * 60000;
class PasswordReset {
  constructor({store,mail,fail,string,key}) {
    Object.assign(this,{store,db:store.db,mail,fail,string,key});
    this.db.exec(`CREATE TABLE IF NOT EXISTS password_resets(id TEXT PRIMARY KEY,user_id TEXT,code_hash TEXT NOT NULL,expires INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS password_reset_limits(bucket TEXT PRIMARY KEY,at INTEGER NOT NULL,count INTEGER NOT NULL);`);
  }
  limit(address,email) {
    const now=Date.now();
    for(const bucket of [hash('ip:'+address),hash('email:'+email)]) {
      const row=this.db.prepare('SELECT * FROM password_reset_limits WHERE bucket=?').get(bucket);
      if(row&&now-row.at<3600000&&row.count>=5)this.fail(429,'Забагато спроб. Спробуйте за годину / Too many attempts, try again in an hour');
      this.db.prepare('INSERT INTO password_reset_limits VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET at=CASE WHEN ?-at>=3600000 THEN ? ELSE at END,count=CASE WHEN ?-at>=3600000 THEN 1 ELSE count+1 END').run(bucket,now,now,now,now);
    }
  }
  codeHash(id,code){return crypto.createHmac('sha256',this.key).update('reset:'+id+':'+code).digest('hex');}
  async handle(req,url,reply) {
    if(req.method!=='POST'||!['/v1/password/reset/start','/v1/password/reset/confirm'].includes(url.pathname))return false;
    const data=req.parsedBody||{};
    if(url.pathname.endsWith('/start')) {
      if(!this.mail.configured())this.fail(503,'Відновлення пароля тимчасово недоступне. Напишіть нам / Password reset is unavailable, contact us');
      const email=this.string(data.email,254).toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))this.fail(400,'Перевірте email / Invalid email');
      this.limit(req.clientAddress||req.socket.remoteAddress,email);
      const user=this.db.prepare("SELECT id,name,email,stage FROM users WHERE email=?").get(email);
      const id=crypto.randomUUID(),code=String(crypto.randomInt(0,1000000)).padStart(6,'0');
      // An unknown or blocked email gets the same answer and no letter.
      this.store.transaction(()=>{
        this.db.prepare('INSERT INTO password_resets(id,user_id,code_hash,expires,attempts,created_at) VALUES(?,?,?,?,0,?)').run(id,user&&user.stage!=='blocked'?user.id:null,this.codeHash(id,code),Date.now()+TTL,Date.now());
        if(user&&user.stage!=='blocked'){this.mail.enqueue('password-reset',user.email,data.language,{name:user.name,code},{dedupe:'reset:'+id,userId:user.id,expires:Date.now()+TTL});this.store.event('password.reset.requested',user.id);}
      });
      reply(201,{reset_id:id,expires:Date.now()+TTL});return true;
    }
    const row=this.db.prepare('SELECT * FROM password_resets WHERE id=?').get(this.string(data.reset_id,64));
    if(!row||row.expires<=Date.now()||row.attempts>=5)this.fail(401,'Код недійсний або прострочений. Надішліть новий / Code expired, request a new one');
    this.db.prepare('UPDATE password_resets SET attempts=attempts+1 WHERE id=?').run(row.id);
    if(!row.user_id||typeof data.code!=='string'||!/^\d{6}$/.test(data.code)||!crypto.timingSafeEqual(Buffer.from(this.codeHash(row.id,data.code)),Buffer.from(row.code_hash)))this.fail(401,'Невірний код / Incorrect code');
    const encoded=passwordHash(data.password);
    const login=this.store.transaction(()=>{
      const user=this.db.prepare('SELECT id,email,stage FROM users WHERE id=?').get(row.user_id);
      if(!user||user.stage==='blocked')this.fail(403,'Доступ призупинено. Напишіть нам / Access suspended, contact us');
      this.db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(encoded,user.id);
      this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
      this.db.prepare('DELETE FROM password_resets WHERE user_id=?').run(user.id);
      this.store.event('password.reset.done',user.id);
      return user.email;
    });
    reply(200,{ok:true,login});return true;
  }
  cleanup(){this.db.prepare('DELETE FROM password_resets WHERE expires<?').run(Date.now());this.db.prepare('DELETE FROM password_reset_limits WHERE at<?').run(Date.now()-86400000);}
}
module.exports={PasswordReset};
