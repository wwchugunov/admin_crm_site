#!/usr/bin/env node
// Renders the legal drafts to PDF (A4, local Chrome) and DOCX (macOS textutil) for lawyer review.
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
const fontCss = face('onest-cyrillic-wght-normal.woff2', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116') + face('onest-latin-wght-normal.woff2', 'U+0000-00FF,U+2000-206F,U+20AC,U+2116');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  let playwright;
  try { playwright = require.resolve(process.env.PLAYWRIGHT_CORE || 'playwright-core', { paths: [root, path.join(root, '..', 'app_crm')] }); }
  catch { throw Error('playwright-core not found. Run "npm i --no-save playwright-core" in this repository or set PLAYWRIGHT_CORE.'); }
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    for (const [source, name] of documents) {
      const file = path.join(__dirname, source);
      const page = await browser.newPage();
      await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
      await page.addStyleTag({ content: fontCss });
      await page.evaluate(() => document.fonts.ready);
      await page.pdf({ path: path.join(out, `${name}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;font:8px Arial,sans-serif;color:#8a8d95;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
      await page.close();
      // Word copy for editing; textutil ships with macOS.
      if (process.platform === 'darwin') execFileSync('textutil', ['-convert', 'docx', '-output', path.join(out, `${name}.docx`), file]);
      console.log(path.join(out, name) + '.{pdf' + (process.platform === 'darwin' ? ',docx}' : '}'));
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error.message); process.exit(1); });
