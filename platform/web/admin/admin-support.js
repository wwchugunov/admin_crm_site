'use strict';
// Support requests from the app. Open a request to see the whole conversation and reply: the reply is
// saved in the customer's history in the app (Налаштування → Підтримка) and sent to them by email.
(() => {
  const L = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
  const topics = { problem: L('Щось не працює', 'Something is broken'), question: L('Питання', 'Question'), idea: L('Пропозиція', 'Idea'), billing: L('Оплата і доступ', 'Billing and access') };
  const statuses = { open: L('Потребує відповіді', 'Needs reply'), waiting: L('Чекаємо клієнта', 'Waiting for customer'), solved: L('Вирішено', 'Solved'), closed: L('Закрито', 'Closed') };
  const when = (ms) => new Date(ms).toLocaleString(OrbitI18n.language === 'en' ? 'en-GB' : 'uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const rating = (r) => (r.rating ? `<span class="support-rating ${r.rating}">${r.rating === 'good' ? L('👍 Допомогли', '👍 Helpful') : L('👎 Не допомогли', '👎 Not helpful')}</span>` : '');
  pages.support = [L('Звернення', 'Support'), L('Звернення клієнтів із застосунку. Відповідайте тут — відповідь з’явиться в застосунку клієнта й прийде йому листом.', 'Customer requests from the app. Reply here — it appears in the customer’s app and arrives by email.')];
  extraViews.support = () => {
    const rows = data.supportRequests || [];
    if (!rows.length) return noRows(L('Звернень ще немає', 'No requests yet'));
    return `<div class="support-list">${rows
      .map((r) => {
        const last = r.messages.at(-1);
        return `<button type="button" class="card support-item ${r.status}" data-action="support-open" data-id="${esc(r.id)}"><div class="support-head"><strong>№${r.number}</strong><span>${esc(topics[r.topic] || r.topic)}</span><span class="badge support-status ${r.status}">${esc(statuses[r.status] || r.status)}</span>${rating(r)}<span class="hint">${when(r.updated_at || r.created_at)}</span></div><p class="support-from">${esc(r.name || '—')} · ${esc(r.email)}${r.business ? ` · ${esc(r.business)}` : ''}</p><p class="support-preview">${last.author === 'team' ? L('Ви: ', 'You: ') : ''}${esc(last.text.slice(0, 180))}</p></button>`;
      })
      .join('')}</div>`;
  };
  function thread(r) {
    return `<div class="support-thread">${r.messages.map((m) => `<div class="support-msg ${m.author}"><div class="support-meta">${esc(m.author === 'team' ? m.name || 'LOMVIKO' : r.name || r.email)} · ${when(m.created_at)}</div><div class="support-body">${esc(m.text)}</div></div>`).join('')}</div>`;
  }
  function open(id) {
    const r = (data.supportRequests || []).find((x) => x.id === id);
    if (!r) return;
    const head = `<p class="support-from"><b>${esc(topics[r.topic] || r.topic)}</b> · ${esc(r.name || '—')} · ${esc(r.email)}${r.business ? ` · ${esc(r.business)}` : ''}${r.parent ? ` · ${L('продовження', 'follow-up of')} №${r.parent}` : ''}</p><p><span class="badge support-status ${r.status}">${esc(statuses[r.status])}</span> ${rating(r)}${r.rating_comment ? ` <span class="hint">«${esc(r.rating_comment)}»</span>` : ''}</p>`;
    const details = r.details ? `<details><summary>${L('Технічні дані', 'Technical details')}</summary><pre class="support-details">${esc(r.details)}</pre></details>` : '';
    const form = r.status === 'closed'
      ? `<p class="hint">${L('Звернення закрите. Якщо клієнт напише знову, з’явиться нове звернення з посиланням на це.', 'Closed. If the customer writes again, a new linked request appears.')}</p>`
      : `<label for="f-text">${L('Ваша відповідь', 'Your reply')}</label><textarea id="f-text" name="text" rows="6" required maxlength="8000" placeholder="${esc(L('Напишіть по-людськи: що сталося, що ми зробили і що робити клієнту', 'Write plainly: what happened, what we did, what the customer should do'))}"></textarea><label class="checkbox-line"><input type="checkbox" name="solve"> ${L('Питання вирішено — позначити як вирішене', 'Mark as solved')}</label>`;
    const buttons = `<div class="card-buttons">${r.status !== 'closed' ? `<button type="button" class="secondary" data-action="support-status" data-status="closed" data-id="${esc(r.id)}">${L('Закрити без відповіді', 'Close without reply')}</button>` : `<button type="button" class="secondary" data-action="support-status" data-status="open" data-id="${esc(r.id)}">${L('Відкрити знову', 'Reopen')}</button>`}<button type="button" class="danger" data-action="support-delete" data-id="${esc(r.id)}">${L('Видалити', 'Delete')}</button></div>`;
    modal(`${L('Звернення', 'Request')} №${r.number}`, head + thread(r) + details + form + buttons, r.status === 'closed' ? () => {} : async (v) => {
      await window.owner.call('owner:support:reply', { id: r.id, text: v.text, solve: v.solve === 'on' });
      toast(L(`Відповідь надіслано. Клієнт побачить її в застосунку й отримає листом.`, 'Reply sent: in the app and by email.'));
      await refresh();
    }, r.status === 'closed' ? L('Закрити', 'Close') : L('Надіслати відповідь', 'Send reply'));
    setTimeout(() => { const t = document.querySelector('.support-thread'); if (t) t.scrollTop = t.scrollHeight; document.querySelector('#f-text')?.focus(); }, 30);
  }
  const reload = () => refresh();
  Object.assign(actions, {
    'support-open': (b) => open(b.dataset.id),
    'support-status': async (b) => { await window.owner.call('owner:support:status', { id: b.dataset.id, status: b.dataset.status }); close(); await reload(); },
    'support-stage': async (b) => { await window.owner.call('owner:support:status', { id: b.dataset.id, status: b.dataset.stage }); await reload(); },
    'support-delete': async (b) => { await window.owner.call('owner:support:delete', { id: b.dataset.id }); close(); await reload(); },
  });
  const addNav = () => {
    const nav = document.querySelector('aside nav');
    if (!nav || nav.querySelector('[data-page="support"]')) return;
    const button = document.createElement('button');
    button.className = 'nav';
    button.dataset.page = 'support';
    button.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/></svg></span><span data-nav-label></span>';
    button.lastChild.textContent = pages.support[0];
    nav.querySelector('[data-page="admins"]')?.after(button) ?? nav.append(button);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addNav, { once: true });
  else addNav();
  // Requests that need a reply are counted next to the menu item.
  setInterval(() => {
    const label = document.querySelector('[data-page="support"] [data-nav-label]');
    if (!label || typeof data === 'undefined' || !data) return;
    const waiting = (data.supportRequests || []).filter((r) => r.status === 'open').length;
    label.textContent = pages.support[0] + (waiting ? ` (${waiting})` : '');
  }, 2000);
})();
