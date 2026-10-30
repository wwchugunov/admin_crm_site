const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../../../platform/api/server.cjs');
const PNG=Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),Buffer.from('picture')]);
async function fixture(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'site-editor-')),keys=setup(directory),store=new ProductStore(path.join(directory,'owner.sqlite'));const server=createProductServer({store,...keys});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(directory,{recursive:true,force:true});});return{server,site:server.website,url:'http://127.0.0.1:'+server.address().port};}
test('Texts edited on the page and a replaced picture stay in the draft until published, then reach visitors',async t=>{
 const f=await fixture(t),site=f.site;let state=site.admin();
 const content={...state.draft,texts:{uk:{heroTitle:['Новий заголовок','для салону.'],navPrice:'Тарифи'},en:{}}};
 site.save({content,revision:state.revision});state=site.admin();
 assert.deepEqual(state.draft.texts.uk.navPrice,'Тарифи');assert.deepEqual((await (await fetch(f.url+'/public/site')).json()).texts.uk,{},'visitors do not see the draft');
 const picture=site.saveImage('app',PNG,state.revision);assert.equal((await fetch(f.url+'/public/site-image/app')).status,404,'the new picture is not public before publishing');
 site.publish({revision:picture.revision});
 const live=await (await fetch(f.url+'/public/site')).json();assert.equal(live.texts.uk.navPrice,'Тарифи');assert.equal(live.images.app,picture.version);
 const served=await fetch(f.url+'/public/site-image/app');assert.equal(served.status,200);assert.equal(served.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await served.arrayBuffer()),PNG);
});
test('The editor refuses malformed texts, unknown picture slots and files that are not pictures',async t=>{
 const f=await fixture(t),site=f.site,state=site.admin();
 for(const texts of [{uk:{'bad key':'x'},en:{}},{uk:{title:''},en:{}},{uk:{title:'x'.repeat(1001)},en:{}},{uk:{title:['only one']},en:{}},{uk:{title:{a:1}},en:{}}])
  assert.throws(()=>site.save({content:{...state.draft,texts},revision:state.revision}),e=>e.status===400,JSON.stringify(texts));
 assert.throws(()=>site.saveImage('logo',PNG,state.revision),e=>e.status===400);
 assert.throws(()=>site.saveImage('app',Buffer.from('<svg onload=alert(1)>'),state.revision),e=>e.status===400);
 assert.throws(()=>site.saveImage('app',PNG,state.revision-1),e=>e.status===409);
});
test('The renderer applies edited texts of the right shape and ignores anything else',()=>{
 const {renderPage}=require('../../../website/render.cjs'),template=fs.readFileSync(path.join(__dirname,'../../../website/public/index.html'),'utf8');
 const html=renderPage(template,'uk',{texts:{uk:{navPrice:'Тарифи <b>x</b>',heroTitle:['Перша','друга'],priceTitle:'not an array',unknownKey:'x'},en:{}},images:{app:42}});
 assert.match(html,/Тарифи &lt;b&gt;x&lt;\/b&gt;/);assert.match(html,/Перша <em>друга<\/em>/);assert.doesNotMatch(html,/>not an array</);assert.match(html,/Три тарифи./);assert.match(html,/\/public\/site-image\/app\?v=42/);
});
