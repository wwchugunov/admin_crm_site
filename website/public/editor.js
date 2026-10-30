'use strict';
// Site editor, inside the site admin only: the page opens in a frame there with ?edit=1. Texts become editable in
// place and pictures get a "Replace" button; every change goes to the admin, which saves it to the draft.
// Messages are accepted only from the one origin the server names in <meta name="lomviko-editor">.
(() => {
  const editor = document.querySelector('meta[name="lomviko-editor"]')?.content;
  if (!editor || window.parent === window || new URLSearchParams(location.search).get('edit') !== '1') return;
  const language = document.documentElement.lang === 'en' ? 'en' : 'uk';
  const LIMIT = 1000, PART_LIMIT = 300;
  let draft = {}, pictures = {}, ready = false;
  const send = (message) => window.parent.postMessage({ source: 'lomviko-site', ...message }, editor);

  const clean = (text, limit) => text.replace(/\s+/g, ' ').trim().slice(0, limit);
  function editable(el, onChange) {
    if (el.dataset.editBound) return;
    el.dataset.editBound = '1';
    el.setAttribute('contenteditable', 'plaintext-only');
    el.setAttribute('spellcheck', 'true');
    el.classList.add('edit-text');
    let timer;
    el.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(onChange, 500); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
    el.addEventListener('blur', () => { clearTimeout(timer); onChange(); });
  }
  function textKey(el) { return el.dataset.t || el.dataset.edit; }

  // Applies the draft over whatever the page just rendered, then makes every text and heading editable.
  function apply() {
    for (const el of document.querySelectorAll('header [data-t], main [data-t], footer [data-t], main [data-edit]')) {
      const key = textKey(el);
      if (el.closest('#request-dialog, noscript') || el.children.length) continue;
      if (typeof draft[key] === 'string') el.textContent = draft[key];
      editable(el, () => {
        const value = clean(el.textContent, LIMIT);
        if (!value) { delete draft[key]; send({ type: 'change', language, key, value: null }); return; }
        if (value === draft[key]) return;
        draft[key] = value; send({ type: 'change', language, key, value });
      });
    }
    // Two-part headings: [data-h], and hero texts rendered as a heading with an accent part.
    for (const el of document.querySelectorAll('main [data-h], main [data-edit]')) {
      if (el.dataset.edit && !el.querySelector('em, [data-part]')) continue;
      const key = el.dataset.h || el.dataset.edit;
      if (!el.querySelector('[data-part]')) {
        const em = el.querySelector('em'), first = (em ? el.firstChild?.textContent : el.textContent) || '', second = em?.textContent || '';
        const parts = Array.isArray(draft[key]) ? draft[key] : [first.trim(), second.trim()];
        el.textContent = '';
        const a = document.createElement('span'), b = document.createElement('em');
        a.dataset.part = '0'; b.dataset.part = '1'; a.textContent = parts[0]; b.textContent = parts[1];
        el.append(a, ' ', b);
      }
      const save = () => {
        const value = [clean(el.querySelector('[data-part="0"]').textContent, PART_LIMIT), clean(el.querySelector('[data-part="1"]').textContent, PART_LIMIT)];
        if (!value[0]) { delete draft[key]; send({ type: 'change', language, key, value: null }); return; }
        if (JSON.stringify(value) === JSON.stringify(draft[key])) return;
        draft[key] = value; send({ type: 'change', language, key, value });
      };
      for (const part of el.querySelectorAll('[data-part]')) editable(part, save);
    }
    for (const img of document.querySelectorAll('img[data-img]')) {
      if (pictures[img.dataset.img]) img.src = pictures[img.dataset.img];
      if (img.parentElement.querySelector('.edit-picture')) continue;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'edit-picture';
      button.textContent = language === 'en' ? 'Replace picture' : 'Замінити картинку';
      button.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); send({ type: 'picture', slot: img.dataset.img }); });
      img.parentElement.classList.add('edit-picture-host');
      img.parentElement.append(button);
    }
  }

  // Links, buttons and forms do nothing while editing: a click only places the cursor.
  document.addEventListener('click', (e) => {
    if (e.target.closest('.edit-picture')) return;
    const target = e.target.closest('a, button, summary, label, input, select, textarea');
    if (target && !target.closest('[contenteditable]')) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener('submit', (e) => e.preventDefault(), true);

  window.addEventListener('message', (event) => {
    if (event.origin !== editor || event.source !== window.parent || event.data?.source !== 'lomviko-admin') return;
    const m = event.data;
    if (m.type === 'draft') {
      draft = m.texts && typeof m.texts === 'object' ? { ...m.texts } : {};
      pictures = m.pictures && typeof m.pictures === 'object' ? { ...m.pictures } : {};
      ready = true; apply();
    }
    if (m.type === 'picture' && typeof m.slot === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(m.data || '')) {
      pictures[m.slot] = m.data; apply();
    }
  });
  document.addEventListener('lomviko:render', () => { if (ready) setTimeout(apply, 0); });
  document.documentElement.classList.add('editing');
  send({ type: 'ready', language });
})();
