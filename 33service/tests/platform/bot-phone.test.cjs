const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');
const DAY=86400000,TZ='Europe/Kyiv';
const kyiv=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ}).format(ms);
// A company with one specialist and a hosted bot whose messages are collected instead of being sent.
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-phone-')),keys=setup(dir),owner=new ProductStore(path.join(dir,'owner.sqlite'));
 const server=createProductServer({store:owner,...keys,allowLocalAdmin:true});
 const user=owner.addUser({name:'Олена',email:'olena@example.test',business:'Ліра',days:30,max_devices:2});
 const id=server.accounts.addBusiness(user,'Ліра'),business=owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id),runtime=server.accounts.businesses.get(business),store=runtime.store;
 store.set('business','Ліра');store.set('timezone',TZ);store.set('work_start','10:00');store.set('work_end','18:00');store.set('work_days',[1,2,3,4,5,6,7]);store.set('bot_username','lira_bot');
 const sent=[];runtime.vault.put('telegram','000000:test');runtime.telegram.call=async(method,payload)=>{if(method==='sendMessage')sent.push(payload);return{};};
 const service=store.addService({name:'Стрижка',duration:60,price:900,capacity:1,required_resources:1,bot_visible:true});store.addResource({name:'Олена'});
 const press=(chat,data)=>runtime.telegram.handle({update_id:1,callback_query:{id:'q',data,from:{id:chat,first_name:'Гість'},message:{chat:{id:chat,type:'private'}}}});
 const say=(chat,message)=>runtime.telegram.handle({update_id:2,message:{chat:{id:chat,type:'private'},from:{id:chat,first_name:'Гість'},...message}});
 const last=()=>sent.at(-1),buttons=m=>(m.reply_markup?.inline_keyboard||[]).flat().map(b=>b.callback_data);
 // Walks the bot from the service list to the confirm button and returns that button.
 const quote=async chat=>{await press(chat,'consent');await press(chat,'book');await press(chat,'s:'+service);await press(chat,'r:any');await press(chat,'d:'+kyiv(Date.now()+2*DAY));await press(chat,buttons(last()).find(b=>b.startsWith('t:')));return buttons(last()).find(b=>b.startsWith('confirm:'));};
 t.after(async()=>{await server.shutdown();owner.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 return{store,sent,press,say,last,quote};
}
const visits=(store,chat)=>store.db.prepare('SELECT a.id FROM appointments a JOIN clients c ON c.id=a.client_id WHERE c.chat_id=?').all(String(chat));

test('Before the first booking the bot asks for the phone and books right after the contact is shared',async t=>{
 const f=await fixture(t),confirm=await f.quote(501);
 await f.press(501,confirm);
 assert.equal(visits(f.store,501).length,0,'nothing is booked without a phone');
 assert.equal(f.last().reply_markup.keyboard[0][0].request_contact,true);
 await f.say(501,{contact:{phone_number:'380671234567',user_id:999}});
 assert.match(f.last().text,/власний номер/,'someone else’s contact is refused');
 await f.say(501,{contact:{phone_number:'380671234567',user_id:501}});
 assert.equal(f.store.db.prepare('SELECT phone FROM clients WHERE chat_id=?').get('501').phone,'+380671234567');
 assert.equal(visits(f.store,501).length,1,'the pending booking is made');
 assert.ok(f.sent.some(m=>m.reply_markup?.remove_keyboard),'the contact keyboard is removed');
 // The next booking does not ask again.
 const again=await f.quote(501);await f.press(501,again);assert.equal(visits(f.store,501).length,2);
});

test('A typed number works too, and a client already in the CRM with that number takes over the chat',async t=>{
 const f=await fixture(t),maria=f.store.addClient({name:'Марія',phone:'+38 (067) 765-43-21'});
 const confirm=await f.quote(502);await f.press(502,confirm);
 await f.say(502,{text:'не скажу'});assert.equal(visits(f.store,502).length,0);
 await f.say(502,{text:'+380 67 765 43 21'});
 const linked=f.store.db.prepare('SELECT * FROM clients WHERE chat_id=?').get('502');
 assert.equal(linked.id,maria,'the existing card is used');assert.equal(linked.phone,'+38 (067) 765-43-21','the CRM phone is kept');
 assert.equal(f.store.db.prepare("SELECT count(*) n FROM clients WHERE name='Гість'").get().n,0,'the empty bot card is removed');
 assert.equal(visits(f.store,502).length,1);
 await f.say(503,{text:'12'});assert.equal(f.store.db.prepare('SELECT count(*) n FROM clients WHERE chat_id=?').get('503').n,0,'unknown chats still get the consent screen');
});
