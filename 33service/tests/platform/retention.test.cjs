const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { Retention } = require("../../../platform/api/retention.cjs");

const DAY = 86400000;
test("Expired accounts get a reminder before export closes and are deleted after 3 months", (t) => {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec("CREATE TABLE users(id TEXT,name TEXT,email TEXT,stage TEXT,expires INTEGER,account_id TEXT)");
  const now = Date.now(), add = db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)");
  add.run("fresh", "A", "a@x.ua", "trial", now - 5 * DAY, null);
  add.run("remind", "B", "b@x.ua", "trial", now - 25 * DAY, null);
  add.run("closed", "C", "c@x.ua", "active", now - 60 * DAY, null);
  add.run("old", "D", "d@x.ua", "trial", now - 91 * DAY, null);
  add.run("blocked", "E", "e@x.ua", "blocked", now - 400 * DAY, null);
  add.run("staff", "F", "f@x.ua", "active", now - 400 * DAY, "old");
  add.run("paid", "G", "g@x.ua", "active", now + 300 * DAY, null);
  const deleted = [], mails = [];
  const r = new Retention({
    store: { db, event: () => {} },
    accounts: { deletion: { delete: (id) => deleted.push(id) } },
    mail: { configured: () => true, enqueue: (kind, to, lang, fields) => mails.push([kind, to, fields]) },
  });
  assert.equal(r.tick(now), 1);
  assert.deepEqual(deleted, ["old"]);
  assert.deepEqual(mails.map((m) => m[1]), ["b@x.ua"]);
  assert.equal(mails[0][0], "account-expiring");
});
