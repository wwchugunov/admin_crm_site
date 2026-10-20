const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');
const {Telegram}=require('../../../platform/core/integrations.cjs');
const {midnight}=require('../../../platform/api/notify.cjs');
const DAY=86400000,TZ='Europe/Kyiv';
const local=(date,time)=>midnight(date,TZ)+(Number(time.slice(0,2))*60+Number(time.slice(3)))*60000;
const kyiv=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ}).format(ms);
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-notify-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Олена',email:'olena@example.test',business:'Ліра',days:30,max_devices:2});
 const id=server.accounts.addBusiness(user,'Ліра'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id),runtime=server.accounts.businesses.get(business),store=runtime.store;
 store.set('business','Студія «Ліра»');store.set('timezone',TZ);store.set('work_start','09:00');store.set('work_end','19:00');store.set('work_days',[1,2,3,4,5,6,7]);store.set('bot_username','lira_bot');store.set('website_enabled',true);
 const sent=[];runtime.vault.put('telegram','000000:test');
 runtime.telegram.call=async(method,payload)=>{sent.push(payload);return{};};
 runtime.telegram.send=async(chat,text)=>{sent.push({chat_id:String(chat),text});};
 const service=store.addService({name:'Стрижка',duration:60,price:900,capacity:1,required_resources:1,web_visible:true,bot_visible:true}),olena=store.addResource({name:'Олена Коваль'}),iryna=store.addResource({name:'Ірина Мороз'});
 const notify=server.accounts.notify,owner_={id:user,email:'olena@example.test'};
 t.after(()=>{owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 return{server,owner,business,runtime,store,sent,service,olena,iryna,notify,user:owner_};
}
async function linkOwner(f){const {url}=f.notify.link(f.business,f.user);const code=/start=team-(.+)$/.exec(url)[1];await Telegram.onTeamLink(f.runtime.telegram,code,777);return url;}
test('Each team member links their own Telegram through the company bot; stale links are refused',async t=>{
 const f=await fixture(t);
 assert.equal(f.notify.status(f.business,f.user).telegram,false);
 const url=await linkOwner(f);
 assert.match(url,/^https:\/\/t\.me\/lira_bot\?start=team-[A-Za-z0-9_-]{16}$/);
 assert.equal(f.notify.status(f.business,f.user).telegram,true);
 assert.match(f.sent.at(-1).text,/Готово/);
 await Telegram.onTeamLink(f.runtime.telegram,'used-or-wrong',778);
 assert.match(f.sent.at(-1).text,/застаріло/);
 assert.throws(()=>f.notify.save(f.business,f.user,{morning_time:'03:00'}),{status:400});
 assert.equal(f.notify.save(f.business,f.user,{morning_time:'07:30',payment:false}).prefs.morning_time,'07:30');
});
test('The morning summary arrives once at the chosen time with the day, free windows and yesterday',async t=>{
 const f=await fixture(t);await linkOwner(f);f.sent.length=0;
 const tomorrow=kyiv(Date.now()+DAY);
 f.store.book({new_clients:[{name:'Марія',phone:'+380671112233'}],service_id:f.service,resource_ids:[f.olena],start:local(tomorrow,'10:00')});
 f.store.book({new_clients:[{name:'Оксана',phone:'+380501112233'}],service_id:f.service,resource_ids:[f.iryna],start:local(tomorrow,'15:00')});
 await f.notify.tick(local(tomorrow,'07:55'));
 assert.equal(f.sent.length,0,'not before 08:00');
 await f.notify.tick(local(tomorrow,'08:01'));await f.notify.tick(local(tomorrow,'08:02'));
 assert.equal(f.sent.length,1,'exactly once');
 const text=f.sent[0].text;
 assert.match(text,/Записів: 2 · очікується 1[\s ]800 грн/);
 assert.match(text,/Олена Коваль — 1 \(10:00–11:00\)/);
 assert.match(text,/Вільні вікна: .*Олена 08:01–10:00|Вільні вікна: .*Олена 11:00–19:00/);
 assert.equal(f.sent[0].chat_id,'777');
});
test('Online bookings and online payments are announced at once, each only once',async t=>{
 const f=await fixture(t);await linkOwner(f);f.sent.length=0;
 const date=kyiv(Date.now()+2*DAY),start=local(date,'12:00');
 const r=f.server.accounts.websiteBooking.create(f.business,f.store,{request_id:crypto.randomUUID(),name:'Софія',phone:'+380671234599',consent:true,service_id:f.service,resource_id:'any',start},'127.0.0.1');
 await new Promise(r=>setTimeout(r,20));
 assert.match(f.sent.at(-1).text,/Новий запис онлайн\nСофія · \+380671234599\nСтрижка/);
 await f.notify.tick();f.sent.length=0;
 f.store.db.prepare('INSERT INTO payments(id,appointment_id,amount,at,method) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),r.appointment_id,90000,Date.now()+1000,'monobank');
 await f.notify.tick(Date.now()+60000);await f.notify.tick(Date.now()+120000);
 const pays=f.sent.filter(m=>/Оплата monobank/.test(m.text));
 assert.equal(pays.length,1);assert.match(pays[0].text,/900 грн/);
 // Turned off: nothing more.
 f.notify.save(f.business,f.user,{booking:false});f.sent.length=0;
 f.server.accounts.websiteBooking.create(f.business,f.store,{request_id:crypto.randomUUID(),name:'Ліна',phone:'+380631234599',consent:true,service_id:f.service,resource_id:'any',start:local(date,'14:00')},'127.0.0.1');
 await new Promise(r=>setTimeout(r,20));
 assert.equal(f.sent.length,0);
});
test('The Monday report sums last week with load per specialist and the change to the week before',async t=>{
 const f=await fixture(t);await linkOwner(f);f.sent.length=0;
 // Next Monday 09:05 in Kyiv; visits are written directly into the weeks before it.
 let monday=kyiv(Date.now()+DAY);while(new Date(monday+'T12:00:00Z').getUTCDay()!==1)monday=kyiv(Date.parse(monday+'T12:00:00Z')+DAY);
 const add=(date,time,resource,total,status='completed')=>{const id=crypto.randomUUID(),client=f.store.addClient({name:'Клієнт '+id.slice(0,4),phone:'+38067'+String(Math.random()).slice(2,9)}),s=local(date,time);f.store.db.prepare('INSERT INTO appointments(id,client_id,service_id,resource_id,start,end,status,notes,created_at,total,cost,people_count) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,client,f.service,resource,s,s+3600000,status,'',s,total,0,1);f.store.db.prepare('INSERT INTO appointment_clients VALUES(?,?)').run(id,client);f.store.db.prepare('INSERT INTO appointment_resources VALUES(?,?)').run(id,resource);};
 const back=n=>kyiv(Date.parse(monday+'T12:00:00Z')-n*DAY);
 for(let d=1;d<=7;d++){add(back(d),'10:00',f.olena,90000);add(back(d),'12:00',f.olena,90000);}
 add(back(3),'15:00',f.iryna,90000);add(back(2),'16:00',f.iryna,0,'no_show');
 for(let d=8;d<=14;d++)add(back(d),'10:00',f.olena,90000);
 await f.notify.tick(local(monday,'09:05'));
 const report=f.sent.find(m=>/📊/.test(m.text));
 assert(report,'weekly report sent');
 assert.match(report.text,/Виторг: 13[\s ]500 грн \(\+114% до попереднього\)/);
 assert.match(report.text,/неявок: 1/);
 assert.match(report.text,/Олена Коваль — 12[\s ]600 грн, візитів 14, завантаження 20%/);
 await f.notify.tick(local(monday,'09:30'));
 assert.equal(f.sent.filter(m=>/📊/.test(m.text)).length,1);
});
