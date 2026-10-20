const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const { Store } = require("../../../platform/core/store.cjs");
const { Monobank } = require("../../../platform/api/monobank.cjs");

const fail = (status, message) => {
  throw Object.assign(Error(message), { status });
};
const BUSINESS = "11111111-2222-3333-4444-555555555555";

// A company with one 800 UAH visit, a fake monobank and a fake Telegram bot.
function setup(t, options = {}) {
  const store = new Store(":memory:"),
    db = new DatabaseSync(":memory:");
  t.after(() => {
    store.db.close();
    db.close();
  });
  db.exec("CREATE TABLE businesses(id TEXT PRIMARY KEY,name TEXT)");
  db.prepare("INSERT INTO businesses VALUES(?,?)").run(BUSINESS, "Studio");
  const service = store.addService({ name: "Cut", duration: 60, price: 800 }),
    resource = store.addResource({ name: "Olena" }),
    client = store.addClient({ name: "Anna" });
  store.db.prepare("UPDATE clients SET chat_id=? WHERE id=?").run("42", client);
  const visit = store.book({
    client_id: client,
    service_id: service,
    resource_id: resource,
    start: Date.now() + 86400000 - ((Date.now() + 86400000) % 3600000),
  });
  const keys = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" }),
    pem = keys.publicKey.export({ type: "spki", format: "pem" });
  const vault = new Map(),
    sent = [],
    calls = [],
    invoices = new Map();
  const runtime = {
    store,
    vault: {
      has: (k) => vault.has(k),
      get: (k) => vault.get(k) ?? null,
      put: (k, v) => vault.set(k, v),
      remove: (k) => vault.delete(k),
    },
    telegram: {
      text: (chat, key) => key,
      call: async (method, payload) => sent.push({ method, payload }),
    },
  };
  vault.set("telegram", "bot");
  const request = async (url, init) => {
    const path = url.replace("https://api.monobank.ua", "");
    calls.push({ path, init });
    const reply = (status, body) => ({
      ok: status < 400,
      status,
      text: async () => JSON.stringify(body),
    });
    if (init.headers["X-Token"] !== "test-token-0123456789")
      return reply(403, { errText: "forbidden" });
    if (path === "/api/merchant/details")
      return reply(200, { merchantId: "m1", merchantName: "ФОП Іваненко" });
    if (path === "/api/merchant/pubkey")
      return reply(200, { key: Buffer.from(pem).toString("base64") });
    if (path === "/api/merchant/invoice/create") {
      const id = "inv" + (invoices.size + 1);
      invoices.set(id, { status: "created", ...JSON.parse(init.body) });
      return reply(200, { invoiceId: id, pageUrl: "https://pay.mbnk.biz/" + id });
    }
    if (path === "/api/merchant/invoice/remove") {
      invoices.get(JSON.parse(init.body).invoiceId).status = "removed";
      return reply(200, {});
    }
    if (path.startsWith("/api/merchant/invoice/status")) {
      const id = new URL("https://x" + path).searchParams.get("invoiceId"),
        inv = invoices.get(id);
      return reply(200, {
        invoiceId: id,
        status: inv.status,
        amount: inv.amount,
        finalAmount: inv.status === "success" ? inv.amount : 0,
        ccy: 980,
        modifiedDate: new Date().toISOString(),
      });
    }
    return reply(404, {});
  };
  const mono = new Monobank({
    db,
    fail,
    request,
    publicUrl: "https://api.example.com",
    accounts: {
      businesses: {
        get: () => runtime,
        instances: new Map([[BUSINESS, runtime]]),
      },
      botWorkers: options.botWorkers,
    },
  });
  const business = { id: BUSINESS, name: "Studio" };
  const sign = (body) =>
    crypto.sign("sha256", Buffer.from(body), keys.privateKey).toString("base64");
  const webhook = async (payload, signature) => {
    const rawBody = JSON.stringify(payload);
    let result;
    await mono.handle(
      {
        method: "POST",
        rawBody,
        headers: { "x-sign": signature ?? sign(rawBody) },
      },
      new URL(`https://api.example.com/v1/pay/monobank/${BUSINESS}`),
      (status, value) => (result = { status, value }),
    );
    return result;
  };
  const paid = () =>
    store.snapshot().appointments.find((a) => a.id === visit).paid;
  return {
    store,
    mono,
    runtime,
    business,
    visit,
    sent,
    calls,
    invoices,
    webhook,
    paid,
    vault,
  };
}

