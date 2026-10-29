// LOMVIKO in the browser (app.lomviko.com).
// The browser holds only HttpOnly cookies; this server keeps no state of its own. The device key
// is derived from a per-browser secret cookie, so one browser is one device seat, and every API
// call to the API is signed here.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {signRequest}=require('../core/request-proof.cjs');
const {encryptBackup}=require('../core/security.cjs');
const VERSION=require('../package.json').version;
const PKCS8=Buffer.from('302e020100300506032b657004220420','hex');
const DEVICE='lv_device',SESSION='lv_session',WEEK=7*86400000,YEAR=365*86400000;
// Channel → company route on the API. "whole" answers are passed on as they come, the rest unwrap {value}.
const CRM={'client:add':'client','client:update':'client/update','client:delete':'client/delete','client:history':'client/history','crm:range':'range',
 'service:add':'service','service:update':'service/update','service:delete':'service/delete','resource:add':'resource','resource:update':'resource/update','resource:delete':'resource/delete',
 'absence:add':'absence','absence:delete':'absence/delete','booking:add':'book','booking:reschedule':'reschedule','visit:update':'visit/update','payment:add':'payment','settings:save':'profile',
 'waitlist:add':'waitlist','waitlist:remove':'waitlist/remove','telegram:disconnect':'telegram/disconnect','monobank:invoice':'monobank/invoice','monobank:cancel':'monobank/cancel',
 'liqpay:connect':'liqpay/connect','liqpay:invoice':'liqpay/invoice','liqpay:cancel':'liqpay/cancel','monobank:disconnect':'monobank/disconnect','liqpay:disconnect':'liqpay/disconnect',
 'expense:add':'expense','expense:delete':'expense/delete','material:add':'material','material:update':'material/update','material:delete':'material/delete','material:move':'material/move',
 'certificate:sell':'certificate','certificate:void':'certificate/void','pass:sell':'pass','pass:void':'pass/void','payroll:get':'payroll','client:import':'client/import','reviews:save':'reviews/save','lapsed:settings':'lapsed/settings','lapsed:invite-all':'lapsed/invite-all',
 'fiscal:connect':'fiscal/connect','fiscal:disconnect':'fiscal/disconnect','fiscal:settings':'fiscal/settings','fiscal:retry':'fiscal/retry',
 'notify:save':'notify/save','notify:unlink':'notify/unlink','notify:test':'notify/test','booking:save':'booking/save','account:user:add':'users/add','account:user:update':'users/update'};
