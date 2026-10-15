const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const{setup,ProductStore,createProductServer}=require('../owner/server.cjs'),{signRequest,signDigest}=require('../src/request-proof.cjs');

async function fixture(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'orbit-publish-test-')),keys=setup(directory),store=new ProductStore(path.join(directory,'owner.sqlite')),server=createProductServer({store,...keys});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(directory,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port,pair=crypto.generateKeyPairSync('ed25519');
 const id=server.publishing.add('Test laptop',pair.publicKey.export({type:'spki',format:'pem'}));
 const put=async(name,bytes,{key=pair.privateKey,keyId=id,proof=bytes}={})=>{const route='/publish/file?'+new URLSearchParams({name}),sha=crypto.createHash('sha256').update(proof).digest('hex');const r=await fetch(url+route,{method:'PUT',headers:{Authorization:'Release '+keyId,'Content-Length':String(bytes.length),...signDigest('PUT',route,sha,keyId,key)},body:bytes});return{status:r.status,value:await r.json()};};
 const register=async(data,{key=pair.privateKey,keyId=id}={})=>{const body=JSON.stringify(data),r=await fetch(url+'/publish/release',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Release '+keyId,...signRequest('POST','/publish/release',body,keyId,key)},body});return{status:r.status,value:await r.json()};};
 return{url,server,id,put,register,directory};
}
const feed=(v,file)=>Buffer.from(`version: ${v}\nfiles:\n  - url: ${file}\n    sha512: x\n    size: 1\npath: ${file}\nsha512: x\nreleaseDate: '2026-10-15T00:00:00.000Z'\n`);

test('Only an active release key with a valid proof can upload, and versioned files are immutable',async t=>{
 const f=await fixture(t),exe=Buffer.from('MZ windows installer 1.2.0');
 assert.equal((await f.put('LOMVIKO-1.2.0-win-x64.exe',exe,{key:crypto.generateKeyPairSync('ed25519').privateKey})).status,401);
 assert.equal((await f.put('LOMVIKO-1.2.0-win-x64.exe',exe,{proof:Buffer.from('other')})).status,401);
 assert.equal((await f.put('LOMVIKO-1.2.0-win-x64.exe',exe,{keyId:'0'.repeat(32)})).status,401);
 for(const name of ['../owner.sqlite','LOMVIKO-1.2.0-win-arm64.exe','LOMVIKO-1.2-win-x64.exe','admin.secret','latest-linux.yml'])assert.equal((await f.put(name,exe)).status,400,name);
 assert.equal((await f.put('latest.yml',Buffer.from('not a feed'))).status,400);
 assert.equal((await f.put('LOMVIKO-1.2.0-win-x64.exe',exe)).status,201);
 assert.equal((await f.put('LOMVIKO-1.2.0-win-x64.exe',exe)).status,201,'retrying the same file is safe');
 assert.equal((await f.put('LOMVIKO-1.2.0-win-x64.exe',Buffer.from('MZ tampered'))).status,409);
 assert(!fs.readdirSync(path.join(f.directory,'releases')).some(n=>n.endsWith('.partial')));
 const admin=await fetch(f.url+'/admin/snapshot',{headers:{Authorization:'Release '+f.id}});assert.equal(admin.status,401,'release keys never open the admin API');
});

test('A published version becomes the download, the signed catalog entry and the update feed',async t=>{
 const f=await fixture(t),exe=Buffer.from('MZ windows installer 1.2.0'),dmg=Buffer.from('mac disk image 1.2.0'),zip=Buffer.from('PK mac update 1.2.0');
 assert.equal((await f.register({version:'1.2.0',platform:'win',arch:'x64',notes:'x'})).status,409,'installer must be uploaded first');
 for(const [name,bytes] of [['LOMVIKO-1.2.0-win-x64.exe',exe],['LOMVIKO-1.2.0-win-x64.exe.blockmap',Buffer.from('map')],['LOMVIKO-1.2.0-mac-arm64.dmg',dmg],['LOMVIKO-1.2.0-mac-arm64.zip',zip]])assert.equal((await f.put(name,bytes)).status,201,name);
 assert.equal((await f.register({version:'1.2.0',platform:'win',arch:'arm64'})).status,400);
 assert.equal((await f.register({version:'1.2.0',platform:'win',arch:'x64',notes:'Нова версія'})).status,201);
 assert.equal((await f.register({version:'1.2.0',platform:'mac',arch:'arm64',notes:'Нова версія'})).status,201);
 assert.equal((await f.register({version:'1.2.0',platform:'win',arch:'x64'})).status,409,'versions stay immutable');
 assert.equal((await f.put('latest.yml',feed('1.2.0','LOMVIKO-1.2.0-win-x64.exe'))).status,201);
 const site=await (await fetch(f.url+'/public/site')).json(),win=site.releases.find(r=>r.platform==='win');
 assert.equal(win.version,'1.2.0');assert.equal(win.sha256,crypto.createHash('sha256').update(exe).digest('hex'),'the registered installer is the exact uploaded file');
 assert.deepEqual(Buffer.from(await (await fetch(f.url+win.path)).arrayBuffer()),exe);
 assert.match(await (await fetch(f.url+'/public/updates/latest.yml')).text(),/version: 1\.2\.0/);
 assert.deepEqual(Buffer.from(await (await fetch(f.url+'/public/updates/LOMVIKO-1.2.0-win-x64.exe')).arrayBuffer()),exe);
 f.server.publishing.revoke(f.id);
 assert.equal((await f.put('LOMVIKO-1.2.1-win-x64.exe',exe)).status,401,'revoked keys stop working');
});
