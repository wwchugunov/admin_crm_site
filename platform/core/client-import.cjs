"use strict";
const { randomUUID, randomBytes } = require("node:crypto");
// Clients brought over from a spreadsheet or another program. Rows already parsed by the app arrive here;
// a phone that matches an existing client (last 9 digits) or an earlier row is skipped, so importing twice is safe.
const MAX_ROWS = 3000;
const digits = (v) => String(v || "").replace(/\D/g, "");
// 31.12.1990, 31/12/1990, 1990-12-31 → 1990-12-31; anything else is dropped rather than refusing the row.
function birthday(value) {
  const v = String(value || "").trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  let y, mo, d;
  if (m) [, y, mo, d] = m;
  else if ((m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(v))) [, d, mo, y] = m;
  else return "";
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    date = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return "";
  return iso >= "1900-01-01" && iso <= new Date().toISOString().slice(0, 10) ? iso : "";
}
const clientImport = {
  importClients(rows) {
    if (!Array.isArray(rows) || !rows.length) throw Error("Немає рядків для імпорту / No rows to import");
    if (rows.length > MAX_ROWS) throw Error(`За один раз — до ${MAX_ROWS} клієнтів / Up to ${MAX_ROWS} clients at a time`);
    const known = new Set(
      this.db
        .prepare("SELECT phone FROM clients")
        .all()
        .map((c) => digits(c.phone))
        .filter((p) => p.length >= 7)
        .map((p) => p.slice(-9)),
    );
    const result = { added: 0, duplicates: 0, skipped: 0 };
    const insert = this.db.prepare(
      "INSERT INTO clients(id,name,phone,notes,link_code,birthday,email,source,alert,tags,vehicle,plate) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
    );
    this.transaction(() => {
      for (const raw of rows) {
        const phoneDigits = digits(raw?.phone),
          name = String(raw?.name || "").trim().slice(0, 120) || (phoneDigits ? String(raw.phone).trim().slice(0, 40) : "");
        if (!name || (phoneDigits && (phoneDigits.length < 7 || phoneDigits.length > 15))) {
          result.skipped++;
          continue;
        }
        const tail = phoneDigits.slice(-9);
        if (phoneDigits && known.has(tail)) {
          result.duplicates++;
          continue;
        }
        if (phoneDigits) known.add(tail);
        const email = String(raw.email || "").trim();
        insert.run(
          randomUUID(),
          name,
          phoneDigits ? (String(raw.phone).trim().startsWith("+") ? "+" : phoneDigits.startsWith("380") ? "+" : "") + phoneDigits : "",
          String(raw.notes || "").slice(0, 2000),
          randomBytes(24).toString("base64url"),
          birthday(raw.birthday),
          email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "",
          "",
          "",
          String(raw.tags || "").slice(0, 200),
          String(raw.vehicle || "").slice(0, 80),
          String(raw.plate || "").slice(0, 20),
        );
        result.added++;
      }
      this.audit("clients.imported", String(result.added));
    });
    return result;
  },
};
module.exports = { clientImport, MAX_ROWS };
