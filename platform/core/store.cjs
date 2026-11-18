const OrbitI18n = require("../shared/i18n.js");
const OrbitStaff = require("../shared/staff-rules.js");
const { DatabaseSync } = require("node:sqlite");
const { randomUUID, randomBytes } = require("node:crypto");
const { mkdirSync, chmodSync } = require("node:fs");
const { dirname } = require("node:path");
const { finance } = require("./finance.cjs");
const { clientImport } = require("./client-import.cjs");
const { reviews } = require("./reviews.cjs");
const OrbitIndustries = require("../shared/industries.js");

const TABLES = [
  "clients",
  "services",
  "resources",
  "appointments",
  "settings",
  "audit",
  "reminders",
  "appointment_clients",
  "appointment_resources",
  "payments",
  "reminder_deliveries",
  "service_resources",
  "resource_absences",
  "payment_links",
  "waitlist",
  "materials",
  "service_materials",
  "material_moves",
  "expenses",
  "certificates",
  "passes",
  "fiscal_receipts",
  "client_regulars",
];
// Company settings the app shows; changing one of them counts as a change of data.
const PROFILE = [
  "business",
  "industry",
  "installation",
  "timezone",
  "currency",
  "logo",
  "phone",
  "address",
  "work_start",
  "work_end",
  "work_days",
  "onboarded",
  "website_enabled",
  "lapsed_days",
  "lapsed_settings",
  "reviews",
];
function text(value, max = 500) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw Error(OrbitI18n.t("m533"));
  return value.trim();
}
// Where a client came from; bookings from the page and the bot are marked by themselves.
const SOURCES = [
  "instagram",
  "google",
  "referral",
  "street",
  "ads",
  "page",
  "telegram",
  "other",
];
const EXTRAS = [
  "birthday",
  "name_day",
  "email",
  "source",
  "alert",
  "tags",
  "vehicle",
  "plate",
];
// A client phone: optional, but when given it must be a real number. Ukrainian "067…" and "380…" become
// "+380…"; other numbers keep their country code. Rejected: letters, too short or long, one repeated digit
// (00000000) and a Ukrainian number whose operator code starts with 0.
function clientPhone(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (!/^[+\d\s().-]+$/.test(value)) throw Error(OrbitI18n.t("clientPhoneInvalid"));
  let digits = value.replace(/\D/g, "");
  if (!value.startsWith("+") && /^0\d{9}$/.test(digits)) digits = "38" + digits;
  if (digits.length < 9 || digits.length > 15 || /^(\d)\1+$/.test(digits) || /^0/.test(digits))
    throw Error(OrbitI18n.t("clientPhoneInvalid"));
  if (digits.startsWith("380") && (digits.length !== 12 || digits[3] === "0" || /^0+$/.test(digits.slice(3))))
    throw Error(OrbitI18n.t("clientPhoneInvalid"));
  return "+" + digits;
}
// Optional client details; a field left out of an update keeps its value (older apps send none).
function clientExtras(data, old = {}) {
  const out = {};
  for (const key of EXTRAS) {
    const raw = data[key] === undefined ? old[key] : data[key];
    out[key] = String(raw ?? "").trim();
  }
  if (out.name_day) {
    const match = /^(\d{2})\.(\d{2})$/.exec(out.name_day);
    const date = match && new Date(Date.UTC(2000, Number(match[2]) - 1, Number(match[1])));
    if (!match || date.getUTCDate() !== Number(match[1]) || date.getUTCMonth() !== Number(match[2]) - 1)
      throw Error(OrbitI18n.t("clientNameDayInvalid"));
  }
  if (out.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(out.birthday))
    throw Error(OrbitI18n.t("clientBirthdayInvalid"));
  if (
    out.birthday &&
    (out.birthday < "1900-01-01" ||
      out.birthday > new Date().toISOString().slice(0, 10))
  )
    throw Error(OrbitI18n.t("clientBirthdayInvalid"));
  if (
    out.email &&
    (out.email.length > 120 || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(out.email))
  )
    throw Error(OrbitI18n.t("clientEmailInvalid"));
  if (out.source && !SOURCES.includes(out.source)) out.source = "other";
  out.alert = out.alert.slice(0, 500);
  out.tags = [
    ...new Set(
      out.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ]
    .slice(0, 10)
    .map((t) => t.slice(0, 30))
    .join(", ");
  out.vehicle = out.vehicle.slice(0, 80);
  out.plate = out.plate.toUpperCase().replace(/\s+/g, " ").slice(0, 20);
  return out;
}
function cents(value) {
  const amount = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1e10)
    throw Error(OrbitI18n.t("m534"));
  return amount;
}
function zonedTime(date, clock, timezone) {
  const [y, m, d] = date.split("-").map(Number),
    [h, n] = clock.split(":").map(Number),
    desired = Date.UTC(y, m - 1, d, h, n);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let result = desired;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(result)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, Number(p.value)]),
    );
    const actual = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const delta = desired - actual;
    if (!delta) return result;
    result += delta;
  }
  throw Error(OrbitI18n.t("m535"));
}
class Store {
  constructor(path) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ":memory:") chmodSync(path, 0o600);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS clients(id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',chat_id TEXT UNIQUE,link_code TEXT UNIQUE);
      CREATE TABLE IF NOT EXISTS services(id TEXT PRIMARY KEY,name TEXT NOT NULL,duration INTEGER NOT NULL CHECK(duration BETWEEN 5 AND 480),price INTEGER NOT NULL CHECK(price>=0));
      CREATE TABLE IF NOT EXISTS resources(id TEXT PRIMARY KEY,name TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),service_id TEXT NOT NULL REFERENCES services(id),resource_id TEXT NOT NULL REFERENCES resources(id),start INTEGER NOT NULL,end INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN ('confirmed','completed','cancelled','no_show')),notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS slot_idx ON appointments(resource_id,start,end);
      CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,at INTEGER NOT NULL,event TEXT NOT NULL,entity_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS reminders(appointment_id TEXT NOT NULL REFERENCES appointments(id),kind TEXT NOT NULL,status TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(appointment_id,kind));
      CREATE TABLE IF NOT EXISTS appointment_clients(appointment_id TEXT NOT NULL REFERENCES appointments(id),client_id TEXT NOT NULL REFERENCES clients(id),PRIMARY KEY(appointment_id,client_id));
      CREATE TABLE IF NOT EXISTS appointment_resources(appointment_id TEXT NOT NULL REFERENCES appointments(id),resource_id TEXT NOT NULL REFERENCES resources(id),PRIMARY KEY(appointment_id,resource_id));
      CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,appointment_id TEXT NOT NULL REFERENCES appointments(id),amount INTEGER NOT NULL CHECK(amount!=0),at INTEGER NOT NULL,method TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS reminder_deliveries(appointment_id TEXT NOT NULL REFERENCES appointments(id),kind TEXT NOT NULL,client_id TEXT NOT NULL REFERENCES clients(id),status TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(appointment_id,kind,client_id));`);
    for (const [table, column, definition] of [
      [
        "services",
        "capacity",
        "INTEGER NOT NULL DEFAULT 1 CHECK(capacity BETWEEN 1 AND 100)",
      ],
      [
        "services",
        "required_resources",
        "INTEGER NOT NULL DEFAULT 1 CHECK(required_resources BETWEEN 1 AND 8)",
      ],
      ["services", "bot_visible", "INTEGER NOT NULL DEFAULT 1"],
      // Minutes kept free after each visit (cleaning, notes, getting ready for the next client).
      ["services", "buffer", "INTEGER NOT NULL DEFAULT 0 CHECK(buffer BETWEEN 0 AND 120)"],
      // A specialist does services; a room or equipment is only needed for some of them.
      ["resources", "kind", "TEXT NOT NULL DEFAULT 'staff' CHECK(kind IN ('staff','room'))"],
      // A note the team keeps about a service, and about a specialist.
      ["services", "comment", "TEXT NOT NULL DEFAULT ''"],
      ["resources", "info", "TEXT NOT NULL DEFAULT ''"],
      ["services", "web_visible", "INTEGER NOT NULL DEFAULT 0"],
      ["appointments", "total", "INTEGER NOT NULL DEFAULT 0 CHECK(total>=0)"],
      ["appointments", "cost", "INTEGER NOT NULL DEFAULT 0 CHECK(cost>=0)"],
      [
        "appointments",
        "people_count",
        "INTEGER NOT NULL DEFAULT 1 CHECK(people_count BETWEEN 1 AND 100)",
      ],
      // The client pressed "I'll come" in a reminder.
      ["appointments", "client_confirmed", "INTEGER NOT NULL DEFAULT 0"],
      // When the company bot last invited a client who had not come for a while.
      ["clients", "invited_at", "INTEGER"],
      // More about the client: all optional.
      ["clients", "birthday", "TEXT NOT NULL DEFAULT ''"],
      ["clients", "name_day", "TEXT NOT NULL DEFAULT ''"],
      ["clients", "email", "TEXT NOT NULL DEFAULT ''"],
      ["clients", "source", "TEXT NOT NULL DEFAULT ''"],
      ["clients", "alert", "TEXT NOT NULL DEFAULT ''"],
      ["clients", "tags", "TEXT NOT NULL DEFAULT ''"],
      ["clients", "vehicle", "TEXT NOT NULL DEFAULT ''"],
      ["clients", "plate", "TEXT NOT NULL DEFAULT ''"],
    ]) {
      if (
        !this.db
          .prepare(`PRAGMA table_info(${table})`)
          .all()
          .some((c) => c.name === column)
      ) {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        if (column === "total")
          this.db.exec(
            "UPDATE appointments SET total=(SELECT price FROM services WHERE id=appointments.service_id)",
          );
      }
    }
    for (const table of ["services", "resources"]) {
      if (
        !this.db
          .prepare(`PRAGMA table_info(${table})`)
          .all()
          .some((c) => c.name === "archived")
      )
        this.db.exec(
          `ALTER TABLE ${table} ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1))`,
        );
    }
    this.db.exec(
      "INSERT OR IGNORE INTO appointment_clients SELECT id,client_id FROM appointments; INSERT OR IGNORE INTO appointment_resources SELECT id,resource_id FROM appointments;",
    );
    this.db.exec(
      "INSERT OR IGNORE INTO reminder_deliveries SELECT q.appointment_id,q.kind,p.client_id,q.status,q.attempts,q.next_at FROM reminders q JOIN appointment_clients p ON p.appointment_id=q.appointment_id;",
    );
    if (!this.get("installation")) this.set("installation", randomUUID());
    if (!this.get("business")) this.set("business", OrbitI18n.t("m536"));
    if (!this.get("industry")) this.set("industry", "beauty");
    if (!this.get("timezone"))
      this.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (!this.get("currency")) this.set("currency", "UAH");
    if (!this.get("work_start")) this.set("work_start", "09:00");
    if (!this.get("work_end")) this.set("work_end", "18:00");
    if (!this.get("work_days")) this.set("work_days", [1, 2, 3, 4, 5, 6, 7]);
    this.staffSchema();
    // A client's own specialist, set by hand; resource_id NULL means "no regular specialist" even
    // when the visits would suggest one. Without a row, two visits to one person make them regular.
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS client_regulars(client_id TEXT PRIMARY KEY REFERENCES clients(id),resource_id TEXT REFERENCES resources(id))",
    );
    this.financeSchema();
    this.reviewSchema();
    // Indexes for the snapshot and client history (added after all tables exist).
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS payment_visit ON payments(appointment_id);CREATE INDEX IF NOT EXISTS visit_clients ON appointment_clients(client_id);CREATE INDEX IF NOT EXISTS visit_resources ON appointment_resources(resource_id);CREATE INDEX IF NOT EXISTS visit_start ON appointments(start);CREATE INDEX IF NOT EXISTS visit_open ON appointments(status,end);CREATE INDEX IF NOT EXISTS payment_at ON payments(at);",
    );
    this.revisionSchema();
  }
  // A counter the database raises on every change the app shows, whatever code made it (app, bot,
  // website, bank callback). A refresh with nothing new then answers "unchanged" instead of sending
  // every visit again.
  revisionSchema() {
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS data_revision(id INTEGER PRIMARY KEY CHECK(id=1),value INTEGER NOT NULL);INSERT OR IGNORE INTO data_revision VALUES(1,0)",
    );
    const bump = "BEGIN UPDATE data_revision SET value=value+1 WHERE id=1; END";
    for (const table of [
      "clients",
      "services",
      "resources",
      "appointments",
      "payments",
      "appointment_clients",
      "appointment_resources",
      "service_resources",
      "resource_absences",
      "payment_links",
      "waitlist",
      "materials",
      "service_materials",
      "material_moves",
      "expenses",
      "certificates",
      "passes",
      "fiscal_receipts",
      "client_regulars",
    ])
      for (const op of ["insert", "update", "delete"])
        this.db.exec(
          `CREATE TRIGGER IF NOT EXISTS revision_${table}_${op} AFTER ${op.toUpperCase()} ON ${table} ${bump}`,
        );
    const shown = PROFILE.map((k) => `'${k}'`).join(",");
    // The list of shown settings grows with new features, so these two triggers are rebuilt on every start.
    for (const op of ["insert", "update"])
      this.db.exec(
        `DROP TRIGGER IF EXISTS revision_settings_${op}; CREATE TRIGGER revision_settings_${op} AFTER ${op.toUpperCase()} ON settings WHEN NEW.key IN (${shown}) ${bump}`,
      );
  }
  revision() {
    return `${this.get("installation")}:${this.db.prepare("SELECT value FROM data_revision WHERE id=1").get().value}`;
  }
  // The app keeps the previous month, this month and everything ahead; older months load on request.
  windowStart() {
    const timezone = this.get("timezone") || "Europe/Kyiv",
      [y, m] = this.businessDay(Date.now()).split("-").map(Number),
      first =
        m === 1
          ? `${y - 1}-12-01`
          : `${y}-${String(m - 1).padStart(2, "0")}-01`;
    return zonedTime(first, "00:00", timezone);
  }
  // Visits with their participants, specialists and what was paid, for the given condition.
  visits(where, params) {
    const appointments = this.db
      .prepare(
        `SELECT a.*,c.name client_name,c.phone,s.name service_name,a.total price,r.name resource_name,COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0) paid FROM appointments a JOIN clients c ON c.id=a.client_id JOIN services s ON s.id=a.service_id JOIN resources r ON r.id=a.resource_id WHERE ${where} ORDER BY start`,
      )
      .all(...params);
    const byVisit = new Map(appointments.map((a) => [a.id, a]));
    for (const a of appointments) {
      a.clients = [];
      a.resources = [];
    }
    // Participants and specialists in two queries instead of two per visit.
    const ids = `SELECT a.id FROM appointments a WHERE ${where}`;
    for (const row of this.db
      .prepare(
        `SELECT p.appointment_id,c.id,c.name FROM appointment_clients p JOIN clients c ON c.id=p.client_id WHERE p.appointment_id IN (${ids})`,
      )
      .all(...params))
      byVisit
        .get(row.appointment_id)
        ?.clients.push({ id: row.id, name: row.name });
    for (const row of this.db
      .prepare(
        `SELECT p.appointment_id,r.id,r.name FROM appointment_resources p JOIN resources r ON r.id=p.resource_id WHERE p.appointment_id IN (${ids})`,
      )
      .all(...params))
      byVisit
        .get(row.appointment_id)
        ?.resources.push({ id: row.id, name: row.name });
    for (const a of appointments) {
      a.resource_name = a.resources.map((r) => r.name).join(", ");
      a.client_name = a.clients.map((c) => c.name).join(", ");
    }
    return appointments;
  }
  paymentsBetween(from, to) {
    return this.db
      .prepare(
        "SELECT p.*,s.name service_name FROM payments p JOIN appointments a ON a.id=p.appointment_id JOIN services s ON s.id=a.service_id WHERE p.at>=? AND p.at<? ORDER BY at DESC",
      )
      .all(from, to);
  }
  // What the bot and the booking page need: services and people, without any visits.
  catalogue() {
    return {
      services: this.db
        .prepare("SELECT * FROM services WHERE archived=0 ORDER BY name")
        .all()
        .map((service) => ({
          ...service,
          resource_ids: this.serviceStaff(service.id),
        })),
      resources: this.db
        .prepare("SELECT * FROM resources WHERE archived=0 ORDER BY name")
        .all(),
    };
  }
  // Visits still ahead, for the bot's "my visits" and cancel buttons.
  upcoming() {
    return this.visits("a.status='confirmed' AND a.start>?", [Date.now()]);
  }
  // Older months for finance and the dashboard: visits and payments in [from, to).
  range(from, to) {
    from = Number(from);
    to = Number(to);
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to <= from)
      throw Error(OrbitI18n.t("m504"));
    return {
      from,
      to,
      appointments: this.visits("a.start>=? AND a.start<?", [from, to]),
      payments: this.paymentsBetween(from, to),
      expenses: this.db.prepare("SELECT * FROM expenses WHERE at>=? AND at<? ORDER BY at DESC").all(from, to),
      certificates: this.db.prepare("SELECT * FROM certificates WHERE sold_at>=? AND sold_at<? ORDER BY sold_at DESC").all(from, to),
      passes: this.db.prepare("SELECT * FROM passes WHERE sold_at>=? AND sold_at<? ORDER BY sold_at DESC").all(from, to),
    };
  }
  // The client card: the latest visits of one client, however old.
  clientHistory(id) {
    return this.visits(
      "a.id IN (SELECT a2.id FROM appointments a2 JOIN appointment_clients c2 ON c2.appointment_id=a2.id WHERE c2.client_id=? ORDER BY a2.start DESC LIMIT 50)",
      [text(id)],
    );
  }
  get(key) {
    const r = this.db
      .prepare("SELECT value FROM settings WHERE key=?")
      .get(key);
    return r ? JSON.parse(r.value) : null;
  }
  set(key, value) {
    this.db
      .prepare(
        "INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run(key, JSON.stringify(value));
  }
  audit(event, id) {
    this.db
      .prepare("INSERT INTO audit VALUES (?,?,?,?)")
      .run(randomUUID(), Date.now(), event, id);
  }
  transaction(fn) {
    const nested = Boolean(this.transactionDepth),
      savepoint = `orbit_${this.transactionDepth || 0}`;
    this.db.exec(nested ? `SAVEPOINT ${savepoint}` : "BEGIN IMMEDIATE");
    this.transactionDepth = (this.transactionDepth || 0) + 1;
    try {
      const result = fn();
      this.db.exec(nested ? `RELEASE ${savepoint}` : "COMMIT");
      return result;
    } catch (e) {
      this.db.exec(nested ? `ROLLBACK TO ${savepoint}` : "ROLLBACK");
      if (nested) this.db.exec(`RELEASE ${savepoint}`);
      throw e;
    } finally {
      this.transactionDepth--;
    }
  }
  addClient(data) {
    const id = randomUUID(),
      extra = clientExtras(data);
    this.db
      .prepare(
        `INSERT INTO clients(id,name,phone,notes,link_code,${EXTRAS.join(",")}) VALUES(?,?,?,?,?${",?".repeat(EXTRAS.length)})`,
      )
      .run(
        id,
        text(data.name, 120),
        clientPhone(data.phone),
        String(data.notes || "").slice(0, 2000),
        randomBytes(24).toString("base64url"),
        ...EXTRAS.map((k) => extra[k]),
      );
    this.setDiscount(id, data.discount);
    this.audit("client.created", id);
    return id;
  }
  addService(data) {
    const values = this.serviceValues(data),
      id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO services(id,name,duration,price,capacity,required_resources,bot_visible,web_visible,buffer,comment) VALUES(?,?,?,?,?,?,?,?,?,?)",
      )
      .run(id, ...values);
    if (Array.isArray(data.resource_ids))
      this.setServiceStaff(id, data.resource_ids);
    if (Array.isArray(data.room_ids)) this.setServiceRooms(id, data.room_ids);
    this.setServiceMaterials(id, data.materials);
    this.setPay("services", id, data);
    this.setDeposit(id, data);
    this.audit("service.created", id);
    return id;
  }
  serviceValues(data) {
    const duration = Number(data.duration),
      price = cents(data.price),
      // An individual service takes one client per specialist; only a group has seats to set.
      capacity = data.kind === "individual" ? 1 : Number(data.capacity || 1),
      required = Number(data.required_resources || 1),
      buffer = Number(data.buffer || 0);
    if (
      !Number.isInteger(duration) ||
      duration < 5 ||
      duration > 480 ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 100 ||
      !Number.isInteger(required) ||
      required < 1 ||
      required > 8 ||
      !Number.isInteger(buffer) ||
      buffer < 0 ||
      buffer > 120
    )
      throw Error(OrbitI18n.t("m537"));
    return [
      text(data.name, 120),
      duration,
      price,
      capacity,
      required,
      data.bot_visible === false || data.bot_visible === "0" ? 0 : 1,
      data.web_visible === true || data.web_visible === "1" ? 1 : 0,
      buffer,
      String(data.comment ?? "").trim().slice(0, 1000),
    ];
  }
  updateService(data) {
    if (
      !this.db
        .prepare(
          "UPDATE services SET name=?,duration=?,price=?,capacity=?,required_resources=?,bot_visible=?,web_visible=?,buffer=?,comment=? WHERE id=? AND archived=0",
        )
        .run(...this.serviceValues(data), text(data.id)).changes
    )
      throw Error(OrbitI18n.t("m538"));
    if (Array.isArray(data.resource_ids))
      this.setServiceStaff(text(data.id), data.resource_ids);
    if (Array.isArray(data.room_ids)) this.setServiceRooms(text(data.id), data.room_ids);
    this.setServiceMaterials(text(data.id), data.materials);
    this.setPay("services", text(data.id), data);
    this.setDeposit(text(data.id), data);
    this.audit("service.updated", data.id);
  }
  addResource(data) {
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO resources(id,name,kind,info) VALUES(?,?,?,?)")
      .run(id, text(data.name, 120), data.kind === "room" ? "room" : "staff", String(data.info ?? "").trim().slice(0, 2000));
    if (Array.isArray(data.service_ids)) this.setResourceServices(id, data.service_ids);
    this.setPay("resources", id, data);
    this.audit("resource.created", id);
    return id;
  }

  deleteService(data) {
    const id = text(data.id);
    if (
      !this.db
        .prepare(
          "UPDATE services SET archived=1,bot_visible=0,web_visible=0 WHERE id=? AND archived=0",
        )
        .run(id).changes
    )
      throw Error(OrbitI18n.t("m538"));
    this.audit("service.deleted", id);
  }
  deleteResource(data) {
    const id = text(data.id);
    if (
      !this.db
        .prepare("UPDATE resources SET archived=1 WHERE id=? AND archived=0")
        .run(id).changes
    )
      throw Error(OrbitI18n.t("catalogResourceMissing"));
    this.audit("resource.deleted", id);
  }
  bookingClients(data) {
    const existing =
      data.client_ids || (data.client_id ? [data.client_id] : []);
    const drafts = data.new_clients || [];
    if (
      !Array.isArray(existing) ||
      !Array.isArray(drafts) ||
      existing.length + drafts.length > 100
    )
      throw Error(OrbitI18n.t("m540"));
    const clients = existing.map((id) => text(id));
    for (const draft of drafts) {
      const name = text(draft.name, 120),
        phone = String(draft.phone || "").trim();
      if (phone.length > 40) throw Error(OrbitI18n.t("m533"));
      // Numbers are compared in one format, so "050 123 45 67" finds the client saved as "+380501234567".
      const same = (v) => { try { return clientPhone(v).replace(/\D/g, ""); } catch { return String(v || "").replace(/\D/g, ""); } };
      const digits = same(phone);
      const matches =
        digits.length >= 7
          ? this.db
              .prepare("SELECT id,name,phone FROM clients")
              .all()
              .filter((c) => same(c.phone) === digits)
          : [];
      if (matches.length) {
        if (
          matches.length !== 1 ||
          matches[0].name.trim().toLocaleLowerCase() !==
            name.toLocaleLowerCase()
        )
          throw Error(OrbitI18n.t("bookingPhoneExists"));
        clients.push(matches[0].id);
      } else clients.push(this.addClient({ name, phone }));
    }
    for (const id of clients)
      if (!this.db.prepare("SELECT id FROM clients WHERE id=?").get(id))
        throw Error(OrbitI18n.t("bookingClientMissing"));
    return [...new Set(clients)];
  }
  book(data) {
    return this.transaction(() => {
      const service = this.db
        .prepare("SELECT * FROM services WHERE id=? AND archived=0")
        .get(text(data.service_id));
      if (!service) throw Error(OrbitI18n.t("m538"));
      const start = Number(data.start),
        end = start + service.duration * 60000;
      if (
        !Number.isSafeInteger(start) ||
        start < Date.now() - 60000 ||
        start > Date.now() + 366 * 86400000
      )
        throw Error(OrbitI18n.t("m539"));
      const clients = this.bookingClients(data),
        resources = [
          ...new Set(
            (data.resource_ids || [data.resource_id]).map((v) => text(v)),
          ),
        ];
      const people = Number(data.people_count || clients.length);
      if (
        !clients.length ||
        !resources.length ||
        !Number.isInteger(people) ||
        people < clients.length ||
        people > service.capacity ||
        resources.length < service.required_resources ||
        resources.length > 8
      )
        throw Error(OrbitI18n.t("m540"));
      for (const resource of resources)
        if (!this.canDo(service.id, resource))
          throw Error(OrbitI18n.t("staffCannotDo"));
      // A group class already set for this time with this leader: the client takes a seat in it.
      if (service.capacity > 1) {
        const session = this.db
          .prepare(
            "SELECT a.* FROM appointments a JOIN appointment_resources r ON r.appointment_id=a.id WHERE a.service_id=? AND a.start=? AND a.status='confirmed' AND r.resource_id=?",
          )
          .get(service.id, start, resources[0]);
        if (session) return this.joinGroup(session, service, clients, people);
      }
      for (const resource of resources)
        if (!this.resourceFree(resource, start, end))
          throw Error(OrbitI18n.t("m541"));
      for (const client of clients)
        if (
          this.db
            .prepare(
              "SELECT a.id FROM appointments a JOIN appointment_clients c ON c.appointment_id=a.id WHERE c.client_id=? AND a.status='confirmed' AND a.start<? AND a.end>?",
            )
            .get(client, end, start)
        )
          throw Error(OrbitI18n.t("m542"));
      const id = randomUUID();
      const total =
          data.total === undefined
            ? this.discounted(service.price * people, clients[0])
            : cents(data.total),
        cost = cents(data.cost || 0);
      if (total > 1e10) throw Error(OrbitI18n.t("m543"));
      this.db
        .prepare(
          "INSERT INTO appointments(id,client_id,service_id,resource_id,start,end,status,notes,created_at,total,cost,people_count) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          clients[0],
          service.id,
          resources[0],
          start,
          end,
          "confirmed",
          String(data.notes || "").slice(0, 2000),
          Date.now(),
          total,
          cost,
          people,
        );
      for (const c of clients)
        this.db
          .prepare("INSERT INTO appointment_clients VALUES(?,?)")
          .run(id, c);
      for (const r of resources)
        this.db
          .prepare("INSERT INTO appointment_resources VALUES(?,?)")
          .run(id, r);
      for (const kind of ["24h", "2h"])
        this.db
          .prepare(
            "INSERT INTO reminders(appointment_id,kind,status) VALUES(?,?,'pending')",
          )
          .run(id, kind);
      for (const kind of ["24h", "2h"])
        for (const client of clients)
          this.db
            .prepare(
              "INSERT INTO reminder_deliveries(appointment_id,kind,client_id,status) VALUES(?,?,?,'pending')",
            )
            .run(id, kind, client);
      if (data.wait_id)
        this.db
          .prepare(
            "UPDATE waitlist SET status='booked',appointment_id=? WHERE id=? AND status='waiting'",
          )
          .run(id, text(data.wait_id));
      this.audit("appointment.created", id);
      return id;
    });
  }
  // Seats in a group class: more clients join the same visit until it is full.
  joinGroup(session, service, clients, people) {
    if (session.people_count + people > service.capacity)
      throw Error(OrbitI18n.t("groupFull"));
    const inside = this.db.prepare(
      "SELECT 1 FROM appointment_clients WHERE appointment_id=? AND client_id=?",
    );
    for (const client of clients)
      if (inside.get(session.id, client)) throw Error(OrbitI18n.t("m542"));
    for (const client of clients)
      if (
        this.db
          .prepare(
            "SELECT a.id FROM appointments a JOIN appointment_clients c ON c.appointment_id=a.id WHERE c.client_id=? AND a.status='confirmed' AND a.start<? AND a.end>?",
          )
          .get(client, session.end, session.start)
      )
        throw Error(OrbitI18n.t("m542"));
    for (const client of clients) {
      this.db.prepare("INSERT INTO appointment_clients VALUES(?,?)").run(session.id, client);
      for (const kind of ["24h", "2h"])
        this.db
          .prepare(
            "INSERT OR IGNORE INTO reminder_deliveries(appointment_id,kind,client_id,status) VALUES(?,?,?,'pending')",
          )
          .run(session.id, kind, client);
    }
    this.db
      .prepare("UPDATE appointments SET people_count=people_count+?,total=total+? WHERE id=?")
      .run(people, this.discounted(service.price * people, clients[0]), session.id);
    this.audit("appointment.joined", session.id);
    return session.id;
  }
  // Moves a confirmed visit to another time and/or specialists. The duration and price stay as booked;
  // reminders are re-armed for the new time.
  reschedule(data) {
    return this.transaction(() => {
      const id = text(data.id),
        a = this.db.prepare("SELECT * FROM appointments WHERE id=?").get(id);
      if (!a || a.status !== "confirmed") throw Error(OrbitI18n.t("m545"));
      const start = Number(data.start),
        end = start + (a.end - a.start);
      if (
        !Number.isSafeInteger(start) ||
        start < Date.now() - 60000 ||
        start > Date.now() + 366 * 86400000
      )
        throw Error(OrbitI18n.t("m539"));
      const current = this.db
          .prepare(
            "SELECT resource_id FROM appointment_resources WHERE appointment_id=?",
          )
          .all(id)
          .map((r) => r.resource_id),
        resources = data.resource_ids
          ? [...new Set(data.resource_ids.map((v) => text(v)))]
          : current;
      if (!resources.length || resources.length !== current.length)
        throw Error(OrbitI18n.t("m540"));
      const busy = this.db.prepare(
        "SELECT a.id FROM appointments a JOIN appointment_resources r ON r.appointment_id=a.id WHERE r.resource_id=? AND a.id<>? AND a.status='confirmed' AND a.start<? AND a.end>?",
      );
      for (const resource of resources)
        if (!this.canDo(a.service_id, resource))
          throw Error(OrbitI18n.t("staffCannotDo"));
      for (const resource of resources)
        if (
          !this.db
            .prepare("SELECT id FROM resources WHERE id=? AND archived=0")
            .get(resource) ||
          busy.get(resource, id, end, start)
        )
          throw Error(OrbitI18n.t("m541"));
      const clientBusy = this.db.prepare(
        "SELECT a.id FROM appointments a JOIN appointment_clients c ON c.appointment_id=a.id WHERE c.client_id=? AND a.id<>? AND a.status='confirmed' AND a.start<? AND a.end>?",
      );
      for (const { client_id } of this.db
        .prepare(
          "SELECT client_id FROM appointment_clients WHERE appointment_id=?",
        )
        .all(id))
        if (clientBusy.get(client_id, id, end, start))
          throw Error(OrbitI18n.t("m542"));
      this.db
        .prepare(
          "UPDATE appointments SET start=?,end=?,resource_id=?,client_confirmed=0 WHERE id=?",
        )
        .run(start, end, resources[0], id);
      this.db
        .prepare("DELETE FROM appointment_resources WHERE appointment_id=?")
        .run(id);
      for (const r of resources)
        this.db
          .prepare("INSERT INTO appointment_resources VALUES(?,?)")
          .run(id, r);
      for (const table of ["reminders", "reminder_deliveries"])
        this.db
          .prepare(
            `UPDATE ${table} SET status='pending',attempts=0,next_at=0 WHERE appointment_id=?`,
          )
          .run(id);
      this.audit("appointment.rescheduled", id);
      return id;
    });
  }
  // Staff rules: which services a person does, their shift pattern and absences.
  staffSchema() {
    if (
      !this.db
        .prepare("PRAGMA table_info(resources)")
        .all()
        .some((c) => c.name === "schedule")
    )
      this.db.exec("ALTER TABLE resources ADD COLUMN schedule TEXT");
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS service_resources(service_id TEXT NOT NULL REFERENCES services(id),resource_id TEXT NOT NULL REFERENCES resources(id),PRIMARY KEY(service_id,resource_id));CREATE TABLE IF NOT EXISTS resource_absences(id TEXT PRIMARY KEY,resource_id TEXT NOT NULL REFERENCES resources(id),start_date TEXT NOT NULL,end_date TEXT NOT NULL,reason TEXT NOT NULL DEFAULT '')",
    );
    // Online payment links (monobank and others): money goes straight to the company's account.
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS payment_links(id TEXT PRIMARY KEY,appointment_id TEXT NOT NULL REFERENCES appointments(id),provider TEXT NOT NULL,invoice_id TEXT NOT NULL,amount INTEGER NOT NULL,credited INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL,url TEXT NOT NULL,created_at INTEGER NOT NULL,expires INTEGER NOT NULL,modified TEXT NOT NULL DEFAULT '',UNIQUE(provider,invoice_id))",
    );
    // Waiting list: a client wants a service on a day that is full. Freed times of that day are offered
    // to everyone waiting; "seen" remembers which times a person was already offered (or saw as free).
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS waitlist(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),service_id TEXT NOT NULL REFERENCES services(id),resource_id TEXT,date TEXT NOT NULL,wanted INTEGER,note TEXT NOT NULL DEFAULT '',source TEXT NOT NULL DEFAULT 'app',status TEXT NOT NULL DEFAULT 'waiting',created_at INTEGER NOT NULL,appointment_id TEXT);CREATE INDEX IF NOT EXISTS waitlist_day ON waitlist(status,date);CREATE TABLE IF NOT EXISTS waitlist_seen(wait_id TEXT NOT NULL REFERENCES waitlist(id) ON DELETE CASCADE,start INTEGER NOT NULL,PRIMARY KEY(wait_id,start))",
    );
  }
  businessDay(ms) {
    // Creating a formatter is slow; keep one per time zone.
    const zone = this.get("timezone") || "Europe/Kyiv";
    if (this.dayFormat?.zone !== zone)
      this.dayFormat = {
        zone,
        format: new Intl.DateTimeFormat("en-CA", { timeZone: zone }),
      };
    return this.dayFormat.format.format(ms);
  }
  serviceStaff(serviceId) {
    return this.db
      .prepare(
        "SELECT s.resource_id FROM service_resources s JOIN resources r ON r.id=s.resource_id WHERE s.service_id=? AND r.archived=0",
      )
      .all(serviceId)
      .map((r) => r.resource_id);
  }
  // Specialists: the ones chosen in "Who performs" (nobody chosen = anyone). Rooms and equipment:
  // the ones the service needs; a service that needs none may still be given one by hand.
  serviceLinks(serviceId) {
    const links = this.db
      .prepare(
        "SELECT s.resource_id id,r.kind FROM service_resources s JOIN resources r ON r.id=s.resource_id WHERE s.service_id=? AND r.archived=0",
      )
      .all(serviceId);
    return {
      staff: links.filter((l) => l.kind !== "room").map((l) => l.id),
      rooms: links.filter((l) => l.kind === "room").map((l) => l.id),
    };
  }
  canDo(serviceId, resourceId) {
    const kind = this.db
        .prepare("SELECT kind FROM resources WHERE id=?")
        .get(resourceId)?.kind,
      links = this.serviceLinks(serviceId);
    return OrbitStaff.capable(
      { resource_ids: kind === "room" ? links.rooms : links.staff },
      resourceId,
    );
  }
  // Specialists a client may pick for a service (never rooms or equipment).
  specialists(serviceId) {
    return this.db
      .prepare("SELECT id,name FROM resources WHERE archived=0 AND kind<>'room' ORDER BY name,id")
      .all()
      .filter((r) => !serviceId || this.canDo(serviceId, r.id));
  }
  worksOn(resourceId, date) {
    const resource = this.db
      .prepare("SELECT id,schedule FROM resources WHERE id=?")
      .get(resourceId);
    const absences = this.db
      .prepare("SELECT * FROM resource_absences WHERE resource_id=?")
      .all(resourceId);
    return OrbitStaff.works(resource, date, absences);
  }
  setServiceStaff(serviceId, ids) {
    const unique = [...new Set(ids.map((v) => text(v)))];
    for (const id of unique)
      if (
        !this.db
          .prepare("SELECT id FROM resources WHERE id=? AND archived=0")
          .get(id)
      )
        throw Error(OrbitI18n.t("catalogResourceMissing"));
    this.db
      .prepare("DELETE FROM service_resources WHERE service_id=?")
      .run(serviceId);
    for (const id of unique)
      this.db
        .prepare("INSERT INTO service_resources VALUES(?,?)")
        .run(serviceId, id);
  }
  // Rooms and equipment a service needs; the specialists who do it stay as they are.
  setServiceRooms(serviceId, ids) {
    const rooms = [...new Set(ids.map((v) => text(v)))];
    for (const id of rooms)
      if (!this.db.prepare("SELECT id FROM resources WHERE id=? AND archived=0 AND kind='room'").get(id))
        throw Error(OrbitI18n.t("catalogResourceMissing"));
    this.db
      .prepare("DELETE FROM service_resources WHERE service_id=? AND resource_id IN (SELECT id FROM resources WHERE kind='room')")
      .run(serviceId);
    for (const id of rooms) this.db.prepare("INSERT INTO service_resources VALUES(?,?)").run(serviceId, id);
  }
  // The services a specialist does, ticked on their card. A service nobody was chosen for is done by
  // anyone; unticking it there keeps it with everyone else instead of taking it from all.
  setResourceServices(resourceId, ids) {
    const wanted = new Set(ids.map((v) => text(v)));
    const staff = this.db.prepare("SELECT id FROM resources WHERE archived=0 AND kind<>'room'").all().map((r) => r.id);
    for (const id of wanted)
      if (!this.db.prepare("SELECT id FROM services WHERE id=? AND archived=0").get(id)) throw Error(OrbitI18n.t("m538"));
    for (const { id: serviceId } of this.db.prepare("SELECT id FROM services WHERE archived=0").all()) {
      const people = this.serviceLinks(serviceId).staff,
        has = people.length ? people.includes(resourceId) : true;
      if (wanted.has(serviceId) === has) continue;
      if (wanted.has(serviceId)) this.db.prepare("INSERT OR IGNORE INTO service_resources VALUES(?,?)").run(serviceId, resourceId);
      else if (people.length) this.db.prepare("DELETE FROM service_resources WHERE service_id=? AND resource_id=?").run(serviceId, resourceId);
      else
        for (const other of staff.filter((x) => x !== resourceId))
          this.db.prepare("INSERT OR IGNORE INTO service_resources VALUES(?,?)").run(serviceId, other);
    }
  }
  // Regular clients: a client's own specialist. Set by hand, or two visits to the same person
  // (the most visits wins, then the latest). Used to pick the specialist when the client books.
  regulars() {
    const auto = new Map();
    for (const row of this.db
      .prepare(
        "SELECT ac.client_id,ar.resource_id,count(*) n,max(a.start) last FROM appointments a JOIN appointment_clients ac ON ac.appointment_id=a.id JOIN appointment_resources ar ON ar.appointment_id=a.id JOIN resources r ON r.id=ar.resource_id AND r.kind<>'room' AND r.archived=0 WHERE a.status IN ('confirmed','completed') GROUP BY ac.client_id,ar.resource_id HAVING n>=2",
      )
      .all()) {
      const best = auto.get(row.client_id);
      if (!best || row.n > best.n || (row.n === best.n && row.last > best.last)) auto.set(row.client_id, row);
    }
    const out = new Map([...auto].map(([client, r]) => [client, { client_id: client, resource_id: r.resource_id, manual: false, visits: r.n }]));
    for (const row of this.db
      .prepare("SELECT g.client_id,g.resource_id FROM client_regulars g LEFT JOIN resources r ON r.id=g.resource_id WHERE g.resource_id IS NULL OR r.archived=0")
      .all())
      if (row.resource_id) out.set(row.client_id, { client_id: row.client_id, resource_id: row.resource_id, manual: true, visits: auto.get(row.client_id)?.resource_id === row.resource_id ? auto.get(row.client_id).n : 0 });
      else out.delete(row.client_id);
    return [...out.values()];
  }
  regularOf(clientId) {
    if (!clientId) return null;
    return this.regulars().find((r) => r.client_id === clientId)?.resource_id || null;
  }
  // Make a client regular with a specialist (resource_id) or with nobody (null).
  setRegular(data) {
    const client = text(data.client_id),
      resource = data.resource_id == null || data.resource_id === "" ? null : text(data.resource_id);
    if (!this.db.prepare("SELECT id FROM clients WHERE id=?").get(client)) throw Error(OrbitI18n.t("clientMissing"));
    if (resource && !this.db.prepare("SELECT id FROM resources WHERE id=? AND archived=0 AND kind<>'room'").get(resource))
      throw Error(OrbitI18n.t("catalogResourceMissing"));
    this.db.prepare("INSERT INTO client_regulars(client_id,resource_id) VALUES(?,?) ON CONFLICT(client_id) DO UPDATE SET resource_id=excluded.resource_id").run(client, resource);
    this.audit("client.regular", client);
  }
  updateResource(data) {
    const id = text(data.id);
    let schedule;
    try {
      schedule = OrbitStaff.normalize(data.schedule);
    } catch {
      throw Error(OrbitI18n.t("staffScheduleInvalid"));
    }
    if (
      !this.db
        .prepare(
          "UPDATE resources SET name=?,schedule=?,kind=COALESCE(?,kind),info=COALESCE(?,info) WHERE id=? AND archived=0",
        )
        .run(
          text(data.name, 120),
          schedule ? JSON.stringify(schedule) : null,
          ["staff", "room"].includes(data.kind) ? data.kind : null,
          data.info === undefined ? null : String(data.info).trim().slice(0, 2000),
          id,
        ).changes
    )
      throw Error(OrbitI18n.t("catalogResourceMissing"));
    if (Array.isArray(data.service_ids)) this.setResourceServices(id, data.service_ids);
    this.setPay("resources", id, data);
    this.audit("resource.updated", id);
  }
  addAbsence(data) {
    const resource = text(data.resource_id),
      from = String(data.start_date || ""),
      to = String(data.end_date || "");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
      to < from
    )
      throw Error(OrbitI18n.t("staffAbsenceInvalid"));
    if (
      !this.db
        .prepare("SELECT id FROM resources WHERE id=? AND archived=0")
        .get(resource)
    )
      throw Error(OrbitI18n.t("catalogResourceMissing"));
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO resource_absences VALUES(?,?,?,?,?)")
      .run(id, resource, from, to, String(data.reason || "").slice(0, 200));
    this.audit("resource.absence", id);
    return id;
  }
  deleteAbsence(data) {
    this.db
      .prepare("DELETE FROM resource_absences WHERE id=?")
      .run(text(data.id));
  }
  updateClient(data) {
    const id = text(data.id),
      old = this.db.prepare("SELECT * FROM clients WHERE id=?").get(id);
    if (!old) throw Error(OrbitI18n.t("clientMissing"));
    const extra = clientExtras(data, old);
    this.db
      .prepare(
        `UPDATE clients SET name=?,phone=?,notes=?,${EXTRAS.map((k) => `${k}=?`).join(",")} WHERE id=?`,
      )
      .run(
        text(data.name, 120),
        // An unchanged old number is kept as it was, so clients saved before this check stay editable.
        String(data.phone ?? "").trim() === String(old.phone || "").trim() ? String(old.phone || "") : clientPhone(data.phone),
        String(data.notes || "").slice(0, 2000),
        ...EXTRAS.map((k) => extra[k]),
        id,
      );
    this.setDiscount(id, data.discount);
    this.audit("client.updated", id);
  }
  // A client with visits is anonymised (visits stay in the books); one without is removed.
  deleteClient(data) {
    const id = text(data.id);
    if (!this.db.prepare("SELECT id FROM clients WHERE id=?").get(id))
      throw Error(OrbitI18n.t("clientMissing"));
    const used = this.db
      .prepare(
        "SELECT 1 FROM appointment_clients WHERE client_id=? UNION SELECT 1 FROM appointments WHERE client_id=? LIMIT 1",
      )
      .get(id, id);
    this.transaction(() => {
      if (used)
        this.db
          .prepare(
            "UPDATE clients SET name=?,phone='',notes='',chat_id=NULL,link_code=?,birthday='',name_day='',email='',source='',alert='',tags='',vehicle='',plate='' WHERE id=?",
          )
          .run(
            OrbitI18n.t("clientDeletedName"),
            randomBytes(24).toString("base64url"),
            id,
          );
      // An anonymised client keeps old visits, so mark them "no regular specialist" rather than letting
      // those visits make them regular again.
      if (used) this.db.prepare("INSERT INTO client_regulars VALUES(?,NULL) ON CONFLICT(client_id) DO UPDATE SET resource_id=NULL").run(id);
      else this.db.prepare("DELETE FROM client_regulars WHERE client_id=?").run(id);
      if (!used) {
        this.db.prepare("DELETE FROM passes WHERE client_id=?").run(id);
        this.db
          .prepare("UPDATE certificates SET client_id=NULL WHERE client_id=?")
          .run(id);
        this.db.prepare("DELETE FROM clients WHERE id=?").run(id);
      }
      this.audit("client.deleted", id);
    });
  }
  // The real price is often known only after the visit (parts, extra work).
  updateVisit(data) {
    const id = text(data.id),
      a = this.db.prepare("SELECT * FROM appointments WHERE id=?").get(id);
    if (!a || a.status === "cancelled") throw Error(OrbitI18n.t("m545"));
    const total = cents(data.total),
      cost = data.cost === undefined ? a.cost : cents(data.cost);
    if (total > 1e10) throw Error(OrbitI18n.t("m543"));
    this.db
      .prepare("UPDATE appointments SET total=?,cost=?,notes=? WHERE id=?")
      .run(
        total,
        cost,
        data.notes === undefined ? a.notes : String(data.notes).slice(0, 2000),
        id,
      );
    this.audit("appointment.updated", id);
  }
  status(id, status) {
    if (!["completed", "cancelled", "no_show"].includes(status))
      throw Error(OrbitI18n.t("m544"));
    // A client cannot miss a visit that has not started yet.
    if (
      status === "no_show" &&
      this.db
        .prepare("SELECT start FROM appointments WHERE id=?")
        .get(text(id))?.start > Date.now()
    )
      throw Error(
        "Візит ще не почався — відмітити неявку можна після його початку / The visit has not started yet",
      );
    if (
      !this.db
        .prepare(
          "UPDATE appointments SET status=? WHERE id=? AND status='confirmed'",
        )
        .run(status, text(id)).changes
    )
      throw Error(OrbitI18n.t("m545"));
    if (status === "completed") this.consumeMaterials(text(id));
    this.audit(`appointment.${status}`, id);
  }
  snapshot(options = {}) {
    // Apps before 1.6 expect every visit: they ask without a window.
    const revision = this.revision(),
      from = options.all ? 0 : this.windowStart();
    // Nothing changed since the app's last copy: only say so.
    if (options.revision === revision && Number(options.from) === from)
      return { unchanged: true, revision, loaded_from: from };
    // The same copy serves every member until data changes (or five minutes pass, for "upcoming").
    const cacheKey = `${revision}|${from}|${Math.floor(Date.now() / 300000)}`;
    if (this.snapshotCache?.key === cacheKey) return this.snapshotCache.value;
    const value = this.buildSnapshot(from, revision);
    this.snapshotCache = { key: cacheKey, value };
    return value;
  }
  buildSnapshot(from, revision) {
    const profile = {};
    for (const key of PROFILE) profile[key] = this.get(key);
    // Per-client totals over all time, so the client list does not need every old visit.
    const totals = new Map(
      this.db
        .prepare(
          "SELECT p.client_id id,sum(a.status='confirmed' AND a.start>?) upcoming,sum(a.status='completed') done,sum(a.status='no_show') no_show,max(CASE WHEN a.status='completed' THEN a.start END) last,sum(COALESCE(pay.s,0)) paid,sum(CASE WHEN a.status='completed' THEN max(0,a.total-COALESCE(pay.s,0)) ELSE 0 END) due FROM appointment_clients p JOIN appointments a ON a.id=p.appointment_id LEFT JOIN (SELECT appointment_id,sum(amount) s FROM payments GROUP BY appointment_id) pay ON pay.appointment_id=a.id GROUP BY p.client_id",
        )
        .all(Date.now())
        .map((r) => [r.id, r]),
    );
    const rhythm = this.rhythms();
    return {
      revision,
      loaded_from: from,
      clients: this.db
        .prepare(
          "SELECT id,name,phone,notes,chat_id,invited_at,birthday,name_day,email,source,alert,tags,vehicle,plate,discount FROM clients ORDER BY name",
        )
        .all()
        .map((c) => {
          const t = totals.get(c.id);
          return {
            ...c,
            stats: {
              done: t?.done || 0,
              no_show: t?.no_show || 0,
              last: t?.last || 0,
              paid: t?.paid || 0,
              due: t?.due || 0,
              upcoming: t?.upcoming || 0,
              rhythm: rhythm.get(c.id) || 0,
            },
          };
        }),
      services: this.db
        .prepare("SELECT * FROM services WHERE archived=0 ORDER BY name")
        .all()
        .map((service) => ({
          ...service,
          resource_ids: this.serviceStaff(service.id),
        })),
      absences: this.db
        .prepare("SELECT * FROM resource_absences ORDER BY start_date")
        .all(),
      resources: this.db
        .prepare("SELECT * FROM resources WHERE archived=0 ORDER BY name")
        .all(),
      regulars: this.regulars(),
      // This window plus every visit still open, however old, so nothing waiting to be closed hides.
      appointments: this.visits("a.start>=? OR a.status='confirmed'", [from]),
      payments: this.paymentsBetween(from, 8.64e15),
      payment_links: this.openPaymentLinks(),
      waitlist: this.waitlist(),
      ...this.financeSnapshot(from),
      ...profile,
    };
  }
  export() {
    const tables = {};
    for (const table of TABLES)
      tables[table] = this.db
        .prepare(`SELECT * FROM ${table}`)
        .all()
        .map((row) => ({ ...row }));
    for (const client of tables.clients) client.link_code = null;
    return {
      format: "orbit-crm",
      version: 2,
      exported_at: new Date().toISOString(),
      tables,
    };
  }
  restore(data) {
    if (data?.format === "orbit-crm" && data.version === 1 && data.tables) {
      data = JSON.parse(JSON.stringify(data));
      data.version = 2;
      for (const s of data.tables.services || [])
        Object.assign(s, {
          capacity: 1,
          required_resources: 1,
          bot_visible: 1,
          web_visible: 0,
        });
      for (const a of data.tables.appointments || [])
        Object.assign(a, {
          total:
            data.tables.services.find((s) => s.id === a.service_id)?.price || 0,
          cost: 0,
          people_count: 1,
        });
      data.tables.appointment_clients = (data.tables.appointments || []).map(
        (a) => ({ appointment_id: a.id, client_id: a.client_id }),
      );
      data.tables.appointment_resources = (data.tables.appointments || []).map(
        (a) => ({ appointment_id: a.id, resource_id: a.resource_id }),
      );
      data.tables.payments = [];
    }
    if (
      data?.format === "orbit-crm" &&
      data.version === 2 &&
      data.tables &&
      !data.tables.reminder_deliveries
    )
      data.tables.reminder_deliveries = (data.tables.reminders || []).flatMap(
        (q) =>
          (data.tables.appointment_clients || [])
            .filter((p) => p.appointment_id === q.appointment_id)
            .map((p) => ({ ...q, client_id: p.client_id })),
      );
    // Backups made before staff schedules have no such tables yet.
    if (data?.format === "orbit-crm" && data.version === 2 && data.tables)
      for (const t of [
        "service_resources",
        "resource_absences",
        "payment_links",
        "waitlist",
        "materials",
        "service_materials",
        "material_moves",
        "expenses",
        "certificates",
        "passes",
        "fiscal_receipts",
        "client_regulars",
      ])
        if (!data.tables[t]) data.tables[t] = [];
    if (
      data?.format !== "orbit-crm" ||
      data.version !== 2 ||
      !data.tables ||
      TABLES.some((t) => !Array.isArray(data.tables[t]))
    )
      throw Error(OrbitI18n.t("m546"));
    // Preserve device identity and local integration state. Credentials are never exported.
    const local = [
      "installation",
      "telegram_offset",
      "drive_last",
      "drive_enabled",
      "monobank_merchant",
      "monobank_key",
      "liqpay_merchant",
      "liqpay_sandbox",
    ].map((k) => [k, this.get(k)]);
    this.transaction(() => {
      for (const t of [...TABLES].reverse()) this.db.exec(`DELETE FROM ${t}`);
      for (const t of TABLES) {
        const info = this.db.prepare(`PRAGMA table_info(${t})`).all(),
          columns = info.map((c) => c.name),
          // A backup older than a column gets the column's default ('staff', 0, '').
          defaults = Object.fromEntries(
            info
              .filter((c) => c.dflt_value != null)
              .map((c) => [c.name, /^'.*'$/s.test(c.dflt_value) ? c.dflt_value.slice(1, -1) : Number(c.dflt_value)]),
          );
        const stmt = this.db.prepare(
          `INSERT INTO ${t}(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`,
        );
        if (data.tables[t].length > 1000000) throw Error(OrbitI18n.t("m547"));
        for (const row of data.tables[t])
          stmt.run(
            ...columns.map(
              (c) =>
                row[c] ??
                defaults[c] ??
                (c === "archived" || c === "client_confirmed"
                  ? 0
                  : EXTRAS.includes(c)
                    ? ""
                    : null),
            ),
          );
      }
      for (const [k, v] of local) this.set(k, v);
      this.db.exec(
        "UPDATE reminders SET status='pending' WHERE status='sending'",
      );
      this.db.exec(
        "UPDATE reminder_deliveries SET status='pending' WHERE status='sending'",
      );
      this.audit("backup.restored", this.get("installation"));
    });
  }
  // Everything needed to answer "who can take this service at what time" for one day: each person's
  // own hours and break (or the company's), shifts and absences, visits with the pause after them,
  // and the rooms or equipment the service needs. Built once per day, then asked per time.
  dayPlan(serviceId, date) {
    const service = this.db
      .prepare("SELECT * FROM services WHERE id=? AND archived=0")
      .get(serviceId);
    if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return null;
    const zone = this.get("timezone") || "Europe/Kyiv",
      company = { start: this.get("work_start") || "09:00", end: this.get("work_end") || "18:00" };
    if (!this.get("work_days").includes(OrbitStaff.weekday(date))) return { service, staff: [], rooms: [], needRoom: false, busy: new Map() };
    const absences = this.db
        .prepare("SELECT * FROM resource_absences WHERE start_date<=? AND end_date>=?")
        .all(date, date),
      links = this.serviceLinks(serviceId),
      at = (clock) => zonedTime(date, clock, zone);
    const people = this.db
      .prepare("SELECT id,kind,schedule FROM resources WHERE archived=0 ORDER BY name,id")
      .all()
      .filter((r) => OrbitStaff.works(r, date, absences))
      .map((r) => {
        const h = OrbitStaff.dayHours(r, company);
        return { id: r.id, kind: r.kind, open: at(h.start), close: at(h.end), breaks: h.breaks.map(([x, y]) => [at(x), at(y)]) };
      });
    const staff = people.filter((r) => r.kind !== "room" && OrbitStaff.capable({ resource_ids: links.staff }, r.id)),
      rooms = people.filter((r) => r.kind === "room" && links.rooms.includes(r.id));
    const from = Math.min(...people.map((r) => r.open), at(company.start)),
      to = Math.max(...people.map((r) => r.close), at(company.end)),
      busy = new Map();
    for (const row of this.db
      .prepare(
        "SELECT r.resource_id,a.id,a.service_id,a.start,a.end,a.people_count,COALESCE(s.buffer,0) buffer FROM appointments a JOIN appointment_resources r ON r.appointment_id=a.id JOIN services s ON s.id=a.service_id WHERE a.status='confirmed' AND a.start<? AND a.end+COALESCE(s.buffer,0)*60000>?",
      )
      .all(to + 86400000, from - 86400000)) {
      if (!busy.has(row.resource_id)) busy.set(row.resource_id, []);
      busy.get(row.resource_id).push(row);
    }
    return { service, staff, rooms, needRoom: links.rooms.length > 0, busy, from, to };
  }
  // Who is free for [start, start + duration + pause): inside own hours, outside the break, and no
  // visit (with its own pause) overlaps. Individual visits of one person never overlap, whatever the service.
  freeIn(plan, list, start) {
    const end = start + plan.service.duration * 60000,
      until = end + (plan.service.buffer || 0) * 60000;
    return list.filter(
      (r) =>
        start >= r.open &&
        end <= r.close &&
        !r.breaks.some(([x, y]) => x < end && y > start) &&
        !(plan.busy.get(r.id) || []).some((v) => v.start < until && v.end + v.buffer * 60000 > start),
    );
  }
  // A group class already set for this time that still has seats (and is led by the chosen person).
  groupSession(plan, start, primary, people = 1) {
    if (plan.service.capacity <= 1) return null;
    const automatic = primary == null || primary === "" || primary === "any";
    for (const r of plan.staff)
      for (const v of plan.busy.get(r.id) || [])
        if (
          v.service_id === plan.service.id &&
          v.start === start &&
          (automatic || r.id === primary) &&
          v.people_count + people <= plan.service.capacity
        )
          return v.id;
    return null;
  }
  // How many more bookings fit at this time: free specialists (or seats left in a group).
  freeCount(serviceId, start) {
    const plan = this.dayPlan(serviceId, this.businessDay(start));
    if (!plan) return 0;
    const people = this.freeIn(plan, plan.staff, start).length,
      rooms = plan.needRoom ? this.freeIn(plan, plan.rooms, start).length : Infinity,
      sessions = Math.min(Math.floor(people / plan.service.required_resources), rooms);
    if (plan.service.capacity <= 1) return sessions;
    let seats = sessions * plan.service.capacity;
    const seen = new Set();
    for (const r of plan.staff)
      for (const v of plan.busy.get(r.id) || [])
        if (v.service_id === plan.service.id && v.start === start && !seen.has(v.id)) {
          seen.add(v.id);
          seats += Math.max(0, plan.service.capacity - v.people_count);
        }
    return seats;
  }
  slots(serviceId, resourceId, date) {
    const plan = this.dayPlan(serviceId, date);
    if (!plan || !plan.staff.length) return [];
    const automatic = resourceId == null || resourceId === "" || resourceId === "any";
    if (!automatic && !plan.staff.some((r) => r.id === resourceId)) return [];
    const result = [],
      now = Date.now(),
      step = 1800000,
      first = Math.min(...plan.staff.map((r) => r.open));
    for (let start = first; start + plan.service.duration * 60000 <= plan.to; start += step) {
      if (start <= now) continue;
      if (this.placeIn(plan, resourceId, start)) result.push(start);
    }
    return result;
  }
  // Who gets a visit at this time: the seats of a group already set, or free specialists (the least
  // busy that day first, so work spreads evenly) plus a free room when the service needs one.
  placeIn(plan, primary, start, people = 1) {
    const session = this.groupSession(plan, start, primary, people);
    if (session)
      return this.db
        .prepare("SELECT resource_id FROM appointment_resources WHERE appointment_id=?")
        .all(session)
        .map((r) => r.resource_id);
    const automatic = primary == null || primary === "" || primary === "any",
      free = this.freeIn(plan, plan.staff, start).map((r) => r.id);
    if (!automatic && !free.includes(primary)) return null;
    let rooms = [];
    if (plan.needRoom) {
      rooms = this.freeIn(plan, plan.rooms, start).map((r) => r.id);
      if (!rooms.length) return null;
    }
    const day = this.businessDay(start),
      zone = this.get("timezone") || "Europe/Kyiv",
      next = new Date(Date.parse(day + "T00:00:00Z") + 86400000).toISOString().slice(0, 10),
      load = new Map(
        this.db
          .prepare(
            "SELECT ar.resource_id id,SUM(a.end-a.start) busy FROM appointments a JOIN appointment_resources ar ON ar.appointment_id=a.id WHERE a.status IN ('confirmed','completed') AND a.start>=? AND a.start<? GROUP BY ar.resource_id",
          )
          .all(zonedTime(day, "00:00", zone), zonedTime(next, "00:00", zone))
          .map((r) => [r.id, r.busy]),
      ),
      others = free.filter((id) => id !== primary).sort((x, y) => (load.get(x) || 0) - (load.get(y) || 0)),
      chosen = (automatic ? others : [primary, ...others]).slice(0, plan.service.required_resources);
    if (chosen.length < plan.service.required_resources) return null;
    return plan.needRoom ? [...chosen, rooms[0]] : chosen;
  }
  resourceFree(resource, start, end) {
    return (
      Boolean(
        this.db
          .prepare("SELECT id FROM resources WHERE id=? AND archived=0")
          .get(resource),
      ) &&
      !this.db
        .prepare(
          "SELECT a.id FROM appointments a INDEXED BY visit_open JOIN appointment_resources r ON r.appointment_id=a.id AND r.resource_id=? WHERE a.status='confirmed' AND a.end>? AND a.start<?",
        )
        .get(resource, start, end)
    );
  }
  // clientId: "any specialist" then goes to the client's regular specialist when they are free.
  availableResources(serviceId, primary, start, people = 1, clientId = null) {
    if (!Number.isSafeInteger(start)) return [];
    const plan = this.dayPlan(serviceId, this.businessDay(start));
    if (!plan) return [];
    const automatic = primary == null || primary === "" || primary === "any",
      regular = automatic ? this.regularOf(clientId) : null;
    if (regular) {
      const own = this.placeIn(plan, regular, start, people);
      if (own) return own;
    }
    return this.placeIn(plan, primary, start, people) || [];
  }
  payment(data) {
    const amount = Number(data.amount),
      value = Math.round(amount * 100);
    if (!Number.isSafeInteger(value) || !value || Math.abs(value) > 1e10)
      throw Error(OrbitI18n.t("m548"));
    const at = Number(data.at || Date.now());
    if (!Number.isSafeInteger(at) || at > Date.now() + 60000)
      throw Error(OrbitI18n.t("m549"));
    // A refund is a negative amount; the method says how the money went back (cash, card, transfer).
    // "refund" stays accepted for older apps that sent refunds as a separate method.
    const method = [
      "cash",
      "card",
      "transfer",
      "refund",
      "certificate",
      "pass",
    ].includes(data.method)
      ? data.method
      : "cash";
    if (method === "refund" && value > 0) throw Error(OrbitI18n.t("m550"));
    const appointment = text(data.appointment_id);
    const row = this.db
      .prepare(
        "SELECT a.id,a.total,a.service_id,a.client_id,COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0) paid FROM appointments a WHERE a.id=?",
      )
      .get(appointment);
    if (!row) throw Error(OrbitI18n.t("m551"));
    const due = row.total - row.paid;
    if (value > 0 && value > Math.max(0, due))
      throw Error(
        OrbitI18n.t(due > 0 ? "payTooMuch" : "payNothingDue").replace(
          "{due}",
          (due / 100).toFixed(2),
        ),
      );
    if (value < 0 && -value > row.paid)
      throw Error(
        OrbitI18n.t("refundTooMuch").replace(
          "{paid}",
          (row.paid / 100).toFixed(2),
        ),
      );
    const id = randomUUID();
    this.transaction(() => {
      // Certificates and passes were paid for when sold; here they only cover the visit.
      const voucher = ["certificate", "pass"].includes(method)
        ? this.applyVoucher(method, data.voucher_id, value, row, due)
        : null;
      this.db
        .prepare(
          "INSERT INTO payments(id,appointment_id,amount,at,method,voucher_id) VALUES(?,?,?,?,?,?)",
        )
        .run(id, appointment, value, at, method, voucher);
      this.depositSettled(appointment);
    });
    this.audit("payment.created", id);
    return id;
  }
  // Unpaid links that can still be paid; shown on the visit card.
  openPaymentLinks() {
    return this.db
      .prepare(
        "SELECT id,appointment_id,provider,amount,status,url,created_at,expires FROM payment_links WHERE status IN ('created','processing','hold') AND expires>? ORDER BY created_at",
      )
      .all(Date.now());
  }
  addPaymentLink(data) {
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO payment_links(id,appointment_id,provider,invoice_id,amount,status,url,created_at,expires) VALUES(?,?,?,?,?,?,?,?,?)",
      )
      .run(
        id,
        data.appointment_id,
        data.provider,
        data.invoice_id,
        data.amount,
        "created",
        data.url,
        Date.now(),
        data.expires,
      );
    this.audit("payment_link.created", id);
    return id;
  }
  // Applies a provider status. Money is credited once: the visit gets the difference between
  // what the bank reports as paid now and what was already credited (refunds become negative).
  settlePaymentLink(provider, invoiceId, state) {
    const link = this.db
      .prepare("SELECT * FROM payment_links WHERE provider=? AND invoice_id=?")
      .get(provider, invoiceId);
    if (!link) return null;
    const modified = String(state.modified || "");
    if (modified && link.modified && modified < link.modified) return link;
    const counted = ["success", "reversed"].includes(state.status);
    const target = counted
      ? Math.max(0, Math.round(Number(state.paid) || 0))
      : link.credited;
    if (!Number.isSafeInteger(target) || target > 1e10)
      throw Error("Invalid payment amount");
    const delta = target - link.credited,
      paymentId = delta ? randomUUID() : null;
    this.transaction(() => {
      if (delta)
        this.db
          .prepare("INSERT INTO payments(id,appointment_id,amount,at,method) VALUES(?,?,?,?,?)")
          .run(
            paymentId,
            link.appointment_id,
            delta,
            Date.now(),
            delta > 0 ? provider : "refund",
          );
      this.db
        .prepare(
          "UPDATE payment_links SET status=?,credited=?,modified=? WHERE id=?",
        )
        .run(String(state.status), target, modified || link.modified, link.id);
    });
    if (delta) {
      this.audit("payment_link.settled", link.id);
      this.depositSettled(link.appointment_id);
    }
    return { ...link, status: state.status, credited: target, delta, payment_id: paymentId };
  }
  // Usual gap between a client's completed visits in days (median); none with fewer than two visit days.
  rhythms() {
    // Computed once per data revision; the day of each visit comes from a per-day zone offset
    // instead of formatting every timestamp (thousands of visits stay fast).
    const revision = this.revision();
    if (this.rhythmCache?.revision === revision) return this.rhythmCache.value;
    const timezone = this.get("timezone") || "Europe/Kyiv",
      DAY = 86400000,
      parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      offsets = new Map(),
      offset = (k) => {
        if (!offsets.has(k)) {
          const at = k * DAY + 12 * 3600000,
            p = Object.fromEntries(parts.formatToParts(at).map((x) => [x.type, x.value]));
          offsets.set(k, Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - at);
        }
        return offsets.get(k);
      },
      byClient = new Map(),
      out = new Map();
    for (const r of this.db
      .prepare(
        "SELECT p.client_id id,a.start FROM appointment_clients p JOIN appointments a ON a.id=p.appointment_id WHERE a.status='completed' ORDER BY a.start",
      )
      .all()) {
      const dayNo = Math.floor((r.start + offset(Math.floor(r.start / DAY))) / DAY),
        days = byClient.get(r.id);
      if (!days) byClient.set(r.id, [dayNo]);
      else if (days[days.length - 1] !== dayNo) days.push(dayNo);
    }
    for (const [id, days] of byClient) {
      if (days.length < 2) continue;
      const gaps = days.slice(1).map((d, i) => d - days[i]).sort((a, b) => a - b);
      out.set(id, gaps[Math.floor((gaps.length - 1) / 2)]);
    }
    this.rhythmCache = { revision, value: out };
    return out;
  }
  // Minimum days without a visit before a client shows in "Haven't visited for a while".
  setLapsedDays(days) {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 3 || n > 365)
      throw Error(OrbitI18n.t("lapsedDaysInvalid"));
    this.set("lapsed_days", n);
  }
  markInvited(id) {
    this.db
      .prepare("UPDATE clients SET invited_at=? WHERE id=?")
      .run(Date.now(), text(id));
  }
  // The client pressed "I'll come" in a reminder.
  clientConfirm(id, clientId) {
    if (
      !this.db
        .prepare(
          "UPDATE appointments SET client_confirmed=1 WHERE id=? AND status='confirmed' AND start>? AND EXISTS(SELECT 1 FROM appointment_clients WHERE appointment_id=appointments.id AND client_id=?)",
        )
        .run(text(id), Date.now(), text(clientId)).changes
    )
      throw Error(OrbitI18n.t("m545"));
    this.audit("appointment.client_confirmed", id);
  }
  // The next free times from a day on (two weeks ahead), offered when the wanted day is full.
  nearestSlots(serviceId, resourceId, date, count = 3) {
    const out = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return out;
    for (let i = 0; i < 14 && out.length < count; i++) {
      const d = new Date(`${date}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      out.push(
        ...this.slots(
          serviceId,
          resourceId,
          d.toISOString().slice(0, 10),
        ).slice(0, count - out.length),
      );
    }
    return out;
  }
  addWait(data) {
    const client = this.db
      .prepare("SELECT id FROM clients WHERE id=?")
      .get(text(data.client_id));
    if (!client) throw Error(OrbitI18n.t("clientMissing"));
    const service = this.db
      .prepare("SELECT * FROM services WHERE id=? AND archived=0")
      .get(text(data.service_id));
    if (!service) throw Error(OrbitI18n.t("m538"));
    const resource =
      data.resource_id && data.resource_id !== "any"
        ? text(data.resource_id)
        : null;
    if (
      resource &&
      !this.db
        .prepare("SELECT id FROM resources WHERE id=? AND archived=0")
        .get(resource)
    )
      throw Error(OrbitI18n.t("catalogResourceMissing"));
    const date = String(data.date || "");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date < this.businessDay(Date.now()) ||
      date > this.businessDay(Date.now() + 366 * 86400000)
    )
      throw Error(OrbitI18n.t("waitDateInvalid"));
    const wanted =
      data.wanted == null || data.wanted === "" ? null : Number(data.wanted);
    if (wanted !== null && !Number.isSafeInteger(wanted))
      throw Error(OrbitI18n.t("m539"));
    const source = ["app", "bot", "page"].includes(data.source)
      ? data.source
      : "app";
    return this.transaction(() => {
      const same = this.db
        .prepare(
          "SELECT id FROM waitlist WHERE client_id=? AND service_id=? AND date=? AND status='waiting'",
        )
        .get(client.id, service.id, date);
      if (same) return same.id;
      const id = randomUUID();
      this.db
        .prepare(
          "INSERT INTO waitlist(id,client_id,service_id,resource_id,date,wanted,note,source,status,created_at) VALUES(?,?,?,?,?,?,?,?,'waiting',?)",
        )
        .run(
          id,
          client.id,
          service.id,
          resource,
          date,
          wanted,
          String(data.note || "").slice(0, 500),
          source,
          Date.now(),
        );
      // Times free right now were already on offer: only times freed later are news.
      for (const start of this.slots(service.id, resource || "any", date))
        this.db
          .prepare("INSERT OR IGNORE INTO waitlist_seen VALUES(?,?)")
          .run(id, start);
      this.audit("waitlist.added", id);
      return id;
    });
  }
  removeWait(data) {
    const id = text(data.id);
    if (
      !this.db
        .prepare(
          "UPDATE waitlist SET status='removed' WHERE id=? AND status='waiting'",
        )
        .run(id).changes
    )
      throw Error(OrbitI18n.t("waitMissing"));
    this.audit("waitlist.removed", id);
  }
  // Who is waiting today and later, with names for the app.
  waitlist() {
    return this.db
      .prepare(
        "SELECT w.*,c.name client_name,c.phone,c.chat_id IS NOT NULL telegram,s.name service_name,s.duration,r.name resource_name FROM waitlist w JOIN clients c ON c.id=w.client_id JOIN services s ON s.id=w.service_id LEFT JOIN resources r ON r.id=w.resource_id WHERE w.status='waiting' AND w.date>=? ORDER BY w.date,w.created_at",
      )
      .all(this.businessDay(Date.now()))
      .map((w) => ({ ...w, telegram: Boolean(w.telegram) }));
  }
  // Times freed since a person joined the list, for people the bot can write to. Each time is
  // offered to everyone waiting for that day at once, and to each person only once.
  waitOffers() {
    const out = [],
      look = `${this.revision()}:${this.businessDay(Date.now())}`;
    if (this.offersLook === look) return out;
    this.offersLook = look;
    for (const w of this.db
      .prepare(
        "SELECT w.*,c.chat_id FROM waitlist w JOIN clients c ON c.id=w.client_id WHERE w.status='waiting' AND w.date>=? AND c.chat_id IS NOT NULL",
      )
      .all(this.businessDay(Date.now()))) {
      const seen = new Set(
        this.db
          .prepare("SELECT start FROM waitlist_seen WHERE wait_id=?")
          .all(w.id)
          .map((r) => r.start),
      );
      const fresh = this.slots(
        w.service_id,
        w.resource_id || "any",
        w.date,
      ).filter((start) => !seen.has(start));
      if (!fresh.length) continue;
      for (const start of fresh)
        this.db
          .prepare("INSERT OR IGNORE INTO waitlist_seen VALUES(?,?)")
          .run(w.id, start);
      out.push({ ...w, starts: fresh });
    }
    return out;
  }
  // "I'll take it": books the freed time for this person unless someone was faster.
  takeWait(waitId, start, clientId) {
    return this.transaction(() => {
      const w = this.db
        .prepare(
          "SELECT * FROM waitlist WHERE id=? AND client_id=? AND status='waiting'",
        )
        .get(text(waitId), text(clientId));
      if (!w) throw Error(OrbitI18n.t("waitMissing"));
      start = Number(start);
      // A time offered earlier may have passed by the time the person taps it.
      const resources =
        Number.isSafeInteger(start) &&
        start > Date.now() &&
        this.businessDay(start) === w.date
          ? this.availableResources(w.service_id, w.resource_id || "any", start)
          : [];
      if (!resources.length) throw Error(OrbitI18n.t("m541"));
      return this.book({
        client_id: w.client_id,
        service_id: w.service_id,
        resource_ids: resources,
        start,
        wait_id: w.id,
      });
    });
  }
  saveProfile(data) {
    if (!OrbitIndustries.IDS.includes(data.industry))
      throw Error(OrbitI18n.t("m552"));
    text(data.business, 120);
    if (data.timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: data.timezone });
      } catch {
        throw Error(OrbitI18n.t("m553"));
      }
    }
    if (data.currency && !/^[A-Z]{3}$/.test(data.currency))
      throw Error(OrbitI18n.t("m554"));
    const start = data.work_start || this.get("work_start"),
      end = data.work_end || this.get("work_end");
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) ||
      start >= end
    )
      throw Error(OrbitI18n.t("m555"));
    if (
      data.work_days &&
      (!Array.isArray(data.work_days) ||
        !data.work_days.length ||
        data.work_days.some((d) => !Number.isInteger(d) || d < 1 || d > 7))
    )
      throw Error(OrbitI18n.t("m556"));
    if (
      data.logo !== undefined &&
      data.logo !== null &&
      data.logo !== "" &&
      (typeof data.logo !== "string" ||
        data.logo.length > 3000000 ||
        !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(data.logo))
    )
      throw Error(OrbitI18n.t("m557"));
    this.transaction(() => {
      for (const key of [
        "business",
        "industry",
        "timezone",
        "currency",
        "phone",
        "address",
        "work_start",
        "work_end",
        "work_days",
        "logo",
        "website_enabled",
      ])
        if (data[key] !== undefined)
          this.set(
            key,
            typeof data[key] === "string" ? data[key].trim() : data[key],
          );
      this.set("onboarded", true);
      this.audit("settings.changed", this.get("installation"));
    });
  }
}
Object.assign(Store.prototype, finance, clientImport, reviews);
// Start and end of a calendar month ("2026-10") in the company's time zone.
Store.prototype.monthRange = function (month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) throw Error(OrbitI18n.t("m504"));
  const [y, m] = month.split("-").map(Number),
    zone = this.get("timezone") || "Europe/Kyiv",
    next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return [zonedTime(`${month}-01`, "00:00", zone), zonedTime(next, "00:00", zone)];
};
module.exports = { Store, zonedTime, CLIENT_SOURCES: SOURCES };
