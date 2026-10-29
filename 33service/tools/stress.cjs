'use strict';
// Load test of one LOMVIKO API process. The server runs in a child process with seeded companies;
// this process plays many owners, front desks and booking-page visitors at once.
// node 33service/tools/stress.cjs [companies=40] [clients=1500] [visits=12000] [seconds=30]
const { spawn } = require('node:child_process'), path = require('node:path'), fs = require('node:fs'), os = require('node:os'), crypto = require('node:crypto');
const root = path.join(__dirname, '..', '..', 'platform');

if (process.argv[2] === '--server') {
  // ---- Child: seed and serve ----
  const [, , , N, CLIENTS, VISITS] = process.argv.map(Number);
  const { setup, ProductStore, createProductServer } = require(root + '/api/server.cjs');
  const { passwordHash } = require(root + '/api/accounts.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lomviko-stress-')), keys = setup(dir), owner = new ProductStore(path.join(dir, 'owner.sqlite'));
  const server = createProductServer({ store: owner, ...keys, allowLocalAdmin: true, trustProxy: true });
  const hash = passwordHash('stress-password-1'), companies = [], DAY = 86400000, t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const email = `owner${i}@stress.test`, user = owner.addUser({ name: 'Owner ' + i, email, business: 'Company ' + i, days: 60, max_devices: 50, password_hash: hash });
    const id = server.accounts.addBusiness(user, 'Company ' + i), business = owner.db.prepare('SELECT * FROM businesses WHERE id=?').get(id), rt = server.accounts.businesses.get(business), st = rt.store;
    st.saveProfile({ business: 'Company ' + i, industry: 'beauty', timezone: 'Europe/Kyiv', currency: 'UAH', work_start: '08:00', work_end: '21:00', work_days: [1, 2, 3, 4, 5, 6, 7] });
    const res = [0, 1, 2, 3, 4].map((n) => st.addResource({ name: 'Майстер ' + n }));
    const svc = [0, 1, 2, 3].map((n) => st.addService({ name: 'Послуга ' + n, duration: 30 + 15 * n, price: 300 + 200 * n, web_visible: true, bot_visible: true }));
    // History is written in bulk: a company that has worked for about a year.
    st.transaction(() => {
      const clients = [];
      for (let c = 0; c < CLIENTS; c++) clients.push(st.addClient({ name: `Клієнт ${i}-${c}`, phone: '+38050' + String(1000000 + i * 20000 + c).slice(-7) }));
      const ins = st.db.prepare("INSERT INTO appointments(id,client_id,service_id,resource_id,start,end,status,notes,created_at) VALUES(?,?,?,?,?,?,?,'',?)");
      const ac = st.db.prepare('INSERT INTO appointment_clients VALUES(?,?)'), ar = st.db.prepare('INSERT INTO appointment_resources VALUES(?,?)');
      for (let v = 0; v < VISITS; v++) {
        const a = crypto.randomUUID(), start = t0 - (365 * DAY) + Math.floor(v * (365 * DAY) / VISITS), cl = clients[v % clients.length], r = res[v % res.length];
        ins.run(a, cl, svc[v % svc.length], r, start, start + 3600000, v % 10 === 0 ? 'no_show' : 'completed', start);
        ac.run(a, cl); ar.run(a, r);
      }
    });
    server.accounts.bookingPage.save(business, rt, { slug: 'stress-' + i, enabled: true });
    companies.push({ email, business: id, slug: 'stress-' + i, services: svc, token: server.accounts.bookingPage.token('stress-' + i, Date.now() - 30000) });
  }
  server.listen(0, '127.0.0.1', () => process.stdout.write(JSON.stringify({ port: server.address().port, companies, seedMs: Date.now() - t0, dir }) + '\n'));
  setInterval(() => process.send?.({ rss: process.memoryUsage().rss }), 1000).unref();
  process.on('SIGTERM', () => process.exit(0));
  return;
}

