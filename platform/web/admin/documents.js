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

function documentsView() {
  const kinds = data.documentKinds || [];
  return `<div class="callout">${esc(dt('rules'))}<br>${esc(dt('fallback'))}</div>` + kinds.map((kind) => {
    const [label, hint] = dt('kinds')[kind], rows = (data.documents || []).filter((d) => d.kind === kind), off = (data.documentsDisabled || []).includes(kind);
    const body = rows.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>${dt('language')}</th><th>${dt('name')}</th><th>${dt('size')}</th><th>${dt('uploaded')}</th><th>${dt('status')}</th><th></th></tr></thead><tbody>${rows.map((d) => `<tr><td>${docLanguages[d.language]}</td><td><strong>${esc(d.title)}</strong><div class="sub">${esc(d.filename)}</div></td><td>${fileSize(d.size)} · ${esc(d.extension.toUpperCase())}</td><td>${date(d.uploaded_at)}</td><td><span class="badge ${d.active ? 'doc-current' : 'doc-archive'}">${d.active ? dt('current') : dt('archive')}</span></td><td class="doc-actions"><a class="secondary doc-link" href="/web/document?id=${encodeURIComponent(d.id)}&kind=${encodeURIComponent(kind)}" download>${dt('download')}</a>${d.active ? '' : `<button class="secondary" data-action="document-activate" data-id="${d.id}" data-kind="${kind}">${dt('activate')}</button>`}<button class="danger" data-action="document-delete" data-id="${d.id}" data-kind="${kind}" data-current="${d.active ? 1 : 0}">${dt('remove')}</button></td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty"><div class="empty-icon">⎙</div><strong>${esc(dt('empty'))}</strong><p>${esc(dt('emptyHint'))}</p></div>`;
    const links = ['uk', 'en'].map((lang) => `${esc(data.endpoint || '')}/public/documents/${kind}/${lang}`).join('<br>');
    return `<section class="panel mt"><div class="panel-head"><div><h2>${esc(label)}</h2><div class="sub doc-hint">${esc(hint)}</div></div><div class="inline-actions">${off ? `<span class="badge">${dt('off')}</span>` : ''}<button class="secondary" data-action="document-switch" data-kind="${kind}" data-enabled="${off ? '1' : '0'}">${dt(off ? 'enable' : 'disable')}</button><button class="primary" data-action="document-upload" data-kind="${kind}">${dt('upload')}</button></div></div>${off ? `<div class="notice">${esc(dt('offNote'))}</div>` : ''}${body}${!off && rows.some((d) => d.active) ? `<div class="notice">${dt('publicLink')}:<br><span class="connection-url">${links}</span></div>` : ''}</section>`;
  }).join('');
}

function uploadDocument(kind, language = OrbitI18n.language === 'en' ? 'en' : 'uk') {
  const defaults = documentText[language].kinds[kind][2];
  modal(dt('kinds')[kind][0],
    `<p class="hint">${esc(dt('rules'))}</p><label for="f-language">${dt('language')}</label><select id="f-language" name="language">${Object.entries(docLanguages).map(([value, name]) => `<option value="${value}" ${value === language ? 'selected' : ''}>${name}</option>`).join('')}</select>`
    + field(dt('name'), 'title', 'text', `required maxlength="160" value="${esc(defaults)}"`)
    + `<label for="f-file">${dt('file')}</label><input id="f-file" name="file" type="file" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"><p class="hint">${esc(dt('chooseFile'))}</p>`
    + `<label class="checkbox-line"><input type="checkbox" name="activate" checked>${dt('makeCurrent')}</label>`,
    async (v) => { await window.owner.call('owner:document:upload', { kind, language: v.language, title: v.title, file: v.file, activate: Object.hasOwn(v, 'activate') }); toast(dt('uploaded_ok')); },
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
