'use strict';
// Public documents: privacy policies, the public offer and the sales presentation.
// Each admin receives only its own document kinds from the server (data.documentKinds).
const documentText = {
  uk: {
    nav: 'Документи', title: 'Документи', subtitle: 'Політики, оферта та презентація. Завантажуйте нові версії — сайт і застосунок одразу показують поточну.',
    upload: 'Завантажити нову версію', current: 'Поточна', archive: 'Архів', activate: 'Зробити поточною', remove: 'Видалити', download: 'Завантажити файл',
    language: 'Мова', file: 'Файл', name: 'Назва', size: 'Розмір', uploaded: 'Завантажено', status: 'Статус',
    empty: 'Документ ще не завантажено', emptyHint: 'Поки файлу немає, посилання на сайті та в застосунку приховані.',
    rules: 'PDF, DOC або DOCX до 25 МБ. Нова версія одразу стає поточною, попередні залишаються в архіві — їх можна повернути або видалити.',
    makeCurrent: 'Одразу зробити поточною версією', chooseFile: 'Оберіть файл PDF, DOC або DOCX',
    uploaded_ok: 'Документ завантажено', activated: 'Поточну версію змінено', deleted: 'Документ видалено',
    activateQuestion: 'Ця версія стане поточною: її побачать на сайті та в застосунку.',
    deleteQuestion: 'Файл буде видалено назавжди.', deleteCurrent: 'Це поточна версія. Після видалення поточною стане найновіша з архіву, а якщо архів порожній — посилання зникне.',
    disable: 'Вимкнути', enable: 'Увімкнути', off: 'Вимкнено',
    offNote: 'Документ вимкнено: посилання на сайті та в застосунку приховані, за прямим посиланням відкривається сторінка «Документ зараз недоступний». Файли збережено — увімкніть, щоб повернути.',
    disableQuestion: 'Посилання на документ зникнуть із сайту та застосунку. Файли й архів залишаться, увімкнути можна будь-коли.',
    enableQuestion: 'Поточна версія знову з’явиться на сайті та в застосунку.',
    disabled_ok: 'Документ вимкнено', enabled_ok: 'Документ увімкнено',
    publicLink: 'Публічне посилання', fallback: 'Якщо немає англійської версії, англомовні відвідувачі отримають українську.',
    kinds: {
      'site-privacy': ['Політика конфіденційності сайту', 'Посилання в підвалі сайту та біля форми заявки. Коротка адреса: /privacy', 'Політика конфіденційності'],
      'site-terms': ['Умови користування', 'Діють, поки продажі вимкнені. Посилання в підвалі сайту і при реєстрації. Коротка адреса: /terms', 'Умови користування'],
      'site-offer': ['Публічна оферта', 'Посилання в підвалі сайту. Коротка адреса: /offer', 'Публічна оферта'],
      presentation: ['Презентація LOMVIKO', 'Кнопка «Завантажити презентацію» на сайті. Коротка адреса /presentation зручна, щоб надсилати клієнтам.', 'Презентація LOMVIKO'],
      'app-privacy': ['Політика конфіденційності сервісу', 'Відкривається у веб-застосунку: Налаштування та дані → Про LOMVIKO → Документи.', 'Політика конфіденційності LOMVIKO'],
    },
  },
  en: {
    nav: 'Documents', title: 'Documents', subtitle: 'Policies, the public offer and the presentation. Upload a new version and the website and app show it right away.',
    upload: 'Upload new version', current: 'Current', archive: 'Archive', activate: 'Make current', remove: 'Delete', download: 'Download file',
    language: 'Language', file: 'File', name: 'Title', size: 'Size', uploaded: 'Uploaded', status: 'Status',
    empty: 'No document uploaded yet', emptyHint: 'Until a file is uploaded, links on the website and in the app stay hidden.',
    rules: 'PDF, DOC or DOCX up to 25 MB. A new version becomes current immediately; earlier ones stay in the archive so you can restore or delete them.',
    makeCurrent: 'Make it the current version now', chooseFile: 'Choose a PDF, DOC or DOCX file',
    uploaded_ok: 'Document uploaded', activated: 'Current version changed', deleted: 'Document deleted',
    activateQuestion: 'This version becomes current and will be shown on the website and in the app.',
    deleteQuestion: 'The file will be deleted permanently.', deleteCurrent: 'This is the current version. After deletion the newest archived version becomes current; if the archive is empty, the link disappears.',
    disable: 'Turn off', enable: 'Turn on', off: 'Off',
    offNote: 'The document is turned off: links on the website and in the app are hidden, and a direct link shows “This document is not available right now”. Files are kept — turn it on to bring it back.',
    disableQuestion: 'Links to this document disappear from the website and the app. Files and the archive stay; you can turn it on at any time.',
    enableQuestion: 'The current version appears on the website and in the app again.',
    disabled_ok: 'Document turned off', enabled_ok: 'Document turned on',
    publicLink: 'Public link', fallback: 'Without an English version, English-speaking visitors receive the Ukrainian one.',
    kinds: {
      'site-privacy': ['Website privacy policy', 'Linked in the website footer and next to the demo form. Short address: /privacy', 'Privacy policy'],
      'site-terms': ['Terms of use', 'Apply while sales are off. Linked in the website footer and at registration. Short address: /terms', 'Terms of use'],
      'site-offer': ['Public offer', 'Linked in the website footer. Short address: /offer', 'Public offer'],
      presentation: ['LOMVIKO presentation', '“Download presentation” button on the website. The short address /presentation is handy for sending to clients.', 'LOMVIKO presentation'],
      'app-privacy': ['App privacy policy', 'Opened from the LOMVIKO app: Settings → Legal documents.', 'LOMVIKO privacy policy'],
    },
  },
};
const dt = (key) => (documentText[OrbitI18n.language] || documentText.uk)[key];
const docLanguages = { uk: 'Українська', en: 'English' };
const fileSize = (bytes) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
pages.documents = [dt('title'), dt('subtitle')];

