const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { Legal } = require("../../../platform/api/legal.cjs");

const fail = (status, message) => {
  throw Object.assign(Error(message), { status });
};
test("Acceptance is recorded per document version; a new upload asks again; stale versions are refused", async (t) => {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec("CREATE TABLE documents(id TEXT,kind TEXT,language TEXT,sha256 TEXT,uploaded_at INTEGER,active INTEGER,extension TEXT NOT NULL DEFAULT 'pdf')");
  const upload = (kind, sha) => {
    db.prepare("UPDATE documents SET active=0 WHERE kind=?").run(kind);
    db.prepare("INSERT INTO documents(id,kind,language,sha256,uploaded_at,active) VALUES(?,?,?,?,?,1)").run(sha, kind, "uk", sha.repeat(4), Date.now());
  };
  upload("site-offer", "aaaa");
  upload("app-privacy", "bbbb");
  const legal = new Legal({ store: { db }, fail });
  const user = { id: "u1", email: "Anna@Salon.ua" };
  legal.record({ userId: "u1", email: user.email, method: "registration-checkbox+email-code", ip: "1.2.3.4", device: "dev" });
  assert.equal(legal.status(user).required, false);
  upload("app-privacy", "cccc");
  const status = legal.status(user);
  assert.equal(status.required, true);
  assert.equal(status.updated, true);
  const accounts = { session: () => ({ user, device: { id: "dev" } }) };
  const call = async (body) => {
    let out;
    await legal.handle({ method: "POST", parsedBody: body, clientAddress: "5.6.7.8" }, new URL("https://x/v1/legal/accept"), (s, v) => (out = { s, v }), accounts);
    return out;
  };
  await assert.rejects(call({ offer_version: status.offer.version, privacy_version: "bbbbbbbbbbbbbbbb" }), { status: 409 });
  const ok = await call({ offer_version: status.offer.version, privacy_version: status.privacy.version, app_version: "1.5.3" });
  assert.equal(ok.v.required, false);
  const history = legal.history("u1");
  assert.deepEqual(history.map((h) => h.method), ["app-signed", "registration-checkbox+email-code"]);
  assert.equal(history[0].ip, "5.6.7.8");
  legal.forget(["u1"], ["anna@salon.ua"]);
  assert.equal(legal.history("u1").length, 0);
});

test("While the offer is switched off only the privacy policy is accepted; switching it on asks again", (t) => {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec("CREATE TABLE documents(id TEXT,kind TEXT,language TEXT,sha256 TEXT,uploaded_at INTEGER,active INTEGER,extension TEXT NOT NULL DEFAULT 'pdf');CREATE TABLE document_switches(kind TEXT PRIMARY KEY,disabled INTEGER NOT NULL)");
  db.prepare("INSERT INTO documents(id,kind,language,sha256,uploaded_at,active) VALUES('o','site-offer','uk',?,1,1)").run("a".repeat(16));
  db.prepare("INSERT INTO documents(id,kind,language,sha256,uploaded_at,active) VALUES('p','app-privacy','uk',?,1,1)").run("b".repeat(16));
  db.prepare("INSERT INTO document_switches VALUES('site-offer',1)").run();
  const legal = new Legal({ store: { db }, fail }),
    user = { id: "u1", email: "anna@salon.ua" };
  assert.equal(legal.current().offer.version, "off");
  legal.record({ userId: user.id, email: user.email, method: "app-signed" });
  assert.equal(legal.status(user).required, false);
  db.prepare("UPDATE document_switches SET disabled=0").run();
  assert.equal(legal.status(user).required, true, "the published offer needs consent");
});

test("While sales are off the terms of use are the contract; publishing the offer asks again", (t) => {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec("CREATE TABLE documents(id TEXT,kind TEXT,language TEXT,sha256 TEXT,uploaded_at INTEGER,active INTEGER,extension TEXT NOT NULL DEFAULT 'pdf');CREATE TABLE document_switches(kind TEXT PRIMARY KEY,disabled INTEGER NOT NULL)");
  db.prepare("INSERT INTO documents(id,kind,language,sha256,uploaded_at,active) VALUES('o','site-offer','uk',?,1,1)").run("a".repeat(16));
  db.prepare("INSERT INTO documents(id,kind,language,sha256,uploaded_at,active) VALUES('t','site-terms','uk',?,1,1)").run("t".repeat(16));
  db.prepare("INSERT INTO documents(id,kind,language,sha256,uploaded_at,active) VALUES('p','app-privacy','uk',?,1,1)").run("b".repeat(16));
  db.prepare("INSERT INTO document_switches VALUES('site-offer',1)").run();
  const legal = new Legal({ store: { db }, fail }),
    user = { id: "u1", email: "anna@salon.ua" };
  const c = legal.current();
  assert.equal(c.offer.kind, "site-terms");
  assert.equal(c.offer.version, "t".repeat(16));
  assert.equal(c.links.offer, "/public/documents/site-terms/uk");
  legal.record({ userId: user.id, email: user.email, method: "app-signed" });
  assert.equal(legal.status(user).required, false);
  db.prepare("UPDATE document_switches SET disabled=0").run();
  assert.equal(legal.current().offer.kind, "site-offer");
  assert.equal(legal.status(user).required, true, "sales on: the offer needs consent");
});
