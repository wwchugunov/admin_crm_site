const { test } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const { Store } = require("../../../platform/core/store.cjs");
const { companyReport } = require("../../../platform/core/report.cjs");
const { reportWorkbook } = require("../../../platform/core/xlsx.cjs");

// A week in the past: Monday..Sunday, Kyiv time. Visits are written directly with their final status,
// as if the week had already happened.
function studio(t) {
  const store = new Store(":memory:");
  t.after(() => store.db.close());
  store.saveProfile({ business: "Студія «Тест»", industry: "beauty", timezone: "Europe/Kyiv", currency: "UAH", work_start: "10:00", work_end: "18:00", work_days: [1, 2, 3, 4, 5] });
  const anna = store.addResource({ name: "Анна" }), boris = store.addResource({ name: "Борис" });
  store.addResource({ name: "Кабінет", kind: "room" });
  store.updateResource({ id: boris, name: "Борис", schedule: { days: [1, 2, 3], start: "10:00", end: "16:00", break_start: "13:00", break_end: "14:00" } });
  const cut = store.addService({ name: "Стрижка", duration: 60, price: 500 }),
    yoga = store.addService({ name: "Йога", duration: 60, price: 200, kind: "group", capacity: 10 });
  const client = (n) => store.addClient({ name: `Клієнт ${n}`, phone: `+38067${1000000 + n}` });
  const monday = "2026-11-02";
  const at = (day, hour) => Date.parse(`2026-11-0${2 + day}T${String(hour - 2).padStart(2, "0")}:00:00Z`);
  const from = Date.parse(`${monday}T00:00:00+02:00`), to = from + 7 * 86400000;
  const visit = (id, service, people, start, status, total, count = 1) => {
    store.db.prepare("INSERT INTO appointments(id,client_id,service_id,resource_id,start,end,status,notes,created_at,total,cost,people_count) VALUES(?,?,?,?,?,?,?,?,?,?,0,?)")
      .run(id, client(id.length + Math.floor(Math.random() * 1e6)), service, people[0], start, start + 3600000, status, "", start, total, count);
    store.db.prepare("UPDATE appointments SET client_id=? WHERE id=?").run(store.db.prepare("SELECT client_id FROM appointments WHERE id=?").get(id).client_id, id);
    store.db.prepare("INSERT INTO appointment_clients SELECT id,client_id FROM appointments WHERE id=?").run(id);
    for (const p of people) store.db.prepare("INSERT INTO appointment_resources VALUES(?,?)").run(id, p);
  };
  return { store, anna, boris, cut, yoga, at, from, to, visit };
}

test("Estimated income: no payments recorded, so the price of completed services; cancelled and missed are left out", (t) => {
  const { store, anna, boris, cut, at, from, to, visit } = studio(t);
  visit("v1", cut, [anna], at(0, 10), "completed", 50000);
  visit("v2", cut, [anna], at(0, 12), "completed", 50000);
  visit("v3", cut, [boris], at(1, 10), "completed", 50000);
  visit("v4", cut, [boris], at(1, 11), "cancelled", 50000);
  visit("v5", cut, [anna], at(2, 15), "no_show", 50000);
  const r = companyReport(store, from, to);
  assert.equal(r.model, "estimated");
  assert.equal(r.summary.income, 150000);
  assert.equal(r.summary.visits, 5);
  assert.equal(r.summary.completed, 3);
  assert.equal(r.summary.cancelled, 1);
  assert.equal(r.summary.no_show, 1);
  assert.equal(r.summary.average, 50000);
  // Anna: Mon–Fri 10–18 = 40 h; Boris: Mon–Wed 10–16 minus a 1 h break = 15 h. Rooms are not people.
  const a = r.staff.find((p) => p.name === "Анна"), b = r.staff.find((p) => p.name === "Борис");
  assert.equal(r.staff.length, 2);
  assert.equal(a.available_hours, 40);
  assert.equal(b.available_hours, 15);
  assert.equal(a.done, 2);
  assert.equal(a.hours, 2);
  assert.equal(a.money, 100000);
  assert.equal(b.cancelled, 1);
  assert.ok(Math.abs(a.load - 2 / 40) < 1e-9);
  assert.ok(Math.abs(r.summary.load - 3 / 55) < 1e-9, "company load = all busy hours / all available hours");
  assert.equal(r.summary.working, 2);
  assert.equal(r.summary.performed, 2);
});

