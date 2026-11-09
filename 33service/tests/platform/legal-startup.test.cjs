const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../../platform/web/app/views.js'),'utf8');
const body=source.slice(source.indexOf('let legalState = null;'),source.indexOf('// How long the company can still work'));
test('The legal check does not draw the screen before every script has loaded',async()=>{
 const listeners=[];let renders=0;
 const context={document:{readyState:'loading'},window:{addEventListener:(name,fn)=>listeners.push([name,fn]),orbit:{call:async()=>({required:true})}},$:()=>({open:false}),render:()=>{renders++;}};
 vm.createContext(context);vm.runInContext(body+';globalThis.run=loadLegal;',context);
 const done=context.run();await new Promise(r=>setImmediate(r));
 assert.equal(renders,0,'nothing is drawn while scripts are loading');assert.equal(listeners[0][0],'load');
 context.document.readyState='complete';listeners[0][1]();await done;assert.equal(renders,1,'drawn once everything is loaded');
});
