const crypto = require('node:crypto');

const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const digits = value => String(value || '').replace(/\D/g, '');

// Public booking uses the same company database and calendar as the desktop and bot.
// The website API (/v1/website/<id>) and the booking page (/b/<address>) share catalog() and create().
class WebsiteBooking {
  constructor(accounts) {
    this.accounts = accounts;
    this.limits = new Map();
  }

  limit(business, address) {
    const now = Date.now();
    for (const [key, entry] of this.limits) if (entry.until <= now) this.limits.delete(key);
    const key = business + ':' + address;
    const entry = this.limits.get(key) || { count: 0, until: now + 3600000 };
    if (entry.count >= 20 || (!this.limits.has(key) && this.limits.size >= 10000))
      this.accounts.fail(429, 'Забагато спроб запису. Спробуйте пізніше або зателефонуйте нам / Too many booking attempts. Try again later.');
    entry.count++;
    this.limits.set(key, entry);
  }

  // Services marked "show on the website", specialists, and free times for one service and day.
  catalog(store, query) {
    const a = this.accounts, snapshot = store.catalogue();
    const services = snapshot.services.filter(s => s.web_visible);
    const serviceId = query.get('service_id');
    const resourceId = query.get('resource_id') || 'any';
    const date = query.get('date');
    if ((serviceId || date) && (!services.some(s => s.id === serviceId) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')))
      a.fail(400, 'Оберіть послугу і дату / Provide a public service_id and date in YYYY-MM-DD format');
    if (resourceId !== 'any' && !snapshot.resources.some(r => r.id === resourceId))
      a.fail(400, 'Такого спеціаліста немає / Unknown resource_id');
    const slots = serviceId && date ? store.slots(serviceId, resourceId, date) : null;
    return {
      business: store.get('business'), currency: store.get('currency'), timezone: store.get('timezone'),
      services: services.map(({id, name, duration, price, capacity, required_resources}) => ({id, name, duration, price, capacity, required_resources})),
      resources: snapshot.resources.filter(r => !serviceId || store.canDo(serviceId, r.id)).map(({id, name}) => ({id, name})),
      // A full day also shows the next free times, so the client does not have to search day by day.
      ...(slots ? { slots, ...(slots.length ? {} : { nearest: store.nearestSlots(serviceId, resourceId, date) }) } : {})
    };
  }

  // Name and phone checks shared by a booking and a place on the waiting list.
  person(data) {
    const a = this.accounts;
    if (!data || Array.isArray(data) || typeof data !== 'object') a.fail(400, 'Некоректний запит / JSON object required');
    if (data.consent !== true) a.fail(400, 'Потрібна згода на обробку даних для запису / Customer consent is required');
    const name = a.string(data.name, 120);
    if (typeof data.phone !== 'string' || data.phone.length > 40 || !/^[+\d\s().-]+$/.test(data.phone)) a.fail(400, 'Перевірте номер телефону / Invalid phone');
    const phone = digits(data.phone);
    if (phone.length < 7 || phone.length > 15) a.fail(400, 'Номер телефону має містити 7–15 цифр разом із кодом країни / Phone must contain 7–15 digits');
    return { name, phone };
  }

  // A full day on the booking page: the client waits for a freed time; the team sees them in the app.
  wait(business, store, data, address) {
    const a = this.accounts;
    this.limit(business.id, address);
    const { name, phone } = this.person(data);
    const catalogue = store.catalogue(), service = catalogue.services.find(s => s.web_visible && s.id === data.service_id);
    if (!service) a.fail(400, 'Цієї послуги немає в онлайн-записі / Unknown or private service');
    const resource = data.resource_id || 'any';
    if (resource !== 'any' && !catalogue.resources.some(r => r.id === resource)) a.fail(400, 'Такого спеціаліста немає / Unknown resource_id');
    return store.transaction(() => {
      const client = store.db.prepare('SELECT id,phone FROM clients').all().find(c => digits(c.phone) === phone);
      const clientId = client?.id || store.addClient({ name, phone: data.phone.trim() });
      try { return store.addWait({ client_id: clientId, service_id: service.id, resource_id: resource, date: String(data.date || ''), source: 'page' }); }
      catch { a.fail(400, 'Оберіть дату від сьогодні й не пізніше ніж за рік / Choose a date within the next year'); }
    });
  }

  // Creates the visit; a repeated request_id returns the same visit instead of a duplicate.
  create(business, store, data, address, ledger = 'website') {
    const a = this.accounts;
    this.limit(business.id, address);
    if (!data || Array.isArray(data) || typeof data !== 'object') a.fail(400, 'Некоректний запит / JSON object required');
    if (data.consent !== true) a.fail(400, 'Потрібна згода на обробку даних для запису / Customer consent is required');
    const catalogue = store.catalogue(), services = catalogue.services.filter(s => s.web_visible), resources = catalogue.resources;
    const service = services.find(s => s.id === data.service_id);
    if (!service) a.fail(400, 'Цієї послуги немає в онлайн-записі / Unknown or private service');
    const requestId = a.string(data.request_id, 100);
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(requestId)) a.fail(400, 'Некоректний запит / Invalid request_id');
    const name = a.string(data.name, 120);
    if (typeof data.phone !== 'string' || data.phone.length > 40 || !/^[+\d\s().-]+$/.test(data.phone)) a.fail(400, 'Перевірте номер телефону / Invalid phone');
    const phone = digits(data.phone);
    if (phone.length < 7 || phone.length > 15) a.fail(400, 'Номер телефону має містити 7–15 цифр разом із кодом країни / Phone must contain 7–15 digits');
    const start = data.start, people = data.people_count ?? 1, resource = data.resource_id || 'any';
    if (!Number.isSafeInteger(start) || !Number.isInteger(people) || people < 1 || people > service.capacity)
      a.fail(400, 'Некоректний час або кількість людей / Invalid start or people_count');
    if (resource !== 'any' && !resources.some(r => r.id === resource)) a.fail(400, 'Такого спеціаліста немає / Unknown resource_id');
    const bodyHash = fingerprint({name, phone, service_id:service.id, resource_id:resource, start, people});
    store.db.exec('CREATE TABLE IF NOT EXISTS website_requests(id TEXT PRIMARY KEY,body_hash TEXT NOT NULL,appointment_id TEXT NOT NULL,created_at INTEGER NOT NULL)');
    const previous = store.db.prepare('SELECT * FROM website_requests WHERE id=?').get(requestId);
    if (previous) {
      if (previous.body_hash !== bodyHash) a.fail(409, 'Цей запит уже використано для іншого запису / request_id was already used for a different booking');
      return { status: 200, appointment_id: previous.appointment_id };
    }
    // Preserve retries for bookings created before the company-local ledger existed.
    if (ledger === 'website') {
      const legacy = a.db.prepare('SELECT appointment_id FROM web_requests WHERE id=? AND business_id=?').get(business.id + ':' + requestId, business.id);
      if (legacy) return { status: 200, appointment_id: legacy.appointment_id };
    }
    if (start <= Date.now() || start > Date.now() + 366 * 86400000) a.fail(400, 'Оберіть час у майбутньому, не далі ніж на рік / start must be within the next 366 days');
    const date = new Intl.DateTimeFormat('en-CA', {timeZone:store.get('timezone'), year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date(start));
    if (!store.slots(service.id, resource, date).includes(start)) a.fail(409, 'Цей час щойно зайняли. Оберіть інший / This slot is no longer available.');
    const appointment = store.transaction(() => {
      const free = store.availableResources(service.id, resource, start);
      if (free.length < service.required_resources) a.fail(409, 'Цей час щойно зайняли. Оберіть інший / This slot is no longer available.');
      // A public request may reuse a client but may never rename it or expose its record.
      const client = store.db.prepare('SELECT id,phone FROM clients').all().find(c => digits(c.phone) === phone);
      const clientId = client?.id || store.addClient({name, phone:data.phone.trim()});
      let id;
      try { id = store.book({client_id:clientId, service_id:service.id, resource_ids:free, start, people_count:people}); }
      catch { a.fail(409, 'Не вдалося записати на цей час. Оберіть інший / The booking could not be reserved.'); }
      store.db.prepare('INSERT INTO website_requests VALUES(?,?,?,?)').run(requestId, bodyHash, id, Date.now());
      return id;
    });
    // The owner and administrators may want to hear about every online booking at once.
    this.accounts.notify?.event(business, 'booking', appointment, 'online').catch(() => {});
    return { status: 201, appointment_id: appointment };
  }

  async handle(req, url, reply) {
    const match = /^\/v1\/website\/([a-f0-9-]{36})(?:\/(book))?$/.exec(url.pathname);
    if (!match) return false;
    const { accounts: a } = this;
    const business = a.db.prepare('SELECT * FROM businesses WHERE id=?').get(match[1]);
    if (!business) a.fail(404, 'Компанію не знайдено / Business not found');
    a.allowed(a.db.prepare('SELECT * FROM users WHERE id=?').get(business.account_id));
    const { store } = a.businesses.get(business);
    if (!store.get('website_enabled')) a.fail(404, 'Онлайн-запис через сайт вимкнено / Website booking is disabled');
    if (req.method === 'GET' && !match[2]) return reply(200, this.catalog(store, url.searchParams)), true;
    if (req.method !== 'POST' || !match[2]) a.fail(404, 'Not found');
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) a.fail(415, 'JSON required');
    const data = await a.body(req);
    const { status, appointment_id } = this.create(business, store, data, req.clientAddress || req.socket.remoteAddress);
    reply(status, { appointment_id });
    return true;
  }
}
module.exports = { WebsiteBooking, digits };
