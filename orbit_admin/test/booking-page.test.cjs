const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../owner/server.cjs');
const PNG='data:image/png;base64,'+Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000'+'1f15c4890000000a49444154789c6300010000050001'+'0d0a2db40000000049454e44ae426082','hex').toString('base64');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-booking-page-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Owner',email:'owner@example.test',business:'Studio',days:14,max_devices:2});
 const company=server.accounts.addBusiness(user,'Studio <Olena>'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(company),runtime=server.accounts.businesses.get(business),{store}=runtime;
 store.set('business','Studio <Olena>');store.set('work_days',[1,2,3,4,5,6,7]);store.set('timezone','UTC');store.set('phone','+380671112233');
 const service=store.addService({name:'Стрижка',duration:60,price:850,capacity:1,required_resources:1,web_visible:true,bot_visible:true}),hidden=store.addService({name:'Private',duration:30,price:1,capacity:1,required_resources:1,web_visible:false,bot_visible:false});
 const olena=store.addResource({name:'Олена'}),iryna=store.addResource({name:'Ірина'});
 const date=new Date(Date.now()+2*86400000).toISOString().slice(0,10),start=store.slots(service,'any',date)[0];assert(start);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const root='http://127.0.0.1:'+server.address().port,page=server.accounts.bookingPage;
 const get=async p=>{const r=await fetch(root+p);return{status:r.status,headers:r.headers,text:await r.text()};};
 const post=async(p,body)=>{const r=await fetch(root+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return{status:r.status,value:await r.json()};};
 const token=(slug='studio-olena',age=5000)=>page.token(slug,Date.now()-age);
 const booking=(extra={})=>({token:token(),request_id:crypto.randomUUID(),name:'Марія',phone:'+380 67 123 45 67',consent:true,service_id:service,resource_id:'any',start,...extra});
 return{owner,server,store,runtime,business,company,service,hidden,olena,iryna,date,start,get,post,page,token,booking,user};
}
test('The owner picks a free address; reserved, malformed and taken addresses are refused',async t=>{
 const f=await fixture(t),{page,business,runtime}=f;
 for(const slug of['ab','-studio','Studio Olena','studio--olena','embed','x'.repeat(41)])assert.throws(()=>page.save(business,runtime,{slug}),e=>e.status>=400);
 assert.throws(()=>page.save(business,runtime,{enabled:true}),{status:400});
 const s=page.save(business,runtime,{slug:'studio-olena',enabled:true,style:'warm',color:'#AA3366',about:'Затишна студія',instagram:'https://instagram.com/studio.olena/'});
 assert.equal(s.url.endsWith('/b/studio-olena'),true);assert.equal(s.style,'warm');assert.equal(s.color,'#aa3366');assert.equal(s.instagram,'studio.olena');
 const other=f.server.accounts.addBusiness(f.user,'Other'),otherBusiness=f.owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(other);
 assert.throws(()=>page.save(otherBusiness,f.server.accounts.businesses.get(otherBusiness),{slug:'studio-olena'}),{status:409});
 page.save(business,runtime,{slug:'olena'});assert.equal(page.slug(business.id),'olena');
 page.save(otherBusiness,f.server.accounts.businesses.get(otherBusiness),{slug:'studio-olena'});
 assert.throws(()=>page.save(business,runtime,{style:'neon'}),{status:400});assert.throws(()=>page.save(business,runtime,{color:'red'}),{status:400});
});
test('The page shows only when enabled, escapes the company name and never runs inline code',async t=>{
 const f=await fixture(t);f.page.save(f.business,f.runtime,{slug:'studio-olena'});
 assert.equal((await f.get('/b/studio-olena')).status,404);
 f.page.save(f.business,f.runtime,{enabled:true,style:'lux',color:'#c9a45c'});
 const r=await f.get('/b/studio-olena');assert.equal(r.status,200);
 assert(!r.text.includes('Studio <Olena>'));assert(r.text.includes('Studio &lt;Olena&gt;'));assert(r.text.includes('class="style-lux"'));
 assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.match(r.headers.get('content-security-policy'),/frame-ancestors \*/);
 const config=JSON.parse(/<script type="application\/json" id="config">(.*?)<\/script>/s.exec(r.text)[1]);assert.equal(config.name,'Studio <Olena>');assert.equal(config.phone,'+380671112233');
 for(const file of['booking.js','booking.css','embed.js'])assert.equal((await f.get('/b/static/'+file)).status,200);
 assert.equal((await f.get('/b/embed.js')).status,200);assert.equal((await f.get('/b/nobody-here')).status,404);
 const catalog=JSON.parse((await f.get('/b/studio-olena/catalog')).text);assert.deepEqual(catalog.services.map(s=>s.id),[f.service]);
 // Expired access closes the page.
 f.owner.db.prepare('UPDATE users SET expires=? WHERE id=?').run(Date.now()-1,f.user);assert.equal((await f.get('/b/studio-olena')).status,404);
});
test('A client books once; bots, stale pages, taken times and double taps are handled',async t=>{
 const f=await fixture(t);f.page.save(f.business,f.runtime,{slug:'studio-olena',enabled:true});
 assert.equal((await f.post('/b/studio-olena/book',f.booking({token:undefined}))).status,400);
 assert.equal((await f.post('/b/studio-olena/book',f.booking({token:f.token('studio-olena',100)}))).status,400,'posted instantly');
 assert.equal((await f.post('/b/studio-olena/book',f.booking({token:f.token('studio-olena',13*3600000)}))).status,400,'page open for half a day');
 assert.equal((await f.post('/b/studio-olena/book',f.booking({token:f.token('other-salon')}))).status,400,'token of another page');
 assert.equal((await f.post('/b/studio-olena/book',f.booking({website:'http://spam'}))).status,400,'hidden field filled');
 assert.equal((await f.post('/b/studio-olena/book',f.booking({service_id:f.hidden}))).status,400,'private service');
 assert.equal((await f.post('/b/studio-olena/book',f.booking({consent:false}))).status,400);
 const body=f.booking(),first=await f.post('/b/studio-olena/book',body);assert.equal(first.status,201);assert.equal(first.value.start,f.start);assert.equal(first.value.service,'Стрижка');
 assert.equal((await f.post('/b/studio-olena/book',body)).status,200,'double tap returns the same visit');
 const visits=f.store.snapshot().appointments;assert.equal(visits.length,1);assert.equal(visits[0].client_name,'Марія');
 // Two specialists: the second client on the same time gets the other one, the third is refused.
 assert.equal((await f.post('/b/studio-olena/book',f.booking({name:'Оксана',phone:'+380501112233'}))).status,201);
 const third=await f.post('/b/studio-olena/book',f.booking({name:'Ліна',phone:'+380631112233'}));assert.equal(third.status,409);assert.match(third.value.error,/Цей час щойно зайняли/);
 const slots=JSON.parse((await f.get(`/b/studio-olena/catalog?service_id=${f.service}&date=${f.date}`)).text).slots;assert(!slots.includes(f.start));
 // The salon cancels: the time is free again.
 f.store.status(visits[0].id,'cancelled');
 assert(JSON.parse((await f.get(`/b/studio-olena/catalog?service_id=${f.service}&date=${f.date}`)).text).slots.includes(f.start));
});
test('Logo and cover accept real images only and are served with their own type',async t=>{
 const f=await fixture(t);f.page.save(f.business,f.runtime,{slug:'studio-olena',enabled:true});
 assert.throws(()=>f.page.save(f.business,f.runtime,{cover:'data:image/png;base64,'+Buffer.from('<svg onload=alert(1)>').toString('base64')}),{status:400});
 assert.throws(()=>f.page.save(f.business,f.runtime,{logo:PNG.replace('image/png','image/jpeg')}),{status:400});
 const s=f.page.save(f.business,f.runtime,{cover:PNG,logo:PNG});assert.equal(s.cover,true);assert.equal(s.logo,true);
 const cover=await fetch((await f.get('/b/studio-olena')).status&&`http://127.0.0.1:${f.server.address().port}/b/studio-olena/cover`);assert.equal(cover.headers.get('content-type'),'image/png');
 f.page.save(f.business,f.runtime,{cover:null});assert.equal((await f.get('/b/studio-olena/cover')).status,404);
});
test('Deleting the account frees its booking address',async t=>{
 const f=await fixture(t);f.page.save(f.business,f.runtime,{slug:'studio-olena',enabled:true});
 const {AccountDeletion}=require('../owner/account-deletion.cjs');
 const deletion=f.server.accounts.deletion;
 deletion.delete(f.user);
 assert.equal(f.owner.db.prepare('SELECT count(*) n FROM booking_pages').get().n,0);
});
