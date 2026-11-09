'use strict';
// "Продажі": the free or selling mode, its end date, what is still missing before selling, who needs attention and
// what to do next. Every rule is enforced by the API (api/sales.cjs); this page only explains it.
(() => {
  const L = (uk, en) => (OrbitI18n.language === 'en' ? en : uk);
  pages.sales = [L('Продажі', 'Sales'), L('Безкоштовно чи продаж, дата, клієнти й підписки.', 'Free or selling, the date, clients and subscriptions.')];
  const day = (ms) => new Date(ms).toLocaleDateString(OrbitI18n.locale(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' }).replace(/\s*р\.$/, '');
  const iso = (ms) => new Date(ms + 3 * 3600000).toISOString().slice(0, 10);
  const planName = (p, id) => { const x = (p.plans || []).find((v) => v.id === id); return x ? L(x.uk, x.en) : id; };
  const toggle = (key, on, title, onText, offText, effects, blocked) =>
    `<section class="panel sales-switch ${on ? 'is-on' : ''}"><div class="sales-switch-head"><div><h2>${title}</h2><p class="sales-state">${on ? onText : offText}</p></div><button class="${on ? 'secondary' : 'primary'}" data-action="product-switch" data-key="${key}" data-on="${on ? '0' : '1'}"${blocked ? ' disabled' : ''}>${on ? L('Вимкнути', 'Turn off') : L('Увімкнути', 'Turn on')}</button></div><ul class="sales-effects">${effects.map((e) => `<li>${e}</li>`).join('')}</ul></section>`;

  const modeSection = (s) => {
    const warn = !s.sales && s.date_passed
      ? `<div class="sales-alert">${L(`Дата ${day(s.free_until)} минула, а продажі вимкнені. Клієнти працюють безкоштовно, нічого не блокується. Перенесіть дату або готуйтеся до продажів.`, `${day(s.free_until)} has passed and sales are off. Clients keep working for free and nothing is locked. Move the date or prepare to sell.`)}</div>` : '';
    const state = s.sales
      ? `<strong>${L('Зараз: продажі ввімкнено', 'Now: selling')}</strong><p>${L('На сайті ціни й кнопки вибору, діє публічна оферта, працюють обмеження тарифів.', 'The site shows prices, the public offer applies, plan limits work.')}</p>`
      : `<strong>${L('Зараз: усе безкоштовно', 'Now: everything is free')}</strong><p>${s.date_passed ? L('На сайті: «Зараз безкоштовно».', 'The site says “free for now”.') : L(`На сайті: «Безкоштовно до ${day(s.free_until)}». Днів лишилося: ${s.days_left}.`, `The site says “free until ${day(s.free_until)}”. Days left: ${s.days_left}.`)}</p>`;
    const dateForm = s.sales ? '' : `<div class="sales-date"><label for="sales-date">${L('Безкоштовно до', 'Free until')}</label><input id="sales-date" type="date" value="${iso(s.free_until)}"><button class="secondary" data-action="sales-date">${L('Зберегти дату', 'Save the date')}</button><p class="hint">${L('Дата одразу зʼявиться на сайті й у доступах клієнтів. Перенести раніше можна лише щонайменше на 30 днів уперед.', 'The date appears at once on the site and in client access. It can be moved earlier only to at least 30 days ahead.')}</p></div>`;
    const button = s.sales
      ? `<button class="secondary" data-action="sales-switch" data-on="0">${L('Повернути безкоштовний режим', 'Back to free')}</button>`
      : `<button class="primary" data-action="sales-switch" data-on="1"${s.ready ? '' : ' disabled'}>${L('Увімкнути продажі', 'Start selling')}</button>${s.ready ? '' : `<p class="hint">${L('Кнопка запрацює, коли всі пункти нижче будуть виконані.', 'The button works once every item below is done.')}</p>`}`;
    return `<section class="panel sales-mode">${warn}<div class="sales-mode-state">${state}${button}</div>${dateForm}</section>`;
  };

  const checklist = (s) => s.sales ? '' : `<section class="panel"><div class="panel-head"><h2>${L('Що потрібно перед продажами', 'Before you start selling')}</h2></div><ul class="sales-checks">${s.checks.map((c) => `<li class="${c.ok ? 'is-ok' : 'is-missing'}"><span class="sales-check-mark">${c.ok ? '✓' : '○'}</span><div><strong>${esc(c.title)}</strong>${c.ok && !c.manual ? '' : `<p class="hint">${esc(c.hint)}</p>`}${c.manual ? `<label class="checkbox-line"><input type="checkbox" data-sales-confirm="${c.id}"${c.ok ? ' checked' : ''}>${L('Зроблено', 'Done')}</label>` : ''}${c.id === 'notice' && !c.ok ? `<button class="secondary" data-action="sales-notice">${L('Попередити клієнтів', 'Notify clients')}</button>` : ''}</div></li>`).join('')}</ul></section>`;

  const STATUS = {
    ended: () => [L('Закінчилась', 'Ended'), 'state-warn'], ending: () => [L('Скоро закінчиться', 'Ending soon'), 'state-warn'],
    active: () => [L('Оплачено', 'Paid'), 'state-ok'], trial: () => [L('Пробний період', 'Trial'), 'state-info'], free: () => [L('Безкоштовно', 'Free'), 'state-info'],
  };
  const subscriptions = (s, p) => {
    const need = s.subscriptions.filter((r) => r.status === 'ended' || r.status === 'ending');
    const row = (r) => {
      const [label, cls] = STATUS[r.status]();
      const term = r.status === 'free' ? L('без обмежень, поки безкоштовно', 'open while free') : r.days > 0 ? `${day(r.expires)} · ${L('днів', 'days')}: ${r.days}` : `${day(r.expires)}<div class="sub">${L(`дані можна вивантажити до ${day(r.exportUntil)}, видалення ${day(r.deleteOn)}`, `export until ${day(r.exportUntil)}, deletion ${day(r.deleteOn)}`)}</div>`;
      const buttons = r.status === 'free' ? '' : `<button class="secondary" data-action="sales-remind" data-id="${esc(r.id)}">${L('Нагадати', 'Remind')}</button> <button class="primary" data-action="mail-purchase" data-id="${esc(r.id)}">${L('Оплату отримано', 'Payment received')}</button>`;
      return `<tr><td><strong>${esc(r.business || r.name)}</strong><div class="sub">${esc(r.name)}</div></td><td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td><td>${esc(r.stage === 'active' ? planName(p, r.plan) : '—')}</td><td><span class="state ${cls}">${label}</span></td><td>${term}</td><td class="sales-actions">${buttons}</td></tr>`;
    };
    const table = (rows) => `<div class="table-wrap"><table class="table"><thead><tr><th>${L('Компанія', 'Company')}</th><th>Email</th><th>${L('Тариф', 'Plan')}</th><th>${L('Стан', 'Status')}</th><th>${L('Діє до', 'Until')}</th><th></th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div>`;
    const c = s.counts;
    const counts = `<p class="sales-counts">${s.sales ? L(`Оплачено: ${c.active} · Пробний період: ${c.trial} · Скоро закінчиться: ${c.ending} · Закінчилась: ${c.ended}`, `Paid: ${c.active} · Trial: ${c.trial} · Ending soon: ${c.ending} · Ended: ${c.ended}`) : L(`Працюють безкоштовно: ${c.free}${c.trial ? ` · З обраною датою: ${c.trial}` : ''}`, `Working for free: ${c.free}`)}</p>`;
    const attention = need.length
      ? `<h3 class="sales-sub">${L('Потрібна ваша увага', 'Needs your attention')} (${need.length})</h3>${table(need)}`
      : `<p class="hint sales-none">${L('Зараз нікому не потрібно нагадувати.', 'Nobody needs a reminder right now.')}</p>`;
    const rest = s.subscriptions.filter((r) => !need.includes(r));
    return `<section class="panel"><div class="panel-head"><h2>${L('Підписки: кого інформувати', 'Subscriptions: who to inform')}</h2></div>${counts}${attention}${rest.length ? `<details class="sales-rest"><summary>${L('Усі інші', 'Everyone else')} (${rest.length})</summary>${table(rest)}</details>` : ''}</section>`;
  };

  const guide = (s) => {
    const steps = s.sales ? [
      L('<strong>Ви нічого не пропустите.</strong> За 7, 3 і 1 день до кінця та в день закінчення клієнт сам отримує лист. Вам приходить лист зі списком, кому закінчується, а тут він у таблиці вище.', '<strong>You will not miss anything.</strong> Clients get emails 7, 3 and 1 days before the end and on the day. You get an email with the list, and they appear in the table above.'),
      L('<strong>Клієнт відповідає</strong> на лист або натискає «Продовжити» в застосунку: запит приходить у «Звернення». Можна й самому написати на його пошту з таблиці.', '<strong>The client replies</strong> to the email or presses renew in the app: the request lands in Support. You can also email them from the table.'),
      L('<strong>Ви надсилаєте рахунок</strong> на свій ФОП. Автоматичної оплати підписки немає.', '<strong>You send an invoice</strong> from your business. There is no automatic subscription payment.'),
      L('<strong>Гроші прийшли:</strong> натисніть «Оплату отримано», вкажіть номер платежу, тариф і дні. Доступ продовжиться, клієнт отримає лист.', '<strong>Money received:</strong> press “Payment received” and enter the reference, plan and days. Access extends and the client gets an email.'),
      L('<strong>Не оплатив:</strong> редагування зупиняється, запис через бота й сторінку не приймається. 30 днів дані можна переглядати й вивантажувати, через 90 днів вони видаляються. Лист про це клієнт отримує сам.', '<strong>Not paid:</strong> editing stops and bookings stop. Data can be viewed and exported for 30 days and is deleted after 90 days. The client is told automatically.'),
    ] : [
      L('<strong>Зараз нічого робити не треба.</strong> Клієнти працюють безкоштовно. Навіть якщо дата мине, нікого не заблокує й нічого не видалиться.', '<strong>Nothing to do now.</strong> Clients work for free. Even if the date passes nothing is locked or deleted.'),
      L('<strong>Вам нагадає пошта</strong> за 60, 30 і 7 днів до дати.', '<strong>Email reminds you</strong> 60, 30 and 7 days before the date.'),
      L('<strong>За 2–3 місяці до продажів:</strong> бухгалтер і ФОП, потім заповнена оферта в «Документах».', '<strong>2–3 months before selling:</strong> an accountant and a registered business, then the completed offer under Documents.'),
      L('<strong>Щонайменше за 30 днів:</strong> кнопка «Попередити клієнтів». Лист надішлеться всім, дату буде запамʼятовано.', '<strong>At least 30 days before:</strong> press “Notify clients”. Everyone gets an email and the date is recorded.'),
      L('<strong>У день старту:</strong> «Увімкнути продажі». Безкоштовні клієнти отримають ще 7 днів і нагадування, далі працюватимуть за оплатою.', '<strong>On the start day:</strong> press “Start selling”. Free clients get 7 more days and reminders, then need a paid plan.'),
    ];
    return `<section class="panel"><div class="panel-head"><h2>${s.sales ? L('Що далі, коли продажі ввімкнено', 'What happens while selling') : L('Як перейти до продажів', 'How to start selling')}</h2></div><ol class="sales-steps">${steps.map((x) => `<li>${x}</li>`).join('')}</ol></section>`;
  };

  extraViews.sales = () => {
    const p = data.product || { plans: [] }, s = data.sales;
    if (!s) return '';
    const plans = `<section class="panel"><div class="panel-head"><h2>${L('Тарифи', 'Plans')}</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>${L('Тариф', 'Plan')}</th><th>${L('Ціна', 'Price')}</th></tr></thead><tbody>${(p.plans || []).map((x) => `<tr><td><strong>${esc(L(x.uk, x.en))}</strong><div class="sub">${esc(L(x.for.uk, x.for.en))}</div></td><td>${x.price} ${L('грн/міс', 'UAH/mo')}</td></tr>`).join('')}</tbody></table></div></section>`;
    const others = `<div class="sales-grid">${toggle('registration', p.registration, L('Реєстрація', 'Registration'), L('Відкрита: нові люди можуть зареєструватися', 'Open: new people can sign up'), L('Закрита: нових реєстрацій немає', 'Closed: no new sign-ups'), [
      L('Коли закрито, сайт і застосунок пропонують залишити заявку', 'When closed, the site and the app offer to leave a request'),
      L('Вже зареєстровані працюють як раніше', 'Existing users keep working'),
      ...(s.registration_ready ? [] : [p.registration ? L('<strong>Увага: реєстрація відкрита, а Політика чи Умови не показуються. Завантажте й увімкніть їх у «Документах» або закрийте реєстрацію.</strong>', '<strong>Warning: registration is open but the Policy or Terms are not shown. Upload and enable them under Documents, or close registration.</strong>') : L('<strong>Щоб відкрити, спершу завантажте й увімкніть Політику та Умови в «Документах».</strong>', '<strong>To open it, first upload and enable the Policy and Terms under Documents.</strong>')]),
    ], !p.registration && !s.registration_ready)}${toggle('owner', p.owner !== false, L('Ваше імʼя в підвалі сайту', 'Your name in the site footer'), L('Показано', 'Shown'), L('Приховано', 'Hidden'), [
      L('Поки безкоштовно, рядок можна приховати. Під час продажів він показується завжди.', 'While free the line can be hidden. While selling it is always shown.'),
      L('Імʼя все одно вказане в Політиці й Умовах: цього вимагає закон про персональні дані (стаття 12).', 'The name stays in the Policy and Terms: the personal data law requires it (article 12).'),
    ])}</div>`;
    const history = (data.events || []).filter((e) => /^(product\.|sales\.|purchase)/.test(e.event)).slice(0, 12);
    const log = history.length ? `<section class="panel"><div class="panel-head"><h2>${L('Історія змін', 'History')}</h2></div>${eventTable(history)}</section>` : '';
    return modeSection(s) + checklist(s) + subscriptions(s, p) + guide(s) + others + plans + log;
  };

  const effectsOn = () => [
    L('На сайті зʼявляться три тарифи з цінами й кнопки вибору', 'The site shows three plans with prices'),
    L('Оферта зʼявиться на сайті й замінить Умови користування', 'The offer appears and replaces the Terms'),
    L('У підвалі сайту зʼявиться ваше імʼя', 'Your name appears in the site footer'),
    L('Запрацюють обмеження тарифів для тих, хто оплатив', 'Plan limits apply to paying clients'),
    L('Безкоштовні клієнти отримають ще 7 днів і нагадування, потім їм потрібна оплата', 'Free clients get 7 more days and reminders, then need to pay'),
    L('Усі користувачі побачать прохання прийняти оферту', 'Everyone is asked to accept the offer'),
  ];
  const effectsOff = (s) => [
    L('Ціни й оферта зникнуть із сайту, знову діятимуть Умови користування', 'Prices and the offer disappear, the Terms apply again'),
    L('Обмеження тарифів вимкнуться: усі функції для всіх', 'Plan limits switch off: every feature for everyone'),
    L('Безкоштовні клієнти знову працюватимуть без блокувань', 'Free clients keep working with no locks'),
    ...(s.paying ? [L(`<strong>Клієнти, що заплатили (${s.paying}), мають діючий доступ: поясніть їм зміну самі.</strong>`, `<strong>${s.paying} paying clients have active access: tell them about the change yourself.</strong>`)] : []),
  ];
  Object.assign(actions, {
    'product-switch': async (b) => {
      await window.owner.call('owner:product', { [b.dataset.key]: b.dataset.on === '1' });
      await refresh();
      toast(L('Збережено', 'Saved'));
    },
    'sales-switch': (b) => {
      const on = b.dataset.on === '1', s = data.sales;
      modal(on ? L('Увімкнути продажі?', 'Start selling?') : L('Повернути безкоштовний режим?', 'Back to free?'),
        `<p>${L('Ось що зміниться одразу:', 'This changes right away:')}</p><ul class="sales-effects">${(on ? effectsOn() : effectsOff(s)).map((x) => `<li>${x}</li>`).join('')}</ul>`,
        async () => { await window.owner.call('owner:product', on ? { sales: true } : { sales: false, confirm: true }); await refresh(); toast(L('Збережено', 'Saved')); },
        on ? L('Так, увімкнути продажі', 'Yes, start selling') : L('Так, повернути', 'Yes, go back'));
    },
    'sales-date': async () => {
      const value = $('#sales-date').value;
      if (!value) throw Error(L('Оберіть дату', 'Pick a date'));
      await window.owner.call('owner:sales:date', { date: value });
      await refresh();
      toast(L('Дату збережено', 'Date saved'));
    },
    'sales-notice': () => {
      const people = data.sales.subscriptions.length;
      modal(L('Попередити клієнтів?', 'Notify clients?'), `<p>${L(`Лист про платні тарифи й дату отримають усі клієнти: ${people}. Повторно цей лист той самий клієнт не отримає.`, `All clients get an email about paid plans and the date: ${people}. Nobody gets the same email twice.`)}</p>`,
        async () => { const r = await window.owner.call('owner:sales:notice', {}); await refresh(); toast(L(`Надіслано листів: ${r.notified}`, `Emails queued: ${r.notified}`)); },
        L('Надіслати', 'Send'));
    },
    'sales-remind': async (b) => {
      await window.owner.call('owner:sales:remind', { user_id: b.dataset.id });
      toast(L('Нагадування надіслано', 'Reminder sent'));
    },
  });
  document.addEventListener('change', (e) => {
    const box = e.target.closest?.('[data-sales-confirm]');
    if (!box) return;
    run(async () => { await window.owner.call('owner:sales:confirm', { [box.dataset.salesConfirm]: box.checked }); await refresh(); });
  });
  const addNav = () => {
    const nav = document.querySelector('aside nav');
    if (!nav || nav.querySelector('[data-page="sales"]')) return;
    const button = document.createElement('button');
    button.className = 'nav';
    button.dataset.page = 'sales';
    button.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h18l-2 11H5z"/><path d="M8 7a4 4 0 0 1 8 0"/></svg></span><span data-nav-label></span>';
    button.lastChild.textContent = pages.sales[0];
    nav.querySelector('[data-page="users"]')?.before(button) ?? nav.append(button);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addNav, { once: true });
  else addNav();
})();
