const crypto=require('node:crypto');
const{passwordHash,passwordValid}=require('./accounts.cjs');
// Additional administrators invited by the owner. Each has their own email, password and
// authenticator key; the invitation link is single-use and valid for 48 hours.
const INVITE_TTL=48*3600000;
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const email=v=>typeof v==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())&&v.trim().length<=254?v.trim().toLowerCase():null;
function fail(status,message){throw Object.assign(Error(message),{status});}
class AdminMembers{
 constructor({db,mail,adminUrl,totp,base32}){
  Object.assign(this,{db,mail,adminUrl:(adminUrl||'').replace(/\/$/,''),totp,base32});this.failures=new Map();
  db.exec(`CREATE TABLE IF NOT EXISTS admin_members(id TEXT PRIMARY KEY,email TEXT NOT NULL COLLATE NOCASE UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL DEFAULT '',totp_secret TEXT NOT NULL,used_counter INTEGER NOT NULL DEFAULT -1,invite_hash TEXT,invite_expires INTEGER,created_at INTEGER NOT NULL,activated_at INTEGER)`);
 }
 list(){return this.db.prepare('SELECT id,email,name,created_at,activated_at,invite_expires FROM admin_members ORDER BY created_at').all().map(m=>({...m,status:m.activated_at?'active':m.invite_expires>Date.now()?'invited':'expired'}));}
 link(token){return `${this.adminUrl||''}/#invite=${token}`;}
 sendInvite(member,token,inviter){
  const queued=this.mail?.enqueue('admin-invite',member.email,'uk',{name:member.name,inviter,link:this.link(token),adminUrl:this.adminUrl,email:member.email},{dedupe:'admin-invite:'+hash(token),expires:Date.now()+INVITE_TTL})||false;
  return{id:member.id,link:this.link(token),mailed:queued};
 }
 invite(data,ownerLogin,inviter='LOMVIKO'){
  const address=email(data?.email),name=typeof data?.name==='string'?data.name.trim().slice(0,120):'';
  if(!address)fail(400,'Вкажіть коректний email / Enter a valid email');if(!name)fail(400,'Вкажіть ім’я / Enter a name');
  if(address===ownerLogin)fail(409,'Це email власника / This is the owner email');
  if(this.db.prepare('SELECT id FROM admin_members WHERE email=?').get(address))fail(409,'Цього адміністратора вже запрошено / Already invited');
  const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('base64url'),member={id,email:address,name};
  this.db.prepare('INSERT INTO admin_members(id,email,name,totp_secret,invite_hash,invite_expires,created_at) VALUES(?,?,?,?,?,?,?)').run(id,address,name,this.base32(crypto.randomBytes(20)),hash(token),Date.now()+INVITE_TTL,Date.now());
  return this.sendInvite(member,token,inviter);
 }
 // A fresh link (and a fresh authenticator key) when the first one expired or got lost.
 resend(id,inviter='LOMVIKO'){
  const member=this.db.prepare('SELECT * FROM admin_members WHERE id=?').get(String(id||''));if(!member)fail(404,'Адміністратора не знайдено / Administrator not found');
  if(member.activated_at)fail(409,'Адміністратор уже активний / Administrator is already active');
  const token=crypto.randomBytes(32).toString('base64url');
  this.db.prepare('UPDATE admin_members SET invite_hash=?,invite_expires=?,totp_secret=?,used_counter=-1 WHERE id=?').run(hash(token),Date.now()+INVITE_TTL,this.base32(crypto.randomBytes(20)),member.id);
  return this.sendInvite(member,token,inviter);
 }
 remove(id){if(!this.db.prepare('DELETE FROM admin_members WHERE id=?').run(String(id||'')).changes)fail(404,'Адміністратора не знайдено / Administrator not found');}
 limit(ip){const now=Date.now(),f=this.failures.get(ip)||{count:0,at:now};if(now-f.at>900000){f.count=0;f.at=now;}if(f.count>=10)fail(429,'Забагато спроб. Зачекайте 15 хвилин / Too many attempts; wait 15 minutes');f.count++;this.failures.set(ip,f);}
 pending(token){
  const member=typeof token==='string'&&token.length<=100?this.db.prepare('SELECT * FROM admin_members WHERE invite_hash=?').get(hash(token)):null;
  if(!member||member.activated_at||!(member.invite_expires>Date.now()))fail(404,'Запрошення недійсне або прострочене. Попросіть надіслати нове / Invitation is invalid or expired');
  return member;
 }
 info(ip,data){this.limit(ip);const m=this.pending(data?.token);return{email:m.email,name:m.name,secret:m.totp_secret,uri:`otpauth://totp/LOMVIKO:${encodeURIComponent(m.email)}?secret=${m.totp_secret}&issuer=LOMVIKO`};}
 match(member,otp){const counter=Math.floor(Date.now()/30000);return[counter-1,counter,counter+1].find(c=>c>member.used_counter&&String(otp||'')===this.totp(member.totp_secret,c));}
 accept(ip,data){
  this.limit(ip);const member=this.pending(data?.token),matched=this.match(member,data?.otp);
  if(matched===undefined)fail(401,'Код із застосунку не підходить. Перевірте, що ключ додано правильно / The authenticator code does not match');
  this.db.prepare('UPDATE admin_members SET password_hash=?,activated_at=?,invite_hash=NULL,invite_expires=NULL,used_counter=? WHERE id=?').run(passwordHash(data.password),Date.now(),matched,member.id);
  this.failures.delete(ip);return{email:member.email};
 }
 // Second factor for sign-in: the member's own password and authenticator code.
 authenticate(login,password,otp){
  const member=this.db.prepare('SELECT * FROM admin_members WHERE email=? AND activated_at IS NOT NULL').get(String(login||'').trim().toLowerCase());
  if(!member||!passwordValid(password,member.password_hash))return null;
  const matched=this.match(member,otp);if(matched===undefined)return null;
  this.db.prepare('UPDATE admin_members SET used_counter=? WHERE id=?').run(matched,member.id);return member;
 }
 cleanup(){for(const[k,v]of this.failures)if(Date.now()-v.at>900000)this.failures.delete(k);}
}
module.exports={AdminMembers};
