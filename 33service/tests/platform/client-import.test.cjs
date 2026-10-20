const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Store } = require("../../../platform/core/store.cjs");

test("Importing clients skips phones already in the base or repeated in the file and reads common date formats", (t) => {
  const store = new Store(":memory:");
  t.after(() => store.db.close());
  store.addClient({ name: "Марія", phone: "+380671112233" });
  const result = store.importClients([
    { name: "Марія з файлу", phone: "067 111 22 33" },
    { name: "Ірина", phone: "+380501234567", birthday: "31.12.1990", email: "irina@example.ua", tags: "VIP" },
    { name: "Ірина ще раз", phone: "050-123-45-67" },
    { name: "", phone: "" },
    { name: "Олег", phone: "12" },
    { name: "Без телефону", birthday: "2999-01-01", email: "not-an-email" },
  ]);
  assert.deepEqual(result, { added: 2, duplicates: 2, skipped: 2 });
  const irina = store.db.prepare("SELECT * FROM clients WHERE name='Ірина'").get();
  assert.deepEqual([irina.birthday, irina.email, irina.tags], ["1990-12-31", "irina@example.ua", "VIP"]);
  const nophone = store.db.prepare("SELECT * FROM clients WHERE name='Без телефону'").get();
  assert.deepEqual([nophone.birthday, nophone.email], ["", ""], "a wrong date or email is dropped, not the client");
  assert.deepEqual(store.importClients([{ name: "Ірина", phone: "+380501234567" }]), { added: 0, duplicates: 1, skipped: 0 }, "importing twice adds nothing");
  assert.throws(() => store.importClients(Array(3001).fill({ name: "x" })), /до 3000/);
});
