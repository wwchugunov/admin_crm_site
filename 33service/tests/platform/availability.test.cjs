const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Store } = require("../../../platform/core/store.cjs");

// Free time is counted from the people who do the service, their own hours and breaks, the visits
// they already have (with the pause after each), the rooms a service needs, and group seats.
function barbershop(t) {
  const store = new Store(":memory:");
  t.after(() => store.db.close());
  store.saveProfile({ business: "Барбер", industry: "beauty", timezone: "Europe/Kyiv", currency: "UAH", work_start: "09:00", work_end: "20:00", work_days: [1, 2, 3, 4, 5, 6, 7] });
  const masters = ["Андрій", "Богдан", "Віктор"].map((name) => store.addResource({ name }));
  const cut = store.addService({ name: "Чоловіча стрижка", duration: 60, price: 500, kind: "individual", resource_ids: masters });
  const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const client = (n) => store.addClient({ name: `Клієнт ${n}`, phone: `+38067${String(1000000 + n)}` });
  return { store, masters, cut, day, client };
}
const at = (date, clock) => {
  // Kyiv local time → epoch ms (the store works in the company time zone).
  for (const offset of [2, 3]) {
    const ms = Date.parse(`${date}T${clock}:00Z`) - offset * 3600000;
    const local = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ms);
    if (local === clock) return ms;
  }
  throw Error("bad time");
};

test("Three masters at 10:00: 3, then 2, then 1, then no free bookings; a chosen master shows only own time", (t) => {
  const { store, masters, cut, day, client } = barbershop(t);
  const ten = at(day, "10:00");
  assert.equal(store.freeCount(cut, ten), 3);
  for (let i = 0; i < 3; i++) {
    const free = store.availableResources(cut, "any", ten);
    assert.equal(free.length, 1, "any free specialist is assigned automatically");
    store.book({ client_id: client(i), service_id: cut, resource_ids: free, start: ten });
    assert.equal(store.freeCount(cut, ten), 2 - i);
  }
  assert.ok(!store.slots(cut, "any", day).includes(ten), "all three busy: the time is gone");
  assert.ok(store.slots(cut, "any", day).includes(at(day, "11:00")));
  assert.deepEqual(store.availableResources(cut, masters[0], ten), [], "a busy chosen master is not offered");
});

test("One master never gets two overlapping individual visits, even of different services", (t) => {
  const { store, masters, cut, day, client } = barbershop(t);
  const beard = store.addService({ name: "Борода", duration: 30, price: 300, resource_ids: [masters[0]] });
  store.book({ client_id: client(1), service_id: cut, resource_ids: [masters[0]], start: at(day, "10:00") });
  assert.throws(() => store.book({ client_id: client(2), service_id: beard, resource_ids: [masters[0]], start: at(day, "10:30") }));
  assert.ok(!store.slots(beard, masters[0], day).includes(at(day, "10:30")));
  assert.ok(store.slots(beard, masters[0], day).includes(at(day, "11:00")));
});

test("A cancelled visit frees its time at once", (t) => {
  const { store, masters, cut, day, client } = barbershop(t);
  const ten = at(day, "10:00");
  const id = store.book({ client_id: client(1), service_id: cut, resource_ids: [masters[0]], start: ten });
  assert.ok(!store.slots(cut, masters[0], day).includes(ten));
  store.status(id, "cancelled");
  assert.ok(store.slots(cut, masters[0], day).includes(ten));
  assert.equal(store.freeCount(cut, ten), 3);
});

test("Own hours, a break and an absence limit a person's free time; changing them keeps booked visits", (t) => {
  const { store, masters, cut, day, client } = barbershop(t);
  const [andriy] = masters;
  const visit = store.book({ client_id: client(1), service_id: cut, resource_ids: [andriy], start: at(day, "09:00") });
  store.updateResource({ id: andriy, name: "Андрій", schedule: { start: "12:00", end: "18:00", break_start: "14:00", break_end: "15:00" } });
  const own = store.slots(cut, andriy, day);
  assert.equal(own[0], at(day, "12:00"), "starts at own hours");
  assert.ok(!own.includes(at(day, "13:30")) && !own.includes(at(day, "14:00")), "no visit runs into the break");
  assert.ok(own.includes(at(day, "15:00")));
  assert.equal(own.at(-1), at(day, "17:00"), "the last visit ends by 18:00");
  assert.ok(store.snapshot().appointments.some((a) => a.id === visit && a.status === "confirmed"), "the schedule change did not remove a visit");
  store.addAbsence({ resource_id: andriy, start_date: day, end_date: day, reason: "Відпустка" });
  assert.deepEqual(store.slots(cut, andriy, day), []);
  assert.equal(store.freeCount(cut, at(day, "15:00")), 2);
});

