const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const{setup,ProductStore,createProductServer}=require('../owner/server.cjs'),{totp}=require('../owner/admin-auth.cjs'),{signRequest,signDigest}=require('../src/request-proof.cjs');

const PDF=Buffer.from('%PDF-1.7\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const DOCX=Buffer.concat([Buffer.from([0x50,0x4b,0x03,0x04]),Buffer.from('word/document.xml')]);
const DOC=Buffer.concat([Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]),Buffer.from('legacy word')]);

async function fixture(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'orbit-documents-test-')),keys=setup(directory),store=new ProductStore(path.join(directory,'owner.sqlite')),server=createProductServer({store,...keys});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(directory,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port,pair=crypto.generateKeyPairSync('ed25519'),key=pair.privateKey;
 const otp=totp(fs.readFileSync(path.join(directory,'admin-totp.secret'),'utf8')),public_key=pair.publicKey.export({type:'spki',format:'pem'});
 const login=JSON.stringify({token:keys.adminToken,otp,public_key});
 const session=(await (await fetch(url+'/admin/session',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+keys.adminToken,...signRequest('POST','/admin/session',login,keys.adminToken,key)},body:login})).json()).session;
 const call=async(route,data)=>{const body=data===undefined?undefined:JSON.stringify(data),method=data===undefined?'GET':'POST';const r=await fetch(url+route,{method,headers:{Authorization:'Bearer '+session,...(body?{'Content-Type':'application/json'}:{}),...signRequest(method,route,body,session,key)},body});return{status:r.status,value:await r.json()};};
 const upload=async(bytes,meta,{proof=bytes,token=session}={})=>{const route='/admin/documents/file?'+new URLSearchParams({kind:'site-privacy',language:'uk',title:'Політика',filename:'policy.pdf',...meta}),sha=crypto.createHash('sha256').update(proof).digest('hex');const r=await fetch(url+route,{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Length':String(bytes.length),...signDigest('PUT',route,sha,token,key)},body:bytes});return{status:r.status,value:await r.json()};};
 return{directory,url,server,call,upload,session};
}

test('Documents upload only with a signed admin session and a matching body hash',async t=>{
 const f=await fixture(t);
 assert.equal((await f.upload(PDF,{},{token:'not-a-session-token-at-all'})).status,401);
 assert.equal((await f.upload(PDF,{},{proof:Buffer.from('other bytes')})).status,401);
 assert(!fs.readdirSync(path.join(f.directory,'documents')).length,'rejected uploads leave no files');
 const ok=await f.upload(PDF,{title:'Політика конфіденційності'});
 assert.equal(ok.status,201,JSON.stringify(ok.value));assert.equal(ok.value.active,1);assert.equal(ok.value.extension,'pdf');
 assert.deepEqual(fs.readdirSync(path.join(f.directory,'documents')),[ok.value.id]);
});

test('File signatures, names, kinds, languages and size are validated',async t=>{
 const f=await fixture(t);
 assert.equal((await f.upload(Buffer.from('<script>alert(1)</script>'),{filename:'policy.pdf'})).status,400);
 assert.equal((await f.upload(PDF,{filename:'policy.docx'})).status,400,'PDF bytes renamed to DOCX');
 assert.equal((await f.upload(PDF,{filename:'policy.html'})).status,400);
 assert.equal((await f.upload(PDF,{kind:'secrets'})).status,400);
 assert.equal((await f.upload(PDF,{language:'de'})).status,400);
 assert.equal((await f.upload(PDF,{title:''})).status,400);
 assert.equal((await f.upload(DOCX,{filename:'оферта.docx',kind:'site-offer'})).status,201);
 assert.equal((await f.upload(DOC,{filename:'old.doc',kind:'site-offer',language:'en'})).status,201);
 const big=await fetch(f.url+'/admin/documents/file?kind=presentation&language=uk&title=x&filename=x.pdf',{method:'PUT',headers:{Authorization:'Bearer '+f.session,'Content-Length':String(26*1024*1024)},body:Buffer.alloc(16)}).catch(()=>({status:413}));
 assert.equal(big.status,413);
 assert(!fs.readdirSync(path.join(f.directory,'documents')).some(n=>n.endsWith('.partial')));
});

test('New uploads become current, older versions stay archived and can be restored or deleted',async t=>{
 const f=await fixture(t);
 const first=(await f.upload(PDF,{title:'Версія 1'})).value,second=(await f.upload(Buffer.concat([PDF,Buffer.from('v2')]),{title:'Версія 2'})).value;
 let list=(await f.call('/admin/snapshot')).value.documents;
 assert.deepEqual(list.map(d=>[d.title,d.active]),[['Версія 2',true],['Версія 1',false]]);
 let site=await (await fetch(f.url+'/public/site')).json();
 assert.equal(site.documents['site-privacy'].uk.title,'Версія 2');assert.equal(site.documents['site-privacy'].en.language,'uk','English falls back to Ukrainian');
 assert.equal((await f.call('/admin/documents/activate',{id:first.id,kind:'site-offer'})).status,404,'kind must match the stored document');
 assert.equal((await f.call('/admin/documents/activate',{id:first.id,kind:'site-privacy'})).status,200);
 site=await (await fetch(f.url+'/public/site')).json();assert.equal(site.documents['site-privacy'].uk.title,'Версія 1');
 assert.equal((await f.call('/admin/documents/delete',{id:first.id,kind:'site-privacy'})).status,200);
 list=(await f.call('/admin/snapshot')).value.documents;assert.deepEqual(list.map(d=>[d.title,d.active]),[['Версія 2',true]],'deleting the current version promotes the newest remaining');
 assert(!fs.existsSync(path.join(f.directory,'documents',first.id)));
 assert.equal((await f.call('/admin/documents/delete',{id:second.id,kind:'site-privacy'})).status,200);
 site=await (await fetch(f.url+'/public/site')).json();assert.deepEqual(site.documents,{});
 assert.equal((await fetch(f.url+'/public/documents/site-privacy/uk')).status,404);
});

test('Public downloads serve the current file with safe headers and detect tampering',async t=>{
 const f=await fixture(t);
 const doc=(await f.upload(PDF,{kind:'presentation',title:'Презентація',filename:'LOMVIKO презентація.pdf'})).value;
 const r=await fetch(f.url+'/public/documents/presentation/en');
 assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'application/pdf');assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 assert.match(r.headers.get('content-disposition'),/^inline; filename="LOMVIKO _+.pdf"; filename\*=UTF-8''LOMVIKO%20/);
 assert.deepEqual(Buffer.from(await r.arrayBuffer()),PDF);
 const head=await fetch(f.url+'/public/documents/presentation/uk',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 const word=(await f.upload(DOCX,{kind:'site-offer',filename:'offer.docx'})).value;
 assert.match((await fetch(f.url+'/public/documents/site-offer/uk')).headers.get('content-disposition'),/^attachment;/);
 assert.equal((await fetch(f.url+'/public/documents/../../owner.sqlite/uk')).status,404);
 assert.equal((await fetch(f.url+'/public/documents/unknown/uk')).status,400);
 fs.writeFileSync(path.join(f.directory,'documents',doc.id),Buffer.concat([PDF,Buffer.from('tampered')]));
 assert.equal((await fetch(f.url+'/public/documents/presentation/uk')).status,409);
 const admin=await fetch(f.url+'/admin/documents/file?id='+word.id,{headers:{Authorization:'Bearer '+f.session}});assert.equal(admin.status,401,'archive preview requires a signed request');
});
test('Rejected requests are logged by normalized address for diagnostics',async t=>{
 const f=await fixture(t);
 for(let i=0;i<3;i++)await fetch(f.url+'/v1/crm/snapshot',{headers:{Authorization:'Bearer unknown-session'}});
 await fetch(f.url+'/public/documents/presentation/uk');
 const routes=(await f.call('/admin/snapshot')).value.security.routes;
 assert(routes.some(r=>r.route==='/v1/crm/snapshot'&&r.status===401&&r.count===3),JSON.stringify(routes));
 assert(routes.every(r=>!/[0-9a-f]{8}-[0-9a-f]{4}/.test(r.route)));
});
