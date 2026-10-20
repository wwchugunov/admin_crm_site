const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { Support } = require("../api/support.cjs");

const fail = (status, message) => {
  throw Object.assign(Error(message), { status });
};
function setup(t, configured = true, db = new DatabaseSync(":memory:")) {
  const queued = [];
  t.after(() => db.isOpen && db.close());
  const store = { db, transaction: (fn) => fn(), event: () => {} };
  const mail = {
    configured: () => configured,
    settings: () => ({ ownerEmail: "team@lomviko.test", replyTo: "hello@lomviko.test", fromEmail: "no-reply@lomviko.test" }),
    enqueue: (kind, to, language, fields, options) => queued.push({ kind, to, language, fields, options }),
  };
  return { support: new Support({ store, mail, fail }), queued, db };
}
const anna = { id: "u-anna", email: "anna@salon.ua", name: "Анна" };
const ivan = { id: "u-ivan", email: "ivan@sto.ua", name: "Іван" };

test("A request gets a number; the team gets it with reply-to the customer, the customer a receipt with the number", (t) => {
  const s = setup(t);
  const first = s.support.create({ email: " Anna@Salon.UA ", name: "Анна", business: "Салон", topic: "problem", message: "Не відкривається розклад", details: "LOMVIKO 1.5.2 · macOS" }, anna);
  const second = s.support.create({ message: "Ще питання про оплату", topic: "billing" }, anna);
  assert.equal(first.number, 1001);
  assert.equal(second.number, 1002);
  assert.deepEqual(s.queued.slice(0, 2).map((m) => [m.kind, m.to]), [["support-team", "team@lomviko.test"], ["support-receipt", "anna@salon.ua"]]);
  assert.equal(s.queued[0].options.replyTo, "anna@salon.ua");
  assert.equal(s.queued[1].fields.number, 1001);
  assert.equal(s.queued[3].to, "anna@salon.ua", "email taken from the account when the form has none");
  assert.equal(s.support.contact(), "hello@lomviko.test");
});

test("Each customer sees only their own requests; the team reply is unread until opened", (t) => {
  const s = setup(t);
  const { id } = s.support.create({ email: anna.email, message: "Як додати майстра?" }, anna);
  s.support.create({ email: ivan.email, message: "Питання від СТО" }, ivan);
  assert.equal(s.support.mine(anna).requests.length, 1);
  assert.throws(() => s.support.reply(ivan, { id, text: "чуже" }), { status: 404 });
  s.queued.length = 0;
  s.support.answer({ id, text: "Налаштування → Співробітники → Додати." }, "Олена");
  const mine = s.support.mine(anna).requests[0];
  assert.equal(mine.status, "waiting");
  assert.equal(mine.unread, true);
  assert.deepEqual(mine.messages.map((m) => m.author), ["client", "team"]);
  assert.equal(mine.messages[1].name, "Олена");
  assert.equal(s.queued[0].kind, "support-reply");
  assert.equal(s.queued[0].fields.number, 1001);
  s.support.read(anna, { id });
  assert.equal(s.support.mine(anna).requests[0].unread, false);
  assert.equal(s.support.mine(anna).requests[0].email, undefined, "customer view has no team-only fields");
});

test("A customer reply reopens a solved request; closed requests point to a new one; ratings after solving", (t) => {
  const s = setup(t);
  const { id } = s.support.create({ email: anna.email, message: "Не приходять нагадування" }, anna);
  assert.throws(() => s.support.rate(anna, { id, rating: "good" }), { status: 409 });
  s.support.answer({ id, text: "Перепідключили бота, перевірте.", solve: true });
  assert.equal(s.support.mine(anna).requests[0].status, "solved");
  s.support.rate(anna, { id, rating: "good", comment: "Дякую!" });
  assert.equal(s.support.list()[0].rating, "good");
  s.support.reply(anna, { id, text: "Знову не працює" });
  assert.equal(s.support.mine(anna).requests[0].status, "open");
  assert.equal(s.queued.at(-1).fields.followUp, true);
  s.support.status({ id, status: "closed" });
  assert.throws(() => s.support.reply(anna, { id, text: "ще" }), { status: 409 });
  const next = s.support.create({ message: "Продовження: бот мовчить", parent_id: id }, anna);
  assert.equal(s.support.mine(anna).requests.find((r) => r.id === next.id).parent, 1001);
});

test("Solved requests close after 7 days; closed ones are erased after 12 months", (t) => {
  const s = setup(t);
  const { id } = s.support.create({ email: anna.email, message: "Старе питання" }, anna);
  s.support.answer({ id, text: "Готово", solve: true });
  s.support.cleanup(Date.now() + 8 * 86400000);
  assert.equal(s.support.list()[0].status, "closed");
  s.support.cleanup(Date.now() + 400 * 86400000);
  assert.equal(s.support.list().length, 0);
  assert.equal(s.db.prepare("SELECT count(*) n FROM support_messages").get().n, 0);
});

test("Requests saved before numbering keep working: numbered in order, old stages mapped", (t) => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE support_requests(id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,business TEXT NOT NULL,topic TEXT NOT NULL,message TEXT NOT NULL,details TEXT NOT NULL,language TEXT NOT NULL,stage TEXT NOT NULL,created_at INTEGER NOT NULL)");
  db.prepare("INSERT INTO support_requests VALUES('a','a@b.ua','A','','question','Перше','','uk','answered',1)").run();
  db.prepare("INSERT INTO support_requests VALUES('b','a@b.ua','A','','question','Друге','','uk','new',2)").run();
  const s = setup(t, true, db);
  assert.deepEqual(s.support.list().map((r) => [r.number, r.status]).sort(), [[1001, "waiting"], [1002, "open"]]);
  assert.equal(s.support.create({ email: "c@d.ua", message: "Нове звернення" }).number, 1003);
});

test("Messages need a reply address and text, are rate limited, and are saved without mail settings", (t) => {
  const s = setup(t, false);
  assert.throws(() => s.support.create({ email: "nope", message: "Привіт, допоможіть" }), { status: 400 });
  assert.throws(() => s.support.create({ email: "a@b.ua", message: " " }), { status: 400 });
  for (let i = 0; i < 5; i++) s.support.create({ email: "a@b.ua", message: "Питання номер " + i });
  assert.throws(() => s.support.create({ email: "a@b.ua", message: "Ще одне" }), /вже надіслали/);
  assert.equal(s.queued.length, 0);
  assert.equal(s.support.list().length, 5);
  assert.equal(s.support.contact(), null);
});
