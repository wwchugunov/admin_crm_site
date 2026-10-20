"use strict";
const { randomUUID, randomInt } = require("node:crypto");
// Money and stock a company runs on besides visits: expenses, materials, gift certificates,
// visit passes and specialists' pay. Every part is optional; nothing shows until the owner adds a record.
// The methods are mixed into Store, so they run inside its database and transactions.

const EXPENSE_CATEGORIES = [
  "rent",
  "materials",
  "salary",
  "utilities",
  "marketing",
  "taxes",
  "other",
];
const SALE_METHODS = ["cash", "card", "transfer"];
const UNITS = ["pcs", "ml", "g", "pack"];
// Certificate codes avoid letters and digits that are easy to confuse when read aloud or typed.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function fail(uk, en) {
  throw Error(`${uk} / ${en}`);
}
function amountOf(value, { zero = false } = {}) {
  const amount = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1e10 || (!zero && !amount))
    fail("Невірна сума", "Invalid amount");
  return amount;
}
function title(value, max = 120) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    fail("Заповніть назву", "Fill in the name");
  return value.trim();
}
function remark(value, max = 500) {
  if (value == null || value === "") return "";
  if (typeof value !== "string" || value.length > max)
    fail("Коментар задовгий", "The note is too long");
  return value.trim();
}
function quantity(value, { signed = false, zero = false } = {}) {
  const q = Math.round(Number(value) * 1000) / 1000;
  if (!Number.isFinite(q) || Math.abs(q) > 1e6 || (!signed && q < 0) || (!zero && q === 0))
    fail("Невірна кількість", "Invalid quantity");
  return q;
}
function percent(value) {
  const p = Number(value || 0);
  if (!Number.isFinite(p) || p < 0 || p > 100)
    fail("Відсоток має бути від 0 до 100", "Percent must be between 0 and 100");
  return Math.round(p * 100) / 100;
}
function moment(value, fallback = Date.now()) {
  const at = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isSafeInteger(at) || at <= 0 || at > Date.now() + 366 * 86400000)
    fail("Невірна дата", "Invalid date");
  return at;
}
function expiry(value) {
  if (value === undefined || value === null || value === "") return null;
  const at = Number(value);
  if (!Number.isSafeInteger(at) || at <= Date.now())
    fail("Термін дії має бути в майбутньому", "The expiry must be in the future");
  return at;
}
function saleMethod(value) {
  if (!SALE_METHODS.includes(value))
    fail("Оберіть спосіб оплати", "Choose a payment method");
  return value;
}
function id(value) {
  if (typeof value !== "string" || !value || value.length > 80)
    fail("Запис не знайдено", "Record not found");
  return value;
}

