'use strict';
// Customer messages sent from the app ("Підтримка"). Each one is also emailed to the owner address
// from the mail settings; replying to that email reaches the customer directly.
(() => {
  const L = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
  const topics = { problem: L('Щось не працює', 'Something is broken'), question: L('Питання', 'Question'), idea: L('Пропозиція', 'Idea'), billing: L('Оплата і доступ', 'Billing and access') };
  const stages = { new: L('Нове', 'New'), answered: L('Відповіли', 'Answered'), closed: L('Закрито', 'Closed') };
  pages.support = [L('Звернення', 'Support'), L('Повідомлення клієнтів із застосунку. Відповідайте з пошти — лист піде клієнту напряму.', 'Messages from customers in the app. Reply from your mailbox — it goes straight to the customer.')];
  extraViews.support = () => {
    const rows = data.supportRequests || [];
    if (!rows.length) return noRows(L('Звернень ще немає', 'No messages yet'));
    return `<div class="support-list">${rows.map((r) => `<article class="card support-item ${r.stage}"><header><strong>${esc(topics[r.topic] || r.topic)}</strong><span class="badge">${esc(stages[r.stage] || r.stage)}</span><span class="hint">${new Date(r.created_at).toLocaleString(OrbitI18n.language === 'en' ? 'en-GB' : 'uk-UA')}</span></header><p class="support-from">${esc(r.name || '—')} · <span class="mono">${esc(r.email)}</span>${r.business ? ` · ${esc(r.business)}` : ''}</p><p class="support-text">${esc(r.message)}</p>${r.details ? `<details><summary>${L('Технічні дані', 'Technical details')}</summary><pre>${esc(r.details)}</pre></details>` : ''}<div class="card-buttons">${r.stage !== 'answered' ? `<button class="secondary" data-action="support-stage" data-stage="answered" data-id="${esc(r.id)}">${L('Відповіли', 'Answered')}</button>` : ''}${r.stage !== 'closed' ? `<button class="secondary" data-action="support-stage" data-stage="closed" data-id="${esc(r.id)}">${L('Закрити', 'Close')}</button>` : ''}<button class="danger" data-action="support-delete" data-id="${esc(r.id)}">${L('Видалити', 'Delete')}</button></div></article>`).join('')}</div>`;
  };
  const reload = () => refresh();
  Object.assign(actions, {
    'support-stage': async (b) => { await window.owner.call('owner:support:stage', { id: b.dataset.id, stage: b.dataset.stage }); await reload(); },
    'support-delete': async (b) => { await window.owner.call('owner:support:delete', { id: b.dataset.id }); await reload(); },
  });
  const addNav = () => {
    const nav = document.querySelector('aside nav');
    if (!nav || nav.querySelector('[data-page="support"]')) return;
    const button = document.createElement('button');
    button.className = 'nav';
    button.dataset.page = 'support';
    button.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/></svg></span><span data-nav-label></span>';
    button.lastChild.textContent = pages.support[0];
    const fresh = (data?.supportRequests || []).filter((r) => r.stage === 'new').length;
    if (fresh) button.lastChild.textContent += ` (${fresh})`;
    nav.querySelector('[data-page="admins"]')?.after(button) ?? nav.append(button);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addNav, { once: true });
  else addNav();
})();