test("Connecting checks the token at monobank and keeps it only in the vault", async (t) => {
  const s = setup(t);
  await assert.rejects(s.mono.connect(s.runtime, "wrong-token-0123456789"), {
    status: 400,
  });
  assert.equal(s.vault.has("monobank"), false);
  const status = await s.mono.connect(s.runtime, " test-token-0123456789 ");
  assert.deepEqual(status, {
    connected: true,
    merchant: "ФОП Іваненко",
    webhook: true,
  });
  assert.equal(JSON.stringify(s.store.export()).includes("test-token"), false);
  s.mono.disconnect(s.runtime);
  assert.equal(s.mono.status(s.runtime).connected, false);
});

test("An invoice for what is due goes to the client's Telegram; a paid callback credits the visit once", async (t) => {
  const s = setup(t);
  await s.mono.connect(s.runtime, "test-token-0123456789");
  const r = await s.mono.invoice(s.business, s.runtime, {
    appointment_id: s.visit,
    send: true,
  });
  assert.equal(r.amount, 80000);
  assert.equal(r.sent, true);
  const created = s.invoices.get("inv1");
  assert.equal(created.ccy, 980);
  assert.equal(
    created.webHookUrl,
    `https://api.example.com/v1/pay/monobank/${BUSINESS}`,
  );
  assert.equal(created.merchantPaymInfo.basketOrder[0].total, 80000);
  assert.equal(s.sent[0].payload.chat_id, "42");
  assert.equal(
    s.sent[0].payload.reply_markup.inline_keyboard[0][0].url,
    "https://pay.mbnk.biz/inv1",
  );
  assert.equal(s.store.snapshot().payment_links.length, 1);

  const success = {
    invoiceId: "inv1",
    status: "success",
    amount: 80000,
    finalAmount: 80000,
    ccy: 980,
    modifiedDate: "2026-10-16T10:00:00Z",
  };
  assert.equal((await s.webhook(success)).status, 200);
  assert.equal((await s.webhook(success)).status, 200);
  assert.equal(s.paid(), 80000);
  assert.equal(s.store.snapshot().payment_links.length, 0);
  assert.equal(s.store.snapshot().payments[0].method, "monobank");
  // A late "processing" callback does not undo the payment.
  await s.webhook({
    ...success,
    status: "processing",
    modifiedDate: "2026-10-16T09:59:00Z",
  });
  assert.equal(s.paid(), 80000);
  // A refund in the monobank account comes back as a negative payment.
  await s.webhook({
    ...success,
    status: "reversed",
    finalAmount: 30000,
    modifiedDate: "2026-10-16T11:00:00Z",
  });
  assert.equal(s.paid(), 30000);
  assert.equal(s.store.snapshot().payments[0].method, "refund");
  await assert.rejects(
    s.mono.invoice(s.business, s.runtime, {
      appointment_id: s.visit,
      amount: 600,
    }),
    { status: 400 },
  );
});

