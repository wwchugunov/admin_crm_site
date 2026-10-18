const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../owner/server.cjs');
const {Telegram}=require('../src/integrations.cjs');
const {midnight}=require('../owner/notify.cjs');
const DAY=86400000,TZ='Europe/Kyiv';
const local=(date,time)=>midnight(date,TZ)+(Number(time.slice(0,2))*60+Number(time.slice(3)))*60000;
const kyiv=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ}).format(ms);
// A company with one specialist working 10:00–13:00 (three one-hour times) and a hosted bot whose
// messages are collected instead of being sent to Telegram.
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-wait-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Олена',email:'olena@example.test',business:'Ліра',days:30,max_devices:2});
 const id=server.accounts.addBusiness(user,'Ліра'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id),runtime=server.accounts.businesses.get(business),store=runtime.store;
 store.set('business','Студія «Ліра»');store.set('timezone',TZ);store.set('work_start','10:00');store.set('work_end','13:00');store.set('work_days',[1,2,3,4,5,6,7]);store.set('bot_username','lira_bot');
 const sent=[],events=[];runtime.vault.put('telegram','000000:test');
 runtime.telegram.call=async(method,payload)=>{if(method==='sendMessage')sent.push(payload);return{};};
 const original=Telegram.onEvent;Telegram.onEvent=(telegram,kind,id,extra)=>events.push({kind,id,extra});
 const service=store.addService({name:'Стрижка',duration:60,price:900,capacity:1,required_resources:1,bot_visible:true}),olena=store.addResource({name:'Олена'});
 const client=(name,chat)=>{const c=store.addClient({name,phone:'+38067'+String(chat).padStart(7,'0')});store.db.prepare('UPDATE clients SET chat_id=? WHERE id=?').run(String(chat),c);return c;};
 const press=(chat,data)=>runtime.telegram.handle({update_id:1,callback_query:{id:'q',data,from:{first_name:'X'},message:{chat:{id:chat,type:'private'}}}});
 const buttons=(m)=>(m.reply_markup?.inline_keyboard||[]).flat().map(b=>b.callback_data);
 const day=kyiv(Date.now()+2*DAY);
 t.after(()=>{Telegram.onEvent=original;owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 return{server,business,runtime,store,sent,events,service,olena,client,press,buttons,day,bot:runtime.telegram};
}

test('A reminder offers "I\'ll come", "Reschedule" and "Cancel"; "I\'ll come" marks the visit',async t=>{
 const f=await fixture(t),anna=f.client('Анна',101);
 const id=f.store.book({client_id:anna,service_id:f.service,resource_ids:[f.olena],start:Date.now()+3600000});
 await f.bot.reminders();
 const reminder=f.sent.find(m=>m.chat_id==='101');
 assert.match(reminder.text,/Нагадуємо/);
 assert.deepEqual(f.buttons(reminder),[`ok:${id}`,`mv:${id}`,`cancel:${id}`]);
 await f.press(101,`ok:${id}`);
 assert.match(f.sent.at(-1).text,/Чекаємо на вас/);
 assert.equal(f.store.db.prepare('SELECT client_confirmed FROM appointments WHERE id=?').get(id).client_confirmed,1);
 // Somebody else cannot confirm Anna's visit.
 const ivan=f.client('Іван',102);await f.press(102,`ok:${id}`);
 assert.doesNotMatch(f.sent.at(-1).text,/Чекаємо на вас/);
});

test('"Reschedule" shows the same specialist\'s free times, moves the visit and tells the team the old time',async t=>{
 const f=await fixture(t),anna=f.client('Анна',101);
 const iryna=f.store.addResource({name:'Ірина'});
 const id=f.store.book({client_id:anna,service_id:f.service,resource_ids:[f.olena],start:local(f.day,'10:00')});
 f.store.clientConfirm(id,anna);
 await f.press(101,`mv:${id}`);
 assert.match(f.sent.at(-1).text,/того ж спеціаліста/);
 assert.ok(!f.buttons(f.sent.at(-1)).includes('resources:0'),'the specialist cannot be changed in a move');
 await f.press(101,`d:${f.day}`);
 const times=f.buttons(f.sent.at(-1)).filter(b=>b.startsWith('t:')).map(b=>Number(b.slice(2)));
 assert.deepEqual(times,['11:00','11:30','12:00'].map(x=>local(f.day,x)));
 await f.press(101,`t:${local(f.day,'12:00')}`);
 assert.match(f.sent.at(-1).text,/Перенести запис на цей час/);
 const confirm=f.buttons(f.sent.at(-1)).find(b=>b.startsWith('mvok:'));
 await f.press(101,confirm);
 assert.match(f.sent.at(-1).text,/перенесено/);
 const visit=f.store.db.prepare('SELECT * FROM appointments WHERE id=?').get(id);
 assert.equal(visit.start,local(f.day,'12:00'));
 assert.equal(visit.resource_id,f.olena);
 assert.equal(visit.client_confirmed,0,'the new time is not confirmed yet');
 assert.deepEqual(f.events.at(-1),{kind:'reschedule',id,extra:{from:local(f.day,'10:00')}});
 // The reminders are armed again for the new time.
 assert.equal(f.store.db.prepare("SELECT count(*) n FROM reminder_deliveries WHERE appointment_id=? AND status='pending'").get(id).n,2);
 void iryna;
});

test('A full day offers the nearest free times and the waiting list; a freed time goes to everyone waiting and the first tap wins',async t=>{
 const f=await fixture(t),anna=f.client('Анна',101),ivan=f.client('Іван',102),oksana=f.client('Оксана',103);
 const visits=['10:00','11:00','12:00'].map((time,i)=>f.store.book({new_clients:[{name:'Гість '+i}],service_id:f.service,resource_ids:[f.olena],start:local(f.day,time)}));
 // Anna asks for the full day in the bot.
 await f.press(101,`s:${f.service}`);await f.press(101,'r:any');await f.press(101,`d:${f.day}`);
 const full=f.sent.at(-1);
 assert.match(full.text,/вільного часу немає/);assert.match(full.text,/Найближчий вільний час/);
 const nearest=f.buttons(full).filter(b=>b.startsWith('t:')).map(b=>Number(b.slice(2)));
 assert.equal(nearest.length,3);assert.ok(nearest.every(s=>kyiv(s)>f.day));
 assert.ok(f.buttons(full).includes(`wait:${f.day}`));
 await f.press(101,`wait:${f.day}`);
 assert.match(f.sent.at(-1).text,/в листі очікування/);
 // Ivan joins too; Oksana is added by the administrator in the app.
 await f.press(102,`s:${f.service}`);await f.press(102,'r:any');await f.press(102,`d:${f.day}`);await f.press(102,`wait:${f.day}`);
 f.store.addWait({client_id:oksana,service_id:f.service,resource_id:f.olena,date:f.day});
 assert.equal(f.store.waitlist().length,3);
 // Nothing is new yet: no offers.
 f.sent.length=0;await f.bot.waitlistOffers();assert.equal(f.sent.length,0);
 // 11:00 is cancelled: all three get the offer at once.
 f.store.status(visits[1],'cancelled');f.bot.offersAt=0;await f.bot.waitlistOffers();
 assert.deepEqual(f.sent.map(m=>m.chat_id).sort(),['101','102','103']);
 const offers=[...f.sent],offer=offers.find(m=>m.chat_id==='102');
 assert.match(offer.text,/Звільнився час/);
 const take=f.buttons(offer).find(b=>b.startsWith('wl:'));
 assert.ok(take.endsWith(':'+local(f.day,'11:00')));
 // Each time is offered only once.
 f.sent.length=0;f.bot.offersAt=0;await f.bot.waitlistOffers();assert.equal(f.sent.length,0);
 // Ivan is first.
 await f.press(102,take);
 assert.match(f.sent.at(-1).text,/записані|Booked|запис/i);
 const booked=f.store.db.prepare("SELECT * FROM waitlist WHERE client_id=?").get(ivan);
 assert.equal(booked.status,'booked');assert.ok(booked.appointment_id);
 assert.equal(f.store.db.prepare('SELECT client_id,start FROM appointments WHERE id=?').get(booked.appointment_id).start,local(f.day,'11:00'));
 assert.deepEqual(f.events.at(-1),{kind:'booking',id:booked.appointment_id,extra:{waitlist:true}});
 // Anna is late: the time is gone and she stays on the list.
 const annaTake=f.buttons(offers.find(m=>m.chat_id==='101')).find(b=>b.startsWith('wl:'));
 await f.press(101,annaTake);
 assert.match(f.sent.at(-1).text,/уже забрали/);
 assert.equal(f.store.db.prepare('SELECT status FROM waitlist WHERE client_id=?').get(anna).status,'waiting');
 // "Stop waiting" takes her off the list.
 await f.press(101,'wl-stop:'+f.store.db.prepare('SELECT id FROM waitlist WHERE client_id=?').get(anna).id);
 assert.match(f.sent.at(-1).text,/прибрав/);
 assert.deepEqual(f.store.waitlist().map(w=>w.client_name),['Оксана']);
});

test('The waiting list from the app: a visit booked with wait_id closes the entry; the team route and snapshot',async t=>{
 const f=await fixture(t),anna=f.client('Анна',101);
 const w=f.store.addWait({client_id:anna,service_id:f.service,resource_id:'any',date:f.day,note:'після 11'});
 assert.equal(f.store.addWait({client_id:anna,service_id:f.service,date:f.day}),w,'the same wish is not added twice');
 assert.throws(()=>f.store.addWait({client_id:anna,service_id:f.service,date:'2000-01-01'}),/дату/);
 const snap=f.store.snapshot();
 assert.equal(snap.waitlist.length,1);
 assert.equal(snap.waitlist[0].client_name,'Анна');assert.equal(snap.waitlist[0].note,'після 11');assert.equal(snap.waitlist[0].telegram,true);
 const id=f.store.book({client_id:anna,service_id:f.service,resource_ids:[f.olena],start:local(f.day,'11:00'),wait_id:w});
 assert.equal(f.store.db.prepare('SELECT status,appointment_id FROM waitlist WHERE id=?').get(w).appointment_id,id);
 assert.equal(f.store.waitlist().length,0);
 // Removing an entry that is gone says so.
 assert.throws(()=>f.store.removeWait({id:w}),/листі очікування/);
 // Backups carry the list; an old backup without it still restores.
 const backup=f.store.export();assert.ok(Array.isArray(backup.tables.waitlist));
 delete backup.tables.waitlist;for(const a of backup.tables.appointments)delete a.client_confirmed;
 f.store.restore(backup);
 assert.equal(f.store.db.prepare('SELECT client_confirmed FROM appointments WHERE id=?').get(id).client_confirmed,0);
});

test('Visit rhythm: the usual gap between visits and upcoming visits per client',async t=>{
 const f=await fixture(t),anna=f.client('Анна',101),ivan=f.client('Іван',102);
 const insert=(client,daysAgo,status='completed')=>{const id='v'+client+daysAgo,start=Date.now()-daysAgo*DAY;f.store.db.prepare("INSERT INTO appointments(id,client_id,service_id,resource_id,start,end,status,created_at,total) VALUES(?,?,?,?,?,?,?,?,900)").run(id,client,f.service,f.olena,start,start+3600000,status,start);f.store.db.prepare('INSERT INTO appointment_clients VALUES(?,?)').run(id,client);};
 for(const d of [100,79,58,37])insert(anna,d);
 insert(ivan,40);
 const stats=Object.fromEntries(f.store.snapshot().clients.map(c=>[c.name,c.stats]));
 assert.equal(stats['Анна'].rhythm,21);assert.equal(stats['Анна'].upcoming,0);
 assert.equal(stats['Іван'].rhythm,0,'one visit has no rhythm yet');
 f.store.book({client_id:anna,service_id:f.service,resource_ids:[f.olena],start:local(f.day,'10:00')});
 assert.equal(f.store.snapshot().clients.find(c=>c.name==='Анна').stats.upcoming,1);
 assert.throws(()=>f.store.setLapsedDays(3),/від 7 до 365/);
 f.store.setLapsedDays(45);assert.equal(f.store.snapshot().lapsed_days,45);
});