// What each document is for, whether it is required and every place people see it. "Показати" opens the
// site with ?doc=<kind>, which scrolls to the link and highlights it.
const documentGuide = {
  uk: {
    order: ['app-privacy', 'site-terms', 'site-offer', 'presentation'],
    whereTitle: 'Де його бачать', show: 'Показати на сайті', open: 'Відкрити файл',
    shown: 'Показується', hiddenNoFile: 'Не завантажено — посилання приховане', hiddenOff: 'Вимкнено — посилання приховане',
    hiddenSalesOff: 'Не показується: продажі вимкнені', hiddenOffer: 'Не показується: діє публічна оферта', fallbackUsed: 'Не завантажено — на сайті показується загальна політика',
    kinds: {
      'app-privacy': { title: 'Політика конфіденційності', need: ['Обов’язковий', 'need-required'], about: 'Головна політика LOMVIKO: які дані збираємо і як захищаємо. Вимагає закон про захист персональних даних, навіть поки сервіс безкоштовний.',
        where: [['Сайт: підвал і форма заявки — lomviko.com/privacy', 'site-privacy'], ['Реєстрація в застосунку: галочка «Я приймаю…»'], ['Застосунок: Налаштування та дані → Про LOMVIKO → Документи']] },
      'site-terms': { title: 'Умови користування', need: ['Потрібен, поки продажі вимкнені', 'need-now'], about: 'Договір на безкоштовне користування: що надаємо, чиї дані, відповідальність. Коли ввімкнете продажі, його замінить публічна оферта.',
        where: [['Сайт: підвал — lomviko.com/terms', 'site-terms'], ['Реєстрація в застосунку: галочка «Я приймаю Умови користування…»'], ['Застосунок: банер «Прийміть умови», коли завантажите нову версію']] },
      'site-offer': { title: 'Публічна оферта', need: ['Потрібен, коли ввімкнете продажі', 'need-later'], about: 'Договір для платних тарифів: ціни, оплата, повернення, реквізити ФОП. Показується лише тоді, коли в розділі «Продажі» продажі ввімкнено.',
        where: [['Сайт: підвал — lomviko.com/offer', 'site-offer'], ['Реєстрація в застосунку: замість «Умов користування»'], ['Застосунок: банер «Прийміть умови» для всіх, коли оферта з’являється']] },
      presentation: { title: 'Презентація', need: ['Необов’язковий', 'need-optional'], about: 'PDF для клієнтів: можливості, сценарії, безпека. Короткою адресою lomviko.com/presentation зручно ділитися.',
        where: [['Сайт: блок «Покажіть LOMVIKO своїй команді» з кнопкою «Відкрити презентацію»', 'presentation']] },
    },
  },
  en: {
    order: ['app-privacy', 'site-terms', 'site-offer', 'presentation'],
    whereTitle: 'Where people see it', show: 'Show on the site', open: 'Open file',
    shown: 'Shown', hiddenNoFile: 'Not uploaded — the link is hidden', hiddenOff: 'Turned off — the link is hidden',
    hiddenSalesOff: 'Not shown: sales are off', hiddenOffer: 'Not shown: the public offer applies', fallbackUsed: 'Not uploaded — the site shows the main policy',
    kinds: {
      'app-privacy': { title: 'Privacy policy', need: ['Required', 'need-required'], about: 'The main LOMVIKO policy: what data we collect and how we protect it. Required by data protection law even while the service is free.',
        where: [['Site: footer and request form — lomviko.com/privacy', 'site-privacy'], ['App sign-up: the “I accept…” checkbox'], ['App: Settings and data → About LOMVIKO → Documents']] },
      'site-terms': { title: 'Terms of use', need: ['Needed while sales are off', 'need-now'], about: 'The agreement for free use. When you turn sales on, the public offer replaces it.',
        where: [['Site: footer — lomviko.com/terms', 'site-terms'], ['App sign-up: the “I accept the Terms of use…” checkbox'], ['App: the “Accept the terms” banner after a new version']] },
      'site-offer': { title: 'Public offer', need: ['Needed once sales are on', 'need-later'], about: 'The agreement for paid plans. Shown only while sales are on in Sales.',
        where: [['Site: footer — lomviko.com/offer', 'site-offer'], ['App sign-up: instead of the Terms of use'], ['App: the “Accept the terms” banner for everyone when the offer appears']] },
      presentation: { title: 'Presentation', need: ['Optional', 'need-optional'], about: 'A PDF for clients. The short address lomviko.com/presentation is easy to share.',
        where: [['Site: the “Show LOMVIKO to your team” block with the “Open presentation” button', 'presentation']] },
    },
  },
};
const dg = (key) => (documentGuide[OrbitI18n.language] || documentGuide.uk)[key];
const siteBase = () => (data.mail?.settings?.siteUrl || 'https://lomviko.com').replace(/\/$/, '');

