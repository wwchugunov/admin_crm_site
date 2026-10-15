const OrbitI18n = require('./ui/i18n.js');
const http = require('node:http');
const crypto = require('node:crypto');
const { encryptBackup } = require('./security.cjs');
async function request(url, options = {}) {
  let response;
  try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) }); }
  catch { throw Error(OrbitI18n.t('m579')); }
  if (!response.ok) throw Error(`${OrbitI18n.t('m580')} ${response.status}${OrbitI18n.t('m581')}`);
  let result; try { result = await response.json(); } catch { throw Error(OrbitI18n.t('m582')); }
  return result;
}
class Telegram {
  constructor(store, vault, options = {}) { this.runtime = options.runtime || 'desktop'; this.store = store; this.vault = vault; this.sessions = new Map(); this.languages = new Map(); this.busy = false; this.state = OrbitI18n.t('m217'); }
  async call(method, data = {}, override) {
    const token = override || this.vault.get('telegram'); if (!token) throw Error(OrbitI18n.t('m583'));
    const result = await request(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!result.ok) throw Error(OrbitI18n.t('m584')); return result.result;
  }
  async connect(token) {
    if (typeof token !== 'string' || !/^\d{5,20}:[A-Za-z0-9_-]{20,150}$/.test(token.trim())) throw Error(OrbitI18n.t('m585'));
    const me = await this.call('getMe', {}, token.trim());
    const webhook = await this.call('getWebhookInfo', {}, token.trim());
    if (webhook.url) throw Error(OrbitI18n.t('m586'));
    if (this.store.get('bot_username') !== me.username) this.store.set('telegram_offset', 0);
    this.vault.put('telegram', token.trim()); this.store.set('bot_username', me.username); this.state = `@${me.username}`; this.configureCommands().catch(()=>{}); return me.username;
  }
  async send(chat,message,buttons){return this.call('sendMessage',{chat_id:chat,text:message,...(buttons?{reply_markup:{inline_keyboard:buttons}}:{})});}
  client(chat){return this.store.db.prepare('SELECT * FROM clients WHERE chat_id=?').get(String(chat));}
  language(chat,from){const client=this.client(chat),saved=client&&this.store.get('bot_language_'+client.id);return saved||this.languages.get(String(chat))||(from?.language_code?.startsWith('en')?'en':'uk');}
  text(chat,key){return OrbitI18n.t(key,this.language(chat));}
  button(chat,key,data){return{text:this.text(chat,key),callback_data:data};}
  homeButtons(chat){return[[this.button(chat,'botBook','book')],[this.button(chat,'botVisits','/appointments')],[this.button(chat,'botInfo','info'),this.button(chat,'botLanguage','language')]];}
  async menu(chat){this.sessions.delete(String(chat));await this.send(chat,`${this.store.get('business')}\n\n${this.text(chat,'botMenu')}`,this.homeButtons(chat));}
  async consent(chat){await this.send(chat,`${this.store.get('business')}\n\n${this.text(chat,'botConsent')}`,[[this.button(chat,'botAgree','consent')],[this.button(chat,'botLanguage','language')]]);}
  date(chat,value,options={}){return new Date(value).toLocaleString(this.language(chat)==='en'?'en-GB':'uk-UA',{timeZone:this.store.get('timezone'),...options});}
  price(chat,value){return new Intl.NumberFormat(this.language(chat)==='en'?'en-GB':'uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value/100)+' '+this.store.get('currency');}
  async services(chat,page=0){const rows=this.store.snapshot().services.filter(s=>s.bot_visible),offset=page*8;const buttons=rows.slice(offset,offset+8).map(s=>[{text:`${s.name} · ${s.duration} ${this.text(chat,'botMinutes')} · ${this.price(chat,s.price)}`,callback_data:`s:${s.id}`}]);const nav=[];if(page>0)nav.push(this.button(chat,'botBack',`services:${page-1}`));if(offset+8<rows.length)nav.push(this.button(chat,'botNext',`services:${page+1}`));if(nav.length)buttons.push(nav);buttons.push([this.button(chat,'botHome','menu')]);await this.send(chat,this.text(chat,rows.length?'botChooseService':'m597'),buttons);}
  resourceButtons(chat,page=0){const rows=this.store.snapshot().resources,offset=page*8,buttons=[[this.button(chat,'m587','r:any')],...rows.slice(offset,offset+8).map(r=>[{text:r.name,callback_data:`r:${r.id}`}])],nav=[];if(page>0)nav.push(this.button(chat,'botBack',`resources:${page-1}`));if(offset+8<rows.length)nav.push(this.button(chat,'botNext',`resources:${page+1}`));if(nav.length)buttons.push(nav);buttons.push([this.button(chat,'botBack','book'),this.button(chat,'botHome','menu')]);return buttons;}
  async participants(chat,offset=0){const session=this.sessions.get(String(chat)),service=this.store.db.prepare('SELECT * FROM services WHERE id=? AND bot_visible=1 AND archived=0').get(session.service);if(!service)return this.services(chat);const buttons=Array.from({length:Math.min(10,service.capacity-offset)},(_,i)=>[{text:String(offset+i+1),callback_data:`p:${offset+i+1}`}]);const nav=[];if(offset>0)nav.push(this.button(chat,'botBack',`participants:${offset-10}`));if(offset+10<service.capacity)nav.push(this.button(chat,'botNext',`participants:${offset+10}`));if(nav.length)buttons.push(nav);buttons.push([this.button(chat,'botHome','menu')]);await this.send(chat,this.text(chat,'m603'),buttons);}
  async dates(chat,offset=0){const session=this.sessions.get(String(chat));if(!session.resource)return;const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:this.store.get('timezone'),year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts().filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));const days=Array.from({length:7},(_,i)=>{const d=new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+offset+i);return d.toISOString().slice(0,10);});const buttons=days.map(day=>[{text:new Date(day+'T12:00:00Z').toLocaleDateString(this.language(chat)==='en'?'en-GB':'uk-UA',{timeZone:'UTC',weekday:'short',day:'numeric',month:'short'}),callback_data:`d:${day}`}]),nav=[];if(offset>0)nav.push(this.button(chat,'botBack',`dates:${offset-7}`));if(offset<21)nav.push(this.button(chat,'botNext',`dates:${offset+7}`));if(nav.length)buttons.push(nav);buttons.push([this.button(chat,'botResources','resources:0'),this.button(chat,'botHome','menu')]);await this.send(chat,`${this.text(chat,'botChooseDay')} ${this.store.get('timezone')}`,buttons);}
  async times(chat,page=0){const session=this.sessions.get(String(chat));delete session.quote;session.slots=this.store.slots(session.service,session.resource,session.date);const rows=session.slots.slice(page*8,page*8+8),buttons=[];for(let i=0;i<rows.length;i+=2)buttons.push(rows.slice(i,i+2).map(start=>({text:this.date(chat,start,{hour:'2-digit',minute:'2-digit'}),callback_data:`t:${start}`})));const nav=[];if(page>0)nav.push(this.button(chat,'botBack',`times:${page-1}`));if((page+1)*8<session.slots.length)nav.push(this.button(chat,'botNext',`times:${page+1}`));if(nav.length)buttons.push(nav);buttons.push([this.button(chat,'botDates','dates:0'),this.button(chat,'botResources','resources:0')],[this.button(chat,'botHome','menu')]);await this.send(chat,`${this.text(chat,session.slots.length?'botChooseTime':'botNoTimes')}\n${session.date} · ${this.store.get('timezone')}`,buttons);}
  summary(chat,a){const resources=a.resources?.map(r=>r.name).join(', ')||a.resource_name||this.text(chat,'m587');return `${this.text(chat,'botService')}: ${a.service_name}\n${this.text(chat,'botWhen')}: ${this.date(chat,a.start)} (${this.store.get('timezone')})\n${this.text(chat,'botResource')}: ${resources}\n${this.text(chat,'botPeople')}: ${a.people_count||1}\n${this.text(chat,'botPrice')}: ${this.price(chat,a.total)}`;}
  async visits(chat,client){const rows=this.store.db.prepare("SELECT a.*,s.name service_name FROM appointments a JOIN services s ON s.id=a.service_id WHERE EXISTS(SELECT 1 FROM appointment_clients c WHERE c.appointment_id=a.id AND c.client_id=?) AND a.status='confirmed' AND a.start>? ORDER BY a.start LIMIT 20").all(client.id,Date.now());await this.send(chat,this.text(chat,rows.length?'botVisitList':'botNoVisits'),[...rows.map(a=>[{text:`${a.service_name} · ${this.date(chat,a.start)}`,callback_data:`visit:${a.id}`}]),[this.button(chat,'botBook','book'),this.button(chat,'botHome','menu')]]);}
  async configureCommands(){for(const language of ['','uk','en']){const locale=language||'uk';await this.call('setMyCommands',{...(language?{language_code:language}:{}),commands:[{command:'start',description:OrbitI18n.t('botHome',locale)},{command:'book',description:OrbitI18n.t('botBook',locale)},{command:'appointments',description:OrbitI18n.t('botVisits',locale)},{command:'language',description:OrbitI18n.t('botLanguage',locale)},{command:'privacy',description:locale==='en'?'Privacy and data':'Дані та приватність'},{command:'stop',description:locale==='en'?'Disconnect notifications':'Відключити сповіщення'}]});}}
  async handle(update){
    const msg=update.message,callback=update.callback_query,chat=msg?.chat?.id??callback?.message?.chat?.id,from=msg?.from||callback?.from;if(!chat||(msg?.chat?.type??callback?.message?.chat?.type)!=='private')return;
    const key=String(chat);if(!this.languages.has(key))this.languages.set(key,this.language(chat,from));if(callback)await this.call('answerCallbackQuery',{callback_query_id:callback.id});
    const command=msg?.text||callback?.data||'';let client=this.client(chat);
    if(command==='language'||command==='/language'){await this.send(chat,'Оберіть мову / Choose language',[[{text:'Українська',callback_data:'lang:uk'},{text:'English',callback_data:'lang:en'}]]);return;}
    if(command.startsWith('lang:')){const language=command.slice(5);if(!['uk','en'].includes(language))return;this.languages.set(key,language);if(client){this.store.set('bot_language_'+client.id,language);await this.menu(chat);}else await this.consent(chat);return;}
    if(command.startsWith('/start')){const code=command.split(' ')[1];if(code){const linked=this.store.db.prepare('SELECT * FROM clients WHERE link_code=?').get(code);if(!linked||linked.chat_id||client){await this.send(chat,this.text(chat,'m588'));return;}this.sessions.set(key,{pendingClient:linked.id,pendingCode:code,expires:Date.now()+15*60000});}if(client)await this.menu(chat);else await this.consent(chat);return;}
    if(command==='/privacy'){await this.send(chat,this.text(chat,'m591'),[[this.button(chat,'botHome','menu')]]);return;}
    if(command==='/stop'){if(client){this.store.db.prepare('UPDATE clients SET chat_id=NULL WHERE id=?').run(client.id);this.store.audit('telegram.unlinked',client.id);}this.sessions.delete(key);await this.send(chat,this.text(chat,'m592'));return;}
    if(command==='consent'&&!client){const pending=this.sessions.get(key);let id;if(pending?.pendingClient){const row=this.store.db.prepare('SELECT * FROM clients WHERE id=? AND link_code=? AND chat_id IS NULL').get(pending.pendingClient,pending.pendingCode);if(!row||pending.expires<Date.now()){await this.send(chat,this.text(chat,'m593'));return;}id=row.id;}else id=this.store.addClient({name:from?.first_name||this.text(chat,'m594')});this.store.db.prepare('UPDATE clients SET chat_id=?,link_code=NULL WHERE id=?').run(key,id);this.store.set('bot_language_'+id,this.languages.get(key));this.store.audit('telegram.consent',id);client=this.client(chat);await this.menu(chat);return;}
    if(!client){await this.consent(chat);return;}
    if(['menu','/menu','/start','consent'].includes(command)){await this.menu(chat);return;}
    if(command==='info'){await this.send(chat,`${this.store.get('business')}\n${this.text(chat,'m042')}: ${this.store.get('address')||this.text(chat,'botMissingInfo')}\n${this.text(chat,'m322')}: ${this.store.get('phone')||this.text(chat,'botMissingInfo')}\n${this.text(chat,'m043')}: ${this.store.get('timezone')}`,[[this.button(chat,'botBook','book'),this.button(chat,'botHome','menu')]]);return;}
    if(['book','/book'].includes(command)){this.sessions.delete(key);await this.services(chat);return;}
    if(/^services:\d{1,3}$/.test(command)){await this.services(chat,Number(command.slice(9)));return;}
    if(command==='/appointments'){await this.visits(chat,client);return;}
    if(command.startsWith('visit:')){const id=command.slice(6),a=this.store.snapshot().appointments.find(a=>a.id===id&&a.status==='confirmed'&&a.start>Date.now()&&a.clients.some(c=>c.id===client.id));if(!a){await this.send(chat,this.text(chat,'m551'),this.homeButtons(chat));return;}await this.send(chat,this.summary(chat,a),[...(a.client_id===client.id?[[this.button(chat,'botCancel',`cancel:${a.id}`)]]:[]),[this.button(chat,'botVisits','/appointments'),this.button(chat,'botHome','menu')]]);return;}
    if(command.startsWith('cancel:')||command.startsWith('cancel-confirm:')){const confirming=command.startsWith('cancel-confirm:'),id=command.slice(confirming?15:7),a=this.store.snapshot().appointments.find(a=>a.id===id&&a.client_id===client.id&&a.status==='confirmed'&&a.start>Date.now());if(!a){await this.send(chat,this.text(chat,'m551'));return;}if(!confirming){await this.send(chat,`${this.text(chat,'botCancelQuestion')}\n\n${this.summary(chat,a)}`,[[this.button(chat,'botCancelConfirm',`cancel-confirm:${a.id}`)],[this.button(chat,'botKeep',`visit:${a.id}`)]]);return;}this.store.status(id,'cancelled');await this.send(chat,this.text(chat,'botCancelled'),this.homeButtons(chat));return;}
    if(command.startsWith('s:')){const id=command.slice(2),service=this.store.db.prepare('SELECT * FROM services WHERE id=? AND bot_visible=1 AND archived=0').get(id);if(!service){await this.send(chat,this.text(chat,'m602'),this.homeButtons(chat));return;}this.sessions.set(key,{service:id,expires:Date.now()+15*60000});if(service.capacity>1)await this.participants(chat);else await this.send(chat,this.text(chat,'botChooseResource'),this.resourceButtons(chat));return;}
    const session=this.sessions.get(key);if(!session||session.expires<Date.now()){await this.send(chat,this.text(chat,'botExpired'),this.homeButtons(chat));return;}
    if(/^participants:\d{1,2}$/.test(command)){const offset=Number(command.slice(13));if(offset%10===0)await this.participants(chat,offset);return;}
    if(command.startsWith('p:')){const service=this.store.db.prepare('SELECT * FROM services WHERE id=? AND bot_visible=1 AND archived=0').get(session.service),people=Number(command.slice(2));if(!service||!Number.isInteger(people)||people<1||people>service.capacity)return;session.people=people;delete session.resource;delete session.slots;delete session.quote;await this.send(chat,this.text(chat,'botChooseResource'),this.resourceButtons(chat));return;}
    if(/^resources:\d{1,3}$/.test(command)){await this.send(chat,this.text(chat,'botChooseResource'),this.resourceButtons(chat,Number(command.slice(10))));return;}
    if(command.startsWith('r:')){const id=command.slice(2);if(id!=='any'&&!this.store.db.prepare('SELECT id FROM resources WHERE id=? AND archived=0').get(id))return;session.resource=id;delete session.slots;delete session.quote;await this.dates(chat);return;}
    if(/^dates:\d{1,2}$/.test(command)){const offset=Number(command.slice(6));if(offset<=21&&offset%7===0){delete session.quote;await this.dates(chat,offset);}return;}
    if(command.startsWith('d:')&&session.resource){const date=command.slice(2);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;session.date=date;delete session.quote;await this.times(chat);return;}
    if(/^times:\d{1,3}$/.test(command)&&session.date){await this.times(chat,Number(command.slice(6)));return;}
    if(command.startsWith('t:')&&session.slots?.includes(Number(command.slice(2)))){const start=Number(command.slice(2)),service=this.store.db.prepare('SELECT * FROM services WHERE id=? AND bot_visible=1 AND archived=0').get(session.service);if(!service){await this.send(chat,this.text(chat,'m602'),this.homeButtons(chat));return;}const resource_ids=this.store.availableResources(service.id,session.resource,start);if(resource_ids.length<service.required_resources){await this.send(chat,this.text(chat,'botTaken'),[[this.button(chat,'botDates','dates:0')]]);return;}session.quote={nonce:crypto.randomBytes(8).toString('base64url'),start,price:service.price,name:service.name,capacity:service.capacity,duration:service.duration,required_resources:service.required_resources,currency:this.store.get('currency')};const resource_name=session.resource==='any'?this.text(chat,'m587'):this.store.db.prepare('SELECT name FROM resources WHERE id=?').get(session.resource).name;await this.send(chat,`${this.text(chat,'botQuote')}\n\n${this.summary(chat,{start,service_name:service.name,resource_name,people_count:session.people||1,total:service.price*(session.people||1)})}`,[[this.button(chat,'botConfirm',`confirm:${session.quote.nonce}`)],[this.button(chat,'botEdit','times:0'),this.button(chat,'botHome','menu')]]);return;}
    if(command.startsWith('confirm:')&&session.quote?.nonce===command.slice(8)){const quote=session.quote,service=this.store.db.prepare('SELECT * FROM services WHERE id=? AND bot_visible=1 AND archived=0').get(session.service);if(!service||service.price!==quote.price||service.name!==quote.name||service.capacity!==quote.capacity||service.duration!==quote.duration||service.required_resources!==quote.required_resources||this.store.get('currency')!==quote.currency){delete session.quote;await this.send(chat,this.text(chat,'botChanged'),[[this.button(chat,'botBook','book')]]);return;}let id;try{const resources=this.store.availableResources(service.id,session.resource,quote.start);id=this.store.book({client_id:client.id,service_id:service.id,resource_ids:resources,people_count:session.people||1,start:quote.start});}catch{delete session.quote;await this.send(chat,this.text(chat,'botTaken'),[[this.button(chat,'botDates','dates:0')]]);return;}this.sessions.delete(key);const booking=this.store.snapshot().appointments.find(a=>a.id===id);await this.send(chat,`${this.text(chat,'botBooked')}\n\n${this.summary(chat,booking)}`,[[this.button(chat,'botVisits','/appointments'),this.button(chat,'botHome','menu')]]);return;}
    await this.send(chat,this.text(chat,'botExpired'),this.homeButtons(chat));
  }
  async reminders() {
    const now = Date.now();
    const rows = this.store.db.prepare(`SELECT q.*,a.start,a.end,a.status appointment_status,c.chat_id,c.name,s.name service_name FROM reminder_deliveries q JOIN appointments a ON a.id=q.appointment_id JOIN clients c ON c.id=q.client_id JOIN services s ON s.id=a.service_id WHERE q.status='pending' AND q.next_at<=?`).all(now);
    for (const row of rows) {
      if (row.start <= now || row.appointment_status !== 'confirmed') { this.store.db.prepare("UPDATE reminder_deliveries SET status='skipped' WHERE appointment_id=? AND kind=? AND client_id=?").run(row.appointment_id, row.kind,row.client_id); continue; }
      const lead = row.kind === '24h' ? 86400000 : 7200000;
      if (row.kind === '24h' && row.start - now <= 7200000) { this.store.db.prepare("UPDATE reminder_deliveries SET status='skipped' WHERE appointment_id=? AND kind=? AND client_id=?").run(row.appointment_id, row.kind,row.client_id); continue; }
      if (!row.chat_id || row.start - now > lead) continue;
      this.store.db.prepare("UPDATE reminder_deliveries SET status='sending' WHERE appointment_id=? AND kind=? AND client_id=?").run(row.appointment_id, row.kind,row.client_id);
      try {
        await this.send(row.chat_id, `${this.text(row.chat_id,'botReminder')}\n${row.service_name} · ${this.date(row.chat_id,row.start)} (${this.store.get('timezone')})\n${this.store.get('business')}`, [[this.button(row.chat_id,'botVisits','/appointments'),this.button(row.chat_id,'botHome','menu')]]);
        this.store.db.prepare("UPDATE reminder_deliveries SET status='sent' WHERE appointment_id=? AND kind=? AND client_id=?").run(row.appointment_id, row.kind,row.client_id);
      } catch {
        this.store.db.prepare("UPDATE reminder_deliveries SET status='pending',attempts=attempts+1,next_at=? WHERE appointment_id=? AND kind=? AND client_id=?").run(now + Math.min(3600000, 60000 * 2 ** Math.min(row.attempts, 6)), row.appointment_id, row.kind,row.client_id);
      }
    }
  }
  async tick() {
    if (this.busy || !this.vault.has('telegram')) return; this.busy = true;
    try {
      const updates = await this.call('getUpdates', { offset: this.store.get('telegram_offset') || 0, timeout: 0, limit: 20, allowed_updates: ['message', 'callback_query'] });
      for (const update of updates) {
        // Acknowledge before side effects: avoid duplicate bookings on an uncertain HTTP reply.
        this.store.set('telegram_offset', update.update_id + 1); await this.handle(update);
      }
      await this.reminders(); this.state = this.runtime === 'server' ? OrbitI18n.t('m618') : OrbitI18n.t('m619');
    } catch (e) { this.state = e.message; } finally { this.busy = false; }
  }
}
class Drive {
  constructor(store, vault, openExternal, options = {}) { this.store = store; this.vault = vault; this.openExternal = openExternal; this.oauthClient = options.oauthClient; this.request = options.request || request; this.busy = false; this.connecting = false; this.state = vault.has('google') ? OrbitI18n.t('m189') : OrbitI18n.t('m217'); }
  async connect() {
    if (this.connecting) throw Error(OrbitI18n.t('m620'));
    if (this.busy) throw Error(OrbitI18n.t('m621'));
    const client = typeof this.oauthClient === 'function' ? this.oauthClient() : this.oauthClient;
    if (!client) throw Error(OrbitI18n.t('m622'));
    require('./google-config.cjs').googleClient({ installed: client });
    if (!this.vault.available()) throw Error(OrbitI18n.t('m623'));
    const password = this.vault.get('backup_password') || crypto.randomBytes(32).toString('base64url');
    this.connecting = true; this.state = OrbitI18n.t('m228');
    const verifier = crypto.randomBytes(48).toString('base64url'), state = crypto.randomBytes(32).toString('base64url');
    let server, timer;
    try {
      const codePromise = new Promise((resolve, reject) => {
        this.cancelAuthorization = () => reject(Error(OrbitI18n.t('m624')));
        server = http.createServer((req, res) => {
          const url = new URL(req.url, 'http://127.0.0.1');
          if (url.pathname !== '/' || url.searchParams.get('state') !== state) { res.writeHead(400); res.end('Invalid callback'); return; }
          if (!url.searchParams.get('code')) { res.end('Authorization cancelled'); reject(Error(OrbitI18n.t('m624'))); return; }
          res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<p>${OrbitI18n.t('m625')}</p>`); resolve(url.searchParams.get('code'));
        });
        server.on('error', () => reject(Error(OrbitI18n.t('m626'))));
        timer = setTimeout(() => reject(Error(OrbitI18n.t('m627'))), 180000);
      });
      // Attach a rejection handler while the listener is starting.
      codePromise.catch(() => {});
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      const redirect = `http://127.0.0.1:${server.address().port}/`;
      const params = new URLSearchParams({ client_id: client.client_id, redirect_uri: redirect, response_type: 'code', scope: 'https://www.googleapis.com/auth/drive.file', access_type: 'offline', prompt: 'consent', state, code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
      await this.openExternal(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
      const code = await codePromise;
      const tokens = await this.request('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, code, code_verifier: verifier, redirect_uri: redirect, grant_type: 'authorization_code' }) });
      if (!tokens.refresh_token) throw Error(OrbitI18n.t('m628'));
      this.vault.put('google', JSON.stringify({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: tokens.refresh_token }));
      this.vault.put('backup_password', password); this.store.set('drive_enabled', true); this.state = OrbitI18n.t('m189');
      return { recoveryKey: password };
    } catch (e) { this.state = this.vault.has('google') ? OrbitI18n.t('m629') : OrbitI18n.t('m630'); throw e; } finally { clearTimeout(timer); server?.close(); this.cancelAuthorization = null; this.connecting = false; }
  }
  cancel() { this.cancelAuthorization?.(); }
  async backup(exportedData) {
    if (this.busy || this.connecting) throw Error(OrbitI18n.t('m520')); this.busy = true;
    try {
      const config = JSON.parse(this.vault.get('google') || 'null'), password = this.vault.get('backup_password');
      if (!config || !password) throw Error(OrbitI18n.t('m517'));
      const token = await this.request('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ ...config, grant_type: 'refresh_token' }) });
      const encrypted = encryptBackup(exportedData||this.store.export(), password);
      const boundary = `orbit-${crypto.randomBytes(16).toString('hex')}`;
      const metadata = { name: `Orbit-${new Date().toISOString().replace(/[:.]/g, '-')}.orbit`, description: 'Encrypted Orbit CRM backup. Restore in Orbit CRM.' };
      const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`), encrypted, Buffer.from(`\r\n--${boundary}--`)]);
      await this.request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
      this.store.set('drive_last', Date.now()); this.state = OrbitI18n.t('m339');
    } catch (e) { this.state = e.message; throw e; } finally { this.busy = false; }
  }
  async tick() { if (this.store.get('drive_enabled') && this.vault.has('google') && Date.now() - (this.store.get('drive_last') || 0) > 3600000 && !this.busy) { try { await this.backup(); } catch {} } }
}
module.exports = { Telegram, Drive, request };
