const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { Support } = require("../owner/support.cjs");

const fail = (status, message) => {
  throw Object.assign(Error(message), { status });
};
function setup(t, configured = true) {
  const db = new DatabaseSync(":memory:"),
    queued = [];
  t.after(() => db.close());
  const store = { db, transaction: (fn) => fn(), event: () => {} };
  const mail = {
    configured: () => configured,
    settings: () => ({ ownerEmail: "team@lomviko.test", replyTo: "hello@lomviko.test", fromEmail: "no-reply@lomviko.test" }),
    enqueue: (kind, to, language, fields, options) => queued.push({ kind, to, language, fields, options }),
  };
  return { support: new Support({ store, mail, fail }), queued, db };
}

test("A message reaches the team with the customer as reply-to and the customer gets a warm confirmation", (t) => {
  const s = setup(t);
  s.support.create({ email: " Anna@Salon.UA ", name: "Анна", business: "Салон", topic: "problem", message: "Не відкривається розклад", details: "LOMVIKO 1.5.0 · macOS", language: "uk" });
  assert.deepEqual(s.queued.map((m) => [m.kind, m.to]), [["support-team", "team@lomviko.test"], ["support-receipt", "anna@salon.ua"]]);
  assert.equal(s.queued[0].options.replyTo, "anna@salon.ua");
  assert.equal(s.support.list()[0].details, "LOMVIKO 1.5.0 · macOS");
  assert.equal(s.support.contact(), "hello@lomviko.test");
});

test("Messages need a reply address and some text, and are rate limited per sender", (t) => {
  const s = setup(t);
  assert.throws(() => s.support.create({ email: "nope", message: "Привіт, допоможіть" }), { status: 400 });
  assert.throws(() => s.support.create({ email: "a@b.ua", message: " " }), { status: 400 });
  for (let i = 0; i < 5; i++) s.support.create({ email: "a@b.ua", message: "Питання номер " + i });
  assert.throws(() => s.support.create({ email: "a@b.ua", message: "Ще одне" }), /вже надіслали/);
  s.support.stage({ id: s.support.list()[0].id, stage: "answered" });
  assert.equal(s.support.list().filter((r) => r.stage === "answered").length, 1);
});

test("Without mail settings the message is still saved for the admin panel", (t) => {
  const s = setup(t, false);
  s.support.create({ email: "a@b.ua", message: "Перевірка без пошти" });
  assert.equal(s.queued.length, 0);
  assert.equal(s.support.list().length, 1);
  assert.equal(s.support.contact(), null);
});
