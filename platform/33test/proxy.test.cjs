const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {setup,ProductStore,createProductServer}=require('../api/server.cjs');
for(const trustProxy of [false,true])test(`Public rate limits ${trustProxy?'use trusted proxy addresses':'ignore spoofed forwarded headers'}`,async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biz-proxy-')),keys=setup(dir),store=new ProductStore(path.join(dir,'owner.sqlite')),server=createProductServer({store,...keys,trustProxy});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();store.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port+'/v1/info';
 for(let n=0;n<120;n++)assert.equal((await fetch(url,{headers:{'X-Forwarded-For':'192.0.2.1'}})).status,200);
 assert.equal((await fetch(url,{headers:{'X-Forwarded-For':'192.0.2.1'}})).status,429);
 assert.equal((await fetch(url,{headers:{'X-Forwarded-For':'192.0.2.2'}})).status,trustProxy?200:429);
});
