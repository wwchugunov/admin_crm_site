'use strict';
// "Редактор сайту": the real site opens below in edit mode. Click a text and type, or replace the picture; changes are
// saved to the draft as you go, and "Опублікувати" shows them to visitors. Layout and code stay untouched.
(() => {
  const L = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
  pages.editor = [L('Редактор сайту', 'Site editor'), L('Клікніть на текст на сторінці й пишіть. Зміни зберігаються в чернетку — відвідувачі побачать їх після «Опублікувати».', 'Click any text on the page and type. Changes go to the draft; visitors see them after Publish.')];
  let language = 'uk', device = 'desktop', frame = null, saving = Promise.resolve(), status = '';
  const site = () => data.website;
  const origin = () => new URL(data.siteUrl).origin;
  const unpublished = () => site() && site().revision !== site().publishedRevision;
  const post = (message) => frame?.contentWindow?.postMessage({ source: 'lomviko-admin', ...message }, origin());

  async function pictureData(slot, version) {
    const response = await fetch(`/web/site-image?slot=${encodeURIComponent(slot)}&version=${encodeURIComponent(version)}`, { credentials: 'same-origin' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(null); reader.readAsDataURL(blob); });
  }
  async function sendDraft() {
    const draft = site().draft, pictures = {};
    for (const [slot, version] of Object.entries(draft.images || {})) { const url = await pictureData(slot, version); if (url) pictures[slot] = url; }
    post({ type: 'draft', texts: draft.texts?.[language] || {}, pictures });
  }
  function setStatus(text) { status = text; const el = document.querySelector('#editor-status'); if (el) el.textContent = text || (unpublished() ? L('Є неопубліковані зміни', 'Unpublished changes') : L('Усе опубліковано', 'Everything is published')); }
  function bar() {
    const publish = document.querySelector('[data-action="editor-publish"]'), reset = document.querySelector('[data-action="editor-reset"]');
    if (publish) publish.disabled = !unpublished();
    if (reset) reset.disabled = !unpublished();
    setStatus(status);
  }

  // One change at a time, in order, against the latest revision.
  function change(key, value) {
    saving = saving.then(async () => {
      setStatus(L('Зберігаю…', 'Saving…'));
      const content = structuredClone(site().draft);
      content.texts = content.texts || { uk: {}, en: {} };
      content.texts[language] = content.texts[language] || {};
      if (value === null) delete content.texts[language][key]; else content.texts[language][key] = value;
      try {
        const result = await window.owner.call('owner:site:save', { content, revision: site().revision });
        site().draft = content; site().revision = result.revision; status = ''; bar();
      } catch (error) { status = ''; toast(error.message, true); bar(); }
    });
  }
  async function replacePicture(slot) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp';
    input.addEventListener('change', async () => {
      const file = input.files[0]; if (!file) return;
      if (file.size > 3 * 1024 * 1024) return toast(L('Картинка має бути до 3 МБ', 'The picture must be at most 3 MB'), true);
      setStatus(L('Завантажую картинку…', 'Uploading the picture…'));
      try {
        await saving;
        const response = await fetch(`/web/site-image?slot=${encodeURIComponent(slot)}&revision=${site().revision}`, { method: 'PUT', body: file, credentials: 'same-origin' });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || 'Upload failed');
        site().draft.images = { ...(site().draft.images || {}), [slot]: result.version }; site().revision = result.revision;
        const url = await pictureData(slot, result.version); if (url) post({ type: 'picture', slot, data: url });
        status = ''; bar(); toast(L('Картинку замінено в чернетці', 'Picture replaced in the draft'));
      } catch (error) { status = ''; bar(); toast(error.message, true); }
    });
    input.click();
  }

  window.addEventListener('message', (event) => {
    if (!data?.siteUrl || event.origin !== origin() || event.source !== frame?.contentWindow || event.data?.source !== 'lomviko-site') return;
    const m = event.data;
    if (m.type === 'ready') sendDraft();
    if (m.type === 'change' && typeof m.key === 'string' && m.language === language) change(m.key, m.value);
    if (m.type === 'picture' && typeof m.slot === 'string') replacePicture(m.slot);
  });

  extraViews.editor = () => {
    if (!site() || !data.siteUrl) return noRows(L('Оновіть сервер, щоб редагувати сайт', 'Update the server to edit the site'));
    const src = `${data.siteUrl}${language === 'en' ? '/en' : '/'}?edit=1`;
    setTimeout(() => { frame = document.querySelector('#site-frame'); bar(); }, 0);
    return `<div class="editor-bar"><div class="segmented" role="group" aria-label="${L('Мова', 'Language')}">${['uk', 'en'].map((l) => `<button type="button" class="${l === language ? 'active' : ''}" data-action="editor-language" data-value="${l}">${l === 'uk' ? 'Українська' : 'English'}</button>`).join('')}</div>`
      + `<div class="segmented" role="group" aria-label="${L('Екран', 'Screen')}">${[['desktop', L('Комп’ютер', 'Desktop')], ['phone', L('Телефон', 'Phone')]].map(([d, label]) => `<button type="button" class="${d === device ? 'active' : ''}" data-action="editor-device" data-value="${d}">${label}</button>`).join('')}</div>`
      + `<span id="editor-status" class="editor-status" role="status"></span><button class="secondary" data-action="editor-reset">${L('Скасувати зміни', 'Discard changes')}</button><button class="primary" data-action="editor-publish">${L('Опублікувати', 'Publish')}</button></div>`
      + `<div class="editor-stage ${device}"><iframe id="site-frame" title="${L('Сайт у режимі редагування', 'The site in edit mode')}" src="${esc(src)}"></iframe></div>`
      + `<p class="hint">${L('Змінюються лише тексти й картинка — блоки, кнопки та вигляд на телефоні залишаються як є. Порожній текст повертає стандартний.', 'Only texts and the picture change — blocks, buttons and the phone layout stay as they are. An empty text brings back the original.')}</p>`;
  };

  Object.assign(actions, {
    'editor-language': (b) => { language = b.dataset.value; render(); },
    'editor-device': (b) => { device = b.dataset.value; document.querySelector('.editor-stage')?.classList.toggle('phone', device === 'phone'); document.querySelectorAll('[data-action="editor-device"]').forEach((x) => x.classList.toggle('active', x === b)); },
    'editor-publish': () => modal(L('Опублікувати сайт', 'Publish the site'), `<p>${L('Усі зміни з чернетки з’являться на lomviko.com для всіх відвідувачів.', 'All draft changes appear on lomviko.com for every visitor.')}</p>`,
      async () => { await saving; await window.owner.call('owner:site:publish', { revision: site().revision }); toast(L('Опубліковано', 'Published')); }, L('Опублікувати', 'Publish')),
    'editor-reset': () => modal(L('Скасувати зміни', 'Discard changes'), `<p>${L('Чернетка повернеться до того, що зараз на сайті. Неопубліковані тексти й картинки буде втрачено.', 'The draft goes back to what is live now. Unpublished texts and pictures are lost.')}</p>`,
      async () => { await saving; await window.owner.call('owner:site:save', { content: site().published, revision: site().revision }); toast(L('Зміни скасовано', 'Changes discarded')); }, L('Скасувати зміни', 'Discard changes')),
  });

  const addNav = () => {
    const nav = document.querySelector('aside nav');
    if (!nav || nav.querySelector('[data-page="editor"]')) return;
    const button = document.createElement('button');
    button.className = 'nav'; button.dataset.page = 'editor';
    button.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg></span><span data-nav-label></span>';
    button.lastChild.textContent = pages.editor[0];
    nav.prepend(button);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addNav, { once: true }); else addNav();
})();
