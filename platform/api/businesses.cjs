const OrbitI18n = require('../shared/i18n.js');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Store } = require('../core/store.cjs');
const { Telegram } = require('../core/integrations.cjs');
class ServerVault {
  constructor(directory, master) { this.directory=directory;this.master=master;fs.mkdirSync(directory,{recursive:true,mode:0o700}); }
  file(key){if(!/^[a-z_]+$/.test(key))throw Error('Invalid vault key');return path.join(this.directory,`${key}.secret`);}
  available(){return true;}
  has(key){return fs.existsSync(this.file(key));}
  put(key,value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.master,iv);cipher.setAAD(Buffer.from(path.basename(path.dirname(this.directory))+key));const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);const target=this.file(key),temp=target+'.tmp';fs.writeFileSync(temp,Buffer.concat([iv,cipher.getAuthTag(),encrypted]),{mode:0o600});fs.renameSync(temp,target);}
  get(key){if(!this.has(key))return null;const data=fs.readFileSync(this.file(key)),decipher=crypto.createDecipheriv('aes-256-gcm',this.master,data.subarray(0,12));decipher.setAAD(Buffer.from(path.basename(path.dirname(this.directory))+key));decipher.setAuthTag(data.subarray(12,28));return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8');}
  remove(key){fs.rmSync(this.file(key),{force:true});}
}
class Businesses {
  constructor(directory, options = {}){this.telegramFactory = options.telegramFactory || ((store, vault) => new Telegram(store, vault, { runtime: 'server' }));this.directory=directory;this.instances=new Map();fs.mkdirSync(directory,{recursive:true,mode:0o700});const file=path.join(directory,'vault-master.secret');if(!fs.existsSync(file))fs.writeFileSync(file,crypto.randomBytes(32),{mode:0o600});this.master=fs.readFileSync(file);}
  get(business){if(!/^[a-f0-9-]{36}$/.test(business.id))throw Error('Invalid business id');if(!this.instances.has(business.id)){const directory=path.join(this.directory,business.id),store=new Store(path.join(directory,'crm.sqlite'));if(!store.get('onboarded')){store.set('business',business.name);store.set('onboarded',true);/* The server runs in UTC; a new company starts in Kyiv time and can change it in the profile. */if(store.get('timezone')==='UTC')store.set('timezone',process.env.CH_DEFAULT_TIMEZONE||'Europe/Kyiv');}const vault=new ServerVault(path.join(directory,'vault'),this.master),telegram=this.telegramFactory(store,vault);store.db.exec("UPDATE reminders SET status='pending' WHERE status='sending';UPDATE reminder_deliveries SET status='pending' WHERE status='sending'");this.instances.set(business.id,{store,vault,telegram});}return this.instances.get(business.id);}
  // Closes the company database and erases its folder (CRM data, vault secrets, update backups).
  remove(id){if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid business id');const runtime=this.instances.get(id);this.instances.delete(id);try{runtime?.store.db.close();}catch{}fs.rmSync(path.join(this.directory,id),{recursive:true,force:true});}
  async tick(allowed,{listen=false}={}){const active=[...this.instances].filter(([id])=>allowed(id));if(listen)for(const[id,runtime]of active)runtime.telegram.listen?.(()=>allowed(id));await Promise.all(active.map(([,runtime])=>runtime.telegram.tick()));}
  close(){for(const runtime of this.instances.values()){if(runtime.telegram)runtime.telegram.closed=true;runtime.store.db.close();}}
}
module.exports={Businesses};
