const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { Store } = require("../src/store.cjs");
const { LiqPay, sign } = require("../owner/liqpay.cjs");

const fail = (status, message) => {
  throw Object.assign(Error(message), { status });
};
const BUSINESS = "22222222-3333-4444-5555-666666666666";
const KEYS = { public_key: "sandbox_i0000000001", private_key: "sandbox_secretKEY123" };

function setup(t) {
  const store = new Store(":memory:"),
    db = new DatabaseSync(":memory:");
  t.after(() => {
    store.db.close();
    db.close();
  });
  db.exec("CREATE TABLE businesses(id TEXT PRIMARY KEY,name TEXT)");
  db.prepare("INSERT INTO businesses VALUES(?,?)").run(BUSINESS, "Studio");
  const client = store.addClient({ name: "Anna" });
  store.db.prepare("UPDATE clients SET chat_id=? WHERE id=?").run("42", client);
  const visit = store.book({
    client_id: client,
    service_id: store.addService({ name: "Cut", duration: 60, price: 800 }),
    resource_id: store.addResource({ name: "Olena" }),
    start: Date.now() + 86400000 - ((Date.now() + 86400000) % 3600000),
  });
  const vault = new Map(),
    sent = [],
    statuses = new Map();
  const runtime = {
    store,
    vault: { has: (k) => vault.has(k), get: (k) => vault.get(k) ?? null, put: (k, v) => vault.set(k, v), remove: (k) => vault.delete(k) },
  };
  const request = async (url, init) => {
    const form = new URLSearchParams(init.body),
      data = form.get("data"),
      params = JSON.parse(Buffer.from(data, "base64").toString());
    const json = (v) => ({ ok: true, status: 200, text: async () => JSON.stringify(v) });
    if (params.public_key !== KEYS.public_key || form.get("signature") !== sign(KEYS.private_key, data))
      return json({ result: "error", err_code: "err_signature", err_description: "invalid signature" });
    if (params.action === "status")
      return json(statuses.get(params.order_id) || { result: "error", err_code: "payment_not_found" });
    return json({ result: "error", err_code: "unknown" });
  };
  const sender = {
    visit: (s, id) => s.db.prepare("SELECT a.*,s.name service_name,c.chat_id,COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0) paid FROM appointments a JOIN services s ON s.id=a.service_id JOIN clients c ON c.id=a.client_id WHERE a.id=?").get(id),
    send: async (business, rt, a, amount, url) => sent.push({ amount, url }) && true,
  };
  const liqpay = new LiqPay({
    db, fail, request, sender, publicUrl: "https://api.example.com",
    accounts: { businesses: { get: () => runtime, instances: new Map([[BUSINESS, runtime]]) } },
  });
  const callback = async (payload, privateKey = KEYS.private_key, algo = "sha1") => {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64");
    let result;
    await liqpay.handle({ method: "POST", parsedBody: { data, signature: sign(privateKey, data, algo) } }, new URL(`https://api.example.com/v1/pay/liqpay/${BUSINESS}`), (status, value) => (result = { status, value }));
    return result;
  };
  const paid = () => store.snapshot().appointments.find((a) => a.id === visit).paid;
  return { store, runtime, liqpay, visit, sent, statuses, callback, paid, vault, business: { id: BUSINESS, name: "Studio" } };
}

test("Keys are checked at LiqPay and kept only in the vault; wrong keys are refused", async (t) => {
  const s = setup(t);
  await assert.rejects(s.liqpay.connect(s.runtime, { public_key: KEYS.public_key, private_key: "wrongKEY12345" }), { status: 400 });
  const status = await s.liqpay.connect(s.runtime, KEYS);
  assert.equal(status.connected, true);
  assert.equal(status.sandbox, true);
  assert.equal(JSON.stringify(s.store.export()).includes(KEYS.private_key), false);
});

test("A checkout link is signed, sent to Telegram, and a signed callback credits the visit once; refunds follow", async (t) => {
  const s = setup(t);
  await s.liqpay.connect(s.runtime, KEYS);
  const r = await s.liqpay.invoice(s.business, s.runtime, { appointment_id: s.visit, send: true });
  assert.equal(r.amount, 80000);
  assert.equal(r.sent, true);
  const link = new URL(r.url);
  const data = link.searchParams.get("data"),
    params = JSON.parse(Buffer.from(data, "base64").toString());
  assert.equal(link.searchParams.get("signature"), sign(KEYS.private_key, data));
  assert.equal(params.amount, "800.00");
  assert.equal(params.server_url, `https://api.example.com/v1/pay/liqpay/${BUSINESS}`);
  const orderId = params.order_id;
  const success = { order_id: orderId, status: "success", amount: 800, currency: "UAH", public_key: KEYS.public_key, end_date: 1792000000000 };
  assert.equal((await s.callback(success)).status, 200);
  assert.equal((await s.callback(success, KEYS.private_key, "sha3-256")).status, 200);
  assert.equal(s.paid(), 80000);
  assert.equal(s.store.snapshot().payments[0].method, "liqpay");
  await s.callback({ ...success, refund_amount: 300, end_date: 1792000100000 });
  assert.equal(s.paid(), 50000);
  await s.callback({ ...success, status: "reversed", refund_amount: 800, end_date: 1792000200000 });
  assert.equal(s.paid(), 0);
});

test("Forged callbacks and foreign merchants change nothing; lost callbacks are caught by polling", async (t) => {
  const s = setup(t);
  await s.liqpay.connect(s.runtime, KEYS);
  const r = await s.liqpay.invoice(s.business, s.runtime, { appointment_id: s.visit });
  const orderId = JSON.parse(Buffer.from(new URL(r.url).searchParams.get("data"), "base64").toString()).order_id;
  await assert.rejects(s.callback({ order_id: orderId, status: "success", amount: 800 }, "attackerKEY"), { status: 401 });
  await assert.rejects(s.callback({ order_id: orderId, status: "success", amount: 800, public_key: "other" }), { status: 401 });
  assert.equal(s.paid(), 0);
  s.statuses.set(orderId, { result: "ok", status: "success", amount: 800, order_id: orderId, end_date: 1792000000000 });
  await s.liqpay.poll();
  assert.equal(s.paid(), 80000);
  assert.equal(s.store.snapshot().payment_links.length, 0);
});

test("A manual payment withdraws the LiqPay link locally, and a later payment on it is still counted", async (t) => {
  const s = setup(t);
  await s.liqpay.connect(s.runtime, KEYS);
  const r = await s.liqpay.invoice(s.business, s.runtime, { appointment_id: s.visit, amount: 300 });
  const orderId = JSON.parse(Buffer.from(new URL(r.url).searchParams.get("data"), "base64").toString()).order_id;
  s.store.payment({ appointment_id: s.visit, amount: 800, method: "cash" });
  await s.liqpay.reconcile(s.runtime, s.visit);
  assert.equal(s.store.snapshot().payment_links.length, 0);
  // The client had the page open and paid anyway: the money is real, so it shows as overpaid.
  await s.callback({ order_id: orderId, status: "success", amount: 300, public_key: KEYS.public_key, end_date: 1792000000000 });
  assert.equal(s.paid(), 110000);
});
