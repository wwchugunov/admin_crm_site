#!/usr/bin/env node
// Renders the legal documents to PDF (A4, local Chrome) and DOCX (macOS textutil).
// Requisites and terms live in requisites.json: {{executor.name}}, {{terms.trial_days}} … in the HTML
// are filled from it; an empty value is highlighted yellow so nothing unfinished goes unnoticed.
//   node marketing/legal/build.cjs
// Env: CHROME_PATH, PLAYWRIGHT_CORE, OUT_DIR (default: .runtime/legal).
// After review, upload the final files in the admins → Documents.
'use strict';
const fs = require('node:fs'), path = require('node:path'), { pathToFileURL } = require('node:url'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..', '..');
const out = path.resolve(process.env.OUT_DIR || path.join(root, '.runtime', 'legal'));
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const fonts = path.join(root, 'ch_landing', 'public', 'fonts');
const documents = [
  ['privacy-site.uk.html', 'LOMVIKO-privacy-site-uk'],
  ['privacy-app.uk.html', 'LOMVIKO-privacy-app-uk'],
  ['offer.uk.html', 'LOMVIKO-offer-uk'],
];
const face = (file, range) => `@font-face{font-family:Onest;font-weight:100 900;src:url("${pathToFileURL(path.join(fonts, file)).href}") format("woff2");unicode-range:${range}}`;
const values = JSON.parse(fs.readFileSync(path.join(__dirname, 'requisites.json'), 'utf8'));
const labels = { 'executor.name': 'ПІБ ФОП / назва юрособи', 'executor.code': 'РНОКПП / код ЄДРПОУ', 'executor.address': 'адреса', 'executor.iban': 'IBAN', 'executor.bank': 'банк', 'executor.tax': 'податковий статус', 'executor.phone': 'телефон', edition: 'дата редакції', mail_provider: 'поштовий провайдер', hosting: 'хостинг-провайдер' };
const escapeHtml = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function render(html) {
  html = html.replace(/\{\{([a-z_.]+)\}\}/g, (_, key) => {
    const value = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), values);
    return value === undefined || value === null || value === '' ? `<span class="fill">[${labels[key] || key}]</span>` : escapeHtml(value);
  });
  return values.draft ? html : html.replace(/<div class="draft">[\s\S]*?<\/div>\n?/, '');
}
const fontCss = face('onest-cyrillic-wght-normal.woff2', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116') + face('onest-latin-wght-normal.woff2', 'U+0000-00FF,U+2000-206F,U+20AC,U+2116');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  let playwright;
  try { playwright = require.resolve(process.env.PLAYWRIGHT_CORE || 'playwright-core', { paths: [root] }); }
  catch { throw Error('playwright-core not found. Run "npm i --no-save playwright-core" in this repository or set PLAYWRIGHT_CORE.'); }
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    for (const [source, name] of documents) {
      // Rendered copy next to document.css so the stylesheet link keeps working.
      const file = path.join(__dirname, `.rendered-${source}`);
      fs.writeFileSync(file, render(fs.readFileSync(path.join(__dirname, source), 'utf8')));
      const page = await browser.newPage();
      await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
      await page.addStyleTag({ content: fontCss });
      await page.evaluate(() => document.fonts.ready);
      await page.pdf({ path: path.join(out, `${name}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;font:8px Arial,sans-serif;color:#8a8d95;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
      await page.close();
      // Word copy for editing; textutil ships with macOS.
      if (process.platform === 'darwin') execFileSync('textutil', ['-convert', 'docx', '-output', path.join(out, `${name}.docx`), file]);
      fs.copyFileSync(file, path.join(out, `${name}.html`));
      fs.rmSync(file, { force: true });
      console.log(path.join(out, name) + '.{pdf' + (process.platform === 'darwin' ? ',docx}' : '}'));
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error.message); process.exit(1); });
