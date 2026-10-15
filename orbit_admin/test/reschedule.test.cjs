const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Store } = require("../src/store.cjs");

function salon(t) {
  const store = new Store(":memory:");
  t.after(() => store.db.close());
  const service = store.addService({ name: "Cut", duration: 60, price: 500 });
  const olena = store.addResource({ name: "Olena" }),
    max = store.addResource({ name: "Max" });
  const anna = store.addClient({ name: "Anna" }),
    ivan = store.addClient({ name: "Ivan" });
  const base =
    Date.now() + 2 * 86400000 - ((Date.now() + 2 * 86400000) % 3600000);
  return { store, service, olena, max, anna, ivan, base };
}

test("A visit moves to a free time and specialist, keeps its price and re-arms reminders", (t) => {
  const s = salon(t);
  const id = s.store.book({
    client_id: s.anna,
    service_id: s.service,
    resource_id: s.olena,
    start: s.base,
  });
  s.store.db
    .prepare("UPDATE reminders SET status='sent' WHERE appointment_id=?")
    .run(id);
  s.store.reschedule({
    id,
    start: s.base + 3 * 3600000,
    resource_ids: [s.max],
  });
  const a = s.store.snapshot().appointments[0];
  assert.equal(a.start, s.base + 3 * 3600000);
  assert.equal(a.end - a.start, 3600000);
  assert.equal(a.resource_name, "Max");
  assert.equal(a.price, 50000);
  assert.equal(
    s.store.db
      .prepare(
        "SELECT count(*) n FROM reminders WHERE appointment_id=? AND status='pending'",
      )
      .get(id).n,
    2,
  );
  // The old slot is free again.
  s.store.book({
    client_id: s.ivan,
    service_id: s.service,
    resource_id: s.olena,
    start: s.base,
  });
});

test("A move is refused into a busy slot, for a busy client, into the past, or after completion", (t) => {
  const s = salon(t);
  const first = s.store.book({
    client_id: s.anna,
    service_id: s.service,
    resource_id: s.olena,
    start: s.base,
  });
  s.store.book({
    client_id: s.ivan,
    service_id: s.service,
    resource_id: s.max,
    start: s.base + 7200000,
  });
  s.store.book({
    client_id: s.anna,
    service_id: s.service,
    resource_id: s.max,
    start: s.base + 4 * 3600000,
  });
  assert.throws(
    () =>
      s.store.reschedule({
        id: first,
        start: s.base + 7200000 + 1800000,
        resource_ids: [s.max],
      }),
    "specialist busy",
  );
  assert.throws(
    () => s.store.reschedule({ id: first, start: s.base + 4 * 3600000 }),
    "client busy",
  );
  assert.throws(
    () => s.store.reschedule({ id: first, start: Date.now() - 3600000 }),
    "past",
  );
  assert.throws(
    () =>
      s.store.reschedule({
        id: first,
        start: s.base,
        resource_ids: [s.olena, s.max],
      }),
    "resource count",
  );
  s.store.reschedule({ id: first, start: s.base + 1800000 }); // overlapping only itself is fine
  s.store.status(first, "completed");
  assert.throws(
    () => s.store.reschedule({ id: first, start: s.base + 6 * 3600000 }),
    "completed visits stay",
  );
});