test("Forged or foreign callbacks change nothing", async (t) => {
  const s = setup(t);
  await s.mono.connect(s.runtime, "test-token-0123456789");
  await s.mono.invoice(s.business, s.runtime, { appointment_id: s.visit });
  const forged = {
    invoiceId: "inv1",
    status: "success",
    finalAmount: 80000,
    ccy: 980,
  };
  await assert.rejects(s.webhook(forged, "AAAA"), { status: 401 });
  await assert.rejects(s.webhook(forged, ""), { status: 401 });
  assert.equal(s.paid(), 0);
  // Signed, but for an invoice of another company: ignored.
  await s.webhook({ ...forged, invoiceId: "unknown" });
  assert.equal(s.paid(), 0);
  await assert.rejects(s.webhook({ ...forged, ccy: 840 }), { status: 400 });
  assert.equal(s.paid(), 0);
});

test("A new link replaces the unpaid one, partial amounts work, and polling catches lost callbacks", async (t) => {
  const s = setup(t);
  await s.mono.connect(s.runtime, "test-token-0123456789");
  await s.mono.invoice(s.business, s.runtime, { appointment_id: s.visit });
  const second = await s.mono.invoice(s.business, s.runtime, {
    appointment_id: s.visit,
    amount: 300,
  });
  assert.equal(second.amount, 30000);
  assert.equal(s.invoices.get("inv1").status, "removed");
  assert.deepEqual(
    s.store.snapshot().payment_links.map((l) => l.amount),
    [30000],
  );
  // The client paid but the callback never arrived.
  s.invoices.get("inv2").status = "success";
  await s.mono.poll();
  assert.equal(s.paid(), 30000);
  assert.equal(s.store.snapshot().payment_links.length, 0);
});

test("Self-hosted bots get the link through their delivery queue; clients without Telegram get only the link", async (t) => {
  const queued = [];
  const s = setup(t, {
    botWorkers: {
      status: () => ({ hosting: "external" }),
      queue: (id, method, payload) => queued.push({ id, method, payload }),
    },
  });
  await s.mono.connect(s.runtime, "test-token-0123456789");
  await s.mono.invoice(s.business, s.runtime, {
    appointment_id: s.visit,
    send: true,
  });
  assert.equal(queued.length, 1);
  assert.equal(s.sent.length, 0);
  s.store.db.prepare("UPDATE clients SET chat_id=NULL").run();
  const r = await s.mono.invoice(s.business, s.runtime, {
    appointment_id: s.visit,
  });
  assert.equal(r.telegram, false);
  await assert.rejects(
    s.mono.invoice(s.business, s.runtime, {
      appointment_id: s.visit,
      send: true,
    }),
    { status: 400 },
  );
});

test("Backups keep payment links; older backups without them still restore", (t) => {
  const s = setup(t);
  s.store.addPaymentLink({
    appointment_id: s.visit,
    provider: "monobank",
    invoice_id: "x1",
    amount: 100,
    url: "https://pay.mbnk.biz/x1",
    expires: Date.now() + 60000,
  });
  const backup = s.store.export();
  assert.equal(backup.tables.payment_links.length, 1);
  delete backup.tables.payment_links;
  s.store.restore(backup);
  assert.equal(s.store.snapshot().payment_links.length, 0);
});

test("A manual payment or a lower price withdraws an unpaid link that asks for more than is due", async (t) => {
  const s = setup(t);
  await s.mono.connect(s.runtime, "test-token-0123456789");
  await s.mono.invoice(s.business, s.runtime, { appointment_id: s.visit });
  s.store.payment({ appointment_id: s.visit, amount: 800, method: "cash" });
  await s.mono.reconcile(s.runtime, s.visit);
  assert.equal(s.invoices.get("inv1").status, "removed");
  assert.equal(s.store.snapshot().payment_links.length, 0);
  // A link for the exact rest stays.
  s.store.payment({ appointment_id: s.visit, amount: -300, method: "cash" });
  await s.mono.invoice(s.business, s.runtime, { appointment_id: s.visit });
  await s.mono.reconcile(s.runtime, s.visit);
  assert.equal(s.store.snapshot().payment_links.length, 1);
  s.store.updateVisit({ id: s.visit, total: 600 });
  await s.mono.poll();
  assert.equal(s.store.snapshot().payment_links.length, 0);
});
