const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
// Booking page of a company: lomviko.com/b/<address>. The client picks a service, specialist and free
// time and leaves a name and phone; the visit lands in the same calendar as the app and the bot.
// The look is the company's own: logo and phone from the company profile, plus a cover, colour,
// one of four styles, a short description and Instagram. The same page opens from a link, a QR code
// or a "Записатися" button on any website (embed.js shows it in an overlay).
const STYLES=['minimal','warm','lux','bright'];
const RESERVED=new Set(['embed','static','api','admin','app','www','lomviko','book','booking','b','help','support','login']);
const STATIC=path.join(__dirname,'..','web','booking');
const FILES={'booking.js':'text/javascript; charset=utf-8','booking.css':'text/css; charset=utf-8','embed.js':'text/javascript; charset=utf-8'};
const IMAGE=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
function image(dataUrl,limit){
 const m=IMAGE.exec(dataUrl||'');if(!m)return null;const body=Buffer.from(m[2],'base64');if(!body.length||body.length>limit)return null;
 // The declared type must match the file itself, so nothing else can be served as an image.
 const real=body[0]===0x89&&body[1]===0x50?'png':body[0]===0xff&&body[1]===0xd8?'jpeg':body.slice(0,4).toString()==='RIFF'&&body.slice(8,12).toString()==='WEBP'?'webp':null;
 return real===m[1]?{type:'image/'+real,body}:null;
}
class BookingPage{
 constructor({db,accounts,fail,booking,publicUrl}){
  Object.assign(this,{db,accounts,fail,booking,base:(publicUrl||'').replace(/\/$/,'')});
  db.exec('CREATE TABLE IF NOT EXISTS booking_pages(slug TEXT PRIMARY KEY,business_id TEXT NOT NULL UNIQUE,created_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS booking_secret(id INTEGER PRIMARY KEY CHECK(id=1),value TEXT NOT NULL)');
  let row=db.prepare('SELECT value FROM booking_secret WHERE id=1').get();
  if(!row){db.prepare('INSERT OR IGNORE INTO booking_secret VALUES(1,?)').run(crypto.randomBytes(32).toString('base64url'));row=db.prepare('SELECT value FROM booking_secret WHERE id=1').get();}
  this.secret=row.value;
 }
 settings(store){const s=store.get('booking_page')||{};return{enabled:Boolean(s.enabled),style:STYLES.includes(s.style)?s.style:'minimal',color:/^#[0-9a-f]{6}$/i.test(s.color||'')&&s.color.toLowerCase()!=='#5b5bd6'?s.color:'#0a8f74',about:s.about||'',instagram:s.instagram||'',button:s.button||''};}
 slug(businessId){return this.db.prepare('SELECT slug FROM booking_pages WHERE business_id=?').get(businessId)?.slug||null;}
 link(slug,origin=''){return slug?`${this.base||origin}/b/${slug}`:null;}
 // What the app shows in Інтеграції. Without a configured address (local tests) the server's own address is used.
 status(business,runtime,origin=''){const s=this.settings(runtime.store),slug=this.slug(business.id),base=this.base||origin;return{...s,slug,url:slug?`${base}/b/${slug}`:null,base:base?base+'/b/':'',cover:Boolean(runtime.store.get('booking_cover')),logo:Boolean(runtime.store.get('logo'))};}
 save(business,runtime,data,origin=''){
  const store=runtime.store,s=this.settings(store);
  if(data.slug!==undefined){
   const slug=clean(data.slug,41).toLowerCase();
   if(!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)||slug.includes('--'))this.fail(400,'Адреса: 3–40 латинських літер, цифр або дефісів, наприклад studio-olena / Address: 3–40 latin letters, digits or hyphens');
   if(RESERVED.has(slug))this.fail(409,'Ця адреса зарезервована, оберіть іншу / This address is reserved');
   const owner=this.db.prepare('SELECT business_id FROM booking_pages WHERE slug=?').get(slug);
   if(owner&&owner.business_id!==business.id)this.fail(409,'Ця адреса вже зайнята іншою компанією, оберіть іншу / This address is taken');
   this.db.prepare('DELETE FROM booking_pages WHERE business_id=?').run(business.id);
   this.db.prepare('INSERT INTO booking_pages VALUES(?,?,?)').run(slug,business.id,Date.now());
  }
  if(data.style!==undefined&&!STYLES.includes(data.style))this.fail(400,'Невідомий стиль / Unknown style');
  if(data.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(data.color))this.fail(400,'Колір у форматі #RRGGBB / Colour must be #RRGGBB');
  const instagram=data.instagram===undefined?s.instagram:clean(data.instagram,60).replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@/,'').replace(/\/.*$/,'');
  if(instagram&&!/^[A-Za-z0-9._]{1,30}$/.test(instagram))this.fail(400,'Instagram: лише назва профілю, наприклад studio.olena / Instagram: profile name only');
  const next={enabled:data.enabled===undefined?s.enabled:data.enabled===true,style:data.style??s.style,color:(data.color??s.color).toLowerCase(),about:data.about===undefined?s.about:clean(data.about,400),instagram,button:data.button===undefined?s.button:clean(data.button,40)};
  if(next.enabled&&!this.slug(business.id))this.fail(400,'Спочатку вкажіть адресу сторінки / Choose the page address first');
  store.set('booking_page',next);
  if(data.cover!==undefined){
   if(data.cover===null||data.cover==='')store.set('booking_cover',null);
   else{if(!image(data.cover,2*1024*1024))this.fail(400,'Обкладинка: PNG, JPEG або WebP до 2 МБ / Cover: PNG, JPEG or WebP up to 2 MB');store.set('booking_cover',data.cover);}
  }
  if(data.logo!==undefined){
   if(data.logo===null||data.logo==='')store.set('logo',null);
   else{if(!image(data.logo,1024*1024))this.fail(400,'Логотип: PNG, JPEG або WebP до 1 МБ / Logo: PNG, JPEG or WebP up to 1 MB');store.set('logo',data.logo);}
  }
  return this.status(business,runtime,origin);
 }
 forget(businessId){this.db.prepare('DELETE FROM booking_pages WHERE business_id=?').run(businessId);}
 token(slug,at=Date.now()){const sig=crypto.createHmac('sha256',this.secret).update(slug+'.'+at).digest('base64url').slice(0,32);return at+'.'+sig;}
 // The form must have been open for a few seconds and not for days: bots that post directly are refused.
 checkToken(slug,token){
  const [at,sig]=String(token||'').split('.'),time=Number(at);
  if(!Number.isSafeInteger(time)||!sig)return false;
  const own=Buffer.from(this.token(slug,time).split('.')[1]),given=Buffer.from(sig);
  if(own.length!==given.length||!crypto.timingSafeEqual(own,given))return false;
  const age=Date.now()-time;return age>=2500&&age<=12*3600000;
 }
 company(slug){
  const row=this.db.prepare('SELECT business_id FROM booking_pages WHERE slug=?').get(slug);if(!row)return null;
  const business=this.db.prepare('SELECT * FROM businesses WHERE id=?').get(row.business_id);if(!business)return null;
  try{this.accounts.allowed(this.db.prepare('SELECT * FROM users WHERE id=?').get(business.account_id));}catch{return null;}
  const runtime=this.accounts.businesses.get(business),settings=this.settings(runtime.store);
  return settings.enabled?{business,runtime,store:runtime.store,settings}:null;
 }
 // A private link the client keeps to see, move or cancel the visit made on the page.
 links(store){store.db.exec('CREATE TABLE IF NOT EXISTS visit_links(token TEXT PRIMARY KEY,appointment_id TEXT NOT NULL UNIQUE,created_at INTEGER NOT NULL)');}
 visitLink(store,id){this.links(store);const row=store.db.prepare('SELECT token FROM visit_links WHERE appointment_id=?').get(id);if(row)return row.token;const token=crypto.randomBytes(24).toString('base64url');store.db.prepare('INSERT INTO visit_links VALUES(?,?,?)').run(token,id,Date.now());return token;}
 manage(req,res,reply,v,missing){
  const c=this.company(v[1]);if(!c)missing();this.links(c.store);
  const link=c.store.db.prepare('SELECT appointment_id FROM visit_links WHERE token=?').get(v[2]);if(!link)this.fail(404,'Посилання недійсне / The link is not valid');
  const visit=()=>c.store.visits('a.id=?',[link.appointment_id])[0];let a=visit();if(!a)this.fail(404,'Запис не знайдено / Visit not found');
  const open=a.status==='confirmed'&&a.start>Date.now();
  if(!v[3]&&req.method==='GET'){reply(200,{service:a.service_name,service_id:a.service_id,resource:a.resource_name,resource_id:a.resource_id,start:a.start,end:a.end,status:a.status,can_change:open});return true;}
  if(req.method!=='POST')this.fail(405,'Method not allowed');
  if(!open)this.fail(409,'Цей запис уже не можна змінити — зателефонуйте нам / This visit can no longer be changed');
  if(v[3]==='cancel'){c.store.status(a.id,'cancelled');this.accounts.notify?.event(c.business,'cancel',a.id,'page').catch(()=>{});reply(200,{ok:true,status:'cancelled'});return true;}
  const start=Number(req.parsedBody?.start);if(!Number.isSafeInteger(start)||start<=Date.now())this.fail(400,'Оберіть час у майбутньому / Choose a future time');
  const from=a.start,resources=c.store.availableResources(a.service_id,a.resource_id,start);
  if(resources.length!==(a.resources?.length||1))this.fail(409,'Цей час уже зайнятий — оберіть інший / This time was just taken');
  c.store.reschedule({id:a.id,start,resource_ids:resources});this.accounts.notify?.event(c.business,'reschedule',a.id,'page',{from}).catch(()=>{});
  a=visit();reply(200,{ok:true,start:a.start,end:a.end});return true;
 }
 headers(type,extra={}){return{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',...extra};}
 page(res,slug,c,embed){
  const {store,settings}=c,name=store.get('business')||'',phone=store.get('phone')||'',address=store.get('address')||'';
  const bot=c.runtime.vault?.has?.('telegram')?store.get('bot_username'):null;
  const config={slug,name,phone,address,about:settings.about,instagram:settings.instagram,style:settings.style,color:settings.color,logo:Boolean(store.get('logo')),cover:Boolean(store.get('booking_cover')),bot:bot||null,currency:store.get('currency')||'UAH',timezone:store.get('timezone')||'Europe/Kyiv',token:this.token(slug),embed};
  const json=JSON.stringify(config).replace(/</g,'\\u003c');
  const html=`<!doctype html><html lang="uk" class="style-${settings.style}${embed?' embed':''}" style="--accent:${settings.color}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(name)} — онлайн-запис</title><meta name="description" content="${esc(settings.about||'Онлайн-запис: оберіть послугу і зручний час')}"><meta property="og:title" content="${esc(name)} — онлайн-запис">${config.cover?`<meta property="og:image" content="${esc(this.link(slug))}/cover">`:''}<meta name="theme-color" content="${settings.color}"><link rel="stylesheet" href="/b/static/booking.css">${config.logo?`<link rel="icon" href="/b/${slug}/logo">`:''}</head><body><main id="app" aria-live="polite"><noscript>Для запису увімкніть JavaScript або зателефонуйте${phone?': '+esc(phone):''}.</noscript></main><script type="application/json" id="config">${json}</script><script src="/b/static/booking.js" defer></script></body></html>`;
  res.writeHead(200,this.headers('text/html; charset=utf-8',{'Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors *"}));
  res.end(html);
 }
 picture(res,dataUrl){
  const img=image(dataUrl,3*1024*1024);if(!img)this.fail(404,'Зображення немає / No image');
  res.writeHead(200,this.headers(img.type,{'Content-Length':img.body.length,'Cache-Control':'public, max-age=300','Content-Security-Policy':"default-src 'none'; sandbox"}));res.end(img.body);
 }
 async handle(req,url,res,reply){
  const route=url.pathname;if(route!=='/b'&&!route.startsWith('/b/'))return false;
  const file=/^\/b\/(?:static\/)?(booking\.js|booking\.css|embed\.js)$/.exec(route);
  if(file&&req.method==='GET'){
   const body=fs.readFileSync(path.join(STATIC,file[1]));
   res.writeHead(200,this.headers(FILES[file[1]],{'Cache-Control':'public, max-age=300','Access-Control-Allow-Origin':'*','Cross-Origin-Resource-Policy':'cross-origin'}));res.end(body);return true;
  }
  const m=/^\/b\/([a-z0-9-]{3,40})(?:\/(logo|cover|catalog|book|wait))?\/?$/.exec(route);
  const missing=()=>{this.fail(404,'Сторінку запису не знайдено або її вимкнено / Booking page not found');};
  const v=/^\/b\/([a-z0-9-]{3,40})\/visit\/([A-Za-z0-9_-]{32})(?:\/(cancel|move))?$/.exec(route);
  if(v)return this.manage(req,res,reply,v,missing);
  if(!m)missing();
  const c=this.company(m[1]);
  // A person opening a wrong or switched-off link sees a clear page, not an error code.
  if(!c&&!m[2]&&req.method==='GET'){res.writeHead(404,this.headers('text/html; charset=utf-8',{'Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'"}));res.end('<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Сторінку запису не знайдено</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f6f7;color:#18181b;font:16px/1.5 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;padding:24px;box-sizing:border-box}main{max-width:420px;text-align:center}h1{font-size:22px;margin:0 0 8px}p{color:#6b6b76;margin:0}</style></head><body><main><h1>Сторінку запису не знайдено</h1><p>Можливо, в посиланні помилка або салон тимчасово вимкнув онлайн-запис. Зателефонуйте, будь ласка, в салон.</p></main></body></html>');return true;}
  if(!c)missing();
  if(!m[2]&&req.method==='GET'){
   const embed=url.searchParams.get('embed')==='1';
   if(embed||url.searchParams.has('visit'))res.setHeader('X-Robots-Tag','noindex, nofollow');
   this.page(res,m[1],c,embed);return true;
  }
  if(m[2]==='logo'&&req.method==='GET'){this.picture(res,c.store.get('logo'));return true;}
  if(m[2]==='cover'&&req.method==='GET'){this.picture(res,c.store.get('booking_cover'));return true;}
  if(m[2]==='catalog'&&req.method==='GET'){reply(200,this.booking.catalog(c.store,url.searchParams));return true;}
  if(m[2]==='book'&&req.method==='POST'){
   const data=req.parsedBody||{};
   if(data.website)this.fail(400,'Некоректний запит / Invalid request');
   if(!this.checkToken(m[1],data.token))this.fail(400,'Сторінка застаріла — оновіть її і спробуйте ще раз / The page is outdated, reload it');
   const r=this.booking.create(c.business,c.store,{...data,request_id:data.request_id},req.clientAddress||req.socket.remoteAddress,'page');
   const a=c.store.db.prepare('SELECT a.start,a.end,s.name service FROM appointments a JOIN services s ON s.id=a.service_id WHERE a.id=?').get(r.appointment_id);
   const deposit=r.status===201?await this.accounts.deposits?.request(c.business,c.runtime,r.appointment_id).catch(()=>null):null;
   reply(r.status,{ok:true,start:a?.start,end:a?.end,service:a?.service,deposit,manage:a?`${this.base}/b/${m[1]}?visit=${this.visitLink(c.store,r.appointment_id)}`:null});return true;
  }
  if(m[2]==='wait'&&req.method==='POST'){
   const data=req.parsedBody||{};
   if(data.website)this.fail(400,'Некоректний запит / Invalid request');
   if(!this.checkToken(m[1],data.token))this.fail(400,'Сторінка застаріла — оновіть її і спробуйте ще раз / The page is outdated, reload it');
   this.booking.wait(c.business,c.store,data,req.clientAddress||req.socket.remoteAddress);
   reply(201,{ok:true});return true;
  }
  this.fail(405,'Method not allowed');
 }
}
module.exports={BookingPage,STYLES,image};
