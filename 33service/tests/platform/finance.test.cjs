const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Store } = require("../../../platform/core/store.cjs");

// A salon with two specialists, one service using two materials, and a client.
function salon(t) {
  const store = new Store(":memory:");
  t.after(() => store.db.close());
  store.saveProfile({ business: "Ліра", industry: "beauty", timezone: "Europe/Kyiv", currency: "UAH", work_start: "08:00", work_end: "21:00", work_days: [1, 2, 3, 4, 5, 6, 7] });
  const anna = store.addResource({ name: "Анна", pay_percent: 40, pay_daily: 200 }),
    bohdana = store.addResource({ name: "Богдана", pay_percent: 50 });
  const gel = store.addMaterial({ name: "Гель", unit: "ml", min_stock: 20 }),
    files = store.addMaterial({ name: "Пилка", unit: "pcs" });
  const nails = store.addService({ name: "Манікюр", duration: 60, price: 800, resource_ids: [anna, bohdana], materials: [{ material_id: gel, quantity: 5 }, { material_id: files, quantity: 1 }] }),
    cut = store.addService({ name: "Стрижка", duration: 60, price: 500, resource_ids: [anna, bohdana], pay_percent: 30 });
  const client = store.addClient({ name: "Марія", phone: "+380501112233" });
  // Visits in the past: today's date minus some days at 10:00 Kyiv.
  const past = (days, hour = 10) => {
    const d = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    return Date.parse(`${d}T${String(hour - 3).padStart(2, "0")}:00:00Z`);
  };
  // Booking in the past is refused, so past visits are booked ahead and then moved back in the database.
  let ahead = 0;
  const visit = (service, resource, start, extra = {}) => {
    if (start > Date.now()) return store.book({ client_id: client, service_id: service, resource_ids: [resource], start, ...extra });
    const future = Date.parse(new Date(Date.now() + (40 + ++ahead) * 86400000).toISOString().slice(0, 10) + "T09:00:00Z");
    const id = store.book({ client_id: client, service_id: service, resource_ids: [resource], start: future, ...extra });
    store.db.prepare("UPDATE appointments SET start=?,end=?+3600000 WHERE id=?").run(start, start, id);
    return id;
  };
  return { store, anna, bohdana, gel, files, nails, cut, client, past, visit };
}

test("A client's discount prices new visits; an explicit price from the app still wins", (t) => {
  const s = salon(t);
  s.store.updateClient({ id: s.client, name: "Марія", phone: "+380501112233", discount: 10 });
  const id = s.visit(s.nails, s.anna, Date.now() + 2 * 86400000);
  assert.equal(s.store.visits("a.id=?", [id])[0].total, 72000);
  const manual = s.visit(s.nails, s.anna, Date.now() + 3 * 86400000, { total: 500 });
  assert.equal(s.store.visits("a.id=?", [manual])[0].total, 50000);
  assert.throws(() => s.store.updateClient({ id: s.client, name: "Марія", discount: 150 }), /від 0 до 100/);
  assert.equal(s.store.snapshot({ all: true }).clients[0].discount, 10);
});

test("Purchases add stock and an expense; completed visits use the service's materials once", (t) => {
  const s = salon(t);
  s.store.materialMove({ material_id: s.gel, kind: "purchase", quantity: 100, cost: 500 });
  s.store.materialMove({ material_id: s.files, kind: "purchase", quantity: 10 });
  const gel = () => s.store.db.prepare("SELECT * FROM materials WHERE id=?").get(s.gel);
  assert.equal(gel().stock, 100);
  assert.equal(gel().unit_cost, 500, "5.00 per ml");
  assert.equal(s.store.db.prepare("SELECT amount,category FROM expenses").get().amount, 50000);
  const id = s.visit(s.nails, s.anna, s.past(1));
  s.store.status(id, "completed");
  assert.equal(gel().stock, 95);
  assert.equal(s.store.db.prepare("SELECT stock FROM materials WHERE id=?").get(s.files).stock, 9);
  s.store.consumeMaterials(id);
  assert.equal(gel().stock, 95, "a visit never uses materials twice");
  s.store.materialMove({ material_id: s.gel, kind: "adjust", stock: 90 });
  assert.equal(gel().stock, 90);
  s.store.deleteMaterial({ id: s.files });
  assert.deepEqual(s.store.snapshot({ all: true }).service_materials.map((m) => m.material_id), [s.gel]);
});