function documentState(kind) {
  const has = (k) => (data.documents || []).some((d) => d.kind === k && d.active), off = (k) => (data.documentsDisabled || []).includes(k), sales = data.product?.sales === true;
  if (off(kind)) return [dg('hiddenOff'), 'state-off'];
  if (!has(kind)) return kind === 'site-privacy' ? [dg('fallbackUsed'), 'state-info'] : [dg('hiddenNoFile'), kind === 'app-privacy' ? 'state-warn' : 'state-off'];
  if (kind === 'site-offer' && !sales) return [dg('hiddenSalesOff'), 'state-off'];
  if (kind === 'site-terms' && sales && has('site-offer') && !off('site-offer')) return [dg('hiddenOffer'), 'state-off'];
  return [dg('shown'), 'state-ok'];
}

function documentsView() {
  const kinds = dg('order').filter((k) => (data.documentKinds || []).includes(k));
  return `<div class="callout">${esc(dt('rules'))}<br>${esc(dt('fallback'))}</div>` + kinds.map((kind) => {
    const guide = dg('kinds')[kind], rows = (data.documents || []).filter((d) => d.kind === kind), off = (data.documentsDisabled || []).includes(kind), [state, stateClass] = documentState(kind);
    const body = rows.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>${dt('language')}</th><th>${dt('name')}</th><th>${dt('size')}</th><th>${dt('uploaded')}</th><th>${dt('status')}</th><th></th></tr></thead><tbody>${rows.map((d) => `<tr><td>${docLanguages[d.language]}</td><td><strong>${esc(d.title)}</strong><div class="sub">${esc(d.filename)}</div></td><td>${fileSize(d.size)} · ${esc(d.extension.toUpperCase())}</td><td>${date(d.uploaded_at)}</td><td><span class="badge ${d.active ? 'doc-current' : 'doc-archive'}">${d.active ? dt('current') : dt('archive')}</span></td><td class="doc-actions"><a class="secondary doc-link" href="/web/document?id=${encodeURIComponent(d.id)}&kind=${encodeURIComponent(kind)}" download>${dt('download')}</a>${d.active ? '' : `<button class="secondary" data-action="document-activate" data-id="${d.id}" data-kind="${kind}">${dt('activate')}</button>`}<button class="danger" data-action="document-delete" data-id="${d.id}" data-kind="${kind}" data-current="${d.active ? 1 : 0}">${dt('remove')}</button></td></tr>`).join('')}</tbody></table></div>`
      : '';
    const current = (group, lang) => rows.find((d) => d.active && d.language === lang && (group === 'pdf' ? d.extension === 'pdf' : d.extension !== 'pdf'));
    const fileCell = (group) => ['uk', 'en'].map((lang) => { const d = current(group, lang); return d ? `<a class="doc-file" href="/web/document?id=${encodeURIComponent(d.id)}&kind=${encodeURIComponent(kind)}" download>${lang.toUpperCase()} · ${esc(d.filename)}</a>` : (lang === 'uk' ? `<span class="doc-missing">${L2('не завантажено', 'not uploaded')}</span>` : ''); }).join('');
    // Legal texts: the Word file becomes the page on the site, the PDF is an optional download. The presentation is a PDF.
    const legal = kind !== 'presentation';
    const files = legal
      ? `<div class="doc-files"><div><h3>${L2('Word — це текст сторінки на сайті', 'Word — the text of the page on the site')}</h3>${fileCell('word')}</div><div><h3>${L2('PDF — необов’язково, кнопка «Завантажити PDF» на сторінці', 'PDF — optional, a “Download PDF” link on the page')}</h3>${fileCell('pdf')}</div></div>`
      : `<div class="doc-files"><div><h3>${L2('PDF — показується на сайті', 'PDF — shown on the site')}</h3>${fileCell('pdf')}</div><div><h3>${L2('Word — для редагування', 'Word — to edit')}</h3>${fileCell('word')}</div></div>`;
    const where = `<div class="doc-where"><h3>${esc(dg('whereTitle'))}</h3><ul>${guide.where.map(([text, target]) => `<li><span>${esc(text)}</span>${target ? `<a class="doc-show" href="${esc(siteBase())}/?doc=${encodeURIComponent(target)}" target="_blank" rel="noopener">${esc(dg('show'))} ↗</a>` : ''}</li>`).join('')}</ul></div>`;
    return `<section class="panel mt doc-card"><div class="panel-head"><div><h2>${esc(guide.title)} <span class="badge ${guide.need[1]}">${esc(guide.need[0])}</span></h2><p class="doc-about">${esc(guide.about)}</p><p class="doc-state ${stateClass}">${esc(state)}</p></div><div class="inline-actions"><button class="secondary" data-action="document-switch" data-kind="${kind}" data-enabled="${off ? '1' : '0'}">${dt(off ? 'enable' : 'disable')}</button><button class="primary" data-action="document-upload" data-kind="${kind}">${dt('upload')}</button></div></div>${files}${where}${body}</section>`;
  }).join('');
}

const L2 = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
// One dialog for both files: edit the Word file, save it as PDF in Word, upload both. Either one is enough.
function uploadDocument(kind, language = OrbitI18n.language === 'en' ? 'en' : 'uk') {
  const defaults = documentText[language].kinds[kind][2];
  modal(dt('kinds')[kind][0],
    (kind === 'presentation'
      ? `<p class="hint">${L2('Завантажте PDF — його відкриває кнопка на сайті. Word можна додати для власних правок.', 'Upload the PDF the site button opens. Add the Word file for your own edits.')}</p>`
      : `<p class="hint">${L2('Завантажте Word (.docx) — його текст стане сторінкою на сайті: заголовки, списки, таблиці й посилання збережуться. PDF — за бажанням, для кнопки «Завантажити PDF».', 'Upload the Word file (.docx) — its text becomes the page on the site with headings, lists, tables and links. A PDF is optional, for a “Download PDF” link.')}</p>`)
    + `<label for="f-language">${dt('language')}</label><select id="f-language" name="language">${Object.entries(docLanguages).map(([value, name]) => `<option value="${value}" ${value === language ? 'selected' : ''}>${name}</option>`).join('')}</select>`
    + field(dt('name'), 'title', 'text', `required maxlength="160" value="${esc(defaults)}"`)
    + `<label for="f-word">${L2('Файл Word (.docx або .doc)', 'Word file (.docx or .doc)')}</label><input id="f-word" name="word" type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">`
    + `<label for="f-pdf">${kind === 'presentation' ? L2('Файл PDF — його побачать люди', 'PDF file — what people see') : L2('Файл PDF — необов’язково', 'PDF file — optional')}</label><input id="f-pdf" name="pdf" type="file" accept=".pdf,application/pdf">`
    + `<p class="hint">${esc(dt('rules'))}</p>`,
    async (v) => {
      const picked = [v.word, v.pdf].filter((f) => f instanceof File && f.size);
      if (!picked.length) throw Error(L2('Оберіть файл Word, PDF або обидва', 'Choose a Word file, a PDF or both'));
      if (v.pdf?.size && !/\.pdf$/i.test(v.pdf.name)) throw Error(L2('У поле PDF оберіть файл .pdf', 'Choose a .pdf file in the PDF field'));
      if (v.word?.size && !/\.docx?$/i.test(v.word.name)) throw Error(L2('У поле Word оберіть файл .docx або .doc', 'Choose a .docx or .doc file in the Word field'));
      for (const file of picked) await window.owner.call('owner:document:upload', { kind, language: v.language, title: v.title, file, activate: true });
      toast(dt('uploaded_ok'));
    },
    dt('upload'));
}

Object.assign(actions, {
  'document-upload': (b) => uploadDocument(b.dataset.kind),
  'document-activate': (b) => modal(dt('activate'), `<p>${esc(dt('activateQuestion'))}</p>`, async () => { await window.owner.call('owner:document:activate', { id: b.dataset.id, kind: b.dataset.kind }); toast(dt('activated')); }, dt('activate')),
  'document-switch': (b) => { const enabled = b.dataset.enabled === '1'; modal(dt(enabled ? 'enable' : 'disable'), `<p>${esc(dt(enabled ? 'enableQuestion' : 'disableQuestion'))}</p>`, async () => { await window.owner.call('owner:document:switch', { kind: b.dataset.kind, enabled }); toast(dt(enabled ? 'enabled_ok' : 'disabled_ok')); }, dt(enabled ? 'enable' : 'disable')); },
  'document-delete': (b) => modal(dt('remove'), `<p>${esc(dt(b.dataset.current === '1' ? 'deleteCurrent' : 'deleteQuestion'))}</p>`, async () => { await window.owner.call('owner:document:delete', { id: b.dataset.id, kind: b.dataset.kind }); toast(dt('deleted')); }, dt('remove')),
});

function documentNavigation() { document.querySelectorAll('[data-doc-nav]').forEach((el) => { el.textContent = dt('nav'); }); pages.documents = [dt('title'), dt('subtitle')]; }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', documentNavigation, { once: true }); else documentNavigation();
