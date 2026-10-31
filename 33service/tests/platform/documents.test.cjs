const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const{setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs'),{totp}=require('../../../platform/api/admin-auth.cjs'),{signRequest,signDigest}=require('../../../platform/core/request-proof.cjs');

const PDF=Buffer.from('%PDF-1.7\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
// A real Word file: legal texts are turned into a web page, so their .docx must contain readable text.
const DOCX=fs.readFileSync(path.join(__dirname,'fixtures','policy.docx'));
const FAKE_DOCX=Buffer.concat([Buffer.from([0x50,0x4b,0x03,0x04]),Buffer.from('word/document.xml')]);
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
 const page=await fetch(f.url+'/public/documents/site-offer/uk');assert.match(page.headers.get('content-type'),/text\/html/,'a legal Word file opens as a web page');
 const html=await page.text();assert.match(html,/<h2>1\. Хто ми<\/h2>/);assert.match(html,/<strong>жирним<\/strong>/);assert.match(html,/<table>/);assert.doesNotMatch(html,/<script/i);
 assert.match(page.headers.get('content-security-policy'),/default-src 'none'/);
 assert.equal((await f.upload(FAKE_DOCX,{kind:'site-offer',filename:'broken.docx'})).status,400,'a Word file without text is refused for a legal page');
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

test('A switched-off document disappears from public links and comes back when switched on',async t=>{
 const f=await fixture(t);
 assert.equal((await f.upload(PDF,{kind:'site-offer',title:'Оферта',filename:'offer.pdf'})).status,201);
 const publicSite=async()=>(await (await fetch(f.url+'/public/site')).json()).documents||{};
 assert(publicSite().then(d=>d['site-offer']));
 assert.equal((await f.call('/admin/documents/switch',{kind:'site-offer',enabled:'no'})).status,400);
 assert.equal((await f.call('/admin/documents/switch',{kind:'site-offer',enabled:false})).status,200);
 assert.equal((await publicSite())['site-offer'],undefined);
 const hidden=await fetch(f.url+'/public/documents/site-offer/uk');
 assert.equal(hidden.status,404);assert.match(hidden.headers.get('content-type'),/text\/html/);assert.match(await hidden.text(),/Документ зараз недоступний/);
 const snapshot=await f.call('/admin/snapshot');assert.deepEqual(snapshot.value.documentsDisabled,['site-offer']);assert.equal(snapshot.value.documents.length,1,'files stay while switched off');
 assert.equal((await f.call('/admin/documents/switch',{kind:'site-offer',enabled:true})).status,200);
 assert((await publicSite())['site-offer'].uk);
 const shown=await fetch(f.url+'/public/documents/site-offer/uk');assert.equal(shown.status,200);assert.equal(shown.headers.get('content-type'),'application/pdf');
});

test('The site shows the app privacy policy until a separate site policy is uploaded',async t=>{
 const f=await fixture(t);assert.equal((await fetch(f.url+'/public/documents/site-privacy/uk')).status,404);
 const r=await f.upload(PDF,{kind:'app-privacy'});assert.equal(r.status,201,JSON.stringify(r.value));
 const site=await (await fetch(f.url+'/public/site')).json();assert.equal(site.documents['site-privacy'].uk.path,'/public/documents/site-privacy/uk');
 const file=await fetch(f.url+'/public/documents/site-privacy/uk');assert.equal(file.status,200);assert.deepEqual(Buffer.from(await file.arrayBuffer()),PDF);
});

test('A document keeps a current PDF for the site and a current Word file for editing; replacing one keeps the other',async t=>{
 const f=await fixture(t);
 assert.equal((await f.upload(PDF,{kind:'site-terms',filename:'terms.pdf'})).status,201);
 assert.equal((await f.upload(DOCX,{kind:'site-terms',filename:'terms.docx'})).status,201);
 const list=f.server.documents.list().filter(d=>d.kind==='site-terms');
 assert.deepEqual(list.filter(d=>d.active).map(d=>d.extension).sort(),['docx','pdf'],'both stay current');
 const site=await fetch(f.url+'/public/documents/site-terms/uk');assert.match(site.headers.get('content-type'),/text\/html/,'visitors get the web page');assert.match(await site.text(),/Завантажити PDF/);
 const pdf=await fetch(f.url+'/public/documents/site-terms/uk?file=pdf');assert.equal(pdf.headers.get('content-type'),'application/pdf','the PDF stays one click away');
 assert.equal((await f.upload(DOCX,{kind:'site-terms',filename:'terms-v2.docx'})).status,201);
 const after=f.server.documents.list().filter(d=>d.kind==='site-terms'&&d.active);
 assert.deepEqual(after.map(d=>d.filename).sort(),['terms-v2.docx','terms.pdf'],'a new Word file replaces only the Word file');
});

test('The site shows the one privacy policy even when an old separate site file is still stored',async t=>{
 const f=await fixture(t);
 assert.equal((await f.upload(PDF,{kind:'site-privacy',filename:'old-site.pdf'})).status,201);
 assert.equal((await f.upload(DOCX,{kind:'app-privacy',filename:'policy.docx'})).status,201);
 const page=await fetch(f.url+'/public/documents/site-privacy/uk');assert.match(page.headers.get('content-type'),/text\/html/,'the current policy page, not the old file');
});
