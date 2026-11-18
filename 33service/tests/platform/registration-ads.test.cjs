const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../../../platform/web/app/ads.js'),'utf8');
function browser(){const scripts=[],window={};vm.runInNewContext(code,{window,document:{createElement:()=>({}),head:{append:s=>scripts.push(s)}}});return{window,scripts};}
test('Registration conversion is opt-in, contains no CRM data and fires once',()=>{
 const {window,scripts}=browser();window.OrbitAds.configure(null);window.OrbitAds.registrationComplete();assert.equal(scripts.length,0);
 window.OrbitAds.configure({registrationSendTo:'AW-123/registration_label'});assert.equal(scripts.length,1);assert.equal(scripts[0].src,'https://www.googletagmanager.com/gtag/js?id=AW-123');
 window.OrbitAds.registrationComplete();window.OrbitAds.registrationComplete();
 assert.ok(window.dataLayer.every(x=>Object.prototype.toString.call(x)==='[object Arguments]'),'Google tag commands must use the documented arguments format');
 const events=window.dataLayer.filter(x=>x[0]==='event');assert.equal(events.length,1);assert.equal(events[0][1],'conversion');assert.deepEqual(JSON.parse(JSON.stringify(events[0][2])),{send_to:'AW-123/registration_label'});
 assert.deepEqual(JSON.parse(JSON.stringify(window.dataLayer.find(x=>x[0]==='set'&&x[1]==='linker')[2].domains)),['lomviko.com','app.lomviko.com']);
});
test('Malformed conversion targets do not load third party code',()=>{const {window,scripts}=browser();for(const registrationSendTo of ['https://evil.test','AW-123','AW-123/ok?email=private'])window.OrbitAds.configure({registrationSendTo});assert.equal(scripts.length,0);});
test('Opening registration preserves Google attribution parameters while consuming start',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../../../platform/web/app/web.js'),'utf8');
 const window={},location=new URL('https://app.lomviko.com/?start=register&_gl=linker-value&gclid=click-value#section');let replacement,opened;
 const context={window,location,URL,URLSearchParams,fetch:async()=>({json:async()=>({registration:true})}),history:{replaceState:(a,b,url)=>replacement=url},document:{body:{classList:{contains:()=>false,add(){}}},querySelector:()=>({open:false}),querySelectorAll:()=>[]},setTimeout:fn=>fn(),registrationModal:()=>opened='register',loginModal:()=>opened='login'};
 vm.runInNewContext(code,context);window.OrbitWeb.signedOut();
 const remaining=new URL(replacement,location.origin);assert.equal(remaining.searchParams.has('start'),false);assert.equal(remaining.searchParams.get('_gl'),'linker-value');assert.equal(remaining.searchParams.get('gclid'),'click-value');assert.equal(remaining.hash,'#section');assert.equal(opened,'register');
});

test('Embedded auth closes by a scoped parent message; logout always opens sign-in',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../../platform/web/app/web.js'),'utf8'),messages=[];
 const window={parent:{postMessage:(...args)=>messages.push(args)}},location=new URL('https://app.lomviko.com/?start=register&embed=1');let opened;
 const bodyClasses=new Set(),context={ResizeObserver:class { observe(){} },window,location,URL,URLSearchParams,fetch:async()=>({json:async()=>({registration:true})}),history:{replaceState(){}},document:{documentElement:{classList:{add(){}}},body:{classList:{contains:k=>bodyClasses.has(k),add:k=>bodyClasses.add(k),remove:k=>bodyClasses.delete(k)}},querySelector:()=>({open:false}),querySelectorAll:()=>[]},setTimeout:fn=>fn(),registrationModal:()=>opened='register',loginModal:opts=>opened=opts.afterLogout?'login-after-logout':'login'};
 vm.runInNewContext(source,context);window.OrbitWeb.signedOut({afterLogout:true});assert.equal(opened,'login-after-logout');
 window.OrbitWeb.dismissed();assert.equal(messages[0][0].type,'lomviko:auth-close');assert.equal(messages[0][1],'https://lomviko.com');assert.equal(location.href,'https://app.lomviko.com/?start=register&embed=1');
 window.OrbitWeb.signedIn();assert.equal(messages[1][0].type,'lomviko:authenticated');assert.deepEqual(Object.keys(messages[1][0]),['type']);
});
