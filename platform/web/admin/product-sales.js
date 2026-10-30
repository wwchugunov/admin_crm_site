'use strict';
// "Продажі": two switches the LOMVIKO owner controls. Sales on publishes the offer, shows prices and
// plan limits; off keeps everything free with no documents. Registration closed stops new sign-ups.
(() => {
  const L = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
  pages.sales = [L('Продажі', 'Sales'), L('Чи продаєте ви LOMVIKO зараз і чи можуть нові люди реєструватися.', 'Whether you are selling LOMVIKO now and whether new people can sign up.')];
  const toggle = (key, on, title, onText, offText, effects) =>
    `<section class="panel sales-switch ${on ? 'is-on' : ''}"><div class="sales-switch-head"><div><h2>${title}</h2><p class="sales-state">${on ? onText : offText}</p></div><button class="${on ? 'secondary' : 'primary'}" data-action="product-switch" data-key="${key}" data-on="${on ? '0' : '1'}">${on ? L('Вимкнути', 'Turn off') : L('Увімкнути', 'Turn on')}</button></div><ul class="sales-effects">${effects.map((e) => `<li>${e}</li>`).join('')}</ul></section>`;
  extraViews.sales = () => {
    const p = data.product || { sales: false, registration: true, plans: [] };
    const counts = {};
    for (const u of data.users || []) if (!u.account_id && u.stage === 'active') counts[u.plan || 'start'] = (counts[u.plan || 'start'] || 0) + 1;
    const plans = `<section class="panel"><div class="panel-head"><h2>${L('Тарифи', 'Plans')}</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>${L('Тариф', 'Plan')}</th><th>${L('Ціна', 'Price')}</th><th>${L('Користувачів', 'Users')}</th><th>${L('Оплачених компаній', 'Paying companies')}</th></tr></thead><tbody>${p.plans.map((x) => `<tr><td><strong>${esc(L(x.uk, x.en))}</strong><div class="sub">${esc(L(x.for.uk, x.for.en))}</div></td><td>${x.price} ${L('грн/міс', 'UAH/mo')}</td><td>${L('без обмежень', 'unlimited')}</td><td>${counts[x.id] || 0}</td></tr>`).join('')}</tbody></table></div><p class="hint">${L('Тариф компанії обираєте, коли підтверджуєте оплату («Користувачі» → «Підтвердити покупку») або в «Змінити».', 'Pick a company’s plan when you confirm a payment (Users → Confirm purchase) or in Edit.')}</p></section>`;
    return `<div class="sales-grid">${toggle('sales', p.sales, L('Продажі', 'Sales'), L('Увімкнено: ви продаєте LOMVIKO', 'On: you are selling LOMVIKO'), L('Вимкнено: усе безкоштовно, без документів', 'Off: everything is free, no documents'), [
      L('На сайті — ціни трьох тарифів і кнопки «Обрати»; коли вимкнено — «Зараз безкоштовно»', 'The site shows the three plans with prices; when off it says “free for now”'),
      L('Публічна оферта з’являється на сайті й у реєстрації, клієнти приймають її', 'The public offer appears on the site and in sign-up'),
      L('Оплачені компанії отримують лише функції свого тарифу; пробний період — усе', 'Paying companies get only their plan’s features; a trial gets everything'),
    ])}${toggle('registration', p.registration, L('Реєстрація', 'Registration'), L('Відкрита: нові люди можуть зареєструватися', 'Open: new people can sign up'), L('Закрита: нових реєстрацій немає', 'Closed: no new sign-ups'), [
      L('Коли закрито, сайт і застосунок замість «Спробувати» пропонують залишити заявку', 'When closed, the site and the app offer to leave a request instead of “Try”'),
      L('Ті, хто вже зареєстрований, працюють як раніше', 'Existing users keep working as before'),
      L('Ви можете й далі створювати акаунти вручну в «Користувачі»', 'You can still create accounts by hand under Users'),
    ])}${toggle('owner', p.owner !== false, L('Власник сервісу на сайті', 'Service owner on the site'), L('Показано: у підвалі сайту «Власник сервісу — Чугунов Василь Васильович»', 'Shown: the site footer names the service owner'), L('Приховано: у підвалі лише © LOMVIKO', 'Hidden: the footer shows only © LOMVIKO'), [
      L('Поки LOMVIKO безкоштовний, рядок можна приховати', 'While LOMVIKO is free the line can be hidden'),
      L('Коли вмикаєте продажі, увімкніть і цей рядок: покупець має бачити, хто продає', 'When you turn sales on, show it too: buyers must see who sells'),
      L('Ім’я власника все одно вказане в «Умовах користування» і Політиці конфіденційності', 'The owner is still named in the Terms of use and the Privacy policy'),
    ])}</div>${plans}`;
  };
  Object.assign(actions, {
    'product-switch': async (b) => {
      await window.owner.call('owner:product', { [b.dataset.key]: b.dataset.on === '1' });
      await refresh();
      toast(L('Збережено', 'Saved'));
    },
  });
  const addNav = () => {
    const nav = document.querySelector('aside nav');
    if (!nav || nav.querySelector('[data-page="sales"]')) return;
    const button = document.createElement('button');
    button.className = 'nav';
    button.dataset.page = 'sales';
    button.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h18l-2 11H5z"/><path d="M8 7a4 4 0 0 1 8 0"/></svg></span><span></span>';
    button.lastChild.textContent = pages.sales[0];
    nav.querySelector('[data-page="users"]')?.before(button) ?? nav.append(button);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addNav, { once: true });
  else addNav();
})();