const finance = {
  financeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS expenses(id TEXT PRIMARY KEY,at INTEGER NOT NULL,category TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>0),note TEXT NOT NULL DEFAULT '',resource_id TEXT REFERENCES resources(id),move_id TEXT,created_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS expenses_at ON expenses(at);
      CREATE TABLE IF NOT EXISTS materials(id TEXT PRIMARY KEY,name TEXT NOT NULL,unit TEXT NOT NULL,stock REAL NOT NULL DEFAULT 0,min_stock REAL NOT NULL DEFAULT 0,unit_cost INTEGER NOT NULL DEFAULT 0,archived INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS service_materials(service_id TEXT NOT NULL REFERENCES services(id),material_id TEXT NOT NULL REFERENCES materials(id),quantity REAL NOT NULL CHECK(quantity>0),PRIMARY KEY(service_id,material_id));
      CREATE TABLE IF NOT EXISTS material_moves(id TEXT PRIMARY KEY,material_id TEXT NOT NULL REFERENCES materials(id),quantity REAL NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('purchase','use','adjust')),appointment_id TEXT REFERENCES appointments(id),cost INTEGER NOT NULL DEFAULT 0,at INTEGER NOT NULL,note TEXT NOT NULL DEFAULT '');
      CREATE INDEX IF NOT EXISTS material_moves_visit ON material_moves(appointment_id);
      CREATE TABLE IF NOT EXISTS certificates(id TEXT PRIMARY KEY,code TEXT NOT NULL UNIQUE,amount INTEGER NOT NULL CHECK(amount>0),balance INTEGER NOT NULL CHECK(balance>=0),price INTEGER NOT NULL CHECK(price>=0),method TEXT NOT NULL,client_id TEXT REFERENCES clients(id),sold_at INTEGER NOT NULL,expires INTEGER,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','void')),note TEXT NOT NULL DEFAULT '');
      CREATE TABLE IF NOT EXISTS fiscal_receipts(id TEXT PRIMARY KEY,source TEXT NOT NULL,source_id TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('sell','return')),amount INTEGER NOT NULL CHECK(amount>0),method TEXT NOT NULL,title TEXT NOT NULL,related_id TEXT,status TEXT NOT NULL CHECK(status IN ('pending','sent','done','failed')),attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,error TEXT NOT NULL DEFAULT '',fiscal_code TEXT,is_test INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,done_at INTEGER,UNIQUE(source,source_id));
      CREATE TABLE IF NOT EXISTS passes(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),service_id TEXT NOT NULL REFERENCES services(id),visits INTEGER NOT NULL CHECK(visits BETWEEN 1 AND 500),used INTEGER NOT NULL DEFAULT 0 CHECK(used>=0),price INTEGER NOT NULL CHECK(price>=0),method TEXT NOT NULL,sold_at INTEGER NOT NULL,expires INTEGER,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','void')),note TEXT NOT NULL DEFAULT '');`);
    for (const [table, column, definition] of [
      // A personal discount the owner gives a client; new visits are priced with it.
      ["clients", "discount", "INTEGER NOT NULL DEFAULT 0 CHECK(discount BETWEEN 0 AND 100)"],
      // Pay: a share of what clients paid for the specialist's visits plus a fixed sum per working day.
      ["resources", "pay_percent", "REAL NOT NULL DEFAULT 0"],
      ["resources", "pay_daily", "INTEGER NOT NULL DEFAULT 0"],
      // A different share for one service; empty means the specialist's own share.
      ["services", "pay_percent", "REAL"],
      // Which certificate or pass a payment was taken from.
      ["payments", "voucher_id", "TEXT"],
      // Where the client opens the receipt (each provider has its own receipt page).
      ["fiscal_receipts", "url", "TEXT"],
      // Prepayment a service asks for when booked online, and what a visit still waits for.
      ["services", "deposit", "INTEGER NOT NULL DEFAULT 0"],
      ["appointments", "deposit", "INTEGER NOT NULL DEFAULT 0"],
      ["appointments", "deposit_until", "INTEGER"],
    ])
      if (!this.db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column))
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  },

  // Expenses ---------------------------------------------------------------
  addExpense(data) {
    const category = EXPENSE_CATEGORIES.includes(data.category) ? data.category : null;
    if (!category) fail("Оберіть категорію витрати", "Choose an expense category");
    const resource = data.resource_id ? id(data.resource_id) : null;
    if (resource && !this.db.prepare("SELECT id FROM resources WHERE id=?").get(resource))
      fail("Спеціаліста не знайдено", "Specialist not found");
    const expense = randomUUID();
    this.db
      .prepare("INSERT INTO expenses(id,at,category,amount,note,resource_id,move_id,created_at) VALUES(?,?,?,?,?,?,?,?)")
      .run(expense, moment(data.at), category, amountOf(data.amount), remark(data.note), category === "salary" ? resource : null, null, Date.now());
    this.audit("expense.created", expense);
    return expense;
  },
  deleteExpense(data) {
    if (!this.db.prepare("DELETE FROM expenses WHERE id=?").run(id(data.id)).changes)
      fail("Витрату не знайдено", "Expense not found");
    this.audit("expense.deleted", data.id);
  },

  // Materials --------------------------------------------------------------
  addMaterial(data) {
    const material = randomUUID(),
      unit = UNITS.includes(data.unit) ? data.unit : "pcs";
    this.db
      .prepare("INSERT INTO materials(id,name,unit,stock,min_stock,unit_cost) VALUES(?,?,?,0,?,?)")
      .run(material, title(data.name), unit, quantity(data.min_stock || 0, { zero: true }), amountOf(data.unit_cost || 0, { zero: true }));
    if (Number(data.stock) > 0) this.materialMove({ material_id: material, kind: "adjust", stock: data.stock });
    this.audit("material.created", material);
    return material;
  },
  updateMaterial(data) {
    const unit = UNITS.includes(data.unit) ? data.unit : "pcs";
    if (
      !this.db
        .prepare("UPDATE materials SET name=?,unit=?,min_stock=?,unit_cost=? WHERE id=? AND archived=0")
        .run(title(data.name), unit, quantity(data.min_stock || 0, { zero: true }), amountOf(data.unit_cost || 0, { zero: true }), id(data.id)).changes
    )
      fail("Матеріал не знайдено", "Material not found");
    this.audit("material.updated", data.id);
  },
  // History stays for reports; the material only leaves the lists and the services.
  deleteMaterial(data) {
    this.transaction(() => {
      if (!this.db.prepare("UPDATE materials SET archived=1 WHERE id=? AND archived=0").run(id(data.id)).changes)
        fail("Матеріал не знайдено", "Material not found");
      this.db.prepare("DELETE FROM service_materials WHERE material_id=?").run(data.id);
    });
    this.audit("material.archived", data.id);
  },
  // A purchase adds stock and, when it has a price, records the expense; an adjustment sets the counted stock.
  materialMove(data) {
    const material = this.db.prepare("SELECT * FROM materials WHERE id=? AND archived=0").get(id(data.material_id));
    if (!material) fail("Матеріал не знайдено", "Material not found");
    const move = randomUUID(),
      at = moment(data.at);
    return this.transaction(() => {
      if (data.kind === "purchase") {
        const q = quantity(data.quantity),
          cost = amountOf(data.cost || 0, { zero: true }),
          // The unit price follows purchases: a weighted average of what is in stock and what came in.
          stock = Math.max(0, material.stock),
          unitCost = cost ? Math.round((material.unit_cost * stock + cost) / (stock + q)) : material.unit_cost;
        this.db.prepare("INSERT INTO material_moves VALUES(?,?,?,?,?,?,?,?)").run(move, material.id, q, "purchase", null, cost, at, remark(data.note));
        this.db.prepare("UPDATE materials SET stock=round(stock+?,3),unit_cost=? WHERE id=?").run(q, unitCost, material.id);
        if (cost)
          this.db
            .prepare("INSERT INTO expenses(id,at,category,amount,note,resource_id,move_id,created_at) VALUES(?,?,?,?,?,?,?,?)")
            .run(randomUUID(), at, "materials", cost, material.name, null, move, Date.now());
      } else if (data.kind === "adjust") {
        const counted = quantity(data.stock, { zero: true }),
          delta = Math.round((counted - material.stock) * 1000) / 1000;
        if (!delta) return null;
        this.db.prepare("INSERT INTO material_moves VALUES(?,?,?,?,?,?,?,?)").run(move, material.id, delta, "adjust", null, 0, at, remark(data.note));
        this.db.prepare("UPDATE materials SET stock=? WHERE id=?").run(counted, material.id);
      } else fail("Невідома операція", "Unknown operation");
      this.audit("material.moved", move);
      return move;
    });
  },
  setServiceMaterials(serviceId, items) {
    if (!Array.isArray(items)) return;
    if (items.length > 50) fail("Забагато матеріалів", "Too many materials");
    const rows = items.map((item) => ({ material: id(item.material_id), quantity: quantity(item.quantity) }));
    if (new Set(rows.map((r) => r.material)).size !== rows.length)
      fail("Матеріал повторюється", "A material is listed twice");
    for (const r of rows)
      if (!this.db.prepare("SELECT id FROM materials WHERE id=? AND archived=0").get(r.material))
        fail("Матеріал не знайдено", "Material not found");
    this.db.prepare("DELETE FROM service_materials WHERE service_id=?").run(serviceId);
    for (const r of rows)
      this.db.prepare("INSERT INTO service_materials VALUES(?,?,?)").run(serviceId, r.material, r.quantity);
  },
  // When a visit is completed, the materials of its service leave the stock (per person for group visits).
  consumeMaterials(appointmentId) {
    const visit = this.db.prepare("SELECT id,service_id,people_count,start FROM appointments WHERE id=?").get(appointmentId);
    if (!visit || this.db.prepare("SELECT 1 FROM material_moves WHERE appointment_id=? AND kind='use'").get(visit.id)) return;
    for (const m of this.db
      .prepare("SELECT sm.material_id,sm.quantity,m.unit_cost FROM service_materials sm JOIN materials m ON m.id=sm.material_id WHERE sm.service_id=? AND m.archived=0")
      .all(visit.service_id)) {
      const used = Math.round(m.quantity * (visit.people_count || 1) * 1000) / 1000;
      this.db
        .prepare("INSERT INTO material_moves VALUES(?,?,?,?,?,?,?,?)")
        .run(randomUUID(), m.material_id, -used, "use", visit.id, Math.round(used * m.unit_cost), Date.now(), "");
      this.db.prepare("UPDATE materials SET stock=round(stock-?,3) WHERE id=?").run(used, m.material_id);
    }
  },

  // Gift certificates and visit passes -------------------------------------
  sellCertificate(data) {
    const amount = amountOf(data.amount),
      price = data.price === undefined || data.price === "" ? amount : amountOf(data.price, { zero: true }),
      client = data.client_id ? id(data.client_id) : null;
    if (client && !this.db.prepare("SELECT id FROM clients WHERE id=?").get(client))
      fail("Клієнта не знайдено", "Client not found");
    const certificate = randomUUID();
    let code;
    do code = Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
    while (this.db.prepare("SELECT 1 FROM certificates WHERE code=?").get(code));
    this.db
      .prepare("INSERT INTO certificates(id,code,amount,balance,price,method,client_id,sold_at,expires,status,note) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
      .run(certificate, code, amount, amount, price, saleMethod(data.method), client, Date.now(), expiry(data.expires), "active", remark(data.note));
    this.audit("certificate.sold", certificate);
    return { id: certificate, code };
  },
  voidCertificate(data) {
    if (!this.db.prepare("UPDATE certificates SET status='void' WHERE id=? AND status='active'").run(id(data.id)).changes)
      fail("Сертифікат не знайдено", "Certificate not found");
    this.audit("certificate.void", data.id);
  },
  sellPass(data) {
    const client = id(data.client_id),
      service = id(data.service_id),
      visits = Number(data.visits);
    if (!this.db.prepare("SELECT id FROM clients WHERE id=?").get(client)) fail("Клієнта не знайдено", "Client not found");
    if (!this.db.prepare("SELECT id FROM services WHERE id=? AND archived=0").get(service)) fail("Послугу не знайдено", "Service not found");
    if (!Number.isInteger(visits) || visits < 1 || visits > 500) fail("Кількість візитів від 1 до 500", "Visits must be 1 to 500");
    const pass = randomUUID();
    this.db
      .prepare("INSERT INTO passes(id,client_id,service_id,visits,used,price,method,sold_at,expires,status,note) VALUES(?,?,?,?,0,?,?,?,?,?,?)")
      .run(pass, client, service, visits, amountOf(data.price, { zero: true }), saleMethod(data.method), Date.now(), expiry(data.expires), "active", remark(data.note));
    this.audit("pass.sold", pass);
    return pass;
  },
  voidPass(data) {
    if (!this.db.prepare("UPDATE passes SET status='void' WHERE id=? AND status='active'").run(id(data.id)).changes)
      fail("Абонемент не знайдено", "Pass not found");
    this.audit("pass.void", data.id);
  },
  // Called by payment() inside its transaction. A certificate pays any part of a visit up to its balance;
  // a pass covers one whole visit of its service for its holder. Refunds put the value back.
  applyVoucher(method, voucherId, value, appointment, due) {
    const now = Date.now();
    if (method === "certificate") {
      const c = this.db.prepare("SELECT * FROM certificates WHERE id=? OR code=?").get(id(voucherId), String(voucherId).toUpperCase());
      if (!c || c.status !== "active") fail("Сертифікат недійсний", "The certificate is not valid");
      if (value > 0) {
        if (c.expires && c.expires <= now) fail("Термін дії сертифіката минув", "The certificate has expired");
        if (value > c.balance) fail(`На сертифікаті лише ${(c.balance / 100).toFixed(2)}`, `The certificate only has ${(c.balance / 100).toFixed(2)} left`);
      } else if (c.balance - value > c.amount) fail("Повернення більше за номінал сертифіката", "The refund exceeds the certificate value");
      this.db.prepare("UPDATE certificates SET balance=balance-? WHERE id=?").run(value, c.id);
      return c.id;
    }
    const p = this.db.prepare("SELECT * FROM passes WHERE id=?").get(id(voucherId));
    if (!p || p.status !== "active") fail("Абонемент недійсний", "The pass is not valid");
    if (value > 0) {
      if (p.expires && p.expires <= now) fail("Термін дії абонемента минув", "The pass has expired");
      if (p.used >= p.visits) fail("Візити в абонементі закінчились", "The pass has no visits left");
      if (p.service_id !== appointment.service_id) fail("Абонемент на іншу послугу", "The pass is for another service");
      if (!this.db.prepare("SELECT 1 FROM appointment_clients WHERE appointment_id=? AND client_id=?").get(appointment.id, p.client_id) && appointment.client_id !== p.client_id)
        fail("Абонемент належить іншому клієнту", "The pass belongs to another client");
      if (value !== due || appointment.paid !== 0)
        fail("Абонемент оплачує лише візит без інших оплат, повністю", "A pass pays for a whole visit that has no other payments");
      this.db.prepare("UPDATE passes SET used=used+1 WHERE id=?").run(p.id);
    } else {
      if (p.used < 1) fail("Цей абонемент не використовувався", "This pass has not been used");
      this.db.prepare("UPDATE passes SET used=used-1 WHERE id=?").run(p.id);
    }
    return p.id;
  },

  // Specialists' pay ---------------------------------------------------------
  setPay(table, rowId, data) {
    if (table === "resources") {
      if (data.pay_percent === undefined && data.pay_daily === undefined) return;
      this.db.prepare("UPDATE resources SET pay_percent=?,pay_daily=? WHERE id=?").run(percent(data.pay_percent), amountOf(data.pay_daily || 0, { zero: true }), rowId);
    } else if (data.pay_percent !== undefined)
      this.db.prepare("UPDATE services SET pay_percent=? WHERE id=?").run(data.pay_percent === null || data.pay_percent === "" ? null : percent(data.pay_percent), rowId);
  },
  // For each specialist: completed visits in the period, what clients paid for them (certificates and passes
  // included), the share of it, working days times the daily rate, and salary already paid out.
  payroll(from, to) {
    from = Number(from);
    to = Number(to);
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to <= from || to - from > 400 * 86400000)
      fail("Невірний період", "Invalid period");
    const visits = this.db
      .prepare(
        "SELECT a.id,a.resource_id,a.start,COALESCE(s.pay_percent,r.pay_percent) share,COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=a.id),0) paid FROM appointments a JOIN services s ON s.id=a.service_id JOIN resources r ON r.id=a.resource_id WHERE a.status='completed' AND a.start>=? AND a.start<?",
      )
      .all(from, to);
    const paidOut = new Map(
      this.db
        .prepare("SELECT resource_id id,sum(amount) total FROM expenses WHERE category='salary' AND resource_id IS NOT NULL AND at>=? AND at<? GROUP BY resource_id")
        .all(from, to)
        .map((r) => [r.id, r.total]),
    );
    return this.db
      .prepare("SELECT id,name,pay_percent,pay_daily,archived FROM resources ORDER BY name")
      .all()
      .map((r) => {
        const mine = visits.filter((v) => v.resource_id === r.id),
          base = mine.reduce((s, v) => s + Math.max(0, v.paid), 0),
          commission = Math.round(mine.reduce((s, v) => s + (Math.max(0, v.paid) * (v.share || 0)) / 100, 0)),
          days = new Set(mine.map((v) => this.businessDay(v.start))).size,
          daily = days * r.pay_daily,
          paid = paidOut.get(r.id) || 0;
        return { resource_id: r.id, name: r.name, archived: Boolean(r.archived), percent: r.pay_percent, daily_rate: r.pay_daily, visits: mine.length, base, commission, days, daily, total: commission + daily, paid_out: paid, balance: commission + daily - paid };
      })
      .filter((r) => !r.archived || r.visits || r.paid_out);
  },

  // What the app shows: expenses and sales from the window on, current stock and every active voucher.
  financeSnapshot(from) {
    return {
      expenses: this.db.prepare("SELECT * FROM expenses WHERE at>=? ORDER BY at DESC").all(from),
      materials: this.db.prepare("SELECT * FROM materials WHERE archived=0 ORDER BY name").all(),
      service_materials: this.db.prepare("SELECT sm.* FROM service_materials sm JOIN materials m ON m.id=sm.material_id WHERE m.archived=0").all(),
      certificates: this.db.prepare("SELECT * FROM certificates WHERE sold_at>=? OR (status='active' AND balance>0) ORDER BY sold_at DESC").all(from),
      passes: this.db.prepare("SELECT * FROM passes WHERE sold_at>=? OR (status='active' AND used<visits) ORDER BY sold_at DESC").all(from),
      fiscal_receipts: this.db.prepare("SELECT id,source,source_id,kind,amount,method,title,status,error,fiscal_code,is_test,url,created_at FROM fiscal_receipts ORDER BY created_at DESC LIMIT 50").all(),
    };
  },
  setDiscount(clientId, value) {
    if (value === undefined) return;
    const d = Number(value || 0);
    if (!Number.isInteger(d) || d < 0 || d > 100)
      fail("Знижка — ціле число від 0 до 100", "The discount is a whole number from 0 to 100");
    this.db.prepare("UPDATE clients SET discount=? WHERE id=?").run(d, clientId);
  },
  setDeposit(serviceId, data) {
    if (data.deposit === undefined || data.deposit === null) return;
    this.db.prepare("UPDATE services SET deposit=? WHERE id=?").run(amountOf(data.deposit || 0, { zero: true }), serviceId);
  },
  // An online booking of a service with a prepayment waits for it until `until`.
  requireDeposit(appointmentId, amount, until) {
    this.db.prepare("UPDATE appointments SET deposit=?,deposit_until=? WHERE id=? AND status='confirmed'").run(amount, until, appointmentId);
  },
  // Payments reaching the prepayment end the wait.
  depositSettled(appointmentId) {
    this.db
      .prepare("UPDATE appointments SET deposit_until=NULL WHERE id=? AND deposit_until IS NOT NULL AND COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=appointments.id),0)>=deposit")
      .run(appointmentId);
  },
  // Confirmed visits whose prepayment time ran out unpaid; the caller cancels them.
  expiredDeposits(now = Date.now()) {
    return this.db
      .prepare("SELECT id FROM appointments WHERE status='confirmed' AND deposit_until IS NOT NULL AND deposit_until<? AND COALESCE((SELECT sum(amount) FROM payments WHERE appointment_id=appointments.id),0)<deposit")
      .all(now)
      .map((r) => r.id);
  },
  // Discount of the client who books, applied to the list price of a new visit.
  discounted(price, clientId) {
    const d = this.db.prepare("SELECT discount FROM clients WHERE id=?").get(clientId)?.discount || 0;
    return d ? Math.round((price * (100 - d)) / 100) : price;
  },
};

module.exports = { finance, EXPENSE_CATEGORIES, SALE_METHODS, UNITS };
