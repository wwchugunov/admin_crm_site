const crypto = require('node:crypto');
const LANGUAGES = ['uk', 'en'];
const FEATURE_DEFAULTS = {"uk":[["▦","Розклад для всієї команди","Майстри, кабінети й обладнання в одній сітці. Свій графік у кожного спеціаліста, вихідні й відпустки — а записи з цих днів можна одразу передати колезі."],["↗","Telegram-бот 24/7","Клієнт записується сам навіть о третій ночі. Бот працює на сервері — коли ваш комп’ютер вимкнено."],["◫","Ваша сторінка запису","Посилання з логотипом для Instagram і Google Карт, QR-код на ресепшн і кнопка «Записатися» для сайту."],["☁","Нагадування, що рятують виручку","Бот нагадує клієнту за 24 і за 2 години до візиту. Менше неявок — менше годин, які вже не продати."],["♙","monobank і ПриватБанк — уже підключені","Інтеграції з monobank і LiqPay (ПриватБанк) ми зробили за вас: без програмістів і окремих договорів на розробку. Вставте свій ключ — і клієнти платять за посиланням чи QR, гроші одразу на ваш рахунок."],["↓","Фінанси без таблиць","Виручка, матеріали, повернення й завантаженість — за будь-який період і по кожному спеціалісту."]],"en":[["▦","One schedule for your team","Specialists, rooms and equipment in one grid. Personal working days, days off and holidays — and visits on those days can be handed to a colleague right away."],["↗","24/7 Telegram bot","Clients book themselves even at 3 a.m. The bot runs on the server — while your computer is off."],["◫","Your own booking page","A link with your logo for Instagram and Google Maps, a QR code for the front desk and a “Book now” button for your website."],["☁","Reminders that save revenue","The bot reminds clients 24 hours and 2 hours before the visit. Fewer no-shows — fewer hours you can’t sell again."],["♙","monobank and PrivatBank — already built in","We built the monobank and LiqPay (PrivatBank) integrations for you: no developers, no extra contracts. Paste your key — clients pay by link or QR and the money goes straight to your account."],["↓","Finances without spreadsheets","Revenue, materials, refunds and workload — for any period and per specialist."]]};
const FAQ_DEFAULTS = {"uk":[["Скільки це коштує?","Три тарифи: «Старт» — 199 грн/міс (розклад, бот, сторінка запису, нагадування), «Бізнес» — 499 грн/міс (+ онлайн-оплати, звіти, розсилки), «Про» — 899 грн/міс (+ сертифікати, склад, зарплати, ПРРО, філії). До 1 березня 2027 усі функції безкоштовні, без картки."],["Що буде після пробного періоду?","Нічого не зникне. Без оплати зміни зупиняються, але переглядати й експортувати дані можна ще 30 днів."],["Чи підійде моєму бізнесу?","Так, якщо ви працюєте за записом: салони, барбершопи, клініки, масаж, студії, репетитори, СТО. Підтримуються групові заняття, кабінети й обладнання."],["Чи потрібен свій сайт?","Ні. Ви отримуєте власну сторінку запису з логотипом і QR-кодом. Якщо сайт є — кнопка «Записатися» додається одним рядком коду (Tilda, Wix, WordPress, Хорошоп)."]],"en":[["How much does it cost?","Three plans: Start — UAH 199/month (schedule, bot, booking page, reminders), Business — UAH 499/month (+ online payments, reports, mailings), Pro — UAH 899/month (+ certificates, stock, pay, fiscal receipts, branches). Every feature is free until 1 March 2027, no card needed."],["What happens after the trial?","Nothing is lost. Without payment, editing stops, but you can view and export your data for another 30 days."],["Will it fit my business?","Yes, if you work by appointment: salons, barbershops, clinics, massage, studios, tutors, car services. Group classes, rooms and equipment are supported."],["Do I need my own website?","No. You get your own booking page with your logo and a QR code. If you have a site, the “Book now” button is one line of code (Tilda, Wix, WordPress)."]]};
function fail(message, status = 400) { throw Object.assign(Error(message), { status }); }
function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail('Invalid website text');
  return value.trim();
}
function defaults() {
  const content = { enabled: true, contactEmail: '', locales: {
    uk: { eyebrow: "CRM для салонів, клінік, студій і СТО", title: "Онлайн-запис і CRM для вашого бізнесу.", description: "Клієнти записуються самі 24/7, бот нагадує про візит, а розклад, оплати, витрати й зарплати команди — в одній програмі. Для салонів, клінік, СТО, студій і всіх, хто працює за записом.", price: "199 грн на місяць або 1 990 грн на рік. До 1 березня 2027 — безкоштовно.", priceNote: "Без картки й без дзвінків менеджера. Зареєструйтеся прямо в браузері — і приймайте перші онлайн-записи вже сьогодні.", about: "Один робочий простір для кількох бізнесів, команд і послуг.", privacy: "Надаючи ім’я та email, ви погоджуєтеся на їх використання для відповіді на вашу заявку. Ми не створюємо обліковий запис автоматично. Щоб видалити заявку, зверніться за контактним email на цій сторінці.", features: FEATURE_DEFAULTS.uk, faq: FAQ_DEFAULTS.uk },
    en: { eyebrow: "The CRM for salons, clinics, studios and car services", title: "Online booking and CRM for your business.", description: "Clients book themselves 24/7, a bot reminds them of the visit, and your schedule, payments, expenses and team pay live in one app. For salons, clinics, car services, studios and anyone who works by appointment.", price: "UAH 199 a month or UAH 1,990 a year. Free until 1 March 2027.", priceNote: "No card and no sales calls. Sign up right in your browser — and take your first online bookings today.", about: "One workspace for multiple businesses, teams and services.", privacy: "By providing your name and email, you agree to their use to respond to your request. We do not automatically create an account. To delete your request, contact the email displayed on this page.", features: FEATURE_DEFAULTS.en, faq: FAQ_DEFAULTS.en },
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
  constructor(store) {
    this.store = store; this.db = store.db;
    this.db.exec(`CREATE TABLE IF NOT EXISTS site_content(id INTEGER PRIMARY KEY CHECK(id=1),draft TEXT NOT NULL,published TEXT NOT NULL,revision INTEGER NOT NULL,published_revision INTEGER NOT NULL,updated_at INTEGER NOT NULL,published_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS site_history(revision INTEGER PRIMARY KEY,content TEXT NOT NULL,at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS site_leads(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,business TEXT NOT NULL,message TEXT NOT NULL,language TEXT NOT NULL,stage TEXT NOT NULL,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS security_rejections(minute INTEGER NOT NULL,category TEXT NOT NULL,status INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(minute,category,status));
      CREATE TABLE IF NOT EXISTS security_rejection_routes(minute INTEGER NOT NULL,route TEXT NOT NULL,status INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(minute,route,status));`);
    const content = JSON.stringify(defaults()), now = Date.now();
    this.db.prepare('INSERT OR IGNORE INTO site_content VALUES(1,?,?,1,1,?,?)').run(content, content, now, now);
  }
  state() { return this.db.prepare('SELECT * FROM site_content WHERE id=1').get(); }
  admin() {
    const row = this.state();
    return { draft: validate(JSON.parse(row.draft)), published: validate(JSON.parse(row.published)), revision: row.revision, publishedRevision: row.published_revision, publishedAt: row.published_at, leads: this.db.prepare('SELECT * FROM site_leads ORDER BY created_at DESC LIMIT 200').all(), leadCount: this.db.prepare('SELECT count(*) n FROM site_leads').get().n };
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
    return { brand: 'LOMVIKO', revision: row.published_revision, publishedAt: row.published_at, contactEmail: content.contactEmail, locales: content.locales, announcements: content.announcements.filter(a => a.visible).sort((a,b) => b.at-a.at), documents: this.documents?.public() || {}, demoAvailable: !!content.contactEmail, product: this.product?.() || null };
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
  reject(route, status) {
    const category = route.startsWith('/admin/') ? 'admin' : route.startsWith('/public/') ? 'website' : 'client';
    const minute = Math.floor(Date.now()/60000)*60000;
    this.db.prepare('INSERT INTO security_rejections VALUES(?,?,?,1) ON CONFLICT(minute,category,status) DO UPDATE SET count=count+1').run(minute, category, status);
    // Paths only, with identifiers collapsed, so the log explains spikes without storing personal data.
    const path = String(route).slice(0, 200).replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id').replace(/\/[0-9a-f]{32,}/gi, '/:id').replace(/[^\w/.:-]/g, '_').slice(0, 120);
    this.db.prepare('INSERT INTO security_rejection_routes VALUES(?,?,?,1) ON CONFLICT(minute,route,status) DO UPDATE SET count=count+1').run(minute, path, status);
  }
  security() { return { rejections: this.db.prepare('SELECT * FROM security_rejections ORDER BY minute DESC LIMIT 300').all(), rejected24h: this.db.prepare('SELECT COALESCE(sum(count),0) n FROM security_rejections WHERE minute>?').get(Date.now()-86400000).n, routes: this.db.prepare('SELECT route,status,sum(count) count,max(minute) last FROM security_rejection_routes WHERE minute>? GROUP BY route,status ORDER BY count DESC LIMIT 50').all(Date.now()-86400000) }; }
  cleanup() { this.db.prepare('DELETE FROM security_rejections WHERE minute<?').run(Date.now()-30*86400000); this.db.prepare('DELETE FROM security_rejection_routes WHERE minute<?').run(Date.now()-30*86400000); }
}
module.exports = { PublicSite, defaults, validate };
