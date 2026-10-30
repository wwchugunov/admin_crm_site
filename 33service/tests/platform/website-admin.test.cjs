const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),net=require('node:net');
const {createAdminServer}=require('../../../platform/web/admin-server.cjs');
async function port(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
test('Web admin requires login and origin, limits site operations and redacts product data',async()=>{
 const calls=[],api=http.createServer(async(req,res)=>{let body='';for await(const b of req)body+=b;calls.push({route:req.url,body,headers:req.headers});res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url==='/admin/session'?{session:'private-upstream-session',expires:Date.now()+900000}:req.url==='/admin/snapshot'?{website:{revision:1},releases:[],users:[{email:'private@example.test'}],mail:{passwordSet:true},devices:[],businesses:[],events:[]}:{ok:true}));});await new Promise(r=>api.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+await port(),admin=createAdminServer({origin,apiUrl:'http://127.0.0.1:'+api.address().port});await new Promise(r=>admin.listen(Number(new URL(origin).port),'127.0.0.1',r));
 try{
  const page=await fetch(origin);assert.equal(page.status,200);assert.equal(page.headers.get('x-robots-tag'),'noindex, nofollow');
  const send=(route,body,cookie='',from=origin)=>fetch(origin+route,{method:'POST',headers:{Origin:from,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
  assert.equal((await send('/web/call',{channel:'owner:snapshot'})).status,401);
  assert.equal((await send('/web/login',{token:'t'.repeat(40),otp:'123456'},'','https://evil.test')).status,403);
  const login=await send('/web/login',{token:'t'.repeat(40),otp:'123456'});assert.equal(login.status,200);const set=login.headers.get('set-cookie');assert(set.startsWith('ch_site_admin='));assert(set.includes('HttpOnly'));assert(set.includes('SameSite=Strict'));const cookie=set.split(';')[0];assert(!JSON.stringify(await login.json()).includes('private-upstream'));
  const snapshot=await send('/web/call',{channel:'owner:snapshot'},cookie),data=await snapshot.json();assert.equal(data.website.revision,1);assert.deepEqual(data.users,[]);assert(!data.mail);assert(!JSON.stringify(data).includes('private@example.test'));
  const count=calls.length;assert.equal((await send('/web/call',{channel:'owner:user:add',args:[{email:'bad@example.test'}]},cookie)).status,403);assert.equal(calls.length,count);
  assert.equal((await send('/web/call',{channel:'owner:site:publish',args:[{revision:1}]},cookie)).status,200);assert.equal(calls.at(-1).route,'/admin/site/publish');assert(calls.at(-1).headers['x-orbit-proof']);assert.equal(calls.at(-1).headers.authorization,'Bearer private-upstream-session');
  assert.equal((await send('/web/logout',{},cookie)).status,200);assert.equal((await send('/web/call',{channel:'owner:snapshot'},cookie)).status,401);
 }finally{await new Promise(r=>admin.close(r));await new Promise(r=>api.close(r));}
});
test('Public deployments require HTTPS and no arbitrary upstream paths',()=>{assert.throws(()=>createAdminServer({origin:'http://example.test'}));assert.throws(()=>createAdminServer({apiUrl:'https://api.example.test/private'}));});

test('Failed admin sign-ins from one address do not lock out another address',async()=>{
 const api=http.createServer(async(req,res)=>{for await(const _ of req);res.setHeader('Content-Type','application/json');if(req.url==='/admin/session'){res.statusCode=401;return res.end('{"error":"bad"}');}res.end('{}');});await new Promise(r=>api.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+await port(),admin=createAdminServer({origin,apiUrl:'http://127.0.0.1:'+api.address().port});await new Promise(r=>admin.listen(Number(new URL(origin).port),'127.0.0.1',r));
 try{
  const send=(ip)=>fetch(origin+'/web/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Forwarded-For':ip},body:JSON.stringify({token:'t'.repeat(40),otp:'123456'})});
  for(let i=0;i<5;i++)assert.notEqual((await send('203.0.113.9')).status,429);
  assert.equal((await send('203.0.113.9')).status,429,'the guessing address waits');
  assert.notEqual((await send('198.51.100.7')).status,429,'the administrator from another address can still sign in');
 }finally{await new Promise(r=>admin.close(r));await new Promise(r=>api.close(r));}
});
