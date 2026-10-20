const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),net=require('node:net'),crypto=require('node:crypto');
const {createAdminServer}=require('../server.cjs');
async function port(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
const docs=[{id:'11111111-1111-4111-8111-111111111111',kind:'site-privacy',language:'uk',active:true},{id:'22222222-2222-4222-8222-222222222222',kind:'app-privacy',language:'uk',active:true}];
async function fixture(t,profile){
 const calls=[],api=http.createServer(async(req,res)=>{const chunks=[];for await(const b of req)chunks.push(b);const body=Buffer.concat(chunks);calls.push({route:req.url,method:req.method,body,headers:req.headers});
  if(req.url.startsWith('/admin/documents/file')&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="policy.pdf"'});return res.end('%PDF-1.7');}
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url==='/admin/session'?{session:'upstream-session',expires:Date.now()+900000}:req.url==='/admin/snapshot'?{website:{revision:1},releases:[],documents:docs,users:[],devices:[],businesses:[],events:[]}:{ok:true}));});
 await new Promise(r=>api.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+await port(),admin=createAdminServer({origin,profile,apiUrl:'http://127.0.0.1:'+api.address().port});await new Promise(r=>admin.listen(Number(new URL(origin).port),'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>admin.close(r));await new Promise(r=>api.close(r));});
 const login=await fetch(origin+'/web/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token:'t'.repeat(40),otp:'123456'})}),cookie=login.headers.get('set-cookie').split(';')[0];
 if(!/Max-Age=43200/.test(login.headers.get('set-cookie')))throw Error('panel cookie should last a working day');
 const call=(channel,args)=>fetch(origin+'/web/call',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({channel,args})});
 const upload=(kind,from=origin)=>fetch(origin+'/web/document?'+new URLSearchParams({kind,language:'uk',title:'Політика',filename:'policy.pdf',activate:'1'}),{method:'PUT',headers:{Origin:from,Cookie:cookie},body:Buffer.from('%PDF-1.7 test')});
 return{origin,cookie,calls,call,upload};
}
test('Website admin manages only website documents and signs uploads',async t=>{
 const f=await fixture(t,'landing');
 const snapshot=await (await f.call('owner:snapshot')).json();
 assert.deepEqual(snapshot.documentKinds,['site-privacy','site-offer','presentation']);assert.deepEqual(snapshot.documents.map(d=>d.kind),['site-privacy']);
 assert.equal((await f.upload('app-privacy')).status,403);assert.equal((await f.upload('site-privacy','https://evil.test')).status,403);
 const ok=await f.upload('presentation');assert.equal(ok.status,201);
 const sent=f.calls.find(c=>c.method==='PUT');assert.match(sent.route,/^\/admin\/documents\/file\?kind=presentation&language=uk&title=/);assert.equal(sent.body.toString(),'%PDF-1.7 test');assert.equal(sent.headers.authorization,'Bearer upstream-session');assert(sent.headers['x-orbit-proof']);
 assert.equal((await f.call('owner:document:delete',[{id:docs[1].id,kind:'app-privacy'}])).status,403);
 assert.equal((await f.call('owner:document:activate',[{id:docs[0].id,kind:'site-privacy'}])).status,200);assert(f.calls.some(c=>c.route==='/admin/documents/activate'&&JSON.parse(c.body).kind==='site-privacy'));
 const file=await fetch(f.origin+'/web/document?id='+docs[0].id+'&kind=site-privacy',{headers:{Cookie:f.cookie}});assert.equal(file.status,200);assert.match(file.headers.get('content-disposition'),/^attachment; filename="policy.pdf"/);assert.equal(await file.text(),'%PDF-1.7');
 assert.equal((await fetch(f.origin+'/web/document?id='+docs[1].id+'&kind=app-privacy',{headers:{Cookie:f.cookie}})).status,403);
 assert.equal((await fetch(f.origin+'/web/document?id=x&kind=site-privacy',{headers:{Cookie:f.cookie}})).status,404);
});
test('Product admin manages only the app privacy policy',async t=>{
 const f=await fixture(t,'product');
 const snapshot=await (await f.call('owner:snapshot')).json();assert.deepEqual(snapshot.documentKinds,['app-privacy']);assert.deepEqual(snapshot.documents.map(d=>d.kind),['app-privacy']);
 assert.equal((await f.upload('site-offer')).status,403);assert.equal((await f.upload('app-privacy')).status,201);
 assert.equal((await f.call('owner:document:delete',[{id:docs[1].id,kind:'app-privacy'}])).status,200);
});
test('Document routes require a session',async t=>{
 const f=await fixture(t,'landing');
 assert.equal((await fetch(f.origin+'/web/document?kind=site-privacy&language=uk&title=x&filename=x.pdf',{method:'PUT',headers:{Origin:f.origin},body:'x'})).status,401);
});
test('Panel sign-in forwards email, password and code with a proof bound to the login',async t=>{
 const f=await fixture(t,'landing'),before=f.calls.length;
 const send=body=>fetch(f.origin+'/web/login',{method:'POST',headers:{Origin:f.origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await send({login:'owner@example.test',password:'',otp:'123456'})).status,401);
 assert.equal((await send({login:'owner@example.test',password:'long-password-1',otp:'12'})).status,401);
 assert.equal(f.calls.length,before,'incomplete forms never reach the API');
 const ok=await send({login:'owner@example.test',password:'long-password-1',otp:'123456'});assert.equal(ok.status,200);
 const call=f.calls.at(-1),body=JSON.parse(call.body.toString());
 assert.equal(call.route,'/admin/session');assert.equal(body.login,'owner@example.test');assert.equal(body.password,'long-password-1');assert(!('token' in body));
 assert.equal(call.headers.authorization,'Bearer owner@example.test');assert(call.headers['x-orbit-proof']);
});
