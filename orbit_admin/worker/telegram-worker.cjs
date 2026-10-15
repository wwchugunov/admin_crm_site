const fs=require('node:fs'),crypto=require('node:crypto');
const config=JSON.parse(fs.readFileSync('/config/worker.json','utf8'));
const botToken=process.env.TELEGRAM_BOT_TOKEN;
if(!/^\d{5,20}:[A-Za-z0-9_-]{20,150}$/.test(botToken||''))throw Error('Set TELEGRAM_BOT_TOKEN in .env');
const origin=new URL(config.api);
if(origin.protocol!=='https:'&&!(origin.protocol==='http:'&&['localhost','127.0.0.1','host.docker.internal'].includes(origin.hostname)))throw Error('Use an HTTPS BIZ API');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
async function telegram(method,data={}){const r=await fetch(`https://api.telegram.org/bot${botToken}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(35000)});const value=await r.json();if(!r.ok||!value.ok)throw Error('Telegram request failed');return value.result;}
async function api(route,data){const path=route+'?business_id='+encodeURIComponent(config.business_id),body=JSON.stringify(data),timestamp=Date.now(),nonce=crypto.randomUUID();const proof=Buffer.from(JSON.stringify({method:'POST',path,body:hash(body),token:hash(config.token),timestamp,nonce}));const r=await fetch(origin.origin+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.token,'X-Orbit-Time':String(timestamp),'X-Orbit-Nonce':nonce,'X-Orbit-Proof':crypto.sign(null,proof,config.private_key).toString('base64url')},body,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('BIZ API request failed ('+r.status+')');return r.json();}
let stopping=false;process.on('SIGTERM',()=>{stopping=true});process.on('SIGINT',()=>{stopping=true});
(async()=>{const me=await telegram('getMe');const webhook=await telegram('getWebhookInfo');if(webhook.url)throw Error('Remove the existing Telegram webhook before starting this worker');let ack=[];let state=await api('/v1/bot/poll',{username:me.username});
 while(!stopping){try{const updates=await telegram('getUpdates',{offset:state.offset,timeout:20,limit:20,allowed_updates:['message','callback_query']});state=await api('/v1/bot/updates',{updates,ack,username:me.username});ack=[];for(const message of state.messages){await telegram(message.method,message.payload);ack.push(message.id);}
 if(ack.length){state=await api('/v1/bot/poll',{ack,username:me.username});ack=[];}
 }catch{console.error('Worker connection unavailable; retrying in 5 seconds.');await new Promise(r=>setTimeout(r,5000));}}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
