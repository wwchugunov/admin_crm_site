const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const websiteRequire = createRequire(path.resolve(__dirname, '../../../website/package.json'));
const { parseHTML } = websiteRequire('linkedom');
const { createServer } = require('../../../website/server.cjs');
const { defaults } = require('../../../platform/api/public-site.cjs');
const { publicSnapshot } = require('../../../website/render.cjs');
const publicDirectory = path.resolve(__dirname, '../../../website/public');
async function fixture(t, options = {}) {
 const requests = [], state = { data: defaults(), status: 200, delay: 0 };
 const backend = http.createServer(async (req, res) => {
  requests.push({ path: req.url, headers: req.headers });
  if (state.delay) await new Promise(resolve => setTimeout(resolve, state.delay));
  res.writeHead(state.status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(state.data));
 });
 await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
 const server = createServer({ apiUrl: 'http://127.0.0.1:' + backend.address().port, ...options });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 t.after(async () => { await new Promise(resolve => server.close(resolve)); backend.closeAllConnections(); await new Promise(resolve => backend.close(resolve)); });
 return { url: 'http://127.0.0.1:' + server.address().port, state, requests };
}
test('Initial HTML contains localized content, crawlable language links and consistent metadata without JavaScript', async t => {
 const f = await fixture(t);
 for (const [route, lang, titleText] of [['/', 'uk', 'Онлайн-'], ['/en', 'en', 'Online booking']]) {
  const response = await fetch(f.url + route, { headers: { Cookie: 'private=cookie', Authorization: 'Bearer private' } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('x-robots-tag'), null);
  const { document } = parseHTML(await response.text());
  assert.equal(document.documentElement.lang, lang);
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert(document.querySelector('h1').textContent.includes(titleText));
  assert(document.querySelectorAll('#features-grid article').length >= 6);
  assert.equal(document.querySelectorAll('#plans article').length, 3);
  assert(document.querySelectorAll('#faq-list details').length >= 4);
  assert(document.querySelector('#owner-points').textContent.length > 100);
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://lomviko.com' + route);
  assert.equal(document.querySelector('[data-lang="en"]').getAttribute('href'), '/en');
  assert.equal(document.querySelector('[data-lang="uk"]').getAttribute('href'), '/');
  assert.match(document.querySelector('meta[name="robots"]').content, /^index, follow/);
  assert.equal(document.querySelector('meta[property="og:image"]').content, 'https://lomviko.com/assets/' + (lang === 'en' ? 'og-en.png' : 'og.png'));
  assert.equal(document.querySelector('meta[name="twitter:image"]').content, document.querySelector('meta[property="og:image"]').content);
  const schema = JSON.parse(document.querySelector('#structured-data').textContent);
  assert.deepEqual(schema['@graph'].map(item => item['@type']), ['Organization', 'WebSite', 'SoftwareApplication']);
  const app = schema['@graph'][2]; assert.equal(app.inLanguage, lang); assert.equal(app.url, 'https://lomviko.com' + route);
  assert(!app.offers); assert(!app.aggregateRating);
  const ids = [...document.querySelectorAll('[id]')].map(el => el.id); assert.equal(new Set(ids).size, ids.length, 'unique IDs');
  for (const link of document.querySelectorAll('a[href^="#"]')) assert(document.getElementById(link.getAttribute('href').slice(1)), link.outerHTML);
  for (const image of document.querySelectorAll('img')) assert(image.getAttribute('alt'));
 }
 assert.equal(f.requests.length, 1, 'both locales share a bounded public snapshot');
 for (const request of f.requests) { assert.equal(request.path, '/public/site'); assert(!request.headers.authorization); assert(!request.headers.cookie); }
});
test('Published edits and registration settings reach initial HTML; untrusted text cannot escape JSON or HTML', async t => {
 const f = await fixture(t, { siteCacheMs: 0 });
 const first = await fetch(f.url), oldTag = first.headers.get('etag'); await first.text();
 f.state.data.locales.uk.title = '<img id="injected" src=x onerror=alert(1)>';
 f.state.data.locales.uk.description = '</script><script id="injected">alert(1)</script>';
 f.state.data.locales.uk.privateToken = 'should-not-appear';
 f.state.data.privateToken = 'should-not-appear';
 f.state.data.product = { sales: true, registration: false, plans: [{ price: 321, uk: 'Тестовий тариф', en: 'Test plan', for: { uk: 'Тест', en: 'Test' }, features: [] }] };
 const response = await fetch(f.url, { headers: { 'If-None-Match': oldTag } });
 assert.equal(response.status, 200); assert.notEqual(response.headers.get('etag'), oldTag);
 const html = await response.text(), { document } = parseHTML(html);
 assert(!html.includes('should-not-appear')); assert(!document.getElementById('injected'));
 assert.equal(document.querySelector('h1').textContent, f.state.data.locales.uk.title);
 assert.equal(JSON.parse(document.querySelector('#public-site-data').textContent).locales.uk.description, f.state.data.locales.uk.description);
 assert.equal(JSON.parse(document.querySelector('#structured-data').textContent)['@graph'][2].description, f.state.data.locales.uk.description);
 assert.equal(document.querySelector('[data-cta]').getAttribute('href'), '#request');
 assert.match(document.querySelector('.tier-price').textContent, /321/);
 assert(!publicSnapshot(f.state.data).privateToken);
});
test('Unavailable, slow or malformed public API never removes the primary marketing content', async t => {
 const f = await fixture(t, { siteCacheMs: 0 });
 for (const state of [{ status: 503, delay: 0 }, { status: 200, delay: 1700 }, { status: 200, delay: 0, data: { product: { plans: 'invalid' } } }]) {
  Object.assign(f.state, state);
  const response = await fetch(f.url + '/en'); assert.equal(response.status, 200);
  const { document } = parseHTML(await response.text());
  assert(document.querySelectorAll('#features-grid article').length >= 6);
  assert.equal(document.querySelectorAll('#plans article').length, 3);
  assert.match(document.querySelector('h1').textContent, /Online booking/);
 }
});
test('Robots opens only the required public JSON resource; sitemap lists only canonical marketing pages', async t => {
 const f = await fixture(t), robots = await (await fetch(f.url + '/robots.txt')).text();
 assert.match(robots, /^Allow: \/public\/site\$$/m); assert.match(robots, /^Disallow: \/public\/$/m);
 assert.match(robots, /^Sitemap: https:\/\/lomviko.com\/sitemap.xml$/m);
 const xml = await (await fetch(f.url + '/sitemap.xml')).text();
 assert(!xml.includes('<lastmod>')); assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), ['https://lomviko.com/', 'https://lomviko.com/en']);
 for (const asset of ['/content.js', '/app.js', '/style.css', '/motion.js', '/fonts/geologica-cyrillic-wght-normal.woff2', '/assets/app.png']) assert.equal((await fetch(f.url + asset)).status, 200);
 const api = await fetch(f.url + '/public/site'); assert.equal(api.status, 200); assert.equal(api.headers.get('x-robots-tag'), 'noindex');
 for (const route of ['/admin/snapshot', '/v1/crm/export', '/web/call', '/.env', '/server.cjs', '/render.cjs', '/node_modules/linkedom/package.json']) {
  const result = await fetch(f.url + route); assert.equal(result.status, 404); assert.equal(result.headers.get('x-robots-tag'), 'noindex');
 }
 assert(f.requests.every(request => request.path === '/public/site'));
});
test('Google Ads queues conversions before deferring its runtime until page load and idle', () => {
 let onload, idle, script;
 const context = { window: { addEventListener: (event, callback) => { assert.equal(event, 'load'); onload = callback; }, requestIdleCallback: callback => { idle = callback; } }, document: { readyState: 'loading', createElement: () => ({}), head: { append: element => { script = element; } } } };
 vm.runInNewContext(fs.readFileSync(path.join(publicDirectory, 'ads.js'), 'utf8'), context);
 assert(!script); context.window.lomvikoConversion();
 assert.equal(context.window.dataLayer.length, 3); assert.equal(context.window.dataLayer[2][0], 'event');
 onload(); assert(!script); idle(); assert.match(script.src, /^https:\/\/www.googletagmanager.com\/gtag\/js\?id=/); assert.equal(script.async, true);
});
test('The admin can hide the service owner line in the footer while LOMVIKO is free', async t => {
 const f = await fixture(t);
 const shown = parseHTML(await (await fetch(f.url + '/')).text()).document;
 assert.equal(shown.querySelector('#footer-owner').hidden, false);
 assert.match(shown.querySelector('#footer-owner').textContent, /Чугунов Василь Васильович/);
 // A fresh server, because the public snapshot is cached for 30 seconds.
 const server = await fixture(t);
 server.state.data = { ...defaults(), product: { sales: false, registration: true, owner: false, free_until: Date.now(), plans: [] } };
 const hidden = parseHTML(await (await fetch(server.url + '/')).text()).document;
 assert.equal(hidden.querySelector('#footer-owner').hidden, true);
});
