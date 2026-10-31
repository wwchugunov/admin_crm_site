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
  const userFor = (email) => (data.users || []).find((u) => !u.account_id && u.email.toLowerCase() === email.toLowerCase());
  const shortDate = (t) => t >= 253402300799000 ? L('безстроково', 'no end') : new Date(t).toLocaleDateString(OrbitI18n.locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
  const planName = (u) => { if (u.stage === 'trial') return L('Усі функції', 'All features'); const p = (data.product?.plans || []).find((x) => x.id === u.plan); return p ? L(p.uk, p.en) : u.plan; };
  extraViews.leads = () => {
    const list = leads();
    const counts = Object.fromEntries(Object.keys(STAGES).map((k) => [k, list.filter((l) => l.stage === k).length]));
    const stats = `<div class="stats">${[[L('Нові', 'New'), counts.new], [L('В роботі', 'In progress'), counts.contacted], [L('Доступ видано', 'Access given'), counts.granted], [L('Усього', 'Total'), list.length]].map(([label, value]) => `<div class="stat"><div class="stat-top">${label}</div><div class="stat-number">${value}</div></div>`).join('')}</div>`;
    const mailHint = data.mail?.accessReady ? '' : `<div class="callout mt">${L('Щоб кнопка «Дати доступ» надсилала лист, налаштуйте пошту в розділі «Пошта».', 'To send the access letter, set up mail under Mail first.')}</div>`;
    if (!list.length) return stats + mailHint + `<section class="panel mt">${noRows(L('Заявок поки немає', 'No requests yet'))}</section>`;
    const rows = list.map((l) => {
      const u = userFor(l.email), had = u && l.stage !== 'granted';
      // After access is given, the row shows what the person has and whether they signed in.
      const access = u ? `<div class="sub lead-access">${esc(planName(u))} · ${L('до', 'until')} ${shortDate(u.expires)}</div><div class="sub">${u.last_seen ? `${L('Входив', 'Last sign-in')}: ${date(u.last_seen)}` : L('Ще не входив', 'Not signed in yet')}</div>` : '';
      return `<tr class="${l.stage === 'new' ? 'lead-row-new' : ''}"><td><strong>${esc(l.name)}</strong><div class="sub"><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></div><div class="sub">${date(l.created_at)} · ${l.language === 'en' ? 'English' : 'Українська'}</div></td>`
        + `<td>${esc(l.business || '—')}${l.message ? `<div class="sub lead-message">${esc(l.message)}</div>` : ''}</td><td>${had ? `<span class="badge lead-granted">${L('Вже має акаунт', 'Already has an account')}</span>` : badge(l.stage)}${access}</td>`
        + `<td><div class="inline-actions">${u ? `<button class="secondary" data-action="mail-access" data-id="${u.id}">${L('Надіслати лист ще раз', 'Send the letter again')}</button><button class="secondary" data-action="lead-open-user" data-email="${esc(l.email)}">${L('Відкрити користувача', 'Open user')}</button>` : `<button class="primary" data-action="lead-grant" data-id="${l.id}">${L('Дати доступ', 'Give access')}</button><button class="secondary" data-action="lead-stage" data-id="${l.id}">${L('Статус', 'Status')}</button>`}`
        + `<button class="danger" data-action="lead-delete" data-id="${l.id}">${L('Видалити', 'Delete')}</button></div></td></tr>`;
    }).join('');
    return stats + mailHint + `<section class="panel mt"><div class="table-wrap"><table class="table"><thead><tr><th>${L('Хто', 'Who')}</th><th>${L('Бізнес і повідомлення', 'Business and message')}</th><th>${L('Статус', 'Status')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  };
  const find = (b) => leads().find((l) => l.id === b.dataset.id);
  Object.assign(actions, {
    // Opens Users filtered to this email: extend, block or change the plan there.
    'lead-open-user': (b) => { search = b.dataset.email; page = 'users'; render(); const box = document.querySelector('#search'); if (box) box.value = search; },
    'lead-grant': (b) => {
      const l = find(b), product = data.product || {}, freeUntil = product.free_until || Date.now() + 30 * 86400000;
      const freeDate = new Date(Math.max(freeUntil, Date.now() + 30 * 86400000)).toLocaleDateString(OrbitI18n.locale(), { day: 'numeric', month: 'long', year: 'numeric' });
      const plans = [['all', L('Усі функції — безкоштовний період', 'All features — free period')], ...(product.plans || []).map((p) => [p.id, `${L(p.uk, p.en)} — ${p.price} ${L('грн/міс', 'UAH/mo')}`])];
      const terms = [['free', L(`До ${freeDate} (безкоштовний період)`, `Until ${freeDate} (free period)`)], ['14', L('14 днів', '14 days')], ['30', L('30 днів', '30 days')], ['90', L('90 днів', '90 days')], ['365', L('1 рік', '1 year')], ['date', L('Своя дата…', 'Pick a date…')]];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      modal(L('Дати доступ', 'Give access'),
        `<p><strong>${esc(l.name)}</strong> · ${esc(l.email)}</p>`
        + field(L('Назва компанії', 'Company name'), 'business', 'text', `required maxlength="120" value="${esc(l.business || l.name)}"`)
        + `<label for="f-plan">${L('Тариф', 'Plan')}</label><select id="f-plan" name="plan">${plans.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select>`
        + `<p class="hint">${product.sales ? L('Продажі ввімкнено: людина отримає лише функції обраного тарифу.', 'Sales are on: the person gets only the features of the chosen plan.') : L('Поки продажі вимкнені, у всіх відкриті всі функції — тариф лише запам’ятовується й вказується в листі.', 'While sales are off everyone has every feature — the plan is only recorded and named in the letter.')}</p>`
        + `<label for="f-term">${L('Доступ діє', 'Access lasts')}</label><select id="f-term" name="term">${terms.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select>`
        + `<div id="grant-date" hidden>${field(L('До дати', 'Until'), 'until', 'date', `min="${tomorrow}"`)}</div>`
        + `<p class="hint">${L(`На ${esc(l.email)} прийде лист: тариф, строк доступу, логін і кнопка «Задати пароль». Працює і тоді, коли реєстрацію на сайті закрито.`, `${esc(l.email)} gets a letter with the plan, the end date, the login and a “Set password” button. Works even while sign-up is closed.`)}</p>`,
        async (v) => {
          const days = Number(v.term), expires = v.term === 'free' ? undefined : v.term === 'date' ? new Date(v.until + 'T23:59:00').getTime() : Date.now() + days * 86400000;
          if (v.term === 'date' && !v.until) throw Error(L('Оберіть дату', 'Pick a date'));
          await window.owner.call('owner:lead:grant', { id: l.id, plan: v.plan, business: v.business, ...(expires ? { expires } : {}) });
          toast(L(`Доступ видано, лист надіслано на ${l.email}`, `Access given, letter sent to ${l.email}`));
        },
        L('Дати доступ і надіслати лист', 'Give access and send the letter'));
      const term = document.querySelector('#f-term'), box = document.querySelector('#grant-date');
      term.addEventListener('change', () => { box.hidden = term.value !== 'date'; box.querySelector('input').required = term.value === 'date'; });
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
