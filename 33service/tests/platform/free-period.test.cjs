const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs'),{PublicSite}=require('../../../platform/api/public-site.cjs');
const {parseHTML}=require('../../../website/node_modules/linkedom');
const DAY=86400000,OLD=Date.parse('2027-03-01T00:00:00+02:00'),NEW=Date.parse('2027-12-01T00:00:00+02:00');
function open(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'free-period-')),keys=setup(directory),store=new ProductStore(path.join(directory,'owner.sqlite')),server=createProductServer({store,...keys}),sales=server.sales;
 t.after(()=>{store.db.close();fs.rmSync(directory,{recursive:true,force:true});});
 const mails=[];sales.mail={accessReady:()=>true,configured:()=>true,settings:()=>({ownerEmail:'me@example.test'}),enqueue:(kind,to,lang,fields,o)=>{if(mails.some(m=>m.dedupe===o?.dedupe))return false;mails.push({kind,to,fields,dedupe:o?.dedupe});return true;}};
 const docs={offer:'<p>Реквізити ФОП</p>',privacy:true,terms:true,enabled:[]};
 sales.documents={current:k=>k==='site-offer'&&docs.offer?{id:'o'}:null,page:()=>docs.offer?{html:docs.offer}:null,pick:k=>k==='site-privacy'?docs.privacy:docs.terms,setEnabled:d=>docs.enabled.push(d)};
 let n=0;const add=(fields={})=>{const id='u'+(++n);store.db.prepare("INSERT INTO users(id,name,email,business,stage,created_at,expires,max_devices) VALUES(?,?,?,?,?,?,?,1)").run(id,'Анна',id+'@example.test','Салон',fields.stage||'trial',Date.now(),fields.expires??store.freeUntil());if(fields.free!==false)store.db.prepare('UPDATE users SET free_period=1 WHERE id=?').run(id);return id;};
 const user=id=>store.db.prepare('SELECT * FROM users WHERE id=?').get(id);
 const ready=(now)=>{store.setSetting('free_until',String(now-DAY));store.setSetting('notice_sent_at',String(now-31*DAY));store.setSetting('confirm_fop','1');store.setSetting('confirm_cash','1');};
 return{store,server,sales,mails,docs,add,user,ready};
}
const fails=(fn,status,re)=>assert.throws(fn,e=>e.status===status&&(!re||re.test(e.message)));
test('The default free period runs until 1 December 2027 and the admin can move it',t=>{
 const f=open(t),now=Date.now();assert.equal(f.store.freeUntil(),NEW);
 const id=f.add({expires:NEW});f.sales.setDate('2028-06-01',now);
 assert.equal(f.store.freeUntil(),Date.parse('2028-06-01T00:00:00+02:00'));assert.equal(f.user(id).expires,f.store.freeUntil());
});
test('The date cannot be moved to less than 30 days ahead or into the past',t=>{
 const f=open(t),now=Date.parse('2027-01-01T12:00:00+02:00');
 fails(()=>f.sales.setDate('2026-01-01',now),400);fails(()=>f.sales.setDate('nonsense',now),400);
 fails(()=>f.sales.setDate('2027-01-10',now),409,/30 днів/);
 f.sales.setDate('2027-03-01',now);assert.equal(f.store.freeUntil(),Date.parse('2027-03-01T00:00:00+02:00'));
});
test('Forgotten date: free accounts stay open and are never deleted, chosen dates still end',t=>{
 const f=open(t),now=Date.now(),free=f.add({expires:now-200*DAY}),chosen=f.add({free:false,expires:now+5*DAY});
 f.sales.hold(now);assert(f.user(free).expires>=now+29*DAY);assert.equal(f.user(chosen).expires,now+5*DAY);
 f.server.retention.mail=null;f.server.retention.tick(now);assert(f.user(free),'not deleted');
});
test('Selling cannot start until every check passes, and says what is missing',t=>{
 const f=open(t),now=Date.now();f.add();
 fails(()=>f.sales.apply({sales:true},now),409,/Безкоштовний період/);assert.equal(f.store.product().sales,false);
 f.ready(now);f.docs.offer='<p>ФОП ПРИКЛАД</p>';fails(()=>f.sales.apply({sales:true},now),409,/оферта/);
 f.docs.offer=null;fails(()=>f.sales.apply({sales:true},now),409,/оферта/);f.docs.offer='<p>Реквізити</p>';
 f.docs.privacy=false;fails(()=>f.sales.apply({sales:true},now),409,/Політика/);f.docs.privacy=true;
 f.store.setSetting('notice_sent_at',String(now-5*DAY));fails(()=>f.sales.apply({sales:true},now),409,/попереджено/);f.store.setSetting('notice_sent_at',String(now-31*DAY));
 f.store.setSetting('confirm_fop','0');fails(()=>f.sales.apply({sales:true},now),409,/ФОП/);f.store.setSetting('confirm_fop','1');
 assert.equal(f.sales.status(now).ready,true);f.sales.apply({sales:true},now);assert.equal(f.store.product().sales,true);
});
test('Turning selling on gives free accounts a week; off keeps them open again; paying clients need confirmation',t=>{
 const f=open(t),now=Date.now();f.ready(now);const free=f.add({expires:now+40*DAY});
 f.sales.apply({sales:true},now);assert.equal(f.user(free).expires,now+7*DAY);assert.deepEqual(f.docs.enabled.at(-1),{kind:'site-offer',enabled:true});
 const paid=f.add({free:false,stage:'active',expires:now+20*DAY});
 fails(()=>f.sales.apply({sales:false},now),409,/заплатили/);assert.equal(f.store.product().sales,true);
 f.sales.apply({sales:false,confirm:true},now);assert.equal(f.store.product().sales,false);assert(f.user(free).expires>=now+29*DAY);assert.equal(f.user(paid).expires,now+20*DAY);assert.deepEqual(f.docs.enabled.at(-1),{kind:'site-offer',enabled:false});
});
test('Registration cannot open without the policy and the terms',t=>{
 const f=open(t);f.store.setProduct('registration',false);f.docs.terms=false;
 fails(()=>f.sales.apply({registration:true}),409,/Умови/);f.docs.terms=true;f.sales.apply({registration:true});assert.equal(f.store.product().registration,true);
});
test('Notice goes once per client and starts the 30 days only once per date',t=>{
 const f=open(t),now=Date.parse('2027-06-01T12:00:00+02:00');f.add();f.add();
 const first=f.sales.notice(now);assert.equal(first.notified,2);assert.equal(f.mails.length,2);assert.match(f.mails[0].fields.lines.join(' '),/199/);
 const again=f.sales.notice(now+DAY);assert.equal(again.notified,0);assert.equal(Number(f.store.setting('notice_sent_at')),now);
});
test('The owner hears about the date and gets a list of ending subscriptions, once a day',t=>{
 const f=open(t),now=NEW-30*DAY+3600000;f.sales.tick(now);assert(f.mails.some(m=>m.to==='me@example.test'&&/через 30 днів/.test(m.fields.subject)),'30-day reminder');
 const f2=open(t),t2=Date.now();f2.store.setProduct('sales',true);f2.add({free:false,stage:'active',expires:t2+6.5*DAY});f2.add({free:false,stage:'active',expires:t2+60*DAY});
 f2.sales.tick(t2);f2.sales.tick(t2+3600000);const lists=f2.mails.filter(m=>m.dedupe.startsWith('owner-subscriptions'));assert.equal(lists.length,1);assert.match(lists[0].fields.lines.join(' '),/u1@example\.test/);assert.doesNotMatch(lists[0].fields.lines.join(' '),/u2@example\.test/);
 const rows=f2.sales.subscriptions(t2);assert.deepEqual(rows.map(r=>r.status),['ending','active']);
 f2.sales.remind('u1',t2);assert(f2.mails.some(m=>m.kind==='trial-ending'&&m.to==='u1@example.test'));
});
test('Stored site texts with the old date and prices are replaced once, edited texts stay',t=>{
 const f=open(t),store=f.store;const row=store.db.prepare('SELECT * FROM site_content WHERE id=1').get(),content=JSON.parse(row.published);
 content.locales.uk.price='199 грн на місяць. До 1 березня 2027 — безкоштовно.';content.locales.uk.faq[0]=['Скільки це коштує?','199 грн на місяць. До 1 березня 2027 — безкоштовно.'];content.locales.uk.faq[1]=['Що буде після пробного періоду?','Без оплати зміни зупиняються.'];content.locales.uk.faq[2]=['Моє питання','Моя відповідь'];content.locales.en.title='My edited title';
 store.db.prepare('UPDATE site_content SET published=?,draft=? WHERE id=1').run(JSON.stringify(content),JSON.stringify(content));new PublicSite(store);
 for(const column of ['published','draft']){const now=JSON.parse(store.db.prepare('SELECT * FROM site_content WHERE id=1').get()[column]),uk=now.locales.uk;assert.doesNotMatch(JSON.stringify(uk.faq.slice(0,2))+uk.price,/березня|199/);assert.deepEqual(uk.faq[2],['Моє питання','Моя відповідь']);assert.equal(now.locales.en.title,'My edited title');}
});
test('Site: free mode shows the date and no prices, past date shows no date, selling shows plans and the owner',()=>{
 const {renderPage}=require('../../../website/render.cjs'),template=fs.readFileSync(path.join(__dirname,'../../../website/public/index.html'),'utf8');
 const plans=[{price:321,uk:'Тест А',en:'A',for:{uk:'Для А',en:'A'},features:[{uk:'Функція А',en:'A'}]},{price:654,uk:'Тест Б',en:'B',popular:true,for:{uk:'Для Б',en:'B'},features:[{uk:'Функція А',en:'A'},{uk:'Функція Б',en:'B'}]}];
 const page=(sales,until)=>parseHTML(renderPage(template,'uk',{product:{sales,registration:true,owner:sales,free_until:until,plans}})).document;
 const free=page(false,Date.parse('2099-12-01T00:00:00+02:00')),all=free.body.textContent;assert.doesNotMatch(all,/р\.\./);
 assert.doesNotMatch(free.querySelector('#start').textContent+free.querySelector('#faq-list').textContent,/321|654|грн/);assert.match(free.querySelector('#site-price-note').textContent,/1 грудня/);assert.match(all,/безкоштовно до 1 грудня/i);assert.equal(free.querySelectorAll('.tier').length,1);assert.match(free.querySelector('#start').textContent,/Функція Б/);assert.match(free.querySelector('#faq-list').textContent,/1 грудня/);
 const past=page(false,Date.now()-DAY);assert.doesNotMatch(past.querySelector('#site-price-note').textContent,/1 грудня|\d{4}/);assert.match(past.querySelector('[data-t="trustOne"]').textContent,/Зараз/);
 const paid=page(true,NEW);assert.equal(paid.querySelectorAll('.tier').length,2);assert.match(paid.querySelector('.tier-price').textContent,/321/);assert.match(paid.querySelector('#site-price').textContent,/Три тарифи/);assert.match(paid.querySelector('#faq-list').textContent,/321 грн/);assert.equal(paid.querySelector('#footer-owner').hidden,false);
});
