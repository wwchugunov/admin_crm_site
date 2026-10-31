const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const{verifyRequest,verifyDigest,digest}=require('../core/request-proof.cjs');
const{passwordHash,passwordValid}=require('./accounts.cjs');
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
// Admin sessions stay alive while the panel is in use (sliding 30 minutes), up to 12 hours after sign-in.
const IDLE=4*3600000,MAX=12*3600000;
function base32(bytes){let bits=0,value=0,result='';for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){bits-=5;result+=alphabet[(value>>>bits)&31];}}if(bits)result+=alphabet[(value<<(5-bits))&31];return result;}
function decode(secret){let bits=0,value=0,out=[];for(const char of secret){const n=alphabet.indexOf(char);if(n<0)throw Error('Invalid TOTP secret');value=(value<<5)|n;bits+=5;if(bits>=8){bits-=8;out.push((value>>>bits)&255);}}return Buffer.from(out);}
function totp(secret,counter=Math.floor(Date.now()/30000)){const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(counter));const h=crypto.createHmac('sha1',decode(secret)).update(b).digest(),o=h[19]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0');}
function equal(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y);}
class AdminAuth{
 constructor({directory,token,db,local=false}){Object.assign(this,{token,db,local});const file=path.join(directory,'admin-totp.secret');if(!fs.existsSync(file))fs.writeFileSync(file,base32(crypto.randomBytes(20)),{mode:0o600});this.secret=fs.readFileSync(file,'utf8').trim();this.sessions=new Map();this.failures=new Map();if(db)db.exec('CREATE TABLE IF NOT EXISTS admin_security(name TEXT PRIMARY KEY,value INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS admin_account(id INTEGER PRIMARY KEY CHECK(id=1),login TEXT NOT NULL,password_hash TEXT NOT NULL,updated_at INTEGER NOT NULL)');this.usedCounter=db?.prepare("SELECT value FROM admin_security WHERE name='totp-counter'").get()?.value??-1;}
 login(req,data){const ip=req.socket.remoteAddress,now=Date.now(),f=this.failures.get(ip)||{count:0,at:now};if(now-f.at>900000){f.count=0;f.at=now;}if(f.count>=5)throw Object.assign(Error('Too many administrator login attempts'),{status:429});f.count++;this.failures.set(ip,f);
  // First factor: the owner's email and password, or the long emergency key. The authenticator code is always required.
  const byPassword=typeof data.login==='string'&&typeof data.password==='string',account=this.db?.prepare('SELECT * FROM admin_account WHERE id=1').get();
  const invalid=()=>Object.assign(Error('Administrator credentials or second factor are invalid'),{status:401});
  const isOwner=!byPassword||(account&&equal(data.login.trim().toLowerCase(),account.login));
  let matched,member=null;
  if(isOwner){
   const first=byPassword?passwordValid(data.password,account?.password_hash):equal(data.token,this.token);
   const counter=Math.floor(now/30000);matched=[counter-1,counter,counter+1].find(c=>equal(String(data.otp||''),totp(this.secret,c)));
   if(!first||matched===undefined||matched<=this.usedCounter)throw invalid();
  }else{
   // An invited administrator: their own password and their own authenticator key.
   member=this.members?.authenticate(data.login,data.password,data.otp);if(!member)throw invalid();
  }
  let key;try{key=crypto.createPublicKey(data.public_key);if(key.asymmetricKeyType!=='ed25519')throw Error();verifyRequest(req,req.rawBody,byPassword?data.login:data.token,key,this.db);}catch(error){throw Object.assign(Error('Administrator device proof is invalid'),{status:401});}
  if(isOwner){this.db.prepare("INSERT INTO admin_security VALUES('totp-counter',?) ON CONFLICT(name) DO UPDATE SET value=excluded.value").run(matched);this.usedCounter=matched;}
  this.failures.delete(ip);const session=crypto.randomBytes(32).toString('base64url'),expires=now+IDLE;this.sessions.set(digest(session),{key,expires,started:now,member:member?.id||null,name:member?.name||null});return{session,expires,owner:isOwner};
 }
 account(){const row=this.db?.prepare('SELECT login,updated_at FROM admin_account WHERE id=1').get();return{configured:!!row,login:row?.login||'',updatedAt:row?.updated_at||null};}
 // Sets or changes the owner's sign-in email and password; a change requires the current password.
 setAccount(data){const login=typeof data?.login==='string'?data.login.trim().toLowerCase():'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)||login.length>254)throw Object.assign(Error('Вкажіть коректний email / Enter a valid email'),{status:400});const current=this.db.prepare('SELECT * FROM admin_account WHERE id=1').get();if(current&&!passwordValid(data.current_password,current.password_hash))throw Object.assign(Error('Поточний пароль неправильний / Current password is incorrect'),{status:403});const hash=passwordHash(data.password);this.db.prepare('INSERT INTO admin_account VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET login=excluded.login,password_hash=excluded.password_hash,updated_at=excluded.updated_at').run(login,hash,Date.now());return this.account();}
 uploadSession(req){const token=(req.headers.authorization||'').replace(/^Bearer /,''),session=this.sessions.get(digest(token));if(!session||session.expires<=Date.now())throw Object.assign(Error('Administrator session expired; sign in with a new code'),{status:401});return{token,key:session.key};}
 verifyUpload(req,bodyHash){const{token,key}=this.uploadSession(req);verifyDigest(req,bodyHash,token,key,this.db,15*60000);}
 verify(req){const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(this.local&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&equal(token,this.token))return{member:null};const session=this.sessions.get(digest(token));if(!session||session.expires<=Date.now()){this.sessions.delete(digest(token));throw Object.assign(Error('Administrator session expired; sign in with a new code'),{status:401});}verifyRequest(req,req.rawBody,token,session.key,this.db);session.expires=Math.min(Date.now()+IDLE,(session.started||0)+MAX);return session;}
 // Managing administrators and the owner's own sign-in is reserved for the owner.
 owner(session){if(session?.member)throw Object.assign(Error('Лише власник може це змінити / Only the owner can change this'),{status:403});}
 endMember(id){for(const[k,v]of this.sessions)if(v.member===id)this.sessions.delete(k);}
 cleanup(){for(const[k,v]of this.sessions)if(v.expires<=Date.now())this.sessions.delete(k);for(const[k,v]of this.failures)if(Date.now()-v.at>900000)this.failures.delete(k);}
}
module.exports={AdminAuth,totp,base32};
