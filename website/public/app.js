'use strict';

// LOMVIKO itself runs in the browser here; the landing only leads to it.
const APP_URL = 'https://app.lomviko.com';
const { translations, renderPublic, publicSnapshot } = window.LomvikoPublic;
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let language = location.pathname.replace(/\/$/, '') === '/en' ? 'en' : 'uk';

let site = JSON.parse(document.getElementById('public-site-data')?.textContent || 'null'), segment = 'beauty', story = 0, bot = { step: 0 };
const t = (key) => translations[language][key];

/* Showcases: booking page in four styles, owner's Telegram */
let pageStyle = 'warm';

document.addEventListener('click', (e) => {
  const button = e.target.closest('[data-page-style]');
  if (!button) return;
  pageStyle = button.dataset.pageStyle;
  $$('[data-page-style]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  bookingPhone();
});

/* Stories */

function selectStory(i, focus) {
  story = i; storyTabs(); renderStory();
  if (focus) $('#story-tab-' + i).focus();
}
$('#story-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-story]'); if (b) selectStory(Number(b.dataset.story)); });
$('#story-tabs').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const n = t('stories').length;
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (story + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : n - 1)) % n;
  selectStory(next, true);
});
$('#story-panel').addEventListener('click', (e) => {
  const service = e.target.closest('[data-bot-service]'), time = e.target.closest('[data-bot-time]');
  if (service) bot = { step: 1, service: Number(service.dataset.botService) };
  else if (time) {
    bot = { ...bot, step: 2, time: Number(time.dataset.botTime) };
    setTimeout(() => { if (bot.step === 2) { bot.step = 3; if (story === 1) $('#bot').innerHTML = botView(); } }, reduceMotion ? 0 : 900);
  } else if (e.target.closest('[data-bot-restart]')) bot = { step: 0 };
  else return;
  $('#bot').innerHTML = botView();
});

/* Business segments */

$('#segments').addEventListener('click', (e) => { const b = e.target.closest('[data-segment]'); if (b) { segment = b.dataset.segment; renderSegments(); } });
$('#segments').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const keys = Object.keys(t('segments')), i = keys.indexOf(segment);
  segment = e.key === 'Home' ? keys[0] : e.key === 'End' ? keys[keys.length - 1] : keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length];
  renderSegments(); $('#tab-' + segment).focus();
});

/* Calculator */
const calcState = { loss: 0, back: 0 };
const money = (v) => `${new Intl.NumberFormat(t('locale'), { maximumFractionDigits: 0 }).format(Math.round(v))} ${t('currency')}`;
function tween(el, key, to, format) {
  const from = calcState[key]; calcState[key] = to;
  if (reduceMotion || from === to) { el.textContent = format(to); return; }
  const start = performance.now(), duration = 450;
  const frame = (now) => { const k = Math.min(1, (now - start) / duration), e = 1 - Math.pow(1 - k, 3); el.textContent = format(from + (to - from) * e); if (k < 1 && calcState[key] === to) requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
function calc() {
  const v = (id) => Number($('#calc-' + id).value);
  const check = v('check'), visits = v('visits'), noshow = v('noshow'), days = v('days');
  for (const input of $$('#calc-form input[type=range]')) input.style.setProperty('--p', ((input.value - input.min) / (input.max - input.min)) * 100 + '%');
  $('#calc-check-out').textContent = money(check);
  $('#calc-visits-out').textContent = visits;
  $('#calc-noshow-out').textContent = noshow + '%';
  $('#calc-days-out').textContent = days;
  const missed = (visits * days * noshow) / 100, loss = missed * check, back = loss / 3;
  $('#calc-missed').textContent = t('calcMissed')(Math.round(missed));
  tween($('#calc-loss'), 'loss', loss, money);
  tween($('#calc-back'), 'back', back, money);
  $('#calc-year').textContent = t('calcYear')(money(back * 12));
}
$('#calc-form').addEventListener('input', calc);
$('#calc-form').addEventListener('submit', (e) => e.preventDefault());

const state = () => ({ language, site, segment, story, pageStyle, bot });
const bookingPhone = () => renderPublic(document, state(), 'bookingPhone');
const storyTabs = () => renderPublic(document, state(), 'storyTabs');
const renderStory = () => renderPublic(document, state(), 'renderStory');
const renderSegments = () => renderPublic(document, state(), 'renderSegments');
const botView = () => renderPublic(document, state(), 'bot');
function render() {
  renderPublic(document, state()); calc();
  document.dispatchEvent(new CustomEvent('lomviko:render'));
}

$$('[data-lang]').forEach((b) => b.addEventListener('click', (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  if (b.dataset.lang === language) return;
  language = b.dataset.lang;
  try { localStorage.setItem('ch.language', language); } catch {}
  try { history.replaceState(null, '', (language === 'en' ? '/en' : '/') + location.search + location.hash); } catch {}
  $('#form-status').textContent = '';
  render(); accessCopy();
}));

// The request form lives in a dialog: every "Leave a request" link opens it instead of jumping down the page.
const dialog = $('#request-dialog');
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href="#request"]');
  if (link) { e.preventDefault(); $('#form-status').textContent = ''; dialog.showModal(); $('#name').focus(); }
  if (e.target.closest('[data-request-close]') || e.target === dialog) dialog.close();
});
$('#demo-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(e.target)), status = $('#form-status'), submit = $('#demo-submit');
  submit.disabled = true; submit.setAttribute('aria-busy', 'true');
  status.classList.remove('is-error'); status.textContent = t('sending');
  try {
    const response = await fetch('/public/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, consent: values.consent === 'on', language }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) { status.classList.add('is-error'); status.textContent = t(response.status === 429 ? 'rate' : response.status === 400 ? 'invalid' : 'error'); return; }
    e.target.reset(); status.textContent = t('success'); try { window.lomvikoConversion?.(); } catch {} setTimeout(() => { if (status.textContent === t('success')) dialog.close(); }, 2500);
  } catch { status.classList.add('is-error'); status.textContent = t('error'); }
  finally { submit.removeAttribute('aria-busy'); submit.disabled = false; }
});

