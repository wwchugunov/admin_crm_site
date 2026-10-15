'use strict';
// Owner sign-in details: email + password (+ the authenticator code at sign-in).
// Until a password exists, the panel asks for one right after the emergency-key sign-in.
(() => {
  const L = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
  let prompted = false;
  function accountModal() {
    const account = data?.adminAccount || {}, first = !account.configured;
    modal(
      first ? L('Створіть логін і пароль', 'Create your sign-in') : L('Логін і пароль', 'Sign-in details'),
      (first ? `<p class="hint">${L('Далі входьте за email, паролем і кодом із телефона. Аварійний ключ залишиться для відновлення доступу.', 'From now on sign in with email, password and the phone code. The emergency key stays for recovery.')}</p>` : '') +
        field('Email', 'login', 'email', `required maxlength="254" autocomplete="username" value="${esc(account.login || 'w.w.chugunov@gmail.com')}"`) +
        (first ? '' : field(L('Поточний пароль', 'Current password'), 'current_password', 'password', 'required maxlength="128" autocomplete="current-password"')) +
        field(L('Новий пароль (від 12 символів)', 'New password (12+ characters)'), 'password', 'password', 'required minlength="12" maxlength="128" autocomplete="new-password"') +
        field(L('Повторіть пароль', 'Repeat password'), 'confirm', 'password', 'required minlength="12" maxlength="128" autocomplete="new-password"'),
      async (v) => {
        if (v.password !== v.confirm) throw Error(L('Паролі не збігаються', 'Passwords do not match'));
        await window.owner.call('owner:admin:account', { login: v.login, password: v.password, current_password: v.current_password || '' });
        toast(L('Збережено. Наступного разу входьте за email, паролем і кодом.', 'Saved. Next time sign in with email, password and code.'));
      },
      L('Зберегти', 'Save'),
    );
  }
  actions['admin-account'] = accountModal;
  setInterval(() => {
    if (prompted || typeof data === 'undefined' || !data?.adminAccount || data.adminAccount.configured || document.querySelector('#modal').open) return;
    prompted = true;
    accountModal();
  }, 1000);
  const addButton = () => {
    const bottom = document.querySelector('.sidebar-bottom');
    if (!bottom || bottom.querySelector('[data-action="admin-account"]')) return;
    const button = document.createElement('button');
    button.className = 'secondary';
    button.dataset.action = 'admin-account';
    button.textContent = L('Логін і пароль', 'Sign-in details');
    bottom.prepend(button);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton, { once: true });
  else addButton();
})();
