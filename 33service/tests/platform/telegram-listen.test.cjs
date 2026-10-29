const {test}=require('node:test'),assert=require('node:assert/strict');
const {Store}=require('../../../platform/core/store.cjs');
const {Telegram}=require('../../../platform/core/integrations.cjs');

test('On the server a bot answers as soon as a message arrives (long poll), not on the next 10-second cycle',async t=>{
 const store=new Store(':memory:');t.after(()=>store.db.close());
 store.saveProfile({business:'Ліра',industry:'beauty',timezone:'Europe/Kyiv',currency:'UAH',work_start:'09:00',work_end:'20:00',work_days:[1,2,3,4,5,6,7]});
 const vault={has:()=>true,get:()=>'000000:test'},bot=new Telegram(store,vault,{runtime:'server'}),sent=[];
 let delivered=false,polls=0;
 bot.call=async(method,data,override,timeout)=>{
  if(method==='getUpdates'){polls++;assert.equal(data.timeout,25,'long poll');assert(timeout>=30000,'request waits longer than the poll');
   if(!delivered){delivered=true;return[{update_id:7,message:{chat:{id:42,type:'private'},from:{first_name:'Анна'},text:'/start'}}];}
   await new Promise(r=>setTimeout(r,50));return[];}
  if(method==='sendMessage')sent.push(data);return{};
 };
 let allowed=true;const t0=Date.now();bot.listen(()=>allowed);
 while(!sent.length&&Date.now()-t0<2000)await new Promise(r=>setTimeout(r,10));
 assert(sent.length,'answered');assert(Date.now()-t0<1000,'within a second');assert.equal(store.get('telegram_offset'),8);
 allowed=false;bot.closed=true;await new Promise(r=>setTimeout(r,1200));assert.equal(bot.listening,false,'stops when not allowed');
});
