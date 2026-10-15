const crypto = require('node:crypto');
const LANGUAGES = ['uk', 'en'];
const FEATURE_DEFAULTS = {"uk":[["▦","Розклад для всієї команди","Вільний майстер, кілька співробітників або груповий запис — під кожну послугу."],["↗","Запис через Telegram","Клієнт обирає послугу та час. Бот приймає записи й надсилає нагадування через сервер, навіть коли CRM закрита."],["◫","Зрозумілі результати","Завантаженість, доходи та популярні послуги з фільтрами за періодом."],["☁","Копії на вашому Google Drive","Підключіть диск через авторизацію Google. Зберігайте резервні копії на диску власника бізнесу."],["♙","Кілька бізнесів. Один доступ.","Команди, ролі та окремі робочі простори для ваших компаній."],["↓","Ваші дані залишаються вашими","Експортуйте базу та створюйте резервні копії перед оновленням."]],"en":[["▦","One schedule for your team","An available specialist, multiple staff members or group bookings — configured per service."],["↗","Bookings through Telegram","Customers choose a service and time. The server runs the bot and reminders even when the desktop CRM is closed."],["◫","Results you can understand","Workload, revenue and popular services, filtered by period."],["☁","Backups on your Google Drive","Connect with Google sign-in. Store backups on the business owner’s Drive."],["♙","Multiple businesses. One login.","Teams, roles and separate workspaces for your companies."],["↓","Your business data is yours","Export your database and create backups before updating."]]};
const FAQ_DEFAULTS = {"uk":[["Чи потрібен інтернет?","Так, для створення та зміни записів і синхронізації потрібен інтернет. Без мережі можна переглядати збережений розклад."],["Бот працює, коли комп’ютер вимкнено?","Так, якщо сервер бізнесу працює. Бот і нагадування запускаються на сервері, незалежно від десктопного застосунку."],["Що потрібно для початку?","Залиште заявку. Підготуємо бізнес і демодоступ. Після встановлення достатньо увійти за логіном і паролем; ключ може використовуватися як альтернативний спосіб активації."],["Чи можна забрати всі свої дані?","Так. CRM підтримує експорт бази. Google Drive використовується для резервних копій; спільна робота команди синхронізується через сервер."]],"en":[["Do I need internet access?","Yes, to create or change appointments and synchronize data. Offline, you can view the saved schedule."],["Does the bot work when my computer is off?","Yes, while your business server is running. The server runs the bot and reminders independently of the desktop app."],["What do I need to get started?","Request a demo. We prepare your business and access. Install the app and sign in with your login and password; a key is an alternative activation method."],["Can I take all my data with me?","Yes. The CRM supports database export. Google Drive stores backups; shared team data synchronizes through the server."]]};
function fail(message, status = 400) { throw Object.assign(Error(message), { status }); }
function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail('Invalid website text');
  return value.trim();
}
function defaults() {
  const content = { enabled: true, contactEmail: '', locales: {
    uk: { eyebrow: 'РОБОЧИЙ ПРОСТІР ДЛЯ ВАШОГО БІЗНЕСУ', title: 'Менше рутини. Більше часу для вашого бізнесу.', description: 'Записи, клієнти та фінанси в одному застосунку. Для салону краси, СТО та бізнесу, який працює за розкладом.', price: 'Почніть зі знайомства', priceNote: 'Залиште заявку: покажемо застосунок і підберемо умови для вашого бізнесу.', about: 'Один робочий простір для кількох бізнесів, команд і послуг.', privacy: 'Надаючи ім’я та email, ви погоджуєтеся на їх використання для відповіді на вашу заявку. Ми не створюємо обліковий запис автоматично. Щоб видалити заявку, зверніться за контактним email на цій сторінці.' },
    en: { eyebrow: 'YOUR BUSINESS, IN ONE PLACE', title: 'Less routine. More time for your business.', description: 'Appointments, customers and finances in one desktop app. For beauty salons, repair shops and businesses that run on a schedule.', price: 'Start with a conversation', priceNote: 'Request a demo: we will show you the app and discuss terms for your business.', about: 'One workspace for multiple businesses, teams and services.', privacy: 'By providing your name and email, you agree to their use to respond to your request. We do not automatically create an account. To delete your request, contact the email displayed on this page.' }
  }, announcements: [] };
  for (const lang of LANGUAGES) { content.locales[lang].features=FEATURE_DEFAULTS[lang];content.locales[lang].faq=FAQ_DEFAULTS[lang]; }
  return content;
}
function validate(input) {
  if (!input || typeof input !== 'object' || typeof input.enabled !== 'boolean') fail('Invalid website content');
  const contactEmail = text(input.contactEmail, 254);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) fail('Invalid contact email');
  const locales = {};
  for (const lang of LANGUAGES) {
    const value = input.locales?.[lang]; if (!value) fail('Both Ukrainian and English content are required');
    locales[lang] = {};
    for (const [key, max] of Object.entries({ eyebrow: 100, title: 160, description: 1000, price: 160, priceNote: 1000, about: 1000, privacy: 2000 })) locales[lang][key] = text(value[key], max, true);
    const features=value.features ?? FEATURE_DEFAULTS[lang],faq=value.faq ?? FAQ_DEFAULTS[lang];
    if(!Array.isArray(features)||features.length!==6||!Array.isArray(faq)||faq.length!==4)fail('Six features and four FAQ items are required');
    locales[lang].features=features.map((item,index)=>{if(!Array.isArray(item)||item.length!==3)fail('Invalid feature');return [FEATURE_DEFAULTS[lang][index][0],text(item[1],160,true),text(item[2],1000,true)];});
    locales[lang].faq=faq.map(item=>{if(!Array.isArray(item)||item.length!==2)fail('Invalid FAQ');return [text(item[0],200,true),text(item[1],2000,true)];});
  }
  if (!Array.isArray(input.announcements) || input.announcements.length > 30) fail('At most 30 announcements');
  const ids = new Set();
  const announcements = input.announcements.map(item => {
    if (!/^[a-f0-9-]{36}$/.test(item.id || '') || ids.has(item.id) || typeof item.visible !== 'boolean' || !Number.isSafeInteger(item.at) || item.at < 0 || item.at > Date.now()+365*86400000) fail('Invalid announcement'); ids.add(item.id);
    return { id: item.id, at: item.at, visible: item.visible, uk: { title: text(item.uk?.title, 160, true), body: text(item.uk?.body, 2000, true) }, en: { title: text(item.en?.title, 160, true), body: text(item.en?.body, 2000, true) } };
  });
  return { enabled: input.enabled, contactEmail, locales, announcements };
}
class PublicSite {
  constructor(store, updates) {
    this.store = store; this.db = store.db; this.updates = updates;
    this.db.exec(`CREATE TABLE IF NOT EXISTS site_content(id INTEGER PRIMARY KEY CHECK(id=1),draft TEXT NOT NULL,published TEXT NOT NULL,revision INTEGER NOT NULL,published_revision INTEGER NOT NULL,updated_at INTEGER NOT NULL,published_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS site_history(revision INTEGER PRIMARY KEY,content TEXT NOT NULL,at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS site_leads(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,business TEXT NOT NULL,message TEXT NOT NULL,language TEXT NOT NULL,stage TEXT NOT NULL,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS site_downloads(day TEXT NOT NULL,version TEXT NOT NULL,platform TEXT NOT NULL,arch TEXT NOT NULL,requested INTEGER NOT NULL DEFAULT 0,completed INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,version,platform,arch));
      CREATE TABLE IF NOT EXISTS security_rejections(minute INTEGER NOT NULL,category TEXT NOT NULL,status INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(minute,category,status));`);
    const content = JSON.stringify(defaults()), now = Date.now();
    this.db.prepare('INSERT OR IGNORE INTO site_content VALUES(1,?,?,1,1,?,?)').run(content, content, now, now);
  }
  state() { return this.db.prepare('SELECT * FROM site_content WHERE id=1').get(); }
  admin() {
    const row = this.state();
    return { draft: validate(JSON.parse(row.draft)), published: validate(JSON.parse(row.published)), revision: row.revision, publishedRevision: row.published_revision, publishedAt: row.published_at, leads: this.db.prepare('SELECT * FROM site_leads ORDER BY created_at DESC LIMIT 200').all(), leadCount: this.db.prepare('SELECT count(*) n FROM site_leads').get().n, downloads: this.db.prepare('SELECT * FROM site_downloads ORDER BY day DESC LIMIT 200').all(), downloadTotals: this.db.prepare('SELECT COALESCE(sum(requested),0) requested,COALESCE(sum(completed),0) completed FROM site_downloads').get() };
  }
  save(data) {
    const content = JSON.stringify(validate(data.content));
    const row = this.db.prepare('UPDATE site_content SET draft=?,revision=revision+1,updated_at=? WHERE id=1 AND revision=?').run(content, Date.now(), data.revision);
    if (!row.changes) fail('Content changed elsewhere. Refresh before editing.', 409);
    this.store.event('site.draft.saved'); return { revision: this.state().revision };
  }
  publish(data) {
    return this.store.transaction(() => {
      const row = this.state(); if (row.revision !== data.revision) fail('Content changed elsewhere. Refresh before publishing.', 409);
      const content = validate(JSON.parse(row.draft));
      if (content.enabled && !content.contactEmail) fail('Set a contact email before publishing');
      const now = Date.now();
      this.db.prepare('INSERT OR REPLACE INTO site_history VALUES(?,?,?)').run(row.published_revision, row.published, row.published_at);
      this.db.prepare('DELETE FROM site_history WHERE revision NOT IN (SELECT revision FROM site_history ORDER BY revision DESC LIMIT 10)').run();
      this.db.prepare('UPDATE site_content SET published=draft,published_revision=revision,published_at=? WHERE id=1').run(now);
      this.store.event('site.published'); return { ok: true };
    });
  }
  public() {
    const row = this.state(), content = validate(JSON.parse(row.published));
    if (!content.enabled) fail('Website temporarily unavailable', 503);
    const releases = [];
    for (const platform of ['mac', 'win']) for (const arch of ['x64', 'arm64']) {
      const r = this.updates.latest(platform, arch); if (r) releases.push({ version: r.version, platform, arch, sha256: r.sha256, size: r.size, notes: r.notes, publishedAt: r.published_at, path: `/public/download/${r.version}/${platform}/${arch}` });
    }
    return { brand: 'LOMVIKO', revision: row.published_revision, publishedAt: row.published_at, contactEmail: content.contactEmail, locales: content.locales, announcements: content.announcements.filter(a => a.visible).sort((a,b) => b.at-a.at), releases, demoAvailable: !!content.contactEmail };
  }
  lead(data) {
    if (!this.public().demoAvailable) fail('Demo requests are not configured yet', 503);
    if (!data || typeof data !== 'object' || Array.isArray(data)) fail('Invalid demo request');
    if (data.website) return { ok: true }; // Honeypot; no record and no account created.
    if (data.consent !== true || !LANGUAGES.includes(data.language)) fail('Consent and supported language are required');
    const name = text(data.name, 120, true), email = text(data.email, 254, true).toLowerCase(), business = text(data.business || '', 160), message = text(data.message || '', 2000);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Invalid email');
    if (this.db.prepare('SELECT count(*) n FROM site_leads WHERE email=? AND created_at>?').get(email, Date.now()-86400000).n >= 3) fail('Please wait before submitting another request', 429);
    const count = this.db.prepare('SELECT count(*) n FROM site_leads WHERE created_at>?').get(Date.now()-60000).n;
    if (count >= 30) fail('Too many requests; please try later', 429);
    this.store.transaction(()=>{const id=crypto.randomUUID();this.db.prepare('INSERT INTO site_leads VALUES(?,?,?,?,?,?,?,?)').run(id, name, email, business, message, data.language, 'new', Date.now());this.mail?.lead({id,name,email,business,message,language:data.language});this.store.event('site.lead.created');});return { ok: true };
  }
  updateLead(data) {
    if (!['new', 'contacted', 'closed'].includes(data.stage)) fail('Invalid lead stage');
    if (!this.db.prepare('UPDATE site_leads SET stage=? WHERE id=?').run(data.stage, data.id).changes) fail('Lead not found', 404);
    this.store.event('site.lead.updated'); return { ok: true };
  }
  deleteLead(data) { this.mail?.cancelLead(data.id);this.db.prepare('DELETE FROM site_leads WHERE id=?').run(data.id); this.store.event('site.lead.deleted'); return { ok: true }; }
  countDownload(r, complete = false) {
    const day = new Date().toISOString().slice(0,10);
    this.db.prepare(`INSERT INTO site_downloads VALUES(?,?,?,?,?,?) ON CONFLICT(day,version,platform,arch) DO UPDATE SET ${complete?'completed=completed+1':'requested=requested+1'}`).run(day, r.version, r.platform, r.arch, complete?0:1, complete?1:0);
  }
  reject(route, status) {
    const category = route.startsWith('/admin/') ? 'admin' : route.startsWith('/public/') ? 'website' : 'client';
    this.db.prepare('INSERT INTO security_rejections VALUES(?,?,?,1) ON CONFLICT(minute,category,status) DO UPDATE SET count=count+1').run(Math.floor(Date.now()/60000)*60000, category, status);
  }
  security() { return { rejections: this.db.prepare('SELECT * FROM security_rejections ORDER BY minute DESC LIMIT 300').all(), rejected24h: this.db.prepare('SELECT COALESCE(sum(count),0) n FROM security_rejections WHERE minute>?').get(Date.now()-86400000).n }; }
  cleanup() { this.db.prepare('DELETE FROM security_rejections WHERE minute<?').run(Date.now()-30*86400000); }
}
module.exports = { PublicSite, defaults, validate };