test("The pause after a visit keeps the next one from starting too soon", (t) => {
  const { store, masters, day, client } = barbershop(t);
  const color = store.addService({ name: "Фарбування", duration: 60, price: 900, buffer: 30, resource_ids: [masters[1]] });
  store.book({ client_id: client(1), service_id: color, resource_ids: [masters[1]], start: at(day, "10:00") });
  const times = store.slots(color, masters[1], day);
  assert.ok(!times.includes(at(day, "11:00")), "10:00–11:00 plus 30 minutes of pause");
  assert.ok(times.includes(at(day, "11:30")));
  assert.ok(!times.includes(at(day, "09:00")), "09:00–10:00 + pause would run into the 10:00 visit");
});

test("A group class has seats: clients join one visit until it is full; an individual service has no seats", (t) => {
  const { store, masters, day, client } = barbershop(t);
  const yoga = store.addService({ name: "Йога", duration: 60, price: 200, kind: "group", capacity: 3, resource_ids: [masters[2]] });
  const single = store.addService({ name: "Масаж", duration: 60, price: 200, kind: "individual", capacity: 5 });
  assert.equal(store.snapshot().services.find((s) => s.id === single).capacity, 1, "individual means one client");
  const seven = at(day, "19:00");
  const first = store.book({ client_id: client(1), service_id: yoga, resource_ids: store.availableResources(yoga, "any", seven), start: seven });
  assert.equal(store.freeCount(yoga, seven), 2);
  assert.ok(store.slots(yoga, "any", day).includes(seven), "seats left: the time is still offered");
  const second = store.book({ client_id: client(2), service_id: yoga, resource_ids: store.availableResources(yoga, "any", seven), start: seven, people_count: 2 });
  assert.equal(second, first, "the client joined the same class");
  const visit = store.snapshot().appointments.find((a) => a.id === first);
  assert.equal(visit.people_count, 3);
  assert.equal(visit.total, 60000, "three seats paid");
  assert.equal(store.freeCount(yoga, seven), 0);
  assert.ok(!store.slots(yoga, "any", day).includes(seven), "full: not offered");
  assert.throws(() => store.book({ client_id: client(3), service_id: yoga, resource_ids: [masters[2]], start: seven }), /місць|seats/);
});

test("A service that needs a room is offered only while one of its rooms is free", (t) => {
  const { store, masters, day, client } = barbershop(t);
  const room = store.addResource({ name: "Кабінет 1", kind: "room" });
  const peel = store.addService({ name: "Пілінг", duration: 60, price: 800, resource_ids: [room] });
  assert.deepEqual(store.specialists(peel).map((r) => r.id).sort(), [...masters].sort(), "rooms are never offered as specialists");
  const ten = at(day, "10:00");
  const free = store.availableResources(peel, "any", ten);
  assert.equal(free.length, 2);
  assert.ok(free.includes(room));
  store.book({ client_id: client(1), service_id: peel, resource_ids: free, start: ten });
  assert.equal(store.freeCount(peel, ten), 0, "two masters are free but the only room is taken");
  assert.ok(!store.slots(peel, "any", day).includes(ten));
});

test("Simultaneous requests for the last free time make one visit, never two", async (t) => {
  const { store, masters, cut, day, client } = barbershop(t);
  store.updateService({ id: cut, name: "Чоловіча стрижка", duration: 60, price: 500, resource_ids: [masters[0]] });
  const ten = at(day, "10:00");
  const attempt = (n) =>
    Promise.resolve().then(() =>
      store.transaction(() => {
        const free = store.availableResources(cut, "any", ten);
        if (!free.length) throw Error("taken");
        return store.book({ client_id: client(n), service_id: cut, resource_ids: free, start: ten });
      }),
    );
  const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => attempt(i)));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(store.snapshot().appointments.filter((a) => a.status === "confirmed").length, 1);
});