// Phones: a slim trial bar appears after the hero and hides near the other trial buttons.
const sticky = $('#sticky-cta');
if ('IntersectionObserver' in window) {
  const seen = new Set();
  const watch = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? seen.add(e.target) : seen.delete(e.target);
    sticky.hidden = seen.size > 0;
  });
  ['.hero', '#start', '.final'].forEach((s) => watch.observe($(s)));
}

if ($('#public-site-data')) calc(); else render();
(async () => {
  try {
    const response = await fetch('/public/site', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw Error();
    const next = publicSnapshot(await response.json());
    if (JSON.stringify(next) !== JSON.stringify(site)) { site = next; render(); }
  } catch { /* The server-rendered public content stays usable when the API is unavailable. */ }
})();

// Keep the one-time secret out of URLs, navigation, localStorage and requests until submission.
let accessToken = '';
function readAccessLink() {
  if (!location.hash.startsWith('#access=')) return;
  accessToken = location.hash.slice(8);
  history.replaceState(null, '', location.pathname);
  $('#access-section').hidden = false; $('#access-form').reset(); $('#access-status').textContent = '';
  $('#access-password').disabled = false; $('#access-confirm').disabled = false; $('#access-submit').disabled = false;
  accessCopy(); $('#access-section').scrollIntoView();
}
function accessCopy() {
  const en = language === 'en';
  $('#access-title').textContent = en ? 'Set your password' : 'Встановіть пароль';
  $('#access-help').textContent = en ? 'Choose a password of at least 12 characters. The link can be used once. Then sign in to the CRM with the login from your email.' : 'Оберіть пароль від 12 символів. Посилання одноразове. Після цього увійдіть у CRM з логіном із листа.';
  $('#access-label').textContent = en ? 'New password' : 'Новий пароль';
  $('#access-confirm-label').textContent = en ? 'Repeat password' : 'Повторіть пароль';
  $('#access-submit').textContent = en ? 'Save password' : 'Зберегти пароль';
}
accessCopy();
$('#access-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const en = language === 'en', password = $('#access-password').value, status = $('#access-status');
  status.classList.remove('is-error');
  if (password !== $('#access-confirm').value) { status.classList.add('is-error'); status.textContent = en ? 'Passwords do not match.' : 'Паролі не збігаються.'; return; }
  $('#access-submit').disabled = true;
  try {
    const r = await fetch('/public/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: accessToken, password }), signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw Error();
    const result = await r.json();
    status.textContent = (en ? 'Password saved. Your login: ' : 'Пароль збережено. Ваш логін: ') + result.login;
    accessToken = ''; e.target.reset(); $('#access-password').disabled = true; $('#access-confirm').disabled = true;
  } catch {
    status.classList.add('is-error');
    status.textContent = en ? 'The link is invalid, expired or already used, or the server is unavailable. Request a new key from support.' : 'Посилання недійсне, прострочене чи використане, або сервер недоступний. Зверніться для отримання нового ключа.';
    $('#access-submit').disabled = false;
  }
});
window.addEventListener('hashchange', readAccessLink);
readAccessLink();

// Opened from the admin's "Show on the site": scroll to where this document appears and highlight it once.
(() => {
  const kind = new URLSearchParams(location.search).get('doc');
  if (!/^(site-privacy|site-terms|site-offer|presentation)$/.test(kind || '')) return;
  const show = () => {
    const target = kind === 'presentation' ? $('#presentation:not([hidden])') : $(`#footer-legal [data-doc="${kind}"]`) || $('#footer-legal');
    if (!target) return;
    target.scrollIntoView({ block: 'center' });
    target.classList.add('doc-highlight');
    setTimeout(() => target.classList.remove('doc-highlight'), 6000);
  };
  document.addEventListener('lomviko:render', () => setTimeout(show, 300), { once: true });
  setTimeout(show, 1200);
})();