test("Expenses are recorded and deleted; salary payouts belong to a specialist", (t) => {
  const s = salon(t);
  const rent = s.store.addExpense({ category: "rent", amount: 12000, note: "Жовтень" });
  s.store.addExpense({ category: "salary", amount: 1000, resource_id: s.anna });
  assert.throws(() => s.store.addExpense({ category: "party", amount: 10 }), /категорію/);
  assert.throws(() => s.store.addExpense({ category: "other", amount: 0 }), /сума/);
  assert.equal(s.store.snapshot({ all: true }).expenses.length, 2);
  s.store.deleteExpense({ id: rent });
  assert.equal(s.store.snapshot({ all: true }).expenses.length, 1);
});

test("A gift certificate pays parts of visits until its balance runs out; refunds put money back", (t) => {
  const s = salon(t);
  const { id: cert, code } = s.store.sellCertificate({ amount: 1000, method: "cash" });
  assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
  const a = s.visit(s.nails, s.anna, s.past(2));
  s.store.payment({ appointment_id: a, amount: 800, method: "certificate", voucher_id: code.toLowerCase() });
  const balance = () => s.store.db.prepare("SELECT balance FROM certificates WHERE id=?").get(cert).balance;
  assert.equal(balance(), 20000);
  const b = s.visit(s.cut, s.anna, s.past(1));
  assert.throws(() => s.store.payment({ appointment_id: b, amount: 500, method: "certificate", voucher_id: cert }), /лише 200\.00/);
  s.store.payment({ appointment_id: b, amount: 200, method: "certificate", voucher_id: cert });
  s.store.payment({ appointment_id: b, amount: 300, method: "cash" });
  assert.equal(balance(), 0);
  s.store.payment({ appointment_id: b, amount: -100, method: "certificate", voucher_id: cert });
  assert.equal(balance(), 10000);
  assert.equal(s.store.db.prepare("SELECT voucher_id FROM payments WHERE method='certificate' LIMIT 1").get().voucher_id, cert);
  s.store.voidCertificate({ id: cert });
  const c = s.visit(s.cut, s.anna, Date.now() + 86400000);
  assert.throws(() => s.store.payment({ appointment_id: c, amount: 100, method: "certificate", voucher_id: cert }), /недійсний/);
});

test("A visit pass covers whole visits of its service for its client until the visits run out", (t) => {
  const s = salon(t);
  const pass = s.store.sellPass({ client_id: s.client, service_id: s.cut, visits: 2, price: 900, method: "card" });
  const first = s.visit(s.cut, s.anna, s.past(3));
  assert.throws(() => s.store.payment({ appointment_id: first, amount: 100, method: "pass", voucher_id: pass }), /повністю/);
  s.store.payment({ appointment_id: first, amount: 500, method: "pass", voucher_id: pass });
  const other = s.visit(s.nails, s.anna, s.past(2));
  assert.throws(() => s.store.payment({ appointment_id: other, amount: 800, method: "pass", voucher_id: pass }), /іншу послугу/);
  const second = s.visit(s.cut, s.anna, s.past(1));
  s.store.payment({ appointment_id: second, amount: 500, method: "pass", voucher_id: pass });
  const partly = s.visit(s.cut, s.anna, Date.now() + 2 * 86400000);
  s.store.payment({ appointment_id: partly, amount: 100, method: "cash" });
  const spare = s.store.sellPass({ client_id: s.client, service_id: s.cut, visits: 1, price: 450, method: "cash" });
  assert.throws(() => s.store.payment({ appointment_id: partly, amount: 400, method: "pass", voucher_id: spare }), /без інших оплат/);
  const third = s.visit(s.cut, s.anna, Date.now() + 86400000);
  assert.throws(() => s.store.payment({ appointment_id: third, amount: 500, method: "pass", voucher_id: pass }), /закінчились/);
  const stranger = s.store.addClient({ name: "Інша" }),
    foreign = s.store.book({ client_id: stranger, service_id: s.cut, resource_ids: [s.bohdana], start: Date.now() + 2 * 86400000 });
  s.store.payment({ appointment_id: second, amount: -500, method: "pass", voucher_id: pass });
  assert.throws(() => s.store.payment({ appointment_id: foreign, amount: 500, method: "pass", voucher_id: pass }), /іншому клієнту/);
});

