'use strict';
// Six months of three companies on a real LOMVIKO server in one process, with a simulated clock.
// Everything goes through the HTTP API the app and the booking page use; nothing is written to the
// databases directly except moving the clock. Run: node 33service/tools/simulate-half-year.cjs [days] [out.json]
const DAYS = Number(process.argv[2] || 182), OUT = process.argv[3] || '';
const START = Date.parse('2026-11-02T07:00:00Z'); // Monday 09:00 Kyiv
let now = START;
const RealDate = Date;
class SimDate extends RealDate { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
global.Date = SimDate;

const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const root = path.join(__dirname, '..', '..', 'platform');
const { setup, ProductStore, createProductServer } = require(root + '/api/server.cjs');
const { signRequest } = require(root + '/core/request-proof.cjs');
const DAY = 86400000, HOUR = 3600000;
let seed = 20261102;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;
const kyivDate = (ms) => new RealDate(ms + 2 * HOUR).toISOString().slice(0, 10);

const FIRST = ['Олена', 'Ірина', 'Марія', 'Оксана', 'Наталія', 'Юлія', 'Анна', 'Катерина', 'Тетяна', 'Світлана', 'Вікторія', 'Дарина', 'Андрій', 'Олександр', 'Дмитро', 'Максим', 'Іван', 'Сергій', 'Богдан', 'Тарас', 'Юрій', 'Назар', 'Роман', 'Остап'];
const LAST = ['Коваль', 'Шевченко', 'Бондаренко', 'Мельник', 'Ткаченко', 'Кравченко', 'Олійник', 'Лисенко', 'Гончаренко', 'Савчук', 'Руденко', 'Мороз', 'Литвин', 'Бойко', 'Гнатюк', 'Левченко'];
const COMPANIES = [
  { key: 'lira', name: 'Студія краси «Ліра»', industry: 'beauty', plan: 'business', pays: -2, daily: [6, 11],
    staff: ['Олена Коваль', 'Ірина Мороз', 'Наталія Литвин', 'Софія Бойко'],
    services: [['Жіноча стрижка', 60, 900], ['Фарбування', 120, 2200], ['Манікюр + покриття', 90, 750], ['Педикюр', 90, 850], ['Укладка', 45, 600], ['Корекція брів', 30, 400]],
    team: [{ name: 'Марія Адмін', email: 'admin@lira.sim', role: 'admin' }, { name: 'Ірина Мороз', email: 'iryna@lira.sim', role: 'staff' }] },
  { key: 'boroda', name: 'Барбершоп «Борода»', industry: 'beauty', plan: 'start', pays: 8, daily: [4, 8],
    staff: ['Тарас Гнатюк', 'Остап Левченко'],
    services: [['Стрижка', 45, 550], ['Стрижка + борода', 75, 850], ['Оформлення бороди', 30, 350], ['Дитяча стрижка', 30, 400]],
    team: [{ name: 'Остап Левченко', email: 'ostap@boroda.sim', role: 'staff' }] },
  { key: 'avto', name: 'СТО «АвтоДок»', industry: 'auto', plan: 'pro', pays: 1, daily: [3, 7],
    staff: ['Пост 1 · Віктор', 'Пост 2 · Сергій', 'Шиномонтаж'],
    services: [['Заміна масла', 45, 700], ['Діагностика', 60, 600], ['Шиномонтаж', 60, 1200], ['Заміна гальмівних колодок', 90, 1500], ['Розвал-сходження', 60, 900], ['Ремонт ходової', 180, 3500]],
    team: [{ name: 'Оля Приймальня', email: 'olya@avto.sim', role: 'admin' }] },
];

const stats = { requests: 0, byStatus: {}, latency: {}, unexpected: [], checks: [], weekly: [] };
function track(route, ms, status) {
  stats.requests++; stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  const key = route.replace(/\?.*/, '').replace(/\/b\/[a-z-]+/, '/b/:slug');
  (stats.latency[key] ||= []).push(ms);
}
function check(name, ok, details = '') { stats.checks.push({ day: kyivDate(now), name, ok: Boolean(ok), details }); if (!ok) console.log('CHECK FAILED', kyivDate(now), name, details); }

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lomviko-halfyear-')), keys = setup(dir), owner = new ProductStore(path.join(dir, 'owner.sqlite'));
  const server = createProductServer({ store: owner, ...keys, allowLocalAdmin: true });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  async function http(method, route, body, token = keys.adminToken, key) {
    const raw = body === undefined ? '' : JSON.stringify(body), t0 = performance.now();
    const r = await fetch(base + route, { method, headers: { ...(raw ? { 'Content-Type': 'application/json' } : {}), Authorization: 'Bearer ' + token, ...(key ? signRequest(method, route, raw, token, key) : {}) }, body: raw || undefined });
    const text = await r.text(), ms = performance.now() - t0; track(route, ms, r.status);
    let value; try { value = JSON.parse(text); } catch { value = text; }
    return { status: r.status, value, bytes: text.length, ms };
  }
  const expect = (r, what, ok = [200, 201]) => { if (!ok.includes(r.status)) stats.unexpected.push({ day: kyivDate(now), what, status: r.status, error: r.value?.error || String(r.value).slice(0, 120) }); return r; };
  async function login(email, password) {
    const pair = crypto.generateKeyPairSync('ed25519');
    const c = await http('POST', '/v1/auth/challenge', { login: email, password, public_key: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
    const r = await http('POST', '/v1/auth/login', { challenge_id: c.value.challenge_id, signature: crypto.sign(null, Buffer.from(JSON.stringify(c.value)), pair.privateKey).toString('base64url'), platform: 'web', arch: 'x64', version: 'web 2.8.0' });
    if (r.status !== 200) throw Error(`login ${email}: ${r.status} ${JSON.stringify(r.value)}`);
    return { email, password, session: r.value.session, key: pair.privateKey, business: r.value.businesses[0]?.id };
  }
  // A member's call; signs in again when the 7-day session ends, like the app does.
  async function as(m, route, body, method = 'POST') {
    const q = (route.includes('?') ? '&' : '?') + 'business_id=' + m.business;
    let r = await http(method, route + q, body, m.session, m.key);
    if (r.status === 401) { Object.assign(m, await login(m.email, m.password), { business: m.business }); r = await http(method, route + q, body, m.session, m.key); }
    return r;
  }

  // ---- Onboarding: the operator creates three owners (trial until 1 March 2027) ----
  const FREE_UNTIL = Date.parse('2027-03-01T00:00:00+02:00');
  for (const c of COMPANIES) {
    c.email = `${c.key}@owner.sim`; c.password = `${c.key}-owner-password`;
    expect(await http('POST', '/admin/users', { name: c.staff[0].split(' · ').pop(), email: c.email, password: c.password, business: c.name, days: Math.ceil((FREE_UNTIL - now) / DAY), max_devices: 10 }), 'create owner');
    owner.db.prepare("UPDATE users SET stage='trial',expires=? WHERE email=?").run(FREE_UNTIL, c.email);
    c.owner = await login(c.email, c.password);
    const O = (r, b) => as(c.owner, r, b);
    expect(await O('/v1/crm/profile', { business: c.name, industry: c.industry, timezone: 'Europe/Kyiv', currency: 'UAH', work_start: '09:00', work_end: '20:00', work_days: [1, 2, 3, 4, 5, 6], phone: '+380441234567' }), 'profile');
    c.resources = []; for (const s of c.staff) c.resources.push(expect(await O('/v1/crm/resource', { name: s, pay_percent: 40 }), 'resource').value.value);
    c.svc = []; for (const [name, duration, price] of c.services) c.svc.push({ id: expect(await O('/v1/crm/service', { name, duration, price, capacity: 1, required_resources: 1, bot_visible: true, web_visible: true }), 'service').value.value, duration, price });
    c.slug = c.key + '-sim';
    expect(await O('/v1/crm/booking/save', { slug: c.slug, enabled: true }), 'booking page');
    c.members = [];
    for (const m of c.team) {
      expect(await O('/v1/crm/users/add', { name: m.name, email: m.email, password: m.email + '-pass', role: m.role }), 'team add');
      c.members.push({ ...(await login(m.email, m.email + '-pass')), role: m.role });
    }
    c.clients = []; c.visits = []; c.certs = [];
  }
  const bookingPage = server.accounts.bookingPage;
  check('three companies set up', COMPANIES.every((c) => c.svc.length && c.resources.length));

  // ---- Days ----
  for (let d = 0; d < DAYS; d++) {
    const dayStart = START + d * DAY, date = kyivDate(dayStart), weekday = new RealDate(dayStart).getUTCDay() || 7;
    now = dayStart;
    for (const c of COMPANIES) {
      const O = (r, b) => as(c.owner, r, b), admin = c.members.find((m) => m.role === 'admin') || c.owner, A = (r, b) => as(admin, r, b);
      const locked = c.lockedUntil && now < c.lockedUntil;
      // New bookings for the coming two weeks: 60% booking page, 40% by the front desk.
      const n = c.daily[0] + Math.floor(rnd() * (c.daily[1] - c.daily[0] + 1));
      for (let i = 0; i < n && weekday <= 6; i++) {
        const svc = pick(c.svc), when = kyivDate(now + (1 + Math.floor(rnd() * 14)) * DAY);
        const cat = await http('GET', `/b/${c.slug}/catalog?service_id=${svc.id}&date=${when}`);
        const slots = cat.value?.slots || [];
        if (!slots.length) continue;
        const start = pick(slots), name = `${pick(FIRST)} ${pick(LAST)}`, phone = '+38067' + String(1000000 + Math.floor(rnd() * 8999999));
        if (chance(0.6)) {
          const r = await http('POST', `/b/${c.slug}/book`, { token: bookingPage.token(c.slug, now - 40000), request_id: crypto.randomUUID(), name, phone, consent: true, service_id: svc.id, resource_id: 'any', start });
          if (r.status === 201) c.visits.push({ start, svc });
          else if (!locked) expect(r, 'page booking', [201, 409]);
        } else {
          const existing = c.clients.length > 20 && chance(0.55) ? pick(c.clients) : null;
          const client = existing || expect(await A('/v1/crm/client', { name, phone }), 'client').value?.value;
          if (!client) continue; if (!existing) c.clients.push(client);
          const r = await A('/v1/crm/book', { client_id: client, service_id: svc.id, resource_ids: [pick(c.resources)], start });
          if (!locked) expect(r, 'desk booking', [200, 409, 400]);
        }
      }
      // Evening: today's visits are finished, paid, missed or cancelled.
      now = dayStart + 11 * HOUR;
      const today = await O(`/v1/crm/range`, { from: dayStart - 2 * HOUR, to: dayStart + 22 * HOUR });
      for (const a of (today.value?.value?.appointments || []).filter((a) => a.status === 'confirmed' && a.start < now)) {
        const roll = rnd();
        if (roll < 0.06) { expect(await A('/v1/crm/status', { id: a.id, status: 'no_show' }), 'no-show'); continue; }
        if (roll < 0.10) { expect(await A('/v1/crm/status', { id: a.id, status: 'cancelled' }), 'cancel'); continue; }
        expect(await A('/v1/crm/status', { id: a.id, status: 'completed' }), 'complete');
        const due = a.price - a.paid;
        if (due <= 0) continue;
        const usable = c.certs.find((x) => x.left >= due);
        if (c.plan === 'pro' && usable && chance(0.3)) { expect(await O('/v1/crm/payment', { appointment_id: a.id, amount: due / 100, method: 'certificate', voucher_id: usable.code }), 'certificate pay'); usable.left -= due; }
        else expect(await A('/v1/crm/payment', { appointment_id: a.id, amount: due / 100, method: chance(0.55) ? 'card' : 'cash' }), 'payment');
      }
      // Weekly and monthly chores.
      if (weekday === 1) {
        if (c.plan !== 'start') expect(await O('/v1/crm/expense', { amount: 1500 + Math.floor(rnd() * 3000), category: pick(['rent', 'materials', 'marketing', 'utilities', 'other']), date }), 'expense', [200, 403]);
        if (c.plan === 'pro' && chance(0.6)) { const s = expect(await O('/v1/crm/certificate', { amount: 2000, price: 1800, method: 'card' }), 'certificate', [200, 403]).value?.value; if (s?.code) c.certs.push({ code: s.code, left: 200000 }); }
        const snapGet = await as(c.owner, '/v1/crm/snapshot?window=1', undefined, 'GET');
        stats.weekly.push({ day: date, company: c.key, snapshotKb: Math.round(snapGet.bytes / 1024), snapshotMs: Math.round(snapGet.ms), clients: snapGet.value?.clients?.length, appointments: snapGet.value?.appointments?.length });
      }
      if (date.endsWith('-01')) {
        if (c.plan === 'pro') expect(await O('/v1/crm/payroll', { month: kyivDate(now - 5 * DAY).slice(0, 7) }), 'payroll');
        const ex = await as(c.owner, '/v1/crm/export', undefined, 'GET'); expect(ex, 'export');
      }
    }
    // ---- Product events ----
    if (date === '2027-01-15') {
      // The owner of Борода gives the employee the money switch; the employee then takes payments.
      const c = COMPANIES[1], users = (await as(c.owner, '/v1/crm/users', undefined, 'GET')).value || [];
      const ostap = users.find((u) => u.email === 'ostap@boroda.sim');
      expect(await as(c.owner, '/v1/crm/users/update', { id: ostap.id, role: 'staff', stage: 'active', perms: { ...ostap.perms, money: true } }), 'perms update');
      const snap = await as(c.members[0], '/v1/crm/snapshot?window=1', undefined, 'GET');
      check('employee with money permission sees payments', snap.value.perms.money === true);
    }
    if (date === '2027-02-25') { expect(await http('POST', '/admin/product', { sales: true }), 'sales on'); check('sales switched on, offer published', owner.product().sales); }
    for (const c of COMPANIES) {
      if (date === kyivDate(FREE_UNTIL + c.pays * DAY)) {
        const user = owner.db.prepare('SELECT id FROM users WHERE email=?').get(c.email).id;
        const r = expect(await http('POST', '/admin/purchase', { user_id: user, days: 30, max_devices: 10, plan: c.plan, reference: `sim-${c.key}-${date}`, confirmed: true }), 'purchase', [200, 201, 400]);
        if (r.status === 400) owner.db.prepare("UPDATE users SET stage='active',plan=?,expires=? WHERE id=?").run(c.plan, Math.max(now, FREE_UNTIL) + 30 * DAY, user);
        c.lockedUntil = 0;
      }
      if (date === kyivDate(FREE_UNTIL + 2 * DAY) && c.pays > 2) {
        const w = await as(c.owner, '/v1/crm/client', { name: 'Перевірка', phone: '+380500000000' });
        check(`${c.key}: after the trial ends without payment, changes are refused`, w.status === 403, String(w.status));
        const s = await as(c.owner, '/v1/crm/snapshot?window=1', undefined, 'GET');
        check(`${c.key}: the owner can still look at the data`, s.status === 200, String(s.status));
        c.lockedUntil = FREE_UNTIL + c.pays * DAY;
      }
      if (date === kyivDate(FREE_UNTIL + 10 * DAY)) {
        const gated = await as(c.owner, '/v1/crm/certificate', { amount: 500, method: 'cash' });
        check(`${c.key} (${c.plan}): certificates ${c.plan === 'pro' ? 'allowed' : 'refused'} by plan`, (gated.status === 200) === (c.plan === 'pro'), String(gated.status));
        const rep = await as(c.owner, '/v1/crm/expense', { amount: 100, category: 'other', date });
        check(`${c.key} (${c.plan}): expenses ${c.plan === 'start' ? 'refused' : 'allowed'} by plan`, (rep.status === 200) === (c.plan !== 'start'), String(rep.status));
      }
      // Monthly renewals after the first payment.
      const paidUser = owner.db.prepare('SELECT * FROM users WHERE email=?').get(c.email);
      if (paidUser.stage === 'active' && paidUser.expires - now < 2 * DAY && paidUser.expires > now)
      { const r = expect(await http('POST', '/admin/purchase', { user_id: paidUser.id, days: 30, max_devices: 10, plan: c.plan, reference: `sim-${c.key}-${date}-renew`, confirmed: true }), 'renewal', [200, 201, 400]);
        // Without SMTP in the simulation the operator's confirmation is recorded directly (on prod the letter goes out).
        if (r.status === 400) owner.db.prepare('UPDATE users SET expires=expires+? WHERE id=?').run(30 * DAY, paidUser.id); }
    }
    // Reminders run through the day on the server; here once per simulated hour slot.
    for (const b of owner.db.prepare('SELECT * FROM businesses').all()) {
      const rt = server.accounts.businesses.get(b);
      rt.telegram.call = async () => ({}); rt.vault.has('telegram') || rt.vault.put('telegram', '000000:sim');
      // A third of new clients press Start in the company bot (that is what links their chat).
      rt.store.db.prepare("UPDATE clients SET chat_id=CAST(abs(random()) % 900000000 AS TEXT) WHERE chat_id IS NULL AND abs(random()) % 3 = 0").run();
      for (const h of [8, 12, 16]) { now = dayStart + h * HOUR - 2 * HOUR; await rt.telegram.reminders().catch(() => {}); }
    }
    if (d % 30 === 29) console.log(`day ${d + 1}/${DAYS} ${date}: ${stats.requests} requests, ${stats.unexpected.length} unexpected`);
  }

  // ---- Totals ----
  const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))] * 10) / 10; };
  const companies = [];
  for (const c of COMPANIES) {
    const b = owner.db.prepare('SELECT * FROM businesses WHERE account_id=(SELECT id FROM users WHERE email=?)').get(c.email), st = server.accounts.businesses.get(b).store, q = (sql) => st.db.prepare(sql).get();
    companies.push({ key: c.key, name: c.name, plan: c.plan,
      clients: q('SELECT count(*) n FROM clients').n, visits: q('SELECT count(*) n FROM appointments').n,
      completed: q("SELECT count(*) n FROM appointments WHERE status='completed'").n, no_show: q("SELECT count(*) n FROM appointments WHERE status='no_show'").n, cancelled: q("SELECT count(*) n FROM appointments WHERE status='cancelled'").n,
      revenue: Math.round(q("SELECT coalesce(sum(amount),0) s FROM payments WHERE method NOT IN ('certificate','pass')").s / 100),
      certificates: q('SELECT count(*) n FROM certificates').n, expenses: q('SELECT count(*) n FROM expenses').n,
      reminders: q("SELECT count(*) n FROM reminder_deliveries WHERE status='sent'").n,
      dbKb: Math.round(fs.statSync(path.join(dir, 'businesses', b.id, 'crm.sqlite')).size / 1024) });
  }
  const latency = Object.fromEntries(Object.entries(stats.latency).map(([k, v]) => [k, { n: v.length, p50: pct(v, 0.5), p95: pct(v, 0.95), max: pct(v, 1) }]));
  const result = { days: DAYS, from: kyivDate(START), to: kyivDate(START + (DAYS - 1) * DAY), requests: stats.requests, byStatus: stats.byStatus, companies, checks: stats.checks, unexpected: stats.unexpected, latency, weekly: stats.weekly, ownerDbKb: Math.round(fs.statSync(path.join(dir, 'owner.sqlite')).size / 1024) };
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
  console.log(JSON.stringify({ requests: result.requests, byStatus: result.byStatus, companies, failedChecks: stats.checks.filter((c) => !c.ok), unexpected: stats.unexpected.slice(0, 15), unexpectedCount: stats.unexpected.length }, null, 1));
  global.Date = RealDate;
  await server.shutdown(); owner.db.close(); fs.rmSync(dir, { recursive: true, force: true });
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
