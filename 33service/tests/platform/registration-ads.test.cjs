const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../../../platform/web/app/ads.js'),'utf8');
function browser(){const scripts=[],window={};vm.runInNewContext(code,{window,document:{createElement:()=>({}),head:{append:s=>scripts.push(s)}}});return{window,scripts};}
test('Registration conversion is opt-in, contains no CRM data and fires once',()=>{
 const {window,scripts}=browser();window.OrbitAds.configure(null);window.OrbitAds.registrationComplete();assert.equal(scripts.length,0);
 window.OrbitAds.configure({registrationSendTo:'AW-123/registration_label'});assert.equal(scripts.length,1);assert.equal(scripts[0].src,'https://www.googletagmanager.com/gtag/js?id=AW-123');
 window.OrbitAds.registrationComplete();window.OrbitAds.registrationComplete();
 const events=window.dataLayer.filter(x=>x[0]==='event');assert.equal(events.length,1);assert.equal(events[0][1],'conversion');assert.deepEqual(JSON.parse(JSON.stringify(events[0][2])),{send_to:'AW-123/registration_label'});
 assert.deepEqual(JSON.parse(JSON.stringify(window.dataLayer.find(x=>x[0]==='set'&&x[1]==='linker')[2].domains)),['lomviko.com','app.lomviko.com']);
});
test('Malformed conversion targets do not load third party code',()=>{const {window,scripts}=browser();for(const registrationSendTo of ['https://evil.test','AW-123','AW-123/ok?email=private'])window.OrbitAds.configure({registrationSendTo});assert.equal(scripts.length,0);});