const WHOLE=new Set(['account:user:add','account:user:update']);
// Calls whose single argument is not the request body itself.
const SHAPE={'booking:status':(id,status)=>({id,status}),'lapsed:days':days=>({days}),'lapsed:invite':x=>x&&typeof x==='object'?{id:x.id,template_id:x.template_id}:{id:x},'telegram:connect':token=>({token}),'telegram:link':id=>({id}),'monobank:connect':token=>({token}),'client:history':id=>({id}),'crm:range':r=>({from:r?.from,to:r?.to})};
const SHAPED={'booking:status':'status','lapsed:days':'lapsed/days','lapsed:invite':'lapsed/invite','telegram:connect':'telegram/connect','telegram:link':'telegram/link','monobank:connect':'monobank/connect'};
const TYPES={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'application/javascript; charset=utf-8',woff2:'font/woff2',png:'image/png',svg:'image/svg+xml',webmanifest:'application/manifest+json',txt:'text/plain; charset=utf-8'};
function problem(status,message,extra={}){throw Object.assign(Error(message),{status,...extra});}
const keyFrom=seed=>crypto.createPrivateKey({key:Buffer.concat([PKCS8,seed]),format:'der',type:'pkcs8'});
// One browser is one device per person: several people can share a salon computer.
const userTag=email=>crypto.createHash('sha256').update(String(email||'').trim().toLowerCase()).digest('hex').slice(0,16);
const userKey=(seed,emailOrTag)=>keyFrom(crypto.createHmac('sha256',seed).update(/^[a-f0-9]{16}$/.test(emailOrTag||'')?emailOrTag:userTag(emailOrTag)).digest());
const publicPem=key=>crypto.createPublicKey(key).export({type:'spki',format:'pem'});
function csv(exported){
 // Every table in one CSV with an entity column; spreadsheet formulas are neutralised.
 const cell=v=>{let s=typeof v==='object'?JSON.stringify(v):String(v??'');if(/^[\s]*[=+\-@]/.test(s))s=`'${s}`;return `"${s.replaceAll('"','""')}"`;};
 const lines=['entity,id,data'];for(const[table,rows]of Object.entries(exported.tables))for(const row of rows)lines.push([table,row.id||row.key||row.appointment_id,row].map(cell).join(','));
 return Buffer.from('﻿'+lines.join('\r\n'));
}
function createAppServer({apiUrl,origin,publicApi,publicDirectory=path.join(__dirname,'app')}={}){
 const api=new URL(apiUrl||process.env.CH_API_URL||'http://127.0.0.1:4545');if(!['http:','https:'].includes(api.protocol)||api.pathname!=='/'||api.search||api.username)throw Error('CH_API_URL must be an origin');
 const external=new URL(origin||process.env.CH_WEB_APP_ORIGIN||'http://127.0.0.1:4549');if(external.pathname!=='/'||external.search||external.username||!(external.protocol==='https:'||['127.0.0.1','localhost'].includes(external.hostname)))throw Error('CH_WEB_APP_ORIGIN requires HTTPS or local loopback');
 const apiPublic=(publicApi||process.env.CH_PUBLIC_API_URL||api.origin).replace(/\/$/,''),secure=external.protocol==='https:';
 // Static files are read once: the container image never changes them.
 const files=new Map();
 const add=(name,full)=>{const type=TYPES[name.split('.').pop()];if(!type)return;const body=fs.readFileSync(full);files.set(name,{body,type,etag:'"'+crypto.createHash('sha1').update(body).digest('base64url')+'"'});};
 (function load(dir,prefix){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name),name=prefix+entry.name;if(entry.isDirectory())load(full,name+'/');else add(name,full);}})(publicDirectory,'');
 // Role rules are shared with the API so the browser and the server decide permissions the same way.
 add('staff-rules.js',path.join(__dirname,'..','shared','staff-rules.js'));add('permissions.js',path.join(__dirname,'..','shared','permissions.js'));
 add('industries.js',path.join(__dirname,'..','shared','industries.js'));
 const drafts=new Map();
 const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(p=>p.length===2));
 const cookie=(name,value,maxAge)=>`${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(maxAge/1000)}${secure?'; Secure':''}`;
 function clientAddress(req){const forwarded=String(req.headers['x-forwarded-for']||'').split(',').at(-1).trim();return forwarded||req.socket.remoteAddress||'';}
 function device(req,res,email){let seed;const raw=cookies(req)[DEVICE];if(raw&&/^[A-Za-z0-9_-]{43}$/.test(raw))seed=Buffer.from(raw,'base64url');else{seed=crypto.randomBytes(32);res.appendHeader('Set-Cookie',cookie(DEVICE,seed.toString('base64url'),YEAR));}return {seed,key:userKey(seed,email)};}
 function session(req){const raw=cookies(req)[SESSION]||'',[token,business,user]=raw.split('.');if(!/^[A-Za-z0-9_-]{20,200}$/.test(token||'')||!/^[a-f0-9-]{36}$/.test(business||'')||!/^[a-f0-9]{16}$/.test(user||''))problem(401,'Увійдіть знову / Sign in again',{signedOut:true});const d=cookies(req)[DEVICE];if(!d||!/^[A-Za-z0-9_-]{43}$/.test(d))problem(401,'Увійдіть знову / Sign in again',{signedOut:true});return {token,business,user,key:userKey(Buffer.from(d,'base64url'),user)};}
 async function upstream(req,route,body,s){
  const raw=body===undefined?'':JSON.stringify(body),method=body===undefined?'GET':'POST';
  let response;try{response=await fetch(api.origin+route,{method,headers:{'X-Forwarded-For':clientAddress(req),'User-Agent':'LOMVIKO-web/'+VERSION,...(raw?{'Content-Type':'application/json'}:{}),...(s?{Authorization:'Bearer '+s.token,...signRequest(method,route,raw,s.token,s.key)}:{})},...(raw?{body:raw}:{}),redirect:'error',signal:AbortSignal.timeout(60000)});}catch{problem(503,'Сервер тимчасово недоступний / Server is temporarily unavailable');}
  const value=await response.json().catch(()=>({error:'Сервер повернув некоректну відповідь / Unexpected server reply'}));
  if(!response.ok)problem(response.status,value.error||'Операцію відхилено / Operation rejected',response.status===401&&s?{signedOut:true}:{});return value;
 }
 const crm=(req,s,route,data)=>upstream(req,`/v1/crm/${route}?business_id=${encodeURIComponent(s.business)}`,data,s);
 async function login(req,res,email,password){
  const {key}=device(req,res,email),challenge=await upstream(req,'/v1/auth/challenge',{login:email,password,public_key:publicPem(key)});
  const signature=crypto.sign(null,Buffer.from(JSON.stringify({challenge_id:challenge.challenge_id,nonce:challenge.nonce})),key).toString('base64url');
  const result=await upstream(req,'/v1/auth/login',{challenge_id:challenge.challenge_id,signature,platform:'web',version:VERSION});
  if(!result.businesses?.length)problem(403,'Обліковий запис не має доступу до жодної компанії / This account has no company');
  res.appendHeader('Set-Cookie',cookie(SESSION,`${result.session}.${result.businesses[0].id}.${userTag(email)}`,WEEK));return {ok:true};
 }
 const draftKey=seed=>crypto.createHash('sha256').update(seed).digest('hex');
 async function signedOut(req,res,channel,args){
  if(channel==='account:login'){const[, email,password]=args;if(typeof email!=='string'||typeof password!=='string')problem(400,'Введіть email і пароль / Enter email and password');return login(req,res,email,password);}
  if(channel==='account:register:start'){
   const v=args[0]||{},{key,seed}=device(req,res,v.email);
   const fields={email:v.email,name:v.name,business:v.business,password:v.password,public_key:publicPem(key),timestamp:Date.now(),request_id:crypto.randomUUID(),...(v.accept===true?{accept:true}:{})};
   const signature=crypto.sign(null,Buffer.from(JSON.stringify(fields)),key).toString('base64url');
   const result=await upstream(req,'/v1/register/start',{...fields,signature,language:v.language});
   for(const[k,d]of drafts)if(d.expires<Date.now())drafts.delete(k);if(drafts.size>5000)problem(429,'Спробуйте пізніше / Try again later');
   drafts.set(draftKey(seed),{id:result.registration_id,email:v.email,password:v.password,expires:Date.now()+15*60000});return result;
  }
  if(channel==='account:register:confirm'){
   const {seed}=device(req,res),draft=drafts.get(draftKey(seed));if(!draft||draft.expires<Date.now())problem(400,'Почніть реєстрацію знову / Start the registration again');
   const {key}=device(req,res,draft.email),fields={registration_id:draft.id,code:args[0]},signature=crypto.sign(null,Buffer.from(JSON.stringify(fields)),key).toString('base64url');
   await upstream(req,'/v1/register/confirm',{...fields,signature,language:args[1]==='en'?'en':'uk',version:VERSION});drafts.delete(draftKey(seed));return login(req,res,draft.email,draft.password);
  }
  // Forgot password: a code to the account's email, then a new password and a fresh sign-in.
  if(channel==='account:reset:start'){
   const email=String(args[0]||'').trim().toLowerCase(),{seed}=device(req,res);
   const result=await upstream(req,'/v1/password/reset/start',{email,language:args[1]==='en'?'en':'uk'});
   for(const[k,d]of drafts)if(d.expires<Date.now())drafts.delete(k);if(drafts.size>5000)problem(429,'Спробуйте пізніше / Try again later');
   drafts.set('reset:'+draftKey(seed),{id:result.reset_id,email,expires:Date.now()+15*60000});return {ok:true};
  }
  if(channel==='account:reset:confirm'){
   const {seed}=device(req,res),draft=drafts.get('reset:'+draftKey(seed));if(!draft||draft.expires<Date.now())problem(400,'Надішліть код ще раз / Request a new code');
   const[code,password]=args;const r=await upstream(req,'/v1/password/reset/confirm',{reset_id:draft.id,code:String(code||''),password});drafts.delete('reset:'+draftKey(seed));return login(req,res,r.login||draft.email,password);
  }
  if(channel==='support:contact')return (await upstream(req,'/v1/info')).support||null;
  if(channel==='support:send'&&!cookies(req)[SESSION]){const d=args[0]||{};return upstream(req,'/public/support',{email:d.email,name:d.name,business:d.business,topic:d.topic,message:d.message,language:d.language,details:d.attach?details(req,null,d.error):''});}
  return undefined;
 }
 function details(req,s,error){return [`LOMVIKO web ${VERSION}`,String(req.headers['user-agent']||'').slice(0,300),s?`Компанія: ${s.business}`:'',error?`Остання помилка: ${String(error).slice(0,1000)}`:''].filter(Boolean).join('\n');}
 async function call(req,res,channel,args){
  if(typeof channel!=='string'||!Array.isArray(args)||args.length>4)problem(400,'Invalid call');
  const before=await signedOut(req,res,channel,args);if(before!==undefined)return before;
  const s=session(req);
  if(channel==='snapshot'){
   const o=args[0],known=o&&typeof o.revision==='string'?`&revision=${encodeURIComponent(o.revision)}&from=${encodeURIComponent(String(Number(o.from)))}`:'';
   const d=await upstream(req,`/v1/crm/snapshot?window=1&business_id=${encodeURIComponent(s.business)}${known}`,undefined,s);
   return {...d,mode:'server',offline:false,cached_at:Date.now(),integrations:{...d.integrations,product:{connected:true,loggedIn:true,web:true,user:d.account,businesses:d.businesses,business_id:d.business_id,endpoint:apiPublic,loginAvailable:true,state:'',enforced:true,update:null}}};
  }
  if(CRM[channel]&&!SHAPE[channel]){const r=await crm(req,s,CRM[channel],args[0]&&typeof args[0]==='object'?args[0]:{});return WHOLE.has(channel)?r:r.value;}
  if(SHAPE[channel]){const r=await crm(req,s,CRM[channel]||SHAPED[channel],SHAPE[channel](...args));return r.value;}
  if(channel==='telegram:check'||channel==='account:business:add'){return crm(req,s,channel==='telegram:check'?'telegram/check':'business/add',channel==='telegram:check'?{}:{name:args[0]});}
  if(channel==='notify:link'){const {url}=(await crm(req,s,'notify/link',{})).value;if(!/^https:\/\/t\.me\/[A-Za-z0-9_]{3,64}\?start=team-[A-Za-z0-9_-]{8,64}$/.test(url))problem(502,'Unexpected link');return url;}
  if(channel==='account:users')return upstream(req,`/v1/crm/users?business_id=${encodeURIComponent(s.business)}`,undefined,s);
  if(channel==='account:business'){const me=await upstream(req,'/v1/auth/me',undefined,s);const id=String(args[0]||'');if(!me.businesses.some(b=>b.id===id))problem(403,'Немає доступу до цієї компанії / No access to this company');res.appendHeader('Set-Cookie',cookie(SESSION,`${s.token}.${id}.${s.user}`,WEEK));return true;}
  if(channel==='account:logout'){try{await upstream(req,'/v1/auth/logout',{},s);}catch{}res.appendHeader('Set-Cookie',cookie(SESSION,'',0));return true;}
  if(channel==='account:delete'){const r=await upstream(req,'/v1/account/delete',{password:args[0]},s);res.appendHeader('Set-Cookie',cookie(SESSION,'',0));return r;}
  if(channel==='legal:status')return upstream(req,'/v1/legal/status',undefined,s);
  if(channel==='legal:accept')return upstream(req,'/v1/legal/accept',{offer_version:args[0]?.offer_version,privacy_version:args[0]?.privacy_version,app_version:'web '+VERSION},s);
  if(channel==='support:info'){const me=await upstream(req,'/v1/auth/me',undefined,s);return {email:me.user.email,name:me.user.name,business:me.businesses.find(b=>b.id===s.business)?.name||'',details:details(req,s)};}
  if(channel==='support:send'){const d=args[0]||{};return upstream(req,'/v1/support/create',{email:d.email,name:d.name,business:d.business,topic:d.topic,message:d.message,language:d.language,details:d.attach?details(req,s,d.error):'',parent_id:d.parent_id||undefined},s);}
  if(channel==='support:list')return upstream(req,'/v1/support/list',undefined,s);
  if(channel==='support:reply')return upstream(req,'/v1/support/reply',{id:args[0]?.id,text:args[0]?.text},s);
  if(channel==='support:read')return upstream(req,'/v1/support/read',{id:args[0]},s);
  if(channel==='support:rate')return upstream(req,'/v1/support/rate',{id:args[0]?.id,rating:args[0]?.rating,comment:args[0]?.comment},s);
  problem(404,'Ця дія недоступна у веб-версії / Not available in the web version');
 }
 async function json(req,limit){let raw='';for await(const b of req){raw+=b;if(Buffer.byteLength(raw)>limit)problem(413,'Request too large');}try{return JSON.parse(raw);}catch{problem(400,'Invalid JSON');}}
 const server=http.createServer(async(req,res)=>{
  const reply=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  try{
   const url=new URL(req.url,external);
   if(req.method==='GET'&&url.pathname==='/healthz')return reply(200,{status:'ok'});
   if(url.pathname.startsWith('/web/')){
    if(req.headers.host!==external.host)problem(403,'Invalid host');
    if(req.method!=='POST'||req.headers.origin!==external.origin)problem(403,'Invalid origin');
    if(!String(req.headers['content-type']||'').startsWith('application/json'))problem(415,'JSON required');
    // Whether the public offer is published decides what registration asks people to accept.
    if(url.pathname==='/web/info'){let offer=true;try{const r=await fetch(api.origin+'/v1/legal/current',{redirect:'error',signal:AbortSignal.timeout(5000)});if(r.ok)offer=(await r.json())?.offer?.version!=='off';}catch{}return reply(200,{version:VERSION,api:apiPublic,offer});}
    if(url.pathname==='/web/call'){const {channel,args=[]}=await json(req,4*1024*1024);return reply(200,{value:(await call(req,res,channel,args))??null});}
    if(url.pathname==='/web/export'){
     const {format,password}=await json(req,4096),s=session(req);if(!['json','csv','orbit'].includes(format))problem(400,'Unknown format');
     const exported=await upstream(req,`/v1/crm/export?business_id=${encodeURIComponent(s.business)}`,undefined,s);
     const body=format==='orbit'?encryptBackup(exported,password):format==='csv'?csv(exported):Buffer.from(JSON.stringify(exported,null,2));
     res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':body.length,'Content-Disposition':`attachment; filename="LOMVIKO-${new Date().toISOString().slice(0,10)}.${format}"`,'Cache-Control':'no-store'});return res.end(body);
    }
    problem(404,'Unknown operation');
   }
   if(req.method!=='GET'&&req.method!=='HEAD')problem(405,'Method not allowed');
   const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1)),file=files.get(name);
   if(!file||!/^[a-zA-Z0-9_./-]+$/.test(name)||name.includes('..'))problem(404,'Not found');
   if(req.headers['if-none-match']===file.etag){res.writeHead(304,{ETag:file.etag});return res.end();}
   res.writeHead(200,{'Content-Type':file.type,'Content-Length':file.body.length,ETag:file.etag,'Cache-Control':name==='index.html'?'no-store':'no-cache'});res.end(req.method==='HEAD'?undefined:file.body);
  }catch(e){if(!res.headersSent)reply(e.status||500,{error:e.status?e.message:'Сервіс тимчасово недоступний / Service unavailable',...(e.signedOut?{signedOut:true}:{})});else res.destroy();}
 });
 return server;
}
if(require.main===module)createAppServer().listen(Number(process.env.PORT||4549),process.env.HOST||'127.0.0.1');
module.exports={createAppServer};
