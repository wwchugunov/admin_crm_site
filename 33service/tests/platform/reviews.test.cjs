const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');
const {Telegram}=require('../../../platform/core/integrations.cjs');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-reviews-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Олена',email:'olena@example.test',business:'Ліра',days:30,max_devices:2});
 const id=server.accounts.addBusiness(user,'Ліра'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id),runtime=server.accounts.businesses.get(business),store=runtime.store;
 store.set('business','Ліра');store.set('timezone','Europe/Kyiv');store.set('work_start','08:00');store.set('work_end','21:00');store.set('work_days',[1,2,3,4,5,6,7]);
 const sent=[],events=[];runtime.vault.put('telegram','000000:test');runtime.telegram.call=async(m,p)=>{if(m==='sendMessage')sent.push(p);return{};};
 const original=Telegram.onEvent;Telegram.onEvent=(tg,kind,id,extra)=>events.push({kind,id,extra});
 const service=store.addService({name:'Стрижка',duration:60,price:500}),resource=store.addResource({name:'Олена'});
 let n=0;const done=(chat,hoursAgo)=>{const c=store.addClient({name:'Клієнт '+chat,phone:'+38067000000'+chat});store.db.prepare('UPDATE clients SET chat_id=? WHERE id=?').run(String(chat),c);
  const a=store.book({client_id:c,service_id:service,resource_ids:[resource],start:Date.parse(new Date(Date.now()+(3+ ++n)*86400000).toISOString().slice(0,10)+'T07:00:00Z')});
  const end=Date.now()-hoursAgo*3600000;store.db.prepare("UPDATE appointments SET start=?,end=?,status='completed' WHERE id=?").run(end-3600000,end,a);return a;};
 const press=(chat,data)=>runtime.telegram.handle({update_id:1,callback_query:{id:'q',data,from:{id:chat},message:{chat:{id:chat,type:'private'}}}});
 t.after(async()=>{Telegram.onEvent=original;await server.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 return{store,runtime,sent,events,done,press,bot:runtime.telegram};
}
test('After a visit the bot asks for a rating once; 5 stars lead to Google, 2 stars go to the team',async t=>{
 const f=await fixture(t);
 assert.throws(()=>f.store.setReviews({enabled:true}),/посилання/);
 const happy=f.done(11,3),unhappy=f.done(12,5);f.done(13,1);f.done(14,30);
 await f.bot.reviews();assert.equal(f.sent.length,0,'off until switched on');
 f.store.setReviews({enabled:true,url:'https://g.page/r/lira/review'});
 await f.bot.reviews();
 assert.deepEqual(f.sent.map(m=>m.chat_id).sort(),['11','12'],'only visits 2–24 hours old');
 assert.equal(f.sent[0].reply_markup.inline_keyboard[0].length,5);
 await f.bot.reviews();assert.equal(f.sent.length,2,'asked once');
 await f.press(11,`rv:${happy}:5`);assert.equal(f.sent.at(-1).reply_markup.inline_keyboard[0][0].url,'https://g.page/r/lira/review');
 await f.press(12,`rv:${unhappy}:2`);assert.deepEqual(f.events.at(-1),{kind:'review',id:unhappy,extra:{rating:2}});
 assert.equal(f.store.visits('a.id=?',[happy])[0].rating,5);
 await f.press(11,`rv:${happy}:1`);assert.equal(f.store.visits('a.id=?',[happy])[0].rating,5,'the first answer stays');
 await f.press(12,`rv:${happy}:1`);assert.equal(f.events.length,1,'nobody rates someone else’s visit');
});
