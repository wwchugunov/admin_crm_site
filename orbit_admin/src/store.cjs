const OrbitI18n = require('./ui/i18n.js');
const { DatabaseSync } = require('node:sqlite');
const { randomUUID, randomBytes } = require('node:crypto');
const { mkdirSync, chmodSync } = require('node:fs');
const { dirname } = require('node:path');

const TABLES = ['clients', 'services', 'resources', 'appointments', 'settings', 'audit', 'reminders', 'appointment_clients', 'appointment_resources', 'payments','reminder_deliveries'];
function text(value, max = 500) { if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error(OrbitI18n.t('m533')); return value.trim(); }
function cents(value) { const amount = Math.round(Number(value) * 100); if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1e10) throw Error(OrbitI18n.t('m534')); return amount; }
function zonedTime(date, clock, timezone) {
  const [y,m,d] = date.split('-').map(Number), [h,n] = clock.split(':').map(Number), desired = Date.UTC(y,m-1,d,h,n);
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' });
  let result=desired;
  for(let i=0;i<3;i++){ const parts=Object.fromEntries(formatter.formatToParts(result).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));const actual=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute);const delta=desired-actual;if(!delta)return result;result+=delta; }
  throw Error(OrbitI18n.t('m535'));
}
class Store {
  constructor(path) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS clients(id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',chat_id TEXT UNIQUE,link_code TEXT UNIQUE);
      CREATE TABLE IF NOT EXISTS services(id TEXT PRIMARY KEY,name TEXT NOT NULL,duration INTEGER NOT NULL CHECK(duration BETWEEN 5 AND 480),price INTEGER NOT NULL CHECK(price>=0));
      CREATE TABLE IF NOT EXISTS resources(id TEXT PRIMARY KEY,name TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),service_id TEXT NOT NULL REFERENCES services(id),resource_id TEXT NOT NULL REFERENCES resources(id),start INTEGER NOT NULL,end INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN ('confirmed','completed','cancelled','no_show')),notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS slot_idx ON appointments(resource_id,start,end);
      CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,at INTEGER NOT NULL,event TEXT NOT NULL,entity_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS reminders(appointment_id TEXT NOT NULL REFERENCES appointments(id),kind TEXT NOT NULL,status TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(appointment_id,kind));
      CREATE TABLE IF NOT EXISTS appointment_clients(appointment_id TEXT NOT NULL REFERENCES appointments(id),client_id TEXT NOT NULL REFERENCES clients(id),PRIMARY KEY(appointment_id,client_id));
      CREATE TABLE IF NOT EXISTS appointment_resources(appointment_id TEXT NOT NULL REFERENCES appointments(id),resource_id TEXT NOT NULL REFERENCES resources(id),PRIMARY KEY(appointment_id,resource_id));
      CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,appointment_id TEXT NOT NULL REFERENCES appointments(id),amount INTEGER NOT NULL CHECK(amount!=0),at INTEGER NOT NULL,method TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS reminder_deliveries(appointment_id TEXT NOT NULL REFERENCES appointments(id),kind TEXT NOT NULL,client_id TEXT NOT NULL REFERENCES clients(id),status TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(appointment_id,kind,client_id));`);
    for(const [table,column,definition] of [['services','capacity','INTEGER NOT NULL DEFAULT 1 CHECK(capacity BETWEEN 1 AND 100)'],['services','required_resources','INTEGER NOT NULL DEFAULT 1 CHECK(required_resources BETWEEN 1 AND 8)'],['services','bot_visible','INTEGER NOT NULL DEFAULT 1'],['services','web_visible','INTEGER NOT NULL DEFAULT 0'],['appointments','total','INTEGER NOT NULL DEFAULT 0 CHECK(total>=0)'],['appointments','cost','INTEGER NOT NULL DEFAULT 0 CHECK(cost>=0)'],['appointments','people_count','INTEGER NOT NULL DEFAULT 1 CHECK(people_count BETWEEN 1 AND 100)']]) {
      if(!this.db.prepare(`PRAGMA table_info(${table})`).all().some(c=>c.name===column)){ this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`); if(column==='total')this.db.exec('UPDATE appointments SET total=(SELECT price FROM services WHERE id=appointments.service_id)'); }
    }
    for (const table of ['services', 'resources']) {
      if (!this.db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === 'archived'))
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1))`);
    }
    this.db.exec('INSERT OR IGNORE INTO appointment_clients SELECT id,client_id FROM appointments; INSERT OR IGNORE INTO appointment_resources SELECT id,resource_id FROM appointments;');
    this.db.exec('INSERT OR IGNORE INTO reminder_deliveries SELECT q.appointment_id,q.kind,p.client_id,q.status,q.attempts,q.next_at FROM reminders q JOIN appointment_clients p ON p.appointment_id=q.appointment_id;');
    if (!this.get('installation')) this.set('installation', randomUUID());
    if (!this.get('business')) this.set('business', OrbitI18n.t('m536'));
    if (!this.get('industry')) this.set('industry', 'beauty');
    if (!this.get('timezone')) this.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (!this.get('currency')) this.set('currency', 'UAH');
    if (!this.get('work_start')) this.set('work_start','09:00');
    if (!this.get('work_end')) this.set('work_end','18:00');
    if (!this.get('work_days')) this.set('work_days',[1,2,3,4,5,6,7]);
  }
  get(key) { const r = this.db.prepare('SELECT value FROM settings WHERE key=?').get(key); return r ? JSON.parse(r.value) : null; }
  set(key, value) { this.db.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, JSON.stringify(value)); }
  audit(event, id) { this.db.prepare('INSERT INTO audit VALUES (?,?,?,?)').run(randomUUID(), Date.now(), event, id); }
  transaction(fn) { const nested=Boolean(this.transactionDepth),savepoint=`orbit_${this.transactionDepth||0}`;this.db.exec(nested?`SAVEPOINT ${savepoint}`:'BEGIN IMMEDIATE');this.transactionDepth=(this.transactionDepth||0)+1;try{const result=fn();this.db.exec(nested?`RELEASE ${savepoint}`:'COMMIT');return result;}catch(e){this.db.exec(nested?`ROLLBACK TO ${savepoint}`:'ROLLBACK');if(nested)this.db.exec(`RELEASE ${savepoint}`);throw e;}finally{this.transactionDepth--;}}
  addClient(data) {
    const id = randomUUID();
    this.db.prepare('INSERT INTO clients(id,name,phone,notes,link_code) VALUES(?,?,?,?,?)').run(id, text(data.name, 120), String(data.phone || '').slice(0, 40), String(data.notes || '').slice(0, 2000), randomBytes(24).toString('base64url'));
    this.audit('client.created', id); return id;
  }
  addService(data) {
    const values=this.serviceValues(data),id=randomUUID();this.db.prepare('INSERT INTO services(id,name,duration,price,capacity,required_resources,bot_visible,web_visible) VALUES(?,?,?,?,?,?,?,?)').run(id,...values);this.audit('service.created',id);return id;
  }
  serviceValues(data){const duration=Number(data.duration),price=cents(data.price),capacity=Number(data.capacity||1),required=Number(data.required_resources||1);if(!Number.isInteger(duration)||duration<5||duration>480||!Number.isInteger(capacity)||capacity<1||capacity>100||!Number.isInteger(required)||required<1||required>8)throw Error(OrbitI18n.t('m537'));return[text(data.name,120),duration,price,capacity,required,data.bot_visible===false||data.bot_visible==='0'?0:1,data.web_visible===true||data.web_visible==='1'?1:0];}
  updateService(data){if(!this.db.prepare('UPDATE services SET name=?,duration=?,price=?,capacity=?,required_resources=?,bot_visible=?,web_visible=? WHERE id=? AND archived=0').run(...this.serviceValues(data),text(data.id)).changes)throw Error(OrbitI18n.t('m538'));this.audit('service.updated',data.id);}
  addResource(data) { const id = randomUUID(); this.db.prepare('INSERT INTO resources(id,name) VALUES(?,?)').run(id, text(data.name, 120)); this.audit('resource.created', id); return id; }

  deleteService(data) {
    const id = text(data.id);
    if (!this.db.prepare('UPDATE services SET archived=1,bot_visible=0,web_visible=0 WHERE id=? AND archived=0').run(id).changes) throw Error(OrbitI18n.t('m538'));
    this.audit('service.deleted', id);
  }
  deleteResource(data) {
    const id = text(data.id);
    if (!this.db.prepare('UPDATE resources SET archived=1 WHERE id=? AND archived=0').run(id).changes) throw Error(OrbitI18n.t('catalogResourceMissing'));
    this.audit('resource.deleted', id);
  }
  bookingClients(data) {
    const existing = data.client_ids || (data.client_id ? [data.client_id] : []);
    const drafts = data.new_clients || [];
    if (!Array.isArray(existing) || !Array.isArray(drafts) || existing.length + drafts.length > 100) throw Error(OrbitI18n.t('m540'));
    const clients = existing.map(id => text(id));
    for (const draft of drafts) {
      const name = text(draft.name, 120), phone = String(draft.phone || '').trim();
      if (phone.length > 40) throw Error(OrbitI18n.t('m533'));
      const digits = phone.replace(/[^0-9]/g, '');
      const matches = digits.length >= 7 ? this.db.prepare('SELECT id,name,phone FROM clients').all().filter(c => c.phone.replace(/[^0-9]/g, '') === digits) : [];
      if (matches.length) {
        if (matches.length !== 1 || matches[0].name.trim().toLocaleLowerCase() !== name.toLocaleLowerCase()) throw Error(OrbitI18n.t('bookingPhoneExists'));
        clients.push(matches[0].id);
      } else clients.push(this.addClient({name,phone}));
    }
    for (const id of clients) if (!this.db.prepare('SELECT id FROM clients WHERE id=?').get(id)) throw Error(OrbitI18n.t('bookingClientMissing'));
    return [...new Set(clients)];
  }
  book(data) {
    return this.transaction(() => {
      const service = this.db.prepare('SELECT * FROM services WHERE id=? AND archived=0').get(text(data.service_id));
      if (!service) throw Error(OrbitI18n.t('m538'));
      const start = Number(data.start), end = start + service.duration * 60000;
      if (!Number.isSafeInteger(start) || start < Date.now() - 60000 || start > Date.now() + 366 * 86400000) throw Error(OrbitI18n.t('m539'));
      const clients=this.bookingClients(data), resources=[...new Set((data.resource_ids||[data.resource_id]).map(v=>text(v)))];
      const people=Number(data.people_count||clients.length);if(!clients.length||!resources.length||!Number.isInteger(people)||people<clients.length||people>service.capacity||resources.length<service.required_resources||resources.length>8)throw Error(OrbitI18n.t('m540'));
      for(const resource of resources)if(!this.resourceFree(resource,start,end))throw Error(OrbitI18n.t('m541'));
      for(const client of clients)if(this.db.prepare("SELECT a.id FROM appointments a JOIN appointment_clients c ON c.appointment_id=a.id WHERE c.client_id=? AND a.status='confirmed' AND a.start<? AND a.end>?").get(client,end,start))throw Error(OrbitI18n.t('m542'));
      const id = randomUUID();
      const total=data.total===undefined?service.price*people:cents(data.total),cost=cents(data.cost||0);if(total>1e10)throw Error(OrbitI18n.t('m543'));
      this.db.prepare('INSERT INTO appointments(id,client_id,service_id,resource_id,start,end,status,notes,created_at,total,cost,people_count) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,clients[0],service.id,resources[0],start,end,'confirmed',String(data.notes||'').slice(0,2000),Date.now(),total,cost,people);
      for(const c of clients)this.db.prepare('INSERT INTO appointment_clients VALUES(?,?)').run(id,c);
      for(const r of resources)this.db.prepare('INSERT INTO appointment_resources VALUES(?,?)').run(id,r);
      for (const kind of ['24h', '2h']) this.db.prepare("INSERT INTO reminders(appointment_id,kind,status) VALUES(?,?,'pending')").run(id, kind);
      for(const kind of ['24h','2h'])for(const client of clients)this.db.prepare("INSERT INTO reminder_deliveries(appointment_id,kind,client_id,status) VALUES(?,?,?,'pending')").run(id,kind,client);
      this.audit('appointment.created', id); return id;
    });
  }
  status(id, status) {
    if (!['completed', 'cancelled', 'no_show'].includes(status)) throw Error(OrbitI18n.t('m544'));
    if (!this.db.prepare("UPDATE appointments SET status=? WHERE id=? AND status='confirmed'").run(status, text(id)).changes) throw Error(OrbitI18n.t('m545'));
    this.audit(`appointment.${status}`, id);
  }
  snapshot() {
    const appointments=this.db.prepare(`SELECT a.*,c.name client_name,c.phone,s.name service_name,a.total price,r.name resource_name,COALESCE((SELECT sum(amount) FROM payments p WHERE p.appointment_id=a.id),0) paid FROM appointments a JOIN clients c ON c.id=a.client_id JOIN services s ON s.id=a.service_id JOIN resources r ON r.id=a.resource_id ORDER BY start`).all();
    for(const a of appointments){a.clients=this.db.prepare('SELECT c.id,c.name FROM appointment_clients p JOIN clients c ON c.id=p.client_id WHERE p.appointment_id=?').all(a.id);a.resources=this.db.prepare('SELECT r.id,r.name FROM appointment_resources p JOIN resources r ON r.id=p.resource_id WHERE p.appointment_id=?').all(a.id);a.resource_name=a.resources.map(r=>r.name).join(', ');a.client_name=a.clients.map(c=>c.name).join(', ');}
    const profile={};for(const key of ['business','industry','installation','timezone','currency','logo','phone','address','work_start','work_end','work_days','onboarded','website_enabled'])profile[key]=this.get(key);
    return {clients:this.db.prepare('SELECT id,name,phone,notes,chat_id FROM clients ORDER BY name').all(),services:this.db.prepare('SELECT * FROM services WHERE archived=0 ORDER BY name').all(),resources:this.db.prepare('SELECT * FROM resources WHERE archived=0 ORDER BY name').all(),appointments,payments:this.db.prepare('SELECT p.*,s.name service_name FROM payments p JOIN appointments a ON a.id=p.appointment_id JOIN services s ON s.id=a.service_id ORDER BY at DESC').all(),...profile};
  }
  export() { const tables = {}; for (const table of TABLES) tables[table] = this.db.prepare(`SELECT * FROM ${table}`).all().map(row => ({ ...row })); for (const client of tables.clients) client.link_code = null; return { format: 'orbit-crm', version: 2, exported_at: new Date().toISOString(), tables }; }
  restore(data) {
    if(data?.format==='orbit-crm'&&data.version===1&&data.tables){data=JSON.parse(JSON.stringify(data));data.version=2;for(const s of data.tables.services||[])Object.assign(s,{capacity:1,required_resources:1,bot_visible:1,web_visible:0});for(const a of data.tables.appointments||[])Object.assign(a,{total:data.tables.services.find(s=>s.id===a.service_id)?.price||0,cost:0,people_count:1});data.tables.appointment_clients=(data.tables.appointments||[]).map(a=>({appointment_id:a.id,client_id:a.client_id}));data.tables.appointment_resources=(data.tables.appointments||[]).map(a=>({appointment_id:a.id,resource_id:a.resource_id}));data.tables.payments=[];}
    if(data?.format==='orbit-crm'&&data.version===2&&data.tables&&!data.tables.reminder_deliveries)data.tables.reminder_deliveries=(data.tables.reminders||[]).flatMap(q=>(data.tables.appointment_clients||[]).filter(p=>p.appointment_id===q.appointment_id).map(p=>({...q,client_id:p.client_id})));
    if (data?.format !== 'orbit-crm' || data.version !== 2 || !data.tables || TABLES.some(t => !Array.isArray(data.tables[t]))) throw Error(OrbitI18n.t('m546'));
    // Preserve device identity and local integration state. Credentials are never exported.
    const local = ['installation', 'telegram_offset', 'drive_last', 'drive_enabled'].map(k => [k, this.get(k)]);
    this.transaction(() => {
      for (const t of [...TABLES].reverse()) this.db.exec(`DELETE FROM ${t}`);
      for (const t of TABLES) {
        const columns = this.db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
        const stmt = this.db.prepare(`INSERT INTO ${t}(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`);
        if (data.tables[t].length > 1000000) throw Error(OrbitI18n.t('m547'));
        for (const row of data.tables[t]) stmt.run(...columns.map(c => row[c] ?? (c === "archived" ? 0 : null)));
      }
      for (const [k, v] of local) this.set(k, v);
      this.db.exec("UPDATE reminders SET status='pending' WHERE status='sending'");
      this.db.exec("UPDATE reminder_deliveries SET status='pending' WHERE status='sending'");
      this.audit('backup.restored', this.get('installation'));
    });
  }
  slots(serviceId, resourceId, date) {
    const service = this.db.prepare('SELECT * FROM services WHERE id=? AND archived=0').get(serviceId); if (!service) return [];
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!this.get('work_days').includes(new Date(`${date}T12:00:00Z`).getUTCDay()||7))return[];
    const day=zonedTime(date,this.get('work_start'),this.get('timezone')),close=zonedTime(date,this.get('work_end'),this.get('timezone')),result=[];
    for (let start = day; start + service.duration * 60000 <= close; start += 1800000) {
      if (start <= Date.now()) continue;
      if(this.availableResources(serviceId,resourceId,start).length>=service.required_resources)result.push(start);
    } return result;
  }
  resourceFree(resource,start,end){return Boolean(this.db.prepare('SELECT id FROM resources WHERE id=? AND archived=0').get(resource))&&!this.db.prepare("SELECT a.id FROM appointments a JOIN appointment_resources r ON r.appointment_id=a.id WHERE r.resource_id=? AND a.status='confirmed' AND a.start<? AND a.end>?").get(resource,end,start);}
  availableResources(serviceId, primary, start) {
    const service = this.db.prepare('SELECT * FROM services WHERE id=? AND archived=0').get(serviceId);
    if (!service || !Number.isSafeInteger(start)) return [];
    const automatic = primary == null || primary === '' || primary === 'any';
    const end = start + service.duration * 60000;
    if (!automatic && !this.resourceFree(primary, start, end)) return [];
    const free = this.db.prepare('SELECT id FROM resources WHERE archived=0 ORDER BY name,id').all()
      .filter(r => r.id !== primary && this.resourceFree(r.id, start, end)).map(r => r.id);
    const selected = (automatic ? free : [primary, ...free]).slice(0, service.required_resources);
    return selected.length === service.required_resources ? selected : [];
  }
  payment(data){const amount=Number(data.amount),value=Math.round(amount*100);if(!Number.isSafeInteger(value)||!value||Math.abs(value)>1e10)throw Error(OrbitI18n.t('m548'));const at=Number(data.at||Date.now());if(!Number.isSafeInteger(at)||at>Date.now()+60000)throw Error(OrbitI18n.t('m549'));const method=['cash','card','transfer','refund'].includes(data.method)?data.method:'cash';if((value<0)!==(method==='refund'))throw Error(OrbitI18n.t('m550'));const appointment=text(data.appointment_id);const row=this.db.prepare('SELECT id FROM appointments WHERE id=?').get(appointment);if(!row)throw Error(OrbitI18n.t('m551'));const id=randomUUID();this.db.prepare('INSERT INTO payments VALUES(?,?,?,?,?)').run(id,appointment,value,at,method);this.audit('payment.created',id);return id;}
  saveProfile(data){if(!['beauty','auto','universal'].includes(data.industry))throw Error(OrbitI18n.t('m552'));text(data.business,120);if(data.timezone){try{new Intl.DateTimeFormat('en',{timeZone:data.timezone});}catch{throw Error(OrbitI18n.t('m553'));}}if(data.currency&&!/^[A-Z]{3}$/.test(data.currency))throw Error(OrbitI18n.t('m554'));const start=data.work_start||this.get('work_start'),end=data.work_end||this.get('work_end');if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||start>=end)throw Error(OrbitI18n.t('m555'));if(data.work_days&&(!Array.isArray(data.work_days)||!data.work_days.length||data.work_days.some(d=>!Number.isInteger(d)||d<1||d>7)))throw Error(OrbitI18n.t('m556'));if(data.logo!==undefined&&data.logo!==null&&data.logo!==''&&(typeof data.logo!=='string'||data.logo.length>3000000||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(data.logo)))throw Error(OrbitI18n.t('m557'));this.transaction(()=>{for(const key of ['business','industry','timezone','currency','phone','address','work_start','work_end','work_days','logo','website_enabled'])if(data[key]!==undefined)this.set(key,typeof data[key]==='string'?data[key].trim():data[key]);this.set('onboarded',true);this.audit('settings.changed',this.get('installation'));});}
}
module.exports = { Store, zonedTime };
