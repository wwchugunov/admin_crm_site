#!/usr/bin/env node
// Builds the LOMVIKO sales presentation (16:9 PDF, Ukrainian and English) with a local Chrome.
//   node 33marketing/presentation/build.cjs [uk|en]
// Env: CHROME_PATH (default: macOS Google Chrome), PLAYWRIGHT_CORE (module path), OUT_DIR (default: .runtime/presentation),
//      CONTACT_EMAIL (optional, shown on the last slide), PREVIEW=1 (also writes a PNG per slide).
// Upload the resulting PDF in the website admin → Documents → LOMVIKO presentation.
'use strict';
const fs = require('node:fs'), path = require('node:path'), { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..', '..');
const content = require('./content.cjs');
const out = path.resolve(process.env.OUT_DIR || path.join(root, '.runtime', 'presentation'));
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const contactEmail = (process.env.CONTACT_EMAIL || '').trim();
const fonts = path.join(root, 'ch_landing', 'public', 'fonts');
const screenshot = path.join(__dirname, 'assets', 'app.png');
const TOTAL = 15;

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const url = (file) => pathToFileURL(file).href;
const icons = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  send: '<path d="m21 4-18 7 6 2m12-9-3 16-9-7m12-9-12 9v6l3-4"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zm4 4h4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7m5.5 8.5a6.5 6.5 0 0 0-4-6"/>',
  chart: '<path d="M3 20h18M6 16v-5m5 5V7m5 9v-3m4 3V5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9m-4 4 3 3"/>',
  download: '<path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const icon = (name) => `<span class="icon">${svg(name)}</span>`;
const heading = ([plain, accent], tag = 'h2') => `<${tag}>${esc(plain)} <em>${esc(accent)}</em></${tag}>`;
const points = (list) => `<ul class="points">${list.map((p) => `<li>${svg('check')}<span>${esc(p)}</span></li>`).join('')}</ul>`;
const two = (n) => String(n).padStart(2, '0');

function slide(c, index, body, extra = '') {
  const footer = index === 1 ? '' : `<div class="footer"><span class="wordmark">LOMVIKO</span><span>${esc(c.footer)} · ${two(index)} / ${TOTAL}</span></div>`;
  return `<section class="slide ${extra}">${body}${footer}</section>`;
}

function board(b) {
  const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
  // [column, startRow, span, tone, booking index]
  const layout = [[1, 1, 2, 'gold', 0], [1, 4, 1, 'blue', 1], [2, 2, 2, 'violet', 2], [2, 5, 2, 'rose', 3], [3, 1, 1, 'blue', 4], [3, 3, 2, 'gold', 5], [4, 2, 1, 'violet', 6], [4, 4, 3, 'rose', 7]];
  const hours = (start, span) => `${times[start - 1]} — ${String(9 + start - 1 + span).padStart(2, '0')}:00`;
  return `<div class="board"><div class="board-bar"><span class="dots"><i></i><i></i><i></i></span><span class="title">${esc(b.title)}</span><span class="live">● LIVE</span></div><div class="board-grid">
    ${b.members.map((m, i) => `<span class="board-head" style="grid-column:${i + 2}">${esc(m)}</span>`).join('')}
    ${times.map((tm, i) => `<span class="board-time" style="grid-row:${i + 2}">${tm}</span><span class="board-line" style="grid-row:${i + 2}"></span>`).join('')}
    ${layout.map(([col, row, span, tone, k]) => `<div class="bk t-${tone}${k === 5 ? ' new' : ''}" style="grid-column:${col + 1};grid-row:${row + 1} / span ${span}"><span>${hours(row, span)}</span><strong>${esc(b.bookings[k][0])}</strong>${span > 0 ? `<small>${esc(b.bookings[k][1])}</small>` : ''}</div>`).join('')}
  </div></div>`;
}

function phone(chat) {
  const initial = chat.name.replace(/[^\p{L}]/gu, '').slice(0, 1);
  return `<div class="phone-wrap"><div class="phone"><div class="screen"><div class="chat-head"><span class="avatar">${esc(initial)}</span><div><strong>${esc(chat.name)}</strong><small>${esc(chat.status)}</small></div></div><div class="chat">${chat.messages.map((m) => m[0] === 'slots' ? `<div class="slots">${m.slice(1).map((s, i) => `<span class="${i === 1 ? 'on' : ''}">${esc(s)}</span>`).join('')}</div>` : `<div class="msg ${m[0]}">${esc(m[1])}</div>`).join('')}</div></div></div></div>`;
}

function slides(c) {
  const s = [];
  s.push(slide(c, 1, `<div><span class="wordmark">LOMVIKO</span>${heading(c.cover.title, 'h1')}<p class="lead">${esc(c.cover.body)}</p></div><div class="cover-foot"><span>${esc(c.cover.note)}</span><span class="gold">lomviko.com</span></div><div class="ghost">LOMVIKO</div><div class="glow-blue"></div>`, 'cover'));
  s.push(slide(c, 2, `${heading(c.problem.title)}<div class="problem-grid">${c.problem.items.map(([t, p], i) => `<div class="card"><span class="num">${two(i + 1)}</span><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>`));
  s.push(slide(c, 3, `<div class="split"><div>${heading(c.cost.title)}<p class="lead">${esc(c.cost.body)}</p><p class="note">${esc(c.cost.note)}</p></div><div class="card cost-card"><div class="cost-inputs">${c.cost.inputs.map(([l, v]) => `<div><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join('')}</div><div class="cost-result"><span>${esc(c.cost.loss)}</span><strong class="cost-big">${esc(c.cost.lossValue)}</strong><div class="cost-missed">${esc(c.cost.missed)}</div><div class="cost-back"><span>${esc(c.cost.back)}</span><strong>${esc(c.cost.backValue)}</strong><small>${esc(c.cost.year)}</small></div></div></div></div><div class="glow-blue"></div>`));
  s.push(slide(c, 4, `${heading(c.solution.title)}<div class="tiles six">${c.solution.items.map(([ic, t, p]) => `<div class="card">${icon(ic)}<h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>`));
  s.push(slide(c, 5, `${heading(c.flow.title)}<div class="flow">${c.flow.steps.map(([t, p], i) => `<div class="flow-step"><div class="flow-dot"><span class="num">${i + 1}</span></div><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div><div class="glow-blue"></div>`));
  s.push(slide(c, 6, `<div class="split"><div>${heading(c.schedule.title)}${points(c.schedule.points)}</div>${board(c.schedule.board)}</div>`));
  s.push(slide(c, 7, `<div class="split"><div>${heading(c.bot.title)}${points(c.bot.points)}</div>${phone(c.bot.chat)}</div><div class="glow-blue"></div>`));
  s.push(slide(c, 8, `<div class="split"><div>${heading(c.reminders.title)}<p class="lead">${esc(c.reminders.body)}</p><div style="margin-top:60px"><div class="reminder-big">${esc(c.reminders.big)}</div><div class="reminder-note">${esc(c.reminders.bigNote)}</div></div></div><div class="toasts">${c.reminders.cards.map(([t, p]) => `<div class="toast">${icon('bell')}<div><strong>${esc(t)}</strong><p>${esc(p)}</p></div></div>`).join('')}</div></div>`));
  const k = c.clients.card;
  s.push(slide(c, 9, `<div class="split"><div>${heading(c.clients.title)}${points(c.clients.points)}</div><div class="card client"><div class="client-top"><span class="avatar">${esc(k.name.slice(0, 1))}</span><div><h3>${esc(k.name)}</h3><p>${esc(k.phone)}</p></div><span class="client-tag">${esc(k.telegram)}</span></div><div class="client-rows"><div><span>${esc(k.visits)}</span><strong>${esc(k.visitsValue)}</strong></div><div><span>${esc(k.next)}</span><strong>${esc(k.nextValue)}</strong></div><div class="wide"><span>${esc(k.notes)}</span><strong>${esc(k.notesValue)}</strong></div></div></div></div><div class="glow-blue"></div>`));
  const f = c.finance, heights = [40, 55, 48, 70, 92, 100, 35];
  s.push(slide(c, 10, `<div class="split"><div>${heading(f.title)}${points(f.points)}</div><div><div class="kpis">${f.kpis.map(([l, v]) => `<div class="kpi"><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join('')}</div><div class="card chart"><div class="chart-head"><span>${esc(f.kpis[0][0])}</span><span class="gold">${esc(f.delta)}</span></div><div class="bars">${heights.map((h, i) => `<i class="${i === 5 ? 'top' : ''}" style="height:${h}%"></i>`).join('')}</div><div class="bar-labels">${f.days.map((d) => `<span>${esc(d)}</span>`).join('')}</div></div></div></div>`));
  s.push(slide(c, 11, `${heading(c.team.title)}<div class="tiles">${c.team.items.map(([ic, t, p]) => `<div class="card" style="min-height:420px">${icon(ic)}<h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div><div class="glow-blue"></div>`));
  s.push(slide(c, 12, `${heading(c.security.title)}<p class="lead">${esc(c.security.body)}</p><div class="tiles four" style="margin-top:70px">${c.security.items.map(([ic, t, p]) => `<div class="card">${icon(ic)}<h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>`));
  s.push(slide(c, 13, `${heading(c.audience.title)}<div class="segments">${c.audience.segments.map(([t, list], i) => `<div class="card"><span class="num">${two(i + 1)}</span><h3>${esc(t)}</h3><div class="chips">${list.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>`).join('')}</div><div class="glow-blue"></div>`));
  s.push(slide(c, 14, `<div class="product-row">${heading(c.product.title)}<div class="chips">${c.product.chips.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div><div class="frame"><div class="frame-bar"><span class="dots"><i></i><i></i><i></i></span><span>LOMVIKO</span><span></span></div><img src="${url(screenshot)}" alt=""></div><p class="caption">${esc(c.product.caption)}</p>`, 'product'));
  const contact = [[c.start.contact, 'lomviko.com'], ...(contactEmail ? [['Email', contactEmail]] : [])];
  s.push(slide(c, 15, `${heading(c.start.title)}<div class="start-steps">${c.start.steps.map(([t, p], i) => `<div class="card"><span class="num">${two(i + 1)}</span><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div><div class="contact">${contact.map(([l, v]) => `<div><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join('')}</div><div class="ghost">${esc(c.start.word)}</div>`, 'start'));
  if (s.length !== TOTAL) throw Error(`Expected ${TOTAL} slides, built ${s.length}`);
  return s.join('\n');
}

function fontFaces() {
  const cyr = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116', lat = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const face = (family, file, range, extra) => `@font-face{font-family:${family};src:url("${url(path.join(fonts, file))}") format("woff2");unicode-range:${range};${extra}}`;
  return [
    face('Onest', 'onest-cyrillic-wght-normal.woff2', cyr, 'font-weight:100 900'), face('Onest', 'onest-latin-wght-normal.woff2', lat, 'font-weight:100 900'),
    face("'Cormorant Garamond'", 'cormorant-garamond-cyrillic-500-italic.woff2', cyr, 'font-style:italic;font-weight:500'), face("'Cormorant Garamond'", 'cormorant-garamond-latin-500-italic.woff2', lat, 'font-style:italic;font-weight:500'),
    face("'JetBrains Mono'", 'jetbrains-mono-cyrillic-400-normal.woff2', cyr, 'font-weight:400'), face("'JetBrains Mono'", 'jetbrains-mono-latin-400-normal.woff2', lat, 'font-weight:400'),
    face("'JetBrains Mono'", 'jetbrains-mono-cyrillic-500-normal.woff2', cyr, 'font-weight:500'), face("'JetBrains Mono'", 'jetbrains-mono-latin-500-normal.woff2', lat, 'font-weight:500'),
  ].join('\n');
}

function document(c) {
  return `<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8"><title>${esc(c.docTitle)}</title><style>${fontFaces()}</style><link rel="stylesheet" href="${url(path.join(__dirname, 'presentation.css'))}"></head><body>${slides(c)}</body></html>`;
}

(async () => {
  // playwright-core is a build-time tool only; it is not a dependency of the deployed services.
  let playwright;
  try { playwright = require.resolve(process.env.PLAYWRIGHT_CORE || 'playwright-core', { paths: [root] }); }
  catch { throw Error('playwright-core not found. Run "npm i --no-save playwright-core" in this repository or set PLAYWRIGHT_CORE.'); }
  const { chromium } = require(playwright);
  if (!fs.existsSync(screenshot)) throw Error(`App screenshot not found: ${screenshot}`);
  fs.mkdirSync(out, { recursive: true });
  const languages = process.argv[2] ? [process.argv[2]] : ['uk', 'en'];
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    for (const lang of languages) {
      const c = content[lang]; if (!c) throw Error(`Unknown language: ${lang}`);
      const htmlFile = path.join(out, `presentation-${lang}.html`);
      fs.writeFileSync(htmlFile, document(c));
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      await page.goto(url(htmlFile), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const target = path.join(out, c.file);
      await page.pdf({ path: target, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
      if (process.env.PREVIEW) {
        const slidesOnPage = await page.$$('.slide');
        for (const [i, el] of slidesOnPage.entries()) await el.screenshot({ path: path.join(out, `preview-${lang}-${two(i + 1)}.png`) });
      }
      await page.close();
      console.log(`${target} (${(fs.statSync(target).size / 1048576).toFixed(1)} MB)`);
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error.message); process.exit(1); });
