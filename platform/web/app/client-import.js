"use strict";
// Bringing clients over from Excel, Google Sheets or another program: a CSV file or rows pasted from a table.
// Columns are recognised by their headers and can be corrected; duplicates by phone are skipped on the server.
Object.assign(OrbitI18n.messages, {
  importButton: { uk: "Імпорт", en: "Import" },
  importTitle: { uk: "Імпорт клієнтів", en: "Import clients" },
  importHow: { uk: "Збережіть таблицю як CSV (Excel: «Файл → Зберегти як → CSV») і виберіть файл — або просто скопіюйте рядки з Excel чи Google Таблиць і вставте нижче. Перший рядок — назви колонок.", en: "Save the table as CSV (Excel: File → Save as → CSV) and choose the file — or just copy rows from Excel or Google Sheets and paste them below. The first row holds column names." },
  importFile: { uk: "Файл CSV", en: "CSV file" },
  importPaste: { uk: "Або вставте рядки з таблиці", en: "Or paste rows from a table" },
  importColumns: { uk: "Що в якій колонці", en: "What each column holds" },
  importIgnore: { uk: "— не імпортувати —", en: "— do not import —" },
  importPreview: { uk: "Буде оброблено рядків: {count}. Клієнти з телефоном, який уже є в базі, пропускаються.", en: "Rows to process: {count}. Clients whose phone is already in the base are skipped." },
  importRun: { uk: "Імпортувати", en: "Import" },
  importDone: { uk: "Додано: {added}. Уже були в базі: {duplicates}. Пропущено без імені чи з неправильним телефоном: {skipped}.", en: "Added: {added}. Already in the base: {duplicates}. Skipped without a name or with a wrong phone: {skipped}." },
  importEmpty: { uk: "Немає рядків для імпорту — додайте файл або вставте таблицю", en: "No rows to import — add a file or paste a table" },
  importNeedName: { uk: "Позначте колонку з ім’ям або телефоном", en: "Mark the column with the name or phone" },
  col_name: { uk: "Ім’я", en: "Name" },
  col_phone: { uk: "Телефон", en: "Phone" },
  col_email: { uk: "Email", en: "Email" },
  col_birthday: { uk: "Дата народження", en: "Date of birth" },
  col_notes: { uk: "Нотатки", en: "Notes" },
  col_tags: { uk: "Мітки", en: "Tags" },
  col_vehicle: { uk: "Авто / тварина", en: "Vehicle / pet" },
  col_plate: { uk: "Номер авто", en: "Plate" },
});
const IMPORT_FIELDS = ["name", "phone", "email", "birthday", "notes", "tags", "vehicle", "plate"];
// Header words people actually use, in Ukrainian, Russian and English.
const IMPORT_GUESS = {
  name: /^(ім.?я|имя|піб|фіо|name|клієнт|клиент|client|full ?name|прізвище)/i,
  phone: /(телефон|тел\.?|phone|mobile|моб)/i,
  email: /(e-?mail|пошта|почта)/i,
  birthday: /(народж|рожд|birth|д\.?\s?р)/i,
  notes: /(нотат|комент|примітк|примеч|note|comment)/i,
  tags: /(мітк|тег|tag|категор)/i,
  vehicle: /(авто|машин|car|vehicle|тварин|pet)/i,
  plate: /(номер авто|держ|plate|госномер)/i,
};
// A small CSV/TSV reader: quotes, doubled quotes, commas, semicolons (Ukrainian Excel) or tabs (pasted cells).
function parseTable(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "",
    delimiter = ["\t", ";", ","].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && !cell) quoted = true;
    else if (ch === delimiter) row.push(cell.trim()), (cell = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      (row = []), (cell = "");
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
function importModal() {
  let table = [];
  modal(
    OrbitI18n.t("importTitle"),
    `<p class="hint">${OrbitI18n.t("importHow")}</p><label for="field-import-file">${OrbitI18n.t("importFile")}</label><input id="field-import-file" type="file" accept=".csv,.txt,text/csv,text/plain"><label for="field-import-paste">${OrbitI18n.t("importPaste")}</label><textarea id="field-import-paste" rows="4" spellcheck="false"></textarea><div id="import-columns"></div><p class="hint" id="import-preview" role="status"></p>`,
    async () => {
      const map = Array.from(document.querySelectorAll("#import-columns select"), (s) => s.value);
      if (!table.length || table.length < 2) throw Error(OrbitI18n.t("importEmpty"));
      if (!map.includes("name") && !map.includes("phone")) throw Error(OrbitI18n.t("importNeedName"));
      const rows = table.slice(1).map((r) => Object.fromEntries(map.map((field, i) => [field, r[i] || ""]).filter(([field]) => field)));
      const total = { added: 0, duplicates: 0, skipped: 0 };
      for (let i = 0; i < rows.length; i += 1000) {
        const part = await window.orbit.call("client:import", { rows: rows.slice(i, i + 1000) });
        for (const k of Object.keys(total)) total[k] += part[k];
      }
      toast(OrbitI18n.t("importDone").replace("{added}", total.added).replace("{duplicates}", total.duplicates).replace("{skipped}", total.skipped));
    },
    OrbitI18n.t("importRun"),
  );
  const show = (text) => {
    table = parseTable(text);
    const head = table[0] || [];
    $("#import-columns").innerHTML = head.length
      ? `<h3 class="form-section">${OrbitI18n.t("importColumns")}</h3><div class="import-columns">${head
          .map((h, i) => {
            const guess = IMPORT_FIELDS.find((f) => IMPORT_GUESS[f].test(h)) || "";
            return `<label class="import-column"><span>${escape(h || `#${i + 1}`)}<small>${escape(table[1]?.[i] || "")}</small></span><select aria-label="${escape(h)}"><option value="">${OrbitI18n.t("importIgnore")}</option>${IMPORT_FIELDS.map((f) => `<option value="${f}" ${f === guess ? "selected" : ""}>${OrbitI18n.t("col_" + f)}</option>`).join("")}</select></label>`;
          })
          .join("")}</div>`
      : "";
    $("#import-preview").textContent = table.length > 1 ? OrbitI18n.t("importPreview").replace("{count}", table.length - 1) : "";
  };
  $("#field-import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Excel often saves CSV in Windows-1251; fall back to it when the file is not valid UTF-8.
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      text = new TextDecoder("windows-1251").decode(bytes);
    }
    $("#field-import-paste").value = "";
    show(text.replace(/^﻿/, ""));
  });
  $("#field-import-paste").addEventListener("input", (e) => show(e.target.value));
}
Object.assign(actions, { "client-import": importModal });