test("Two visits make a client regular with a specialist; by hand one can set or clear it; 'any' then goes to them", (t) => {
  const { store, masters, cut, day, client } = barbershop(t);
  const [andriy, bohdan] = masters, anna = client(1);
  store.book({ client_id: anna, service_id: cut, resource_ids: [bohdan], start: at(day, "10:00") });
  assert.equal(store.regularOf(anna), null, "one visit is not enough");
  store.book({ client_id: anna, service_id: cut, resource_ids: [bohdan], start: at(day, "12:00") });
  assert.equal(store.regularOf(anna), bohdan);
  // Free at 15:00 are all three; "any" picks the least busy, but Anna goes to Bohdan.
  assert.deepEqual(store.availableResources(cut, "any", at(day, "15:00"), 1, anna), [bohdan]);
  assert.notDeepEqual(store.availableResources(cut, "any", at(day, "15:00")), [bohdan], "without the client the least busy person is chosen");
  store.setRegular({ client_id: anna, resource_id: andriy });
  assert.equal(store.regularOf(anna), andriy, "set by hand wins over visits");
  assert.ok(store.snapshot().regulars.some((r) => r.client_id === anna && r.resource_id === andriy && r.manual));
  store.setRegular({ client_id: anna, resource_id: null });
  assert.equal(store.regularOf(anna), null, "cleared by hand stays cleared");
  // A busy regular specialist does not block the booking: someone else free is chosen.
  store.setRegular({ client_id: anna, resource_id: andriy });
  store.book({ client_id: client(2), service_id: cut, resource_ids: [andriy], start: at(day, "16:00") });
  assert.equal(store.availableResources(cut, "any", at(day, "16:00"), 1, anna).length, 1);
  assert.notDeepEqual(store.availableResources(cut, "any", at(day, "16:00"), 1, anna), [andriy]);
  store.deleteClient({ id: anna });
  assert.equal(store.regularOf(anna), null, "a deleted client keeps no link");
});

test("Services are ticked on the specialist's card; a service done by anyone stays with everyone else when unticked", (t) => {
  const { store, masters, day } = barbershop(t);
  const [andriy, bohdan, viktor] = masters;
  const beard = store.addService({ name: "Борода", duration: 30, price: 300, comment: "Тільки машинкою" });
  assert.equal(store.snapshot().services.find((s) => s.id === beard).comment, "Тільки машинкою");
  assert.ok(masters.every((m) => store.canDo(beard, m)), "nobody chosen: anyone");
  store.updateResource({ id: andriy, name: "Андрій", info: "Старший майстер", service_ids: [] });
  assert.ok(!store.canDo(beard, andriy) && store.canDo(beard, bohdan) && store.canDo(beard, viktor), "unticked by Andriy only");
  assert.equal(store.snapshot().resources.find((r) => r.id === andriy).info, "Старший майстер");
  store.updateResource({ id: andriy, name: "Андрій", service_ids: [beard] });
  assert.ok(store.canDo(beard, andriy), "ticked again");
  const room = store.addResource({ name: "Кабінет", kind: "room" });
  store.updateService({ id: beard, name: "Борода", duration: 30, price: 300, room_ids: [room] });
  assert.ok(store.canDo(beard, bohdan) && store.canDo(beard, room), "rooms change without touching specialists");
  assert.ok(store.slots(beard, "any", day).length > 0);
});

test("A backup made before rooms, pauses and notes restores with their defaults", (t) => {
  const { store, cut } = barbershop(t);
  const backup = store.export();
  for (const row of backup.tables.resources) { delete row.kind; delete row.info; }
  for (const row of backup.tables.services) { delete row.buffer; delete row.comment; }
  delete backup.tables.client_regulars;
  store.restore(backup);
  const snap = store.snapshot();
  assert.ok(snap.resources.every((r) => r.kind === "staff" && r.info === ""));
  assert.equal(snap.services.find((s) => s.id === cut).buffer, 0);
});

test("Setting a regular client counts as a change, so open apps refresh", (t) => {
  const { store, masters, client } = barbershop(t);
  const before = store.revision();
  store.setRegular({ client_id: client(1), resource_id: masters[0] });
  assert.notEqual(store.revision(), before);
});
