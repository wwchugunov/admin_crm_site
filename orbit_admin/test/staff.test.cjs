const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Store } = require("../src/store.cjs");
const OrbitStaff = require("../src/ui/staff-rules.js");

function salon(t) {
  const store = new Store(":memory:");
  t.after(() => store.db.close());
  store.saveProfile({
    business: "Ліра",
    industry: "beauty",
    timezone: "Europe/Kyiv",
    currency: "UAH",
    work_start: "09:00",
    work_end: "20:00",
    work_days: [1, 2, 3, 4, 5, 6, 7],
  });
  const olena = store.addResource({ name: "Олена" }),
    yulia = store.addResource({ name: "Юлія" });
  const cut = store.addService({
      name: "Стрижка",
      duration: 60,
      price: 600,
      resource_ids: [olena],
    }),
    nails = store.addService({
      name: "Манікюр",
      duration: 90,
      price: 700,
      resource_ids: [yulia],
    }),
    any = store.addService({ name: "Консультація", duration: 30, price: 0 });
  const client = store.addClient({ name: "Анна", phone: "+380671112233" });
  const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  return { store, olena, yulia, cut, nails, any, client, day };
}
const at = (store, date, hour) => {
  const probe = Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00Z`);
  const offset =
    Date.parse(
      new Date(probe).toLocaleString("en-US", { timeZone: "Europe/Kyiv" }) +
        " UTC",
    ) - probe;
  return probe - offset;
};

test("Shift patterns: weekdays, N on / M off and absences", () => {
  assert.equal(OrbitStaff.scheduled(null, "2027-01-04"), true);
  assert.equal(
    OrbitStaff.scheduled({ days: [1, 3] }, "2027-01-04"),
    true,
    "Monday",
  );
  assert.equal(
    OrbitStaff.scheduled({ days: [1, 3] }, "2027-01-05"),
    false,
    "Tuesday",
  );
  const twoTwo = { on: 2, off: 2, from: "2027-01-01" };
  assert.deepEqual(
    [
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
      "2027-01-04",
      "2027-01-05",
      "2026-12-31",
    ].map((d) => OrbitStaff.scheduled(twoTwo, d)),
    [true, true, false, false, true, false],
  );
  const resource = { id: "r", schedule: JSON.stringify(twoTwo) };
  assert.equal(
    OrbitStaff.works(resource, "2027-01-02", [
      { resource_id: "r", start_date: "2027-01-02", end_date: "2027-01-10" },
    ]),
    false,
    "vacation wins",
  );
  assert.throws(() => OrbitStaff.normalize({ days: [] }));
  assert.throws(() =>
    OrbitStaff.normalize({ on: 0, off: 2, from: "2027-01-01" }),
  );
});

test("The bot and website offer only specialists who do the service and work that day", (t) => {
  const s = salon(t);
  assert.deepEqual(
    s.store.availableResources(s.nails, "any", at(s.store, s.day, 10)),
    [s.yulia],
    "manicure goes to the nail master, never to the hairdresser",
  );
  assert.deepEqual(
    s.store.availableResources(s.cut, s.yulia, at(s.store, s.day, 10)),
    [],
    "a chosen person who cannot do it is refused",
  );
  assert.equal(
    s.store.availableResources(s.any, "any", at(s.store, s.day, 10)).length,
    1,
    "services without a list stay open to everyone",
  );
  // Yulia's day off: no manicure slots at all.
  s.store.updateResource({
    id: s.yulia,
    name: "Юлія",
    schedule: {
      days: [
        OrbitStaff.weekday(s.day) === 7 ? 1 : OrbitStaff.weekday(s.day) + 1,
      ],
    },
  });
  assert.deepEqual(s.store.slots(s.nails, "any", s.day), []);
  s.store.updateResource({ id: s.yulia, name: "Юлія", schedule: null });
  assert(s.store.slots(s.nails, "any", s.day).length > 0);
  s.store.addAbsence({
    resource_id: s.yulia,
    start_date: s.day,
    end_date: s.day,
    reason: "Лікарняний",
  });
  assert.deepEqual(
    s.store.slots(s.nails, "any", s.day),
    [],
    "sick leave closes the day",
  );
});

test("Booking or moving a visit to someone who does not do the service is refused", (t) => {
  const s = salon(t);
  assert.throws(
    () =>
      s.store.book({
        client_id: s.client,
        service_id: s.nails,
        resource_ids: [s.olena],
        start: at(s.store, s.day, 10),
      }),
    /не виконує/,
  );
  const id = s.store.book({
    client_id: s.client,
    service_id: s.nails,
    resource_ids: [s.yulia],
    start: at(s.store, s.day, 10),
  });
  assert.throws(
    () =>
      s.store.reschedule({
        id,
        start: at(s.store, s.day, 12),
        resource_ids: [s.olena],
      }),
    /не виконує/,
  );
  const snap = s.store.snapshot();
  assert.deepEqual(snap.services.find((x) => x.id === s.nails).resource_ids, [
    s.yulia,
  ]);
  assert.equal(snap.absences.length, 0);
});

test("Visit price can be corrected after diagnosis; clients can be edited and deleted", (t) => {
  const s = salon(t);
  const id = s.store.book({
    client_id: s.client,
    service_id: s.cut,
    resource_ids: [s.olena],
    start: at(s.store, s.day, 10),
  });
  s.store.updateVisit({ id, total: 950, cost: 200, notes: "Додали маску" });
  const visit = s.store.snapshot().appointments[0];
  assert.deepEqual(
    [visit.price, visit.cost, visit.notes],
    [95000, 20000, "Додали маску"],
  );
  s.store.updateClient({
    id: s.client,
    name: "Анна Коваль",
    phone: "+380500000000",
    notes: "",
  });
  assert.equal(s.store.snapshot().clients[0].phone, "+380500000000");
  s.store.deleteClient({ id: s.client });
  const anon = s.store.snapshot().clients[0];
  assert.deepEqual(
    [anon.name, anon.phone],
    ["Видалений клієнт", ""],
    "a client with visits is anonymised, the visit stays",
  );
  const lonely = s.store.addClient({ name: "Без візитів" });
  s.store.deleteClient({ id: lonely });
  assert.equal(s.store.snapshot().clients.length, 1);
});

test("Backups keep staff settings and older backups still restore", (t) => {
  const s = salon(t);
  s.store.addAbsence({
    resource_id: s.yulia,
    start_date: s.day,
    end_date: s.day,
  });
  const backup = s.store.export();
  const copy = new Store(":memory:");
  t.after(() => copy.db.close());
  copy.restore(backup);
  assert.deepEqual(
    copy.snapshot().services.find((x) => x.name === "Манікюр").resource_ids,
    [s.yulia],
  );
  assert.equal(copy.snapshot().absences.length, 1);
  const old = JSON.parse(JSON.stringify(backup));
  delete old.tables.service_resources;
  delete old.tables.resource_absences;
  copy.restore(old);
  assert.equal(copy.snapshot().absences.length, 0);
});