test("Income from payments: received minus refunds plus voucher sales, never counting a certificate redemption twice", (t) => {
  const { store, anna, cut, at, from, to, visit } = studio(t);
  visit("v1", cut, [anna], at(0, 10), "completed", 50000);
  visit("v2", cut, [anna], at(0, 12), "completed", 50000);
  visit("v3", cut, [anna], at(0, 14), "completed", 50000);
  const pay = (id, amount, method, when) => store.db.prepare("INSERT INTO payments(id,appointment_id,amount,at,method) VALUES(?,?,?,?,?)").run(`${id}-${method}-${amount}`, id, amount, when, method);
  pay("v1", 50000, "card", at(0, 11));
  pay("v2", 50000, "cash", at(0, 13));
  pay("v2", -10000, "cash", at(0, 13) + 60000);
  pay("v3", 50000, "certificate", at(0, 15));
  store.db.prepare("INSERT INTO certificates(id,code,amount,balance,price,method,client_id,sold_at,expires,status,note) VALUES('c1','ABC',100000,50000,100000,'card',NULL,?,NULL,'active','')").run(at(1, 10));
  const r = companyReport(store, from, to);
  assert.equal(r.model, "payments");
  assert.equal(r.summary.received, 200000, "500 + 500 + certificate sold for 1000");
  assert.equal(r.summary.refunds, 10000);
  assert.equal(r.summary.income, 190000);
  assert.equal(r.summary.orders, 4, "three paid visits and one certificate");
  assert.equal(r.summary.average, 47500);
  assert.equal(r.summary.estimated, 150000);
});

test("A group class counts its hour once for the trainer; two people on one visit share its money", (t) => {
  const { store, anna, boris, cut, yoga, at, from, to, visit } = studio(t);
  visit("g1", yoga, [boris], at(0, 10), "completed", 160000, 8);
  visit("p1", cut, [anna, boris], at(0, 14), "completed", 100000);
  const r = companyReport(store, from, to), b = r.staff.find((p) => p.name === "Борис"), a = r.staff.find((p) => p.name === "Анна");
  assert.equal(b.hours, 2, "one hour of yoga for eight people, one hour together with Anna");
  assert.equal(b.money, 160000 + 50000);
  assert.equal(a.money, 50000);
  assert.equal(r.summary.income, 260000);
});

test("The report covers only its own company and the chosen period", (t) => {
  const one = studio(t), two = studio(t);
  one.visit("x1", one.cut, [one.anna], one.at(0, 10), "completed", 50000);
  two.visit("y1", two.cut, [two.anna], two.at(0, 10), "completed", 70000);
  two.visit("y2", two.cut, [two.anna], two.at(0, 10) + 8 * 86400000, "completed", 70000);
  const a = companyReport(one.store, one.from, one.to), b = companyReport(two.store, two.from, two.to);
  assert.deepEqual(a.visits.map((v) => v.price), [50000]);
  assert.deepEqual(b.visits.map((v) => v.price), [70000], "a visit after the period is left out");
  assert.throws(() => companyReport(one.store, one.to, one.from));
});

test("The workbook is a valid zip of three sheets with Ukrainian text, typed numbers and filters, and no JSON", (t) => {
  const { store, anna, cut, at, from, to, visit } = studio(t);
  visit("v1", cut, [anna], at(0, 10), "completed", 50000);
  store.db.prepare("UPDATE clients SET name='=HYPERLINK(\"x\")'").run();
  const file = reportWorkbook(companyReport(store, from, to)), parts = unzip(file);
  assert.deepEqual(Object.keys(parts).filter((n) => n.includes("worksheets")).sort(), ["xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml", "xl/worksheets/sheet3.xml"]);
  assert.match(parts["xl/workbook.xml"], /Загальна статистика.*Співробітники.*Записи/);
  const visits = parts["xl/worksheets/sheet3.xml"], staff = parts["xl/worksheets/sheet2.xml"], summary = parts["xl/worksheets/sheet1.xml"];
  assert.match(visits, /<autoFilter ref="A1:J2"\/>/);
  assert.match(visits, /Стрижка/);
  assert.match(visits, /s="2"><v>500<\/v>/, "money as a number");
  assert.match(visits, /s="4"><v>\d+<\/v>/, "date as an Excel date");
  assert.match(visits, /<t xml:space="preserve">=HYPERLINK\(&quot;x&quot;\)<\/t>/, "formula-looking text stays text");
  assert.match(staff, /Анна/);
  assert.match(summary, /Розрахунковий дохід/);
  assert.doesNotMatch(Object.values(parts).join(""), /\{"|":\s*"/, "no JSON inside");
});

// Minimal reader for the zip written by core/xlsx.cjs (central directory → inflate each entry).
function unzip(buffer) {
  const out = {}, end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let p = buffer.readUInt32LE(end + 16);
  const count = buffer.readUInt16LE(end + 10);
  for (let i = 0; i < count; i++) {
    const size = buffer.readUInt32LE(p + 20), nameLength = buffer.readUInt16LE(p + 28), offset = buffer.readUInt32LE(p + 42), crc = buffer.readUInt32LE(p + 16);
    const name = buffer.subarray(p + 46, p + 46 + nameLength).toString();
    const local = offset + 30 + buffer.readUInt16LE(offset + 26) + buffer.readUInt16LE(offset + 28);
    const data = zlib.inflateRawSync(buffer.subarray(local, local + size));
    assert.equal(zlib.crc32(data), crc, name + " checksum");
    out[name] = data.toString();
    p += 46 + nameLength + buffer.readUInt16LE(p + 30) + buffer.readUInt16LE(p + 32);
  }
  return out;
}
