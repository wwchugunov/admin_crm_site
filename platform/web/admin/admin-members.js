'use strict';
// Administrators: the owner invites people by email; each signs in with their own
// password and authenticator code. Only the owner sees and changes this list.
(() => {
  const L = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
  const statusName = { active: L('Активний', 'Active'), invited: L('Запрошено', 'Invited'), expired: L('Посилання прострочене', 'Link expired') };
  pages.admins = [L('Адміністратори', 'Administrators'), L('Хто ще може керувати LOMVIKO. Кожен входить зі своїм паролем і кодом.', 'Who else can manage LOMVIKO. Everyone signs in with their own password and code.')];
  extraViews.admins = () => {
    if (data.adminMe && !data.adminMe.owner) return noRows(L('Цей розділ доступний лише власнику', 'Only the owner can manage administrators'));
    const rows = data.adminMembers || [];
    return `<div class="list-toolbar"><p class="hint">${L('Запрошений отримає лист з інструкцією та посиланням на 48 годин.', 'The invitee gets an email with instructions and a link valid for 48 hours.')}</p><button class="primary" data-action="member-invite">${L('Запросити адміністратора', 'Invite administrator')}</button></div><section class="panel">${rows.length ? `<table class="table"><thead><tr><th>${L('Адміністратор', 'Administrator')}</th><th>${L('Стан', 'Status')}</th><th>${L('Додано', 'Added')}</th><th></th></tr></thead><tbody>${rows.map((m) => `<tr><td><strong>${esc(m.name)}</strong><div class="sub">${esc(m.email)}</div></td><td><span class="badge ${m.status === 'active' ? '' : 'cancelled'}">${statusName[m.status]}</span></td><td>${date(m.created_at)}</td><td><div class="inline-actions">${m.status !== 'active' ? `<button class="secondary" data-action="member-resend" data-id="${m.id}">${L('Надіслати ще раз', 'Resend')}</button>` : ''}<button class="danger" data-action="member-delete" data-id="${m.id}">${L('Забрати доступ', 'Remove access')}</button></div></td></tr>`).join('')}</tbody></table>` : noRows(L('Поки що керуєте лише ви', 'Only you manage LOMVIKO so far'))}</section>`;
  };
  const shown = (result) => {
    submitAction = null;
    setTimeout(() => modal(L('Запрошення створено', 'Invitation created'), `<p>${result.mailed ? L('Лист з інструкцією надіслано.', 'The email with instructions is on its way.') : L('Пошту не налаштовано — надішліть посилання самі.', 'Email is not configured — send the link yourself.')}</p>` + field(L('Посилання (48 годин, одноразове)', 'Link (48 hours, single use)'), 'link', 'text', `readonly value="${esc(result.link)}"`), () => {}, L('Готово', 'Done')), 0);
  };
  Object.assign(actions, {
    'member-invite': () => modal(L('Запросити адміністратора', 'Invite administrator'), field(L('Ім’я', 'Name'), 'name', 'text', 'required maxlength="120"') + field('Email', 'email', 'email', 'required maxlength="254"') + `<p class="hint">${L('Адміністратор зможе керувати користувачами, компаніями, сайтом, поштою й версіями. Додавати інших адміністраторів можете лише ви.', 'Administrators can manage users, companies, the website, mail and releases. Only you can add other administrators.')}</p>`, async (v) => shown(await window.owner.call('owner:members:invite', v)), L('Надіслати запрошення', 'Send invitation')),
    'member-resend': async (b) => shown(await window.owner.call('owner:members:resend', { id: b.dataset.id })),
    'member-delete': (b) => {
      const m = (data.adminMembers || []).find((x) => x.id === b.dataset.id);
      modal(L('Забрати доступ', 'Remove access'), `<p>${esc(m?.name || '')} · ${esc(m?.email || '')}</p><p class="hint">${L('Людина одразу вийде з панелі й більше не зможе увійти.', 'The person is signed out at once and cannot sign in again.')}</p>`, () => window.owner.call('owner:members:delete', { id: b.dataset.id }), L('Забрати доступ', 'Remove access'));
    },
  });
  const addNav = () => {
    const nav = document.querySelector('aside nav');
    if (!nav || nav.querySelector('[data-page="admins"]')) return;
    const button = document.createElement('button');
    button.className = 'nav';
    button.dataset.page = 'admins';
    button.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 11l2 2 3.5-4"/></svg></span><span data-nav-label></span>';
    button.lastChild.textContent = pages.admins[0];
    nav.querySelector('[data-page="security"]')?.after(button) ?? nav.append(button);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addNav, { once: true });
  else addNav();
})();
