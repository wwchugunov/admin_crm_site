const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const{verifyDigest,verifyRequest}=require('../src/request-proof.cjs');
// Scoped publishing for the desktop app: a release key can upload installers and update
// feeds and register versions, nothing else. Admin, website and customer data stay out of reach.
const MAX_FILE=512*1024*1024;
const VERSIONED=/^LOMVIKO-((?:0|[1-9]\d{0,4})\.(?:0|[1-9]\d{0,4})\.(?:0|[1-9]\d{0,4}))-(mac-(?:x64|arm64)\.(?:dmg|zip)|win-x64\.exe)(\.blockmap)?$/;
const FEEDS=new Set(['latest.yml','latest-mac.yml']);
function fail(message,status=400){throw Object.assign(Error(message),{status});}
const fingerprint=key=>crypto.createHash('sha256').update((key instanceof crypto.KeyObject?key:crypto.createPublicKey(key)).export({type:'spki',format:'der'})).digest('hex').slice(0,32);
class ReleasePublishing{
 constructor(store,updates){
  Object.assign(this,{store,db:store.db,updates,directory:updates.directory});
  this.db.exec('CREATE TABLE IF NOT EXISTS release_publishers(id TEXT PRIMARY KEY,name TEXT NOT NULL,public_key TEXT NOT NULL,created_at INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0)');
 }
 add(name,publicKey){const key=crypto.createPublicKey(publicKey);if(key.asymmetricKeyType!=='ed25519')fail('Release key must be Ed25519');if(typeof name!=='string'||!name.trim()||name.length>80)fail('Release key name is required');const id=fingerprint(key),pem=key.export({type:'spki',format:'pem'});this.db.prepare('INSERT INTO release_publishers VALUES(?,?,?,?,0) ON CONFLICT(id) DO UPDATE SET name=excluded.name,revoked=0').run(id,name.trim(),pem,Date.now());this.store.event('release.key.added',null,null,'',name.trim());return id;}
 revoke(id){if(!this.db.prepare('UPDATE release_publishers SET revoked=1 WHERE id=?').run(id).changes)fail('Release key not found',404);this.store.event('release.key.revoked',null,null,'',id);}
 list(){return this.db.prepare('SELECT id,name,created_at,revoked FROM release_publishers ORDER BY created_at').all();}
 publisher(req){const match=/^Release ([a-f0-9]{32})$/.exec(req.headers.authorization||'');const row=match&&this.db.prepare('SELECT * FROM release_publishers WHERE id=? AND revoked=0').get(match[1]);if(!row)fail('Release key is not authorized',401);return row;}
 // Streams one file into the release directory. Versioned files are immutable; feeds are replaced atomically.
 async upload(req,url){
  const publisher=this.publisher(req),name=url.searchParams.get('name')||'';
  const feed=FEEDS.has(name),versioned=VERSIONED.exec(name);if(!feed&&!versioned)fail('Unsupported release file name');
  const size=Number(req.headers['content-length']);if(!Number.isSafeInteger(size)||size<1||size>(feed?1024*1024:MAX_FILE))fail('Invalid release file size',413);
  const target=path.join(this.directory,name),temporary=`${target}.${crypto.randomUUID()}.partial`,digest=crypto.createHash('sha256');let fd=fs.openSync(temporary,'wx',0o600),received=0;
  try{
   for await(const chunk of req){received+=chunk.length;if(received>size)fail('Invalid release file size',413);digest.update(chunk);fs.writeFileSync(fd,chunk);}
   if(received!==size)fail('Incomplete release file');fs.fsyncSync(fd);fs.closeSync(fd);fd=null;const hex=digest.digest('hex');
   verifyDigest(req,hex,publisher.id,publisher.public_key,this.db,15*60000);
   if(feed){if(!/^version: \d+\.\d+\.\d+$/m.test(fs.readFileSync(temporary,'utf8')))fail('Invalid update feed');fs.renameSync(temporary,target);}
   else if(fs.existsSync(target)){const existing=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(target))existing.update(chunk);if(existing.digest('hex')!==hex)fail('Release file already published with different content; publish a new version',409);}
   else fs.linkSync(temporary,target);
   this.store.event('release.file.uploaded',null,null,'',name);return{name,sha256:hex,size};
  }finally{if(fd!==null)fs.closeSync(fd);fs.rmSync(temporary,{force:true});}
 }
 // Registers an uploaded installer as the downloadable release for its platform and architecture.
 async register(req,data){
  const publisher=this.publisher(req);verifyRequest(req,req.rawBody,publisher.id,publisher.public_key,this.db);
  const platform=data?.platform,arch=data?.arch;if(!['mac','win'].includes(platform)||!['x64','arm64'].includes(arch)||(platform==='win'&&arch!=='x64'))fail('Unsupported platform or architecture');
  const source=path.join(this.directory,`LOMVIKO-${data.version}-${platform}-${arch}.${platform==='mac'?'dmg':'exe'}`),target=this.updates.file(data.version,platform,arch);
  if(!fs.existsSync(source))fail('Upload the installer before registering the release',409);
  if(!fs.existsSync(target))fs.linkSync(source,target);
  const result=await this.updates.register({version:data.version,platform,arch,notes:typeof data.notes==='string'?data.notes:''});
  this.store.event('release.published.by.key',null,null,platform,`${data.version} ${publisher.name}`);return result;
 }
}
module.exports={ReleasePublishing,fingerprint};
