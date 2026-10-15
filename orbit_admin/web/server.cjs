const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {signRequest,signDigest}=require('./request-proof.cjs');
const siteRoutes={ 'owner:site:save':'/admin/site/draft','owner:site:publish':'/admin/site/publish','owner:site:lead':'/admin/site/lead','owner:site:lead:delete':'/admin/site/lead/delete','owner:site:export':'/admin/site/export','owner:release:withdraw':'/admin/releases/withdraw','owner:admin:account':'/admin/account'};
const productRoutes={'owner:user:add':'/admin/users','owner:user:update':'/admin/user','owner:password':'/admin/password','owner:business:add':'/admin/business','owner:invite':'/admin/invite','owner:revoke':'/admin/revoke','owner:demo':'/admin/demo','owner:key:revoke':'/admin/invite/revoke','owner:policy':'/admin/policy','owner:export':'/admin/export','owner:mail:settings':'/admin/mail/settings','owner:mail:verify':'/admin/mail/verify','owner:mail:test':'/admin/mail/test','owner:mail:retry':'/admin/mail/retry','owner:mail:access':'/admin/mail/access','owner:purchase':'/admin/purchase'};
// Panel sessions slide with activity (30 minutes idle) and end 12 hours after sign-in.
const IDLE=30*60000,MAX=12*3600000;
function problem(status,message){throw Object.assign(Error(message),{status});}
function createAdminServer({apiUrl,origin,profile='landing',publicDirectory=path.join(__dirname,'public')}={}){
 const api=new URL(apiUrl||process.env.CH_API_URL||'http://127.0.0.1:4545');if(!['http:','https:'].includes(api.protocol)||api.username||api.password||api.pathname!=='/'||api.search||api.hash)throw Error('CH_API_URL must be an origin');
 const external=new URL(origin||process.env.CH_ADMIN_ORIGIN||'http://127.0.0.1:4548');if(external.pathname!=='/'||external.username||external.password||external.search||external.hash||!(external.protocol==='https:'||(external.protocol==='http:'&&['127.0.0.1','localhost'].includes(external.hostname))))throw Error('CH_ADMIN_ORIGIN requires HTTPS or local loopback');
 const sessions=new Map(),routes={...siteRoutes,...(profile==='product'?productRoutes:{})};
 // Each admin manages only its own public documents: the website admin edits site files, the product admin edits the app policy.
 const documentKinds=profile==='product'?['app-privacy']:['site-privacy','site-offer','presentation'];const ownDocument=kind=>{if(!documentKinds.includes(kind))problem(403,'Document type unavailable in this admin');return kind;};let failures=0,resetAt=Date.now()+900000;
 const cookie=profile==='product'?'ch_product_admin':'ch_site_admin';const getSession=req=>{const value=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookie+'='))?.slice(cookie.length+1);const s=sessions.get(value);if(!s||s.expires<=Date.now()){sessions.delete(value);problem(401,'Sign in again with a new verification code');}s.expires=Math.min(Date.now()+IDLE,s.started+MAX);return s;};
 async function upstream(s,route,body){const raw=body===undefined?'':JSON.stringify(body),method=body===undefined?'GET':'POST';const response=await fetch(api.origin+route,{method,headers:{Authorization:'Bearer '+s.token,...signRequest(method,route,raw,s.token,s.key),...(raw?{'Content-Type':'application/json'}:{})},...(raw?{body:raw}:{}),redirect:'error',signal:AbortSignal.timeout(60000)});const value=await response.json();if(!response.ok)problem(response.status,value.error||'API rejected the operation');return value;}
 async function json(req){let raw='';for await(const b of req){raw+=b;if(Buffer.byteLength(raw)>65536)problem(413,'Request too large');}try{return JSON.parse(raw);}catch{problem(400,'Invalid JSON');}}
 const server=http.createServer(async(req,res)=>{
  const reply=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  try{
   const url=new URL(req.url,external);if(url.pathname.startsWith('/web/')){
    if(req.headers.host!==external.host)problem(403,'Invalid host');
    if(req.method!=='GET'&&req.headers.origin!==external.origin)problem(403,'Invalid origin');
    if(['POST'].includes(req.method)&&!String(req.headers['content-type']||'').startsWith('application/json'))problem(415,'JSON required');
    if(req.method==='POST'&&url.pathname==='/web/login'){
     if(Date.now()>resetAt){failures=0;resetAt=Date.now()+900000;}if(failures>=5)problem(429,'Wait before trying again');failures++;
     const d=await json(req),byPassword=typeof d.login==='string'&&typeof d.password==='string';if(!/^\d{6}$/.test(d.otp||'')||(byPassword?d.login.length<3||d.login.length>254||!d.password||d.password.length>128:typeof d.token!=='string'||d.token.length<32||d.token.length>300))problem(401,'Invalid credentials');
     const key=crypto.generateKeyPairSync('ed25519').privateKey,public_key=crypto.createPublicKey(key).export({type:'spki',format:'pem'}),auth=await upstream({token:byPassword?d.login:d.token,key},'/admin/session',byPassword?{login:d.login,password:d.password,otp:d.otp,public_key}:{token:d.token,otp:d.otp,public_key});
     const id=crypto.randomBytes(32).toString('base64url');for(const[k,v]of sessions)if(v.expires<=Date.now())sessions.delete(k);if(sessions.size>=100)problem(429,'Too many sessions');sessions.set(id,{token:auth.session,key,expires:Date.now()+IDLE,started:Date.now()});failures=0;
     res.setHeader('Set-Cookie',`${cookie}=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${external.protocol==='https:'?'; Secure':''}`);return reply(200,{ok:true});
    }
    const s=getSession(req);
    if(req.method==='POST'&&url.pathname==='/web/logout'){for(const[k,v]of sessions)if(v===s)sessions.delete(k);res.setHeader('Set-Cookie',`${cookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${external.protocol==='https:'?'; Secure':''}`);return reply(200,{ok:true});}
    if(req.method==='GET'&&url.pathname==='/web/session')return reply(200,{ok:true});
    if(req.method==='PUT'&&url.pathname==='/web/upload'){
     const version=url.searchParams.get('version'),platform=url.searchParams.get('platform'),arch=url.searchParams.get('arch');if(!/^\d+\.\d+\.\d+$/.test(version||'')||!['mac','win'].includes(platform)||!['x64','arm64'].includes(arch))problem(400,'Invalid release');
     const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'ch-admin-upload-')),file=path.join(temporary,'installer');let size=0;const hash=crypto.createHash('sha256'),handle=await fs.promises.open(file,'wx',0o600);
     try{try{for await(const b of req){size+=b.length;if(size>512*1024*1024)problem(413,'Installer exceeds 512 MiB');hash.update(b);await handle.write(b);}}finally{await handle.close();}if(!size)problem(400,'Empty installer');
      const route=`/admin/releases/file?version=${version}&platform=${platform}&arch=${arch}`,stream=fs.createReadStream(file);let response;
      try{response=await fetch(api.origin+route,{method:'PUT',headers:{Authorization:'Bearer '+s.token,'Content-Type':'application/octet-stream','Content-Length':String(size),...signDigest('PUT',route,hash.digest('hex'),s.token,s.key)},body:stream,duplex:'half',redirect:'error',signal:AbortSignal.timeout(900000)});}finally{stream.destroy();}
      const result=await response.json();if(!response.ok)problem(response.status,result.error||'Upload rejected');
      await upstream(s,'/admin/releases/register',{version,platform,arch,notes:url.searchParams.get('notes')||''});return reply(200,{ok:true});
     }finally{fs.rmSync(temporary,{recursive:true,force:true});}
    }
    if(req.method==='PUT'&&url.pathname==='/web/document'){
     const q=url.searchParams,meta={kind:ownDocument(q.get('kind')),language:q.get('language')||'',title:q.get('title')||'',filename:q.get('filename')||'',activate:q.get('activate')==='0'?'0':'1'};
     const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'ch-admin-document-')),file=path.join(temporary,'document');let size=0;const hash=crypto.createHash('sha256'),handle=await fs.promises.open(file,'wx',0o600);
     try{try{for await(const b of req){size+=b.length;if(size>25*1024*1024)problem(413,'Document exceeds 25 MiB');hash.update(b);await handle.write(b);}}finally{await handle.close();}if(!size)problem(400,'Empty document');
      const route='/admin/documents/file?'+new URLSearchParams(meta),stream=fs.createReadStream(file);let response;
      try{response=await fetch(api.origin+route,{method:'PUT',headers:{Authorization:'Bearer '+s.token,'Content-Type':'application/octet-stream','Content-Length':String(size),...signDigest('PUT',route,hash.digest('hex'),s.token,s.key)},body:stream,duplex:'half',redirect:'error',signal:AbortSignal.timeout(300000)});}finally{stream.destroy();}
      const result=await response.json();if(!response.ok)problem(response.status,result.error||'Upload rejected');return reply(201,result);
     }finally{fs.rmSync(temporary,{recursive:true,force:true});}
    }
    if(req.method==='GET'&&url.pathname==='/web/document'){
     const id=url.searchParams.get('id')||'';if(!/^[a-f0-9-]{36}$/.test(id))problem(404,'Document not found');const route='/admin/documents/file?'+new URLSearchParams({id,kind:ownDocument(url.searchParams.get('kind'))});
     const response=await fetch(api.origin+route,{headers:{Authorization:'Bearer '+s.token,...signRequest('GET',route,'',s.token,s.key)},redirect:'error',signal:AbortSignal.timeout(120000)});
     if(!response.ok){const value=await response.json().catch(()=>({}));problem(response.status,value.error||'Document unavailable');}
     const headers={'Cache-Control':'no-store','Content-Disposition':'attachment'+(response.headers.get('content-disposition')||'').replace(/^(inline|attachment)/,'')};for(const key of ['content-type','content-length'])if(response.headers.has(key))headers[key]=response.headers.get(key);
     res.writeHead(200,headers);for await(const chunk of response.body)res.write(chunk);return res.end();
    }
    if(req.method==='POST'&&url.pathname==='/web/call'){
     const {channel,args=[]}=await json(req);if(!Array.isArray(args)||args.length>4)problem(400,'Invalid arguments');
     if(channel==='owner:snapshot'){const d=await upstream(s,'/admin/snapshot');const documents=(d.documents||[]).filter(doc=>documentKinds.includes(doc.kind));return reply(200,profile==='product'?{...d,documents,documentKinds,endpoint:process.env.CH_PUBLIC_API_URL||api.origin,local:false}:{website:d.website,releases:d.releases,documents,documentKinds,adminAccount:d.adminAccount,users:[],devices:[],businesses:[],events:[],policies:[],invites:[],endpoint:process.env.CH_PUBLIC_API_URL||api.origin,local:false});}
     let route=routes[channel];if(profile==='product'&&channel?.startsWith('owner:business:')){const type=channel.split(':')[2];if(['config','profile','service','resource'].includes(type))route='/admin/business/'+type+'?business_id='+encodeURIComponent(args[0]);}
     if(channel==='owner:document:activate'||channel==='owner:document:delete'){const d=args[0]||{};ownDocument(d.kind);route=channel==='owner:document:activate'?'/admin/documents/activate':'/admin/documents/delete';}
     if(!route)problem(403,'Operation unavailable in this admin');const get=['owner:export','owner:site:export','owner:business:config'].includes(channel);const body=channel==='owner:key:revoke'?{id:args[0]}:channel==='owner:invite'?{user_id:args[0]}:channel==='owner:revoke'?{device_id:args[0]}:channel?.startsWith('owner:business:')?args[1]:args[0]||{};
     const result=await upstream(s,route,get?undefined:body);return reply(200,channel==='owner:invite'?{...result,endpoint:process.env.CH_PUBLIC_API_URL||api.origin}:result);
    }
    problem(404,'Unknown operation');
   }
   if(req.method!=='GET'||url.search)problem(404,'Not found');const name=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!/^[a-zA-Z0-9_-]+\.(html|css|js|png)$/.test(name))problem(404,'Not found');const file=path.join(publicDirectory,name);if(!fs.existsSync(file))problem(404,'Not found');res.writeHead(200,{'Content-Type':({html:'text/html; charset=utf-8',css:'text/css',js:'application/javascript',png:'image/png'})[name.split('.').pop()],'Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
  }catch(e){if(!res.headersSent)reply(e.status||502,{error:e.status?e.message:'Admin service unavailable'});else res.destroy();}
 });server.on('close',()=>sessions.clear());return server;
}
if(require.main===module){const origin=process.env.CH_ADMIN_ORIGIN||'http://127.0.0.1:4548';createAdminServer({origin,profile:'product'}).listen(Number(process.env.PORT||4548),process.env.HOST||'127.0.0.1');}
module.exports={createAdminServer};