test("Pay: a share of what clients paid for completed visits plus a daily rate, minus salary already paid", (t) => {
  const s = salon(t);
  const a = s.visit(s.nails, s.anna, s.past(2)),
    b = s.visit(s.cut, s.anna, s.past(2, 13)),
    c = s.visit(s.nails, s.anna, s.past(1)),
    d = s.visit(s.nails, s.bohdana, s.past(1)),
    unpaidOpen = s.visit(s.nails, s.bohdana, s.past(1, 15));
  for (const id of [a, b, c, d]) s.store.status(id, "completed");
  s.store.payment({ appointment_id: a, amount: 800, method: "cash" });
  s.store.payment({ appointment_id: b, amount: 500, method: "card" });
  s.store.payment({ appointment_id: c, amount: 400, method: "cash" });
  s.store.payment({ appointment_id: d, amount: 800, method: "cash" });
  s.store.payment({ appointment_id: unpaidOpen, amount: 800, method: "cash" });
  s.store.addExpense({ category: "salary", amount: 300, resource_id: s.anna });
  const rows = s.store.payroll(Date.now() - 10 * 86400000, Date.now() + 86400000),
    anna = rows.find((r) => r.name === "Анна"),
    bohdana = rows.find((r) => r.name === "Богдана");
  // Anna: 40% of 800 and 400 (manicure) + 30% of 500 (haircut override) = 320+160+150; two days × 200.
  assert.deepEqual([anna.visits, anna.base, anna.commission, anna.days, anna.daily, anna.total, anna.paid_out, anna.balance], [3, 170000, 63000, 2, 40000, 103000, 30000, 73000]);
  assert.deepEqual([bohdana.visits, bohdana.commission, bohdana.daily], [1, 40000, 0], "an unfinished visit does not count yet");
});

test("Old backups without the new tables still restore, and new ones round-trip", (t) => {
  const s = salon(t);
  s.store.sellCertificate({ amount: 500, method: "cash" });
  const exported = s.store.export();
  const copy = new Store(":memory:");
  t.after(() => copy.db.close());
  copy.restore(exported);
  assert.equal(copy.db.prepare("SELECT count(*) n FROM certificates").get().n, 1);
  const old = JSON.parse(JSON.stringify(exported));
  for (const table of ["materials", "service_materials", "material_moves", "expenses", "certificates", "passes"]) delete old.tables[table];
  copy.restore(old);
  assert.equal(copy.db.prepare("SELECT count(*) n FROM certificates").get().n, 0);
});

test("Deleting a client without visits removes their passes and keeps sold certificates", (t) => {
  const s = salon(t);
  const buyer = s.store.addClient({ name: "Покупець" });
  s.store.sellPass({ client_id: buyer, service_id: s.cut, visits: 5, price: 2000, method: "cash" });
  s.store.sellCertificate({ amount: 500, method: "card", client_id: buyer });
  s.store.deleteClient({ id: buyer });
  assert.equal(s.store.db.prepare("SELECT count(*) n FROM passes").get().n, 0);
  assert.equal(s.store.db.prepare("SELECT client_id FROM certificates").get().client_id, null);
});

test("Certificates in real use: discounted sale, typed codes, expiry, refunds after voiding, and income counted once", (t) => {
  const s = salon(t);
  const Analytics = require("../../../platform/web/app/analytics.js");
  // Sold for 900 with a face value of 1000: the business received 900.
  const { id: cert, code } = s.store.sellCertificate({ amount: 1000, price: 900, method: "card" });
  const a = s.visit(s.nails, s.anna, s.past(0, 10));
  s.store.payment({ appointment_id: a, amount: 800, method: "certificate", voucher_id: ` ${code.slice(0, 4).toLowerCase()}-${code.slice(4)} ` });
  s.store.payment({ appointment_id: s.visit(s.cut, s.bohdana, s.past(0, 12)), amount: 500, method: "cash" });
  const snap = s.store.snapshot({ all: true });
  const month = new Date().toISOString().slice(0, 7);
  const dash = Analytics.dashboard({ ...snap, role: "owner", mode: "server" }, "month", month);
  assert.equal(dash.received, 140000, "900 sale + 500 cash; the 800 redemption is not income again");
  // Expired: no more payments, but a refund still goes back.
  s.store.db.prepare("UPDATE certificates SET expires=? WHERE id=?").run(Date.now() - 1000, cert);
  const late = s.visit(s.cut, s.anna, Date.now() + 86400000);
  assert.throws(() => s.store.payment({ appointment_id: late, amount: 100, method: "certificate", voucher_id: code }), /минув/);
  // Voided after use: refunding the visit paid with it still works.
  s.store.voidCertificate({ id: cert });
  s.store.payment({ appointment_id: a, amount: -800, method: "certificate", voucher_id: cert });
  assert.equal(s.store.db.prepare("SELECT balance FROM certificates WHERE id=?").get(cert).balance, 100000);
  assert.throws(() => s.store.payment({ appointment_id: late, amount: 100, method: "certificate", voucher_id: cert }), /недійсний/);
});
