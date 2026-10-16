const crypto = require('node:crypto');

const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const digits = value => String(value || '').replace(/\D/g, '');

// Public booking uses the same company database and calendar as the desktop and bot.
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
      this.accounts.fail(429, 'Too many booking attempts. Try again later.');
    entry.count++;
    this.limits.set(key, entry);
  }

  async handle(req, url, reply) {
    const match = /^\/v1\/website\/([a-f0-9-]{36})(?:\/(book))?$/.exec(url.pathname);
    if (!match) return false;
    const { accounts: a } = this;
    const business = a.db.prepare('SELECT * FROM businesses WHERE id=?').get(match[1]);
    if (!business) a.fail(404, 'Business not found');
    a.allowed(a.db.prepare('SELECT * FROM users WHERE id=?').get(business.account_id));
    const { store } = a.businesses.get(business);
    if (!store.get('website_enabled')) a.fail(404, 'Website booking is disabled');
    const snapshot = store.snapshot();
    const services = snapshot.services.filter(s => s.web_visible);
    if (req.method === 'GET' && !match[2]) {
      const serviceId = url.searchParams.get('service_id');
      const resourceId = url.searchParams.get('resource_id') || 'any';
      const date = url.searchParams.get('date');
      if ((serviceId || date) && (!services.some(s => s.id === serviceId) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')))
        a.fail(400, 'Provide a public service_id and date in YYYY-MM-DD format');
      if (resourceId !== 'any' && !snapshot.resources.some(r => r.id === resourceId))
        a.fail(400, 'Unknown resource_id');
      reply(200, {
        business: store.get('business'), currency: store.get('currency'), timezone: store.get('timezone'),
        services: services.map(({id, name, duration, price, capacity, required_resources}) => ({id, name, duration, price, capacity, required_resources})),
        resources: snapshot.resources.filter(r => !serviceId || store.canDo(serviceId, r.id)).map(({id, name}) => ({id, name})),
        ...(serviceId && date ? { slots: store.slots(serviceId, resourceId, date) } : {})
      });
      return true;
    }
    if (req.method !== 'POST' || !match[2]) a.fail(404, 'Not found');
    this.limit(business.id, (req.clientAddress || req.socket.remoteAddress));
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) a.fail(415, 'JSON required');
    const data = await a.body(req);
    if (!data || Array.isArray(data) || typeof data !== 'object') a.fail(400, 'JSON object required');
    if (data.consent !== true) a.fail(400, 'Customer consent is required');
    const service = services.find(s => s.id === data.service_id);
    if (!service) a.fail(400, 'Unknown or private service');
    const requestId = a.string(data.request_id, 100);
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(requestId)) a.fail(400, 'Invalid request_id');
    const name = a.string(data.name, 120);
    if (typeof data.phone !== 'string' || data.phone.length > 40 || !/^[+\d\s().-]+$/.test(data.phone)) a.fail(400, 'Invalid phone');
    const phone = digits(data.phone);
    if (phone.length < 7 || phone.length > 15) a.fail(400, 'Phone must contain 7–15 digits, including country code');
    const start = data.start, people = data.people_count ?? 1, resource = data.resource_id || 'any';
    if (!Number.isSafeInteger(start) || !Number.isInteger(people) || people < 1 || people > service.capacity)
      a.fail(400, 'Invalid start or people_count');
    if (resource !== 'any' && !snapshot.resources.some(r => r.id === resource)) a.fail(400, 'Unknown resource_id');
    const bodyHash = fingerprint({name, phone, service_id:service.id, resource_id:resource, start, people});
    store.db.exec('CREATE TABLE IF NOT EXISTS website_requests(id TEXT PRIMARY KEY,body_hash TEXT NOT NULL,appointment_id TEXT NOT NULL,created_at INTEGER NOT NULL)');
    const previous = store.db.prepare('SELECT * FROM website_requests WHERE id=?').get(requestId);
    if (previous) {
      if (previous.body_hash !== bodyHash) a.fail(409, 'request_id was already used for a different booking');
      reply(200, {appointment_id:previous.appointment_id});
      return true;
    }
    // Preserve retries for bookings created before the company-local ledger existed.
    const legacy = a.db.prepare('SELECT appointment_id FROM web_requests WHERE id=? AND business_id=?').get(business.id + ':' + requestId, business.id);
    if (legacy) { reply(200, {appointment_id:legacy.appointment_id}); return true; }
    if (start <= Date.now() || start > Date.now() + 366 * 86400000) a.fail(400, 'start must be within the next 366 days');
    const date = new Intl.DateTimeFormat('en-CA', {timeZone:store.get('timezone'), year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date(start));
    if (!store.slots(service.id, resource, date).includes(start)) a.fail(409, 'This slot is no longer available. Refresh the schedule.');
    const appointment = store.transaction(() => {
      const resources = store.availableResources(service.id, resource, start);
      if (resources.length < service.required_resources) a.fail(409, 'This slot is no longer available.');
      // A public request may reuse a client but may never rename it or expose its record.
      const client = store.db.prepare('SELECT id,phone FROM clients').all().find(c => digits(c.phone) === phone);
      const clientId = client?.id || store.addClient({name, phone:data.phone.trim()});
      let id;
      try { id = store.book({client_id:clientId, service_id:service.id, resource_ids:resources, start, people_count:people}); }
      catch (error) { a.fail(409, 'The booking could not be reserved. Refresh the schedule.'); }
      store.db.prepare('INSERT INTO website_requests VALUES(?,?,?,?)').run(requestId, bodyHash, id, Date.now());
      return id;
    });
    reply(201, {appointment_id:appointment});
    return true;
  }
}
module.exports = { WebsiteBooking };
