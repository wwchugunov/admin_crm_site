'use strict';
// A small writer of real Excel workbooks (.xlsx): several sheets, a bold header row with filters,
// frozen header, column widths, and typed cells (text, whole numbers, money, percent, dates), so
// Excel, Google Sheets and LibreOffice sort and filter them as numbers and dates. No dependencies:
// the file is a ZIP of XML parts, written with node:zlib.
const zlib = require('node:zlib');

const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const column = (i) => { let s = ''; for (i++; i; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };
// Style ids in styles.xml below.
const STYLE = { text: 0, header: 1, money: 2, percent: 3, date: 4, int: 5, label: 6, title: 7, hours: 8 };
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function cell(ref, value, type) {
  if (value === null || value === undefined || value === '') return '';
  if (type === 'date') {
    const days = (Date.parse(value + 'T00:00:00Z') - EXCEL_EPOCH) / 86400000;
    return `<c r="${ref}" s="${STYLE.date}"><v>${days}</v></c>`;
  }
  if (['money', 'percent', 'int', 'hours'].includes(type) && Number.isFinite(value))
    return `<c r="${ref}" s="${STYLE[type]}"><v>${value}</v></c>`;
  // Text: a leading = + - @ stays text, never a formula.
  return `<c r="${ref}" t="inlineStr" s="${STYLE[type] || 0}"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

// sheet: {name, columns:[{title, type, width}], rows:[[...]], table:true|false, intro:[[label, value, type]]}
function sheetXml(sheet) {
  const rows = [];
  let r = 1;
  for (const [label, value, type] of sheet.intro || []) {
    rows.push(`<row r="${r}">${cell('A' + r, label, label && value === undefined ? 'title' : 'label')}${cell('B' + r, value, type)}</row>`);
    r++;
  }
  if (sheet.intro?.length && sheet.columns.length) r++;
  const head = r;
  if (sheet.columns.length) {
    rows.push(`<row r="${r}">${sheet.columns.map((c, i) => cell(column(i) + r, c.title, 'header')).join('')}</row>`);
    r++;
    for (const values of sheet.rows) {
      rows.push(`<row r="${r}">${values.map((v, i) => cell(column(i) + r, v, sheet.columns[i].type)).join('')}</row>`);
      r++;
    }
  }
  const last = column(Math.max(sheet.columns.length, 2) - 1);
  const widths = (sheet.columns.length ? sheet.columns : [{ width: 34 }, { width: 22 }]).map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 16}" customWidth="1"/>`).join('');
  const freeze = sheet.table && sheet.columns.length ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${head}" topLeftCell="A${head + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
  const filter = sheet.table && sheet.columns.length ? `<autoFilter ref="A${head}:${last}${Math.max(head, r - 1)}"/>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${freeze}<cols>${widths}</cols><sheetData>${rows.join('')}</sheetData>${filter}</worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="dd.mm.yyyy"/></numFmts>
<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE9F4EE"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF9DB8A8"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="9">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment wrapText="1" vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function workbook(sheets) {
  const names = sheets.map((s) => s.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
  const files = [
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', STYLES],
    ...sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)]),
  ];
  return zip(files);
}

// ZIP (deflate) with a fixed timestamp-free header: enough for Office Open XML.
function zip(files) {
  const parts = [], central = [];
  let offset = 0;
  for (const [name, text] of files) {
    const data = Buffer.from(text, 'utf8'), packed = zlib.deflateRawSync(data), crc = zlib.crc32(data), nameBytes = Buffer.from(name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10); local.writeUInt16LE(0x21, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBytes.length, 26); local.writeUInt16LE(0, 28);
    parts.push(local, nameBytes, packed);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x0800, 8); entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(0, 12); entry.writeUInt16LE(0x21, 14); entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(packed.length, 20); entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28); entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += 30 + nameBytes.length + packed.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

// The company report as three sheets (see core/report.cjs for how each figure is counted).
function reportWorkbook(report) {
  const money = (v) => (v == null ? null : v / 100), d = (date) => date.split('-').reverse().join('.');
  const s = report.summary, cur = report.currency;
  const incomeLabel = report.model === 'payments' ? `Дохід за період, ${cur}` : `Розрахунковий дохід, ${cur}`;
  const summary = {
    name: 'Загальна статистика', columns: [], rows: [], table: false,
    intro: [
      [report.business],
      ['Період', `${d(report.first)} – ${d(report.last)}`],
      ['Сформовано', new Intl.DateTimeFormat('uk-UA', { timeZone: report.timezone, dateStyle: 'short', timeStyle: 'short' }).format(Date.now())],
      ['', ''],
      [incomeLabel, money(s.income), 'money'],
      ...(report.model === 'payments'
        ? [[`  отримано (оплати, продаж сертифікатів і абонементів), ${cur}`, money(s.received), 'money'], [`  повернення клієнтам, ${cur}`, money(s.refunds), 'money']]
        : [['  оплат за період не внесено: це вартість виконаних послуг', '']]),
      [`Вартість виконаних послуг, ${cur}`, money(s.estimated), 'money'],
      ['Записів за період', s.visits, 'int'],
      ['Виконано послуг', s.completed, 'int'],
      ['Скасовано записів', s.cancelled, 'int'],
      ['Клієнт не прийшов', s.no_show, 'int'],
      ['Ще заплановано', s.planned, 'int'],
      [`Середній чек, ${cur}`, money(s.average), 'money'],
      ['Спеціалістів із робочими годинами', s.working, 'int'],
      ['Спеціалістів, які виконали послуги', s.performed, 'int'],
      ['Середня завантаженість спеціалістів', s.load, 'percent'],
      ['', ''],
      ['Як рахується'],
      ['Дохід', report.model === 'payments' ? 'Отримані оплати за візити (крім списань із сертифікатів і абонементів) + продаж сертифікатів і абонементів − повернення.' : 'Оплат за період не внесено, тому показано вартість виконаних послуг. Скасовані й невиконані не враховуються.'],
      ['Середній чек', report.model === 'payments' ? 'Дохід / кількість оплачених візитів і проданих сертифікатів та абонементів.' : 'Розрахунковий дохід / кількість виконаних послуг.'],
      ['Завантаженість', 'Час виконаних послуг / доступний робочий час (власні години або години компанії, без перерв, вихідних і відсутностей). Групове заняття рахується один раз.'],
    ],
  };
  const staff = {
    name: 'Співробітники', table: true,
    columns: [
      { title: 'Спеціаліст', type: 'text', width: 28 }, { title: 'Виконано послуг', type: 'int', width: 16 },
      { title: 'Годин на виконаних послугах', type: 'hours', width: 18 }, { title: 'Доступних робочих годин', type: 'hours', width: 18 },
      { title: `Дохід, ${cur}`, type: 'money', width: 16 }, { title: 'Завантаженість', type: 'percent', width: 16 },
      { title: 'Скасовано записів', type: 'int', width: 16 }, { title: 'Не прийшли', type: 'int', width: 14 },
    ],
    rows: report.staff.map((p) => [p.name, p.done, Math.round(p.hours * 100) / 100, Math.round(p.available_hours * 100) / 100, money(p.money), p.load, p.cancelled, p.no_show]),
  };
  const visits = {
    name: 'Записи', table: true,
    columns: [
      { title: 'Дата', type: 'date', width: 12 }, { title: 'Час', type: 'text', width: 8 }, { title: 'Клієнт', type: 'text', width: 28 },
      { title: 'Телефон', type: 'text', width: 16 }, { title: 'Послуга', type: 'text', width: 26 }, { title: 'Спеціаліст', type: 'text', width: 24 },
      { title: 'Учасників', type: 'int', width: 11 }, { title: `Вартість, ${cur}`, type: 'money', width: 14 }, { title: `Оплачено, ${cur}`, type: 'money', width: 14 },
      { title: 'Статус', type: 'text', width: 14 },
    ],
    rows: report.visits.map((v) => [v.date, v.time, v.client, v.phone, v.service, v.specialist, v.people, money(v.price), money(v.paid), v.status]),
  };
  return workbook([summary, staff, visits]);
}

module.exports = { workbook, reportWorkbook, zip };
