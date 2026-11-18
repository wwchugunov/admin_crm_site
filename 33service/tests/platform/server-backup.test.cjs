const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), zlib = require("node:zlib");
const { DatabaseSync } = require("node:sqlite");
const { ServerBackups, decrypt, untar } = require("../../../platform/core/server-backup.cjs");

function server(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lomviko-backups-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const owner = new DatabaseSync(path.join(dir, "owner.sqlite"));
  owner.exec("PRAGMA journal_mode=WAL; CREATE TABLE users(id TEXT); INSERT INTO users VALUES('u1')");
  fs.mkdirSync(path.join(dir, "businesses", "b1"), { recursive: true });
  const crm = new DatabaseSync(path.join(dir, "businesses", "b1", "crm.sqlite"));
  crm.exec("PRAGMA journal_mode=WAL; CREATE TABLE clients(name TEXT); INSERT INTO clients VALUES('Анна')");
  fs.writeFileSync(path.join(dir, "admin.secret"), "secret");
  t.after(() => { owner.close(); crm.close(); });
  return { dir, crm };
}

test("A copy holds every database (taken live) and the keys; the download opens only with its password", (t) => {
  const { dir, crm } = server(t);
  const backups = new ServerBackups({ directory: dir });
  crm.exec("INSERT INTO clients VALUES('Борис')"); // still in the write-ahead log
  const made = backups.create("manual");
  assert.equal(made.databases, 2);
  assert.deepEqual(backups.list().map((b) => b.id), [made.id]);
  assert.throws(() => backups.encrypted(made.id, "short"), /12/);
  const file = backups.encrypted(made.id, "a long file password");
  assert.throws(() => decrypt(file, "wrong password here"), /Wrong password/);
  const files = untar(zlib.gunzipSync(decrypt(file, "a long file password")));
  assert.deepEqual([...files.keys()].sort(), ["admin.secret", "businesses/b1/crm.sqlite", "owner.sqlite"]);
  const restored = path.join(dir, "restored.sqlite");
  fs.writeFileSync(restored, files.get("businesses/b1/crm.sqlite"));
  const db = new DatabaseSync(restored, { readOnly: true });
  assert.deepEqual(db.prepare("SELECT name FROM clients ORDER BY name").all().map((r) => r.name), ["Анна", "Борис"]);
  db.close();
  assert.ok(!backups.files().some((f) => f.startsWith("backups/")), "copies never contain other copies");
});

test("Automatic copies keep the newest ones; copies made by hand stay until deleted", (t) => {
  const { dir } = server(t);
  const backups = new ServerBackups({ directory: dir, keep: 2 });
  const day = 86400000, start = Date.UTC(2026, 10, 1);
  const manual = backups.create("manual", start);
  for (let i = 1; i <= 4; i++) backups.create("auto", start + i * day);
  const list = backups.list();
  assert.equal(list.filter((b) => b.kind === "auto").length, 2);
  assert.ok(list.some((b) => b.id === manual.id));
  backups.remove(manual.id);
  assert.ok(!backups.list().some((b) => b.id === manual.id));
  assert.throws(() => backups.remove("../owner"), /not found/i);
});
