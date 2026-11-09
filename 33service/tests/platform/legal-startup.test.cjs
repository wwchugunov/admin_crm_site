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
test('The app starts drawing only after every script on the page has loaded',()=>{
 const actions=fs.readFileSync(path.join(__dirname,'../../../platform/web/app/actions.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'../../../platform/web/app/index.html'),'utf8');
 const boot=actions.slice(actions.indexOf('The first screen is drawn')-40,actions.indexOf('loadSupport();\n  loadLegal();'));
 assert.match(boot,/readyState !== "complete"[\s\S]*addEventListener\("load"[\s\S]*await refresh\(\)/,'the first refresh waits for the load event');
 const order=name=>html.indexOf(`src="${name}"`);assert(order('actions.js')>0&&order('schedule-free.js')>order('actions.js'),'schedule-free.js loads after the boot code, which is why the wait is needed');
});
