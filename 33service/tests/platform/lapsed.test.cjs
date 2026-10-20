const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');
const DAY=86400000;
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-lapsed-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Олена',email:'olena@example.test',business:'Ліра',days:30,max_devices:2});
 const id=server.accounts.addBusiness(user,'Ліра'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id),runtime=server.accounts.businesses.get(business),store=runtime.store;
 store.set('business','Студія Ліра');store.set('timezone','Europe/Kyiv');store.set('work_start','08:00');store.set('work_end','21:00');store.set('work_days',[1,2,3,4,5,6,7]);
 const sent=[];runtime.vault.put('telegram','000000:test');runtime.telegram.call=async(method,payload)=>{if(method==='sendMessage')sent.push(payload);return{};};
 const service=store.addService({name:'Стрижка',duration:60,price:500}),resource=store.addResource({name:'Олена'});
 let n=0;
 // A client whose only completed visit was `days` ago, optionally connected to the bot.
 const client=(name,days,chat)=>{const c=store.addClient({name});if(chat)store.db.prepare('UPDATE clients SET chat_id=? WHERE id=?').run(String(chat),c);
  const start=Date.parse(new Date(Date.now()+(5+ ++n)*DAY).toISOString().slice(0,10)+'T07:00:00Z'),a=store.book({client_id:c,service_id:service,resource_ids:[resource],start});
  store.db.prepare("UPDATE appointments SET start=?,end=?,status='completed' WHERE id=?").run(Date.now()-days*DAY,Date.now()-days*DAY+3600000,a);return c;};
 t.after(async()=>{await server.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 return{server,owner,user,business,runtime,store,sent,client,lapsed:server.accounts.lapsed};
}
const kyivHour=(h)=>{const d=new Date().toISOString().slice(0,10);return Date.parse(`${d}T${String(h-3).padStart(2,'0')}:30:00Z`);};

test('Owners set their own limit and templates; the text greets the client by first name',async t=>{
 const f=await fixture(t);
 assert.throws(()=>f.lapsed.save(f.store,{days:2,templates:[{title:'a',text:'b'}]}),/від 3 до 365/);
 assert.throws(()=>f.lapsed.save(f.store,{days:10,templates:[]}),/шаблонів/);
 const s=f.lapsed.save(f.store,{days:10,rhythm:false,templates:[{id:'soft',title:'М’яко',text:'{name}, ми скучили! {business} чекає вас.'},{title:'Знижка',text:'{ім\'я}, для вас −10% до неділі.'}],auto:true,auto_template:'missing'});
 assert.deepEqual([s.days,s.rhythm,s.templates.length,s.auto,s.auto_template],[10,false,2,true,'soft'],'an unknown automatic template falls back to the first');
 const maria=f.client('Марія Петренко',12,501);f.client('Ірина',5,502);
 assert.deepEqual(f.lapsed.clients(f.store).map(c=>c.id),[maria],'only those past the limit');
 await f.lapsed.invite(f.business,f.runtime,{id:maria,template_id:s.templates[1].id});
 assert.equal(f.sent[0].text,'Марія, для вас −10% до неділі.');assert.equal(f.sent[0].reply_markup.inline_keyboard[0][0].callback_data,'book');
});

test('“Invite all” reaches each absent client with the bot once per absence',async t=>{
 const f=await fixture(t);f.lapsed.save(f.store,{days:10,templates:[{id:'a',title:'A',text:'{name}, повертайтесь у {business}'}]});
 const anna=f.client('Анна',30,601);f.client('Без бота',40);f.client('Нещодавно',3,603);
 assert.deepEqual(await f.lapsed.inviteAll(f.business,f.runtime,{template_id:'a'}),{sent:1});
 assert.equal(f.sent[0].text,'Анна, повертайтесь у Студія Ліра');
 assert.deepEqual(await f.lapsed.inviteAll(f.business,f.runtime,{}),{sent:0},'already invited since the last visit');
 assert.ok(f.store.db.prepare('SELECT invited_at FROM clients WHERE id=?').get(anna).invited_at);
});

test('Automatic invitations go out only when switched on, during the day, and only for companies with access',async t=>{
 const f=await fixture(t);f.client('Олег',30,701);
 await f.lapsed.tick(kyivHour(12));assert.equal(f.sent.length,0,'off by default');
 f.lapsed.save(f.store,{days:14,templates:[{id:'a',title:'A',text:'Привіт, {name}'}],auto:true,auto_template:'a'});
 await f.lapsed.tick(kyivHour(22));assert.equal(f.sent.length,0,'not at night');
 f.owner.db.prepare('UPDATE users SET expires=? WHERE id=?').run(Date.now()-1000,f.user);
 await f.lapsed.tick(kyivHour(12));assert.equal(f.sent.length,0,'not after access ended');
 f.owner.db.prepare('UPDATE users SET expires=? WHERE id=?').run(Date.now()+30*DAY,f.user);
 await f.lapsed.tick(kyivHour(12));assert.equal(f.sent.length,1);assert.equal(f.sent[0].text,'Привіт, Олег');
 await f.lapsed.tick(kyivHour(13));assert.equal(f.sent.length,1,'one invitation per absence');
});
