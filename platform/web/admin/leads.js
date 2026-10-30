'use strict';
// "Заявки": requests left on lomviko.com. One click gives the person a company with the free period and the
// usual letter to set a password, so access can be handed out while self sign-up is closed.
(() => {
  const L = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
  const STAGES = {
    new: [L('Нова', 'New'), 'lead-new'],
    contacted: [L('В роботі', 'In progress'), 'lead-progress'],
    granted: [L('Доступ видано', 'Access given'), 'lead-granted'],
    closed: [L('Відхилено', 'Declined'), 'lead-closed'],
  };
  pages.leads = [L('Заявки', 'Requests'), L('Люди, які залишили заявку на lomviko.com. Дайте доступ одним натисканням — людина отримає лист із посиланням.', 'People who left a request on lomviko.com. Give access in one click — they get a letter with a link.')];
  const leads = () => data.website?.leads || [];
  const fresh = () => leads().filter((l) => l.stage === 'new').length;
  const badge = (stage) => { const [label, cls] = STAGES[stage] || STAGES.new; return `<span class="badge ${cls}">${esc(label)}</span>`; };
  const hasUser = (email) => (data.users || []).some((u) => u.email.toLowerCase() === email.toLowerCase());
  extraViews.leads = () => {
    const list = leads();
    const counts = Object.fromEntries(Object.keys(STAGES).map((k) => [k, list.filter((l) => l.stage === k).length]));
    const stats = `<div class="stats">${[[L('Нові', 'New'), counts.new], [L('В роботі', 'In progress'), counts.contacted], [L('Доступ видано', 'Access given'), counts.granted], [L('Усього', 'Total'), list.length]].map(([label, value]) => `<div class="stat"><div class="stat-top">${label}</div><div class="stat-number">${value}</div></div>`).join('')}</div>`;
    const mailHint = data.mail?.accessReady ? '' : `<div class="callout mt">${L('Щоб кнопка «Дати доступ» надсилала лист, налаштуйте пошту в розділі «Пошта».', 'To send the access letter, set up mail under Mail first.')}</div>`;
    if (!list.length) return stats + mailHint + `<section class="panel mt">${noRows(L('Заявок поки немає', 'No requests yet'))}</section>`;
    const rows = list.map((l) => {
      const granted = l.stage === 'granted' || hasUser(l.email);
      return `<tr class="${l.stage === 'new' ? 'lead-row-new' : ''}"><td><strong>${esc(l.name)}</strong><div class="sub"><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></div><div class="sub">${date(l.created_at)} · ${l.language === 'en' ? 'English' : 'Українська'}</div></td>`
        + `<td>${esc(l.business || '—')}${l.message ? `<div class="sub lead-message">${esc(l.message)}</div>` : ''}</td><td>${badge(l.stage)}</td>`
        + `<td><div class="inline-actions">${granted ? '' : `<button class="primary" data-action="lead-grant" data-id="${l.id}">${L('Дати доступ', 'Give access')}</button>`}`
        + `<button class="secondary" data-action="lead-stage" data-id="${l.id}">${L('Статус', 'Status')}</button>`
        + `<button class="danger" data-action="lead-delete" data-id="${l.id}">${L('Видалити', 'Delete')}</button></div></td></tr>`;
    }).join('');
    return stats + mailHint + `<section class="panel mt"><div class="table-wrap"><table class="table"><thead><tr><th>${L('Хто', 'Who')}</th><th>${L('Бізнес і повідомлення', 'Business and message')}</th><th>${L('Статус', 'Status')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  };
  const find = (b) => leads().find((l) => l.id === b.dataset.id);
  Object.assign(actions, {
    'lead-grant': (b) => {
      const l = find(b);
      modal(L('Дати доступ', 'Give access'),
        `<p><strong>${esc(l.name)}</strong> · ${esc(l.email)}</p><p>${L(`Буде створено компанію «${esc(l.business || l.name)}» з усіма функціями на безкоштовний період. На ${esc(l.email)} прийде лист із логіном і посиланням, щоб задати пароль.`, `A company “${esc(l.business || l.name)}” is created with every feature for the free period. ${esc(l.email)} gets a letter with the login and a link to set a password.`)}</p><p class="hint">${L('Працює і тоді, коли реєстрацію на сайті закрито.', 'Works even while sign-up on the site is closed.')}</p>`,
        async () => { await window.owner.call('owner:lead:grant', { id: l.id }); toast(L(`Доступ видано, лист надіслано на ${l.email}`, `Access given, letter sent to ${l.email}`)); },
        L('Дати доступ і надіслати лист', 'Give access and send the letter'));
    },
    'lead-stage': (b) => {
      const l = find(b);
      modal(L('Статус заявки', 'Request status'),
        `<p><strong>${esc(l.name)}</strong> · ${esc(l.email)}</p><label for="lead-stage">${L('Статус', 'Status')}</label><select id="lead-stage" name="stage">${Object.entries(STAGES).map(([k, [label]]) => `<option value="${k}" ${k === l.stage ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>`,
        async (v) => { await window.owner.call('owner:lead', { id: l.id, stage: v.stage }); });
    },
    'lead-delete': (b) => {
      const l = find(b);
      modal(L('Видалити заявку', 'Delete request'), `<p>${L(`Заявку від ${esc(l.name)} буде видалено разом із контактами. Скасувати не можна.`, `The request from ${esc(l.name)} and its contacts will be deleted. This cannot be undone.`)}</p>`,
        async () => { await window.owner.call('owner:lead:delete', { id: l.id }); }, L('Видалити', 'Delete'));
    },
  });
  // A small counter on the menu item shows new requests without opening the page.
  const addNav = () => {
    const nav = document.querySelector('aside nav');
    if (!nav) return;
    let button = nav.querySelector('[data-page="leads"]');
    if (!button) {
      button = document.createElement('button');
      button.className = 'nav';
      button.dataset.page = 'leads';
      button.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16v12H7l-3 3z"/><path d="M8 9h8M8 12h5"/></svg></span><span data-nav-label></span><b class="nav-count" hidden></b>';
      button.children[1].textContent = pages.leads[0];
      (nav.querySelector('[data-page="sales"]') || nav.querySelector('[data-page="users"]'))?.before(button) ?? nav.append(button);
    }
    const count = button.querySelector('.nav-count'), n = typeof data === 'object' && data ? fresh() : 0;
    count.hidden = !n;
    count.textContent = n;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addNav, { once: true });
  else addNav();
  window.addEventListener('owner:rendered', addNav);
})();
