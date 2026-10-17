const OrbitI18n = require("./ui/i18n.js");
const OrbitStaff = require("./ui/staff-rules.js");
const { DatabaseSync } = require("node:sqlite");
const { randomUUID, randomBytes } = require("node:crypto");
const { mkdirSync, chmodSync } = require("node:fs");
const { dirname } = require("node:path");

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
];
function text(value, max = 500) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw Error(OrbitI18n.t("m533"));
  return value.trim();
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
      ["services", "web_visible", "INTEGER NOT NULL DEFAULT 0"],
      ["appointments", "total", "INTEGER NOT NULL DEFAULT 0 CHECK(total>=0)"],
      ["appointments", "cost", "INTEGER NOT NULL DEFAULT 0 CHECK(cost>=0)"],
      [
        "appointments",
        "people_count",
        "INTEGER NOT NULL DEFAULT 1 CHECK(people_count BETWEEN 1 AND 100)",
      ],
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
    // Indexes for the snapshot and client history (added after all tables exist).
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS payment_visit ON payments(appointment_id);CREATE INDEX IF NOT EXISTS visit_clients ON appointment_clients(client_id);CREATE INDEX IF NOT EXISTS visit_resources ON appointment_resources(resource_id);CREATE INDEX IF NOT EXISTS visit_start ON appointments(start);CREATE INDEX IF NOT EXISTS payment_at ON payments(at);",
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
    ])
      for (const op of ["insert", "update", "delete"])
        this.db.exec(
          `CREATE TRIGGER IF NOT EXISTS revision_${table}_${op} AFTER ${op.toUpperCase()} ON ${table} ${bump}`,
        );
    const shown = PROFILE.map((k) => `'${k}'`).join(",");
    for (const op of ["insert", "update"])
      this.db.exec(
        `CREATE TRIGGER IF NOT EXISTS revision_settings_${op} AFTER ${op.toUpperCase()} ON settings WHEN NEW.key IN (${shown}) ${bump}`,
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
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO clients(id,name,phone,notes,link_code) VALUES(?,?,?,?,?)",
      )
      .run(
        id,
        text(data.name, 120),
        String(data.phone || "").slice(0, 40),
        String(data.notes || "").slice(0, 2000),
        randomBytes(24).toString("base64url"),
      );
    this.audit("client.created", id);
    return id;
  }
  addService(data) {
    const values = this.serviceValues(data),
      id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO services(id,name,duration,price,capacity,required_resources,bot_visible,web_visible) VALUES(?,?,?,?,?,?,?,?)",
      )
      .run(id, ...values);
    if (Array.isArray(data.resource_ids))
      this.setServiceStaff(id, data.resource_ids);
    this.audit("service.created", id);
    return id;
  }
  serviceValues(data) {
    const duration = Number(data.duration),
      price = cents(data.price),
      capacity = Number(data.capacity || 1),
      required = Number(data.required_resources || 1);
    if (
      !Number.isInteger(duration) ||
      duration < 5 ||
      duration > 480 ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 100 ||
      !Number.isInteger(required) ||
      required < 1 ||
      required > 8
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
    ];
  }
  updateService(data) {
    if (
      !this.db
        .prepare(
          "UPDATE services SET name=?,duration=?,price=?,capacity=?,required_resources=?,bot_visible=?,web_visible=? WHERE id=? AND archived=0",
        )
        .run(...this.serviceValues(data), text(data.id)).changes
    )
      throw Error(OrbitI18n.t("m538"));
    if (Array.isArray(data.resource_ids))
      this.setServiceStaff(text(data.id), data.resource_ids);
    this.audit("service.updated", data.id);
  }
  addResource(data) {
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO resources(id,name) VALUES(?,?)")
      .run(id, text(data.name, 120));
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
      const digits = phone.replace(/[^0-9]/g, "");
      const matches =
        digits.length >= 7
          ? this.db
              .prepare("SELECT id,name,phone FROM clients")
              .all()
              .filter((c) => c.phone.replace(/[^0-9]/g, "") === digits)
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
          data.total === undefined ? service.price * people : cents(data.total),
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
      this.audit("appointment.created", id);
      return id;
    });
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
          "UPDATE appointments SET start=?,end=?,resource_id=? WHERE id=?",
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
  }
  businessDay(ms) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: this.get("timezone") || "Europe/Kyiv",
    }).format(ms);
  }
  serviceStaff(serviceId) {
    return this.db
      .prepare(
        "SELECT s.resource_id FROM service_resources s JOIN resources r ON r.id=s.resource_id WHERE s.service_id=? AND r.archived=0",
      )
      .all(serviceId)
      .map((r) => r.resource_id);
  }
  canDo(serviceId, resourceId) {
    return OrbitStaff.capable(
      { resource_ids: this.serviceStaff(serviceId) },
      resourceId,
    );
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
          "UPDATE resources SET name=?,schedule=? WHERE id=? AND archived=0",
        )
        .run(
          text(data.name, 120),
          schedule ? JSON.stringify(schedule) : null,
          id,
        ).changes
    )
      throw Error(OrbitI18n.t("catalogResourceMissing"));
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
    const id = text(data.id);
    if (
      !this.db
        .prepare("UPDATE clients SET name=?,phone=?,notes=? WHERE id=?")
        .run(
          text(data.name, 120),
          String(data.phone || "").slice(0, 40),
          String(data.notes || "").slice(0, 2000),
          id,
        ).changes
    )
      throw Error(OrbitI18n.t("clientMissing"));
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
            "UPDATE clients SET name=?,phone='',notes='',chat_id=NULL,link_code=? WHERE id=?",
          )
          .run(
            OrbitI18n.t("clientDeletedName"),
            randomBytes(24).toString("base64url"),
            id,
          );
      else this.db.prepare("DELETE FROM clients WHERE id=?").run(id);
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
    if (
      !this.db
        .prepare(
          "UPDATE appointments SET status=? WHERE id=? AND status='confirmed'",
        )
        .run(status, text(id)).changes
    )
      throw Error(OrbitI18n.t("m545"));
    this.audit(`appointment.${status}`, id);
  }
  snapshot(options = {}) {
    const revision = this.revision(),
      from = this.windowStart();
    // Nothing changed since the app's last copy: only say so.
    if (options.revision === revision && Number(options.from) === from)
      return { unchanged: true, revision, loaded_from: from };
    const profile = {};
    for (const key of PROFILE) profile[key] = this.get(key);
    // Per-client totals over all time, so the client list does not need every old visit.
    const totals = new Map(
      this.db
        .prepare(
          "SELECT p.client_id id,sum(a.status='completed') done,sum(a.status='no_show') no_show,max(CASE WHEN a.status='completed' THEN a.start END) last,sum(COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0)) paid,sum(CASE WHEN a.status='completed' THEN max(0,a.total-COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0)) ELSE 0 END) due FROM appointment_clients p JOIN appointments a ON a.id=p.appointment_id GROUP BY p.client_id",
        )
        .all()
        .map((r) => [r.id, r]),
    );
    return {
      revision,
      loaded_from: from,
      clients: this.db
        .prepare(
          "SELECT id,name,phone,notes,chat_id FROM clients ORDER BY name",
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
      // This window plus every visit still open, however old, so nothing waiting to be closed hides.
      appointments: this.visits("a.start>=? OR a.status='confirmed'", [from]),
      payments: this.paymentsBetween(from, 8.64e15),
      payment_links: this.openPaymentLinks(),
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
        const columns = this.db
          .prepare(`PRAGMA table_info(${t})`)
          .all()
          .map((c) => c.name);
        const stmt = this.db.prepare(
          `INSERT INTO ${t}(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`,
        );
        if (data.tables[t].length > 1000000) throw Error(OrbitI18n.t("m547"));
        for (const row of data.tables[t])
          stmt.run(
            ...columns.map((c) => row[c] ?? (c === "archived" ? 0 : null)),
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
  slots(serviceId, resourceId, date) {
    const service = this.db
      .prepare("SELECT * FROM services WHERE id=? AND archived=0")
      .get(serviceId);
    if (!service) return [];
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !this.get("work_days").includes(
        new Date(`${date}T12:00:00Z`).getUTCDay() || 7,
      )
    )
      return [];
    const day = zonedTime(date, this.get("work_start"), this.get("timezone")),
      close = zonedTime(date, this.get("work_end"), this.get("timezone")),
      result = [];
    for (
      let start = day;
      start + service.duration * 60000 <= close;
      start += 1800000
    ) {
      if (start <= Date.now()) continue;
      if (
        this.availableResources(serviceId, resourceId, start).length >=
        service.required_resources
      )
        result.push(start);
    }
    return result;
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
          "SELECT a.id FROM appointments a JOIN appointment_resources r ON r.appointment_id=a.id WHERE r.resource_id=? AND a.status='confirmed' AND a.start<? AND a.end>?",
        )
        .get(resource, end, start)
    );
  }
  availableResources(serviceId, primary, start) {
    const service = this.db
      .prepare("SELECT * FROM services WHERE id=? AND archived=0")
      .get(serviceId);
    if (!service || !Number.isSafeInteger(start)) return [];
    const automatic = primary == null || primary === "" || primary === "any";
    const end = start + service.duration * 60000,
      day = this.businessDay(start);
    // Only people who do this service and work that day are offered (bot, website, grid).
    const fits = (id) =>
      this.canDo(serviceId, id) &&
      this.worksOn(id, day) &&
      this.resourceFree(id, start, end);
    if (!automatic && !fits(primary)) return [];
    const free = this.db
      .prepare("SELECT id FROM resources WHERE archived=0 ORDER BY name,id")
      .all()
      .filter((r) => r.id !== primary && fits(r.id))
      .map((r) => r.id);
    const selected = (automatic ? free : [primary, ...free]).slice(
      0,
      service.required_resources,
    );
    return selected.length === service.required_resources ? selected : [];
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
    const method = ["cash", "card", "transfer", "refund"].includes(data.method)
      ? data.method
      : "cash";
    if (method === "refund" && value > 0) throw Error(OrbitI18n.t("m550"));
    const appointment = text(data.appointment_id);
    const row = this.db
      .prepare(
        "SELECT a.id,a.total,COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0) paid FROM appointments a WHERE a.id=?",
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
    this.db
      .prepare("INSERT INTO payments VALUES(?,?,?,?,?)")
      .run(id, appointment, value, at, method);
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
    const delta = target - link.credited;
    this.transaction(() => {
      if (delta)
        this.db
          .prepare("INSERT INTO payments VALUES(?,?,?,?,?)")
          .run(
            randomUUID(),
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
    if (delta) this.audit("payment_link.settled", link.id);
    return { ...link, status: state.status, credited: target, delta };
  }
  saveProfile(data) {
    if (!["beauty", "auto", "universal"].includes(data.industry))
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
module.exports = { Store, zonedTime };