// ---- Parent: load ----
const { signRequest } = require(root + '/core/request-proof.cjs');
const [N = 40, CLIENTS = 1500, VISITS = 12000, SECONDS = 30] = process.argv.slice(2).map(Number);
const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', ...(process.env.STRESS_PROF ? ['--cpu-prof', '--cpu-prof-dir=' + process.env.STRESS_PROF] : []), __filename, '--server', N, CLIENTS, VISITS], { stdio: ['ignore', 'pipe', 'inherit', 'ipc'] });
let rssMax = 0; child.on('message', (m) => { rssMax = Math.max(rssMax, m.rss); });
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))]) : null; };
let ipSeq = 0; const ip = () => `10.${(ipSeq >> 16) & 255}.${(ipSeq >> 8) & 255}.${ipSeq++ & 255}`;
child.stdout.once('data', async (chunk) => {
  const info = JSON.parse(chunk.toString()), base = 'http://127.0.0.1:' + info.port, out = { companies: N, clientsEach: CLIENTS, visitsEach: VISITS, seedSeconds: Math.round(info.seedMs / 1000) };
  async function call(method, route, body, s, headers = {}) {
    const raw = body === undefined ? '' : JSON.stringify(body), t0 = performance.now();
    let r; try { r = await fetch(base + route, { method, headers: { 'X-Forwarded-For': ip(), ...(raw ? { 'Content-Type': 'application/json' } : {}), ...(s ? { Authorization: 'Bearer ' + s.session, ...signRequest(method, route, raw, s.session, s.key) } : {}), ...headers }, body: raw || undefined }); } catch { return { status: 'conn-error', ms: performance.now() - t0, bytes: 0, value: null }; }
    const text = await r.text(); return { status: r.status, ms: performance.now() - t0, bytes: text.length, value: (() => { try { return JSON.parse(text); } catch { return null; } })() };
  }
  async function login(email) {
    const pair = crypto.generateKeyPairSync('ed25519'), c = await call('POST', '/v1/auth/challenge', { login: email, password: 'stress-password-1', public_key: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
    const r = await call('POST', '/v1/auth/login', { challenge_id: c.value.challenge_id, signature: crypto.sign(null, Buffer.from(JSON.stringify(c.value)), pair.privateKey).toString('base64url'), platform: 'web', arch: 'x64', version: 'web' });
    return { session: r.value.session, key: pair.privateKey };
  }
  const sessions = [];
  // Several people per company (owner on a laptop, front desk, phone), each with their own session.
  for (let k = 0; k < 4; k++) for (const c of info.companies) sessions.push({ ...(await login(c.email)), c });

  // 1. One owner opening a big company: the app's first load (two weeks window).
  const single = [];
  for (let i = 0; i < 20; i++) single.push((await call('GET', `/v1/crm/snapshot?window=1&business_id=${sessions[0].c.business}`, undefined, sessions[0])));
  out.snapshotSingle = { p50: pct(single.map((r) => r.ms), 0.5), p95: pct(single.map((r) => r.ms), 0.95), kb: Math.round(single[0].bytes / 1024) };
  // 2. A whole year opened at once (the dashboard "Рік").
  const year = await call('GET', `/v1/crm/snapshot?business_id=${sessions[0].c.business}`, undefined, sessions[0]);
  out.snapshotFullYear = { ms: Math.round(year.ms), kb: Math.round(year.bytes / 1024), status: year.status };

  // 3. What one operation costs the server when nothing else runs (the basis for a capacity estimate).
  const cost = async (n, f) => { const t = []; for (let i = 0; i < n; i++) t.push((await f(i)).ms); return pct(t, 0.5); };
  const s0 = sessions[1], c0 = s0.c, first = await call('GET', `/v1/crm/snapshot?window=1&business_id=${c0.business}`, undefined, s0);
  const date0 = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  out.cost = {
    pollUnchanged: await cost(30, () => call('GET', `/v1/crm/snapshot?window=1&business_id=${c0.business}&revision=${encodeURIComponent(first.value.revision)}&from=${first.value.loaded_from}`, undefined, s0)),
    snapshotAfterChange: await cost(10, async (i) => { await call('POST', `/v1/crm/client?business_id=${c0.business}`, { name: 'Зміна ' + i, phone: '+38066' + String(1000000 + i) }, s0); return call('GET', `/v1/crm/snapshot?window=1&business_id=${c0.business}`, undefined, s0); }),
    catalog: await cost(30, () => call('GET', `/b/${c0.slug}/catalog?service_id=${c0.services[0]}&date=${date0}`)),
    addClient: await cost(30, (i) => call('POST', `/v1/crm/client?business_id=${c0.business}`, { name: 'Клієнт ' + i, phone: '+38068' + String(1000000 + i) }, s0)),
  };
  console.error(JSON.stringify(out.cost));
  // 4. Mixed load for SECONDS: every owner refreshes like the app (every 20–30 s), front desks book and
  //    clients browse and book on booking pages. Concurrency grows in steps to find the knee.
  const steps = [];
  for (const users of [10, 25, 50, 100, 200]) {
    const lat = { snapshot: [], catalog: [], book: [], desk: [] }, status = {}; let done = 0;
    const end = performance.now() + (SECONDS * 1000) / 5;
    const worker = async (w) => {
      const s = sessions[w % sessions.length], c = s.c;
      while (performance.now() < end) {
        const roll = Math.random(); let r, kind;
        if (roll < 0.35) { kind = 'snapshot'; /* like the app: send the revision it has; a full copy only when data changed */ r = await call('GET', `/v1/crm/snapshot?window=1&business_id=${c.business}` + (s.revision ? `&revision=${encodeURIComponent(s.revision)}&from=${s.from}` : ''), undefined, s); if (r.value?.revision) { s.revision = r.value.revision; s.from = r.value.loaded_from; } }
        else if (roll < 0.75) { kind = 'catalog'; const svc = c.services[Math.floor(Math.random() * 4)]; const date = new Date(Date.now() + (1 + Math.floor(Math.random() * 20)) * 86400000).toISOString().slice(0, 10); r = await call('GET', `/b/${c.slug}/catalog?service_id=${svc}&date=${date}`); if (r.value?.slots?.length && Math.random() < 0.4) { const b = await call('POST', `/b/${c.slug}/book`, { token: c.token, request_id: crypto.randomUUID(), name: 'Навантаження', phone: '+38067' + String(1000000 + Math.floor(Math.random() * 8999999)), consent: true, service_id: svc, resource_id: 'any', start: r.value.slots[Math.floor(Math.random() * r.value.slots.length)] }); lat.book.push(b.ms); status[b.status] = (status[b.status] || 0) + 1; done++; } }
        else { kind = 'desk'; r = await call('POST', `/v1/crm/client?business_id=${c.business}`, { name: 'Нова ' + Math.random().toString(36).slice(2, 6), phone: '+38063' + String(1000000 + Math.floor(Math.random() * 8999999)) }, s); }
        lat[kind].push(r.ms); status[r.status] = (status[r.status] || 0) + 1; done++;
      }
    };
    const t0 = performance.now(); await Promise.all(Array.from({ length: users }, (_, w) => worker(w)));
    const secs = (performance.now() - t0) / 1000;
    steps.push({ users, rps: Math.round(done / secs), status, p95: Object.fromEntries(Object.entries(lat).map(([k, v]) => [k, pct(v, 0.95)])), p50: Object.fromEntries(Object.entries(lat).map(([k, v]) => [k, pct(v, 0.5)])) });
    console.error(JSON.stringify(steps.at(-1)));
  }
  out.steps = steps;
  out.serverRssMb = Math.round(rssMax / 1048576);
  const files = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? files(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
  out.dataMb = Math.round(files(info.dir) / 1048576);
  out.cpu = os.cpus()[0].model + ' × ' + os.cpus().length;
  console.log(JSON.stringify(out, null, 1));
  if (process.env.STRESS_OUT) fs.writeFileSync(process.env.STRESS_OUT, JSON.stringify(out, null, 1));
  child.kill(); fs.rmSync(info.dir, { recursive: true, force: true }); process.exit(0);
});
