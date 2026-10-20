'use strict';
// Product admin pages written for people, not logs: companies as a list, readable email history,
// a security page that says what happened and what to do, and a plain backup page.
Object.assign(OrbitI18n.messages, {
  backupTitle: { uk: 'Резервна копія', en: 'Backup' },
  mailStatusHint: { uk: '«Відправлено» означає, що поштовий сервер прийняв лист; далі доставку в скриньку виконує він. Листи зі станом «Невідомо» не повторюються самі, щоб адресат не отримав дубль.', en: '“Sent” means the mail server accepted the email; it then delivers it to the mailbox. Emails marked “Unknown” are not retried automatically, so the recipient does not get a duplicate.' },
  backupSubtitle: { uk: 'Вивантаження всієї бази продукту одним файлом.', en: 'The whole product database in one file.' },
  backupWhat: { uk: 'Що потрапляє у файл', en: 'What the file contains' },
  backupList: { uk: 'Користувачі, компанії, підписки, адміністратори, звернення, листи, документи й налаштування сайту. Бази самих компаній (клієнти, записи, оплати) кожна компанія вивантажує у своєму застосунку: «Налаштування та дані → Дані».', en: 'Users, companies, subscriptions, administrators, support requests, emails, documents and website settings. Each company exports its own base (clients, visits, payments) in its app: Settings and data → Data.' },
  backupWhen: { uk: 'Перед кожним оновленням сервера повна копія даних робиться автоматично. Цей файл — додаткова копія для вас: зберігайте його в надійному місці, у ньому персональні дані.', en: 'A full copy of the data is made automatically before every server update. This file is an extra copy for you: keep it somewhere safe, it contains personal data.' },
  backupDownload: { uk: 'Завантажити резервну копію', en: 'Download backup' },
  backupServer: { uk: 'Сервер API', en: 'API server' },
  companiesCol: { uk: 'Компанія', en: 'Company' },
  companiesAccess: { uk: 'Доступ', en: 'Access' },
  companiesActions: { uk: '', en: '' },
  until: { uk: 'до', en: 'until' },
  signOut: { uk: 'Вийти', en: 'Sign out' },
  signedInAs: { uk: 'Ви увійшли як', en: 'Signed in as' },
  mailSent24: { uk: 'Надіслано за 24 год', en: 'Sent in 24 h' },
  mailProblems: { uk: 'Потребують уваги', en: 'Need attention' },
  mailQueue: { uk: 'У черзі', en: 'Queued' },
  mailAll: { uk: 'Усі листи', en: 'All emails' },
  mailOnlyProblems: { uk: 'Лише проблемні', en: 'Problems only' },
  mailNone: { uk: 'Листів ще не було', en: 'No emails yet' },
  mailNoProblems: { uk: 'Проблемних листів немає — усе доставлено на поштовий сервер.', en: 'No problem emails — everything was handed to the mail server.' },
  mailWhat: { uk: 'Що за лист', en: 'Email' },
  mailTo: { uk: 'Кому', en: 'To' },
  mailState: { uk: 'Стан', en: 'Status' },
  st_pending: { uk: 'У черзі', en: 'Queued' },
  st_sending: { uk: 'Відправляється', en: 'Sending' },
  st_accepted: { uk: 'Відправлено', en: 'Sent' },
  st_failed: { uk: 'Не відправлено', en: 'Not sent' },
  st_uncertain: { uk: 'Невідомо', en: 'Unknown' },
  st_cancelled: { uk: 'Скасовано', en: 'Cancelled' },
  stHint_accepted: { uk: 'Поштовий сервер прийняв лист. Якщо адресат не бачить його — нехай перевірить «Спам».', en: 'The mail server accepted the email. If the recipient cannot find it, ask them to check spam.' },
  stHint_failed: { uk: 'Лист не пішов. Причину видно нижче; виправте її й натисніть «Повторити».', en: 'The email was not sent. The reason is below; fix it and press Retry.' },
  stHint_uncertain: { uk: 'Зв’язок обірвався під час відправки: лист міг дійти. Спершу уточніть в адресата, щоб не надіслати двічі.', en: 'The connection dropped while sending: the email may have arrived. Check with the recipient first so it is not sent twice.' },
  stHint_cancelled: { uk: 'Лист більше не актуальний (наприклад, код уже прострочений).', en: 'The email is no longer relevant (for example, the code expired).' },
  secAllGood: { uk: 'Усе спокійно', en: 'All quiet' },
  secAllGoodText: { uk: 'Підозрілої активності за добу немає. Нічого робити не потрібно.', en: 'No suspicious activity in the last day. Nothing to do.' },
  secAttention: { uk: 'Варто перевірити', en: 'Worth a look' },
  secWhat: { uk: 'Що сталося', en: 'What happened' },
  secMeaning: { uk: 'Що це означає', en: 'What it means' },
  secTodo: { uk: 'Що робити', en: 'What to do' },
  secCount24: { uk: 'За 24 год', en: 'Last 24 h' },
  secCount7: { uk: 'За 7 днів', en: 'Last 7 days' },
  sec_admin_401: { uk: 'Невдалі входи в адмін-панель', en: 'Failed sign-ins to the admin panel' },
  secm_admin_401: { uk: 'Хтось ввів неправильний код, пароль або ключ, або сеанс закінчився. Кілька за день — це зазвичай ви самі.', en: 'Someone entered a wrong code, password or key, or a session expired. A few a day is usually you.' },
  sect_admin_401: { uk: 'Якщо їх десятки, а ви не входили — змініть пароль і перевірте список адміністраторів.', en: 'If there are dozens and you were not signing in, change the password and check the administrators.' },
  sec_admin_403: { uk: 'Заборонені дії в адмін-панелі', en: 'Forbidden admin actions' },
  secm_admin_403: { uk: 'Адміністратор спробував дію, на яку не має прав.', en: 'An administrator tried an action they have no rights for.' },
  sect_admin_403: { uk: 'Перевірте ролі адміністраторів.', en: 'Check the administrators’ roles.' },
  sec_client_401: { uk: 'Закінчені сеанси в застосунку', en: 'Expired app sessions' },
  secm_client_401: { uk: 'Клієнти LOMVIKO відкривали застосунок після завершення сеансу — їх просто попросили увійти знову.', en: 'LOMVIKO customers opened the app after their session ended — they were simply asked to sign in again.' },
  sect_client_401: { uk: 'Нічого — це нормально.', en: 'Nothing — this is normal.' },
  sec_client_403: { uk: 'Відмови в доступі в застосунку', en: 'Access refused in the app' },
  secm_client_403: { uk: 'Співробітник спробував дію поза своєю роллю або в компанії закінчився доступ.', en: 'A team member tried something outside their role, or the company’s access ended.' },
  sect_client_403: { uk: 'Якщо скаржаться — перевірте роль користувача й термін доступу компанії.', en: 'If someone complains, check the user’s role and the company’s access.' },
  sec_429: { uk: 'Забагато запитів', en: 'Too many requests' },
  secm_429: { uk: 'Хтось надто часто надсилав запити й був тимчасово зупинений — так сервер захищається від підбору паролів і спаму.', en: 'Someone sent requests too often and was paused for a while — this is how the server stops password guessing and spam.' },
  sect_429: { uk: 'Якщо це повторюється годинами — напишіть нам, перевіримо адресу.', en: 'If it goes on for hours, tell us and we will check the address.' },
  sec_409: { uk: 'Повторені запити', en: 'Repeated requests' },
  secm_409: { uk: 'Той самий запит надійшов двічі (подвійне натискання або повтор зі старої копії) і був відхилений.', en: 'The same request came twice (a double click or a replay of an old copy) and was refused.' },
  sect_409: { uk: 'Нічого, якщо їх одиниці.', en: 'Nothing, if there are only a few.' },
  sec_website: { uk: 'Відхилені запити до сайту', en: 'Refused website requests' },
  secm_website: { uk: 'Невірні або надто часті заявки з форм сайту.', en: 'Invalid or too frequent website form submissions.' },
  sect_website: { uk: 'Нічого — так відсіюється спам.', en: 'Nothing — this filters out spam.' },
  sec_other: { uk: 'Інші відмови', en: 'Other refusals' },
  secm_other: { uk: 'Запити з помилками, які сервер відхилив.', en: 'Malformed requests the server refused.' },
  sect_other: { uk: 'Нічого, якщо їх небагато.', en: 'Nothing, if there are few.' },
  secSessions: { uk: 'Активні входи', en: 'Active sign-ins' },
  secSessionsHint: { uk: 'Браузери й телефони, з яких входять у застосунок. Якщо бачите чужий або загублений пристрій — натисніть «Відключити»: вхід на ньому завершиться одразу.', en: 'Browsers and phones used to sign in to the app. If you see an unknown or lost device, press Disconnect: it is signed out at once.' },
  secAdminLog: { uk: 'Дії адміністраторів', en: 'Administrator actions' },
  secDetails: { uk: 'Технічні деталі: адреси відхилених запитів за 24 год', en: 'Technical details: refused request addresses, 24 h' },
  secChangePassword: { uk: 'Змінити пароль', en: 'Change password' },
  secAdmins: { uk: 'Адміністратори', en: 'Administrators' },
});
const at = (k) => OrbitI18n.t(k);
const MAIL_KINDS = {
  registration: ['Код підтвердження реєстрації', 'Registration code'],
  'registration-exists': ['Спроба зареєструватися повторно', 'Repeated registration attempt'],
  'registration-trial-used': ['Пробний період уже використано', 'Trial already used'],
  'trial-started': ['Вам: новий користувач почав пробний період', 'To you: a new trial started'],
  welcome: ['Привітання після реєстрації', 'Welcome after registration'],
  lead: ['Підтвердження заявки на демо', 'Demo request confirmation'],
  owner: ['Вам: нова заявка на демо', 'To you: new demo request'],
  'admin-invite': ['Запрошення адміністратора', 'Administrator invitation'],
  'account-expiring': ['Нагадування: дані ще зберігаються', 'Reminder: data is still kept'],
  'support-receipt': ['Звернення отримано', 'Support request received'],
  'support-reply': ['Відповідь на звернення', 'Support reply'],
  'support-team': ['Вам: нове звернення', 'To you: new support request'],
  'password-reset': ['Код для зміни пароля', 'Password reset code'],
  'trial-ending': ['Нагадування: доступ закінчується', 'Reminder: access ends soon'],
  'trial-ended': ['Доступ завершився', 'Access ended'],
  notice: ['Повідомлення', 'Notice'],
  test: ['Тестовий лист', 'Test email'],
  access: ['Доступ до LOMVIKO', 'Access to LOMVIKO'],
  demo: ['Демо-доступ', 'Demo access'],
  purchase: ['Оплату отримано', 'Payment received'],
};
const mailKind = (k) => (MAIL_KINDS[k] ? MAIL_KINDS[k][OrbitI18n.language === 'en' ? 1 : 0] : k);
// Technical SMTP errors in plain words; the original stays underneath for support.
function mailReason(error) {
  const e = String(error || '');
  if (!e) return '';
  const plain = /EAUTH|535|Invalid login|Username and Password/i.test(e) ? ['Неправильний логін або пароль SMTP — перевірте в «Налаштувати SMTP».', 'Wrong SMTP login or password — check SMTP settings.']
    : /ETIMEDOUT|ECONNREFUSED|ECONNECTION|ENOTFOUND|EHOSTUNREACH|ESOCKET/i.test(e) ? ['Поштовий сервер недоступний — перевірте адресу й порт SMTP або спробуйте пізніше.', 'The mail server is unreachable — check the SMTP host and port or try later.']
    : /EENVELOPE|550|553|recipient|mailbox/i.test(e) ? ['Адресу отримувача відхилено — можливо, в email помилка.', 'The recipient address was refused — the email may have a typo.']
    : /server-restarted/i.test(e) ? ['Сервер перезапускався під час відправки.', 'The server restarted while sending.']
    : /expired|прострочен/i.test(e) ? ['Лист застарів і більше не надсилається.', 'The email expired and is no longer sent.']
    : null;
  return `${plain ? `<div>${esc(plain[OrbitI18n.language === 'en' ? 1 : 0])}</div>` : ''}<div class="sub mono-inline">${esc(e.slice(0, 160))}</div>`;
}
let mailFilter = 'all';
mailView = function () {
  const m = data.mail;
  if (!m) return noRows('Update the server');
  const day = Date.now() - 86400000,
    problem = (r) => ['failed', 'uncertain'].includes(r.status),
    rows = m.messages.filter((r) => mailFilter === 'all' || problem(r)),
    stat = (label, value, cls = '') => `<div class="stat ${cls}"><div class="stat-top">${label}</div><div class="stat-number">${value}</div></div>`;
  return `<div class="list-toolbar"><button class="primary" data-action="mail-settings">${mt('mailSettings')}</button><button class="secondary" data-action="mail-verify">${mt('mailVerify')}</button><button class="secondary" data-action="mail-test">${mt('mailTest')}</button></div>
  <div class="callout ${m.configured ? '' : 'callout-warn'}">${mt(m.configured ? 'mailReady' : 'mailNotReady')} · ${mt(m.accessReady ? 'mailAccessReady' : 'mailAccessMissing')}</div>
  <div class="stats mt three">${stat(at('mailSent24'), m.messages.filter((r) => r.status === 'accepted' && r.created_at > day).length)}${stat(at('mailProblems'), m.messages.filter(problem).length, m.messages.some(problem) ? 'stat-warn' : '')}${stat(at('mailQueue'), m.messages.filter((r) => ['pending', 'sending'].includes(r.status)).length)}</div>
  <section class="panel"><div class="panel-head"><div class="period-tabs">${[['all', 'mailAll'], ['problems', 'mailOnlyProblems']].map(([id, k]) => `<button class="secondary ${mailFilter === id ? 'selected' : ''}" aria-pressed="${mailFilter === id}" data-action="mail-filter" data-filter="${id}">${at(k)}</button>`).join('')}</div></div>${
    rows.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>${mt('m399')}</th><th>${at('mailWhat')}</th><th>${at('mailTo')}</th><th>${at('mailState')}</th><th></th></tr></thead><tbody>${rows
          .map((r) => `<tr><td>${date(r.created_at)}</td><td><strong>${esc(mailKind(r.kind))}</strong></td><td>${esc(r.recipient)}</td><td><span class="badge ${problem(r) ? 'cancelled' : ''}" title="${esc(at('stHint_' + r.status) || '')}">${esc(at('st_' + r.status) || r.status)}</span>${r.attempts > 1 ? `<div class="sub">${OrbitI18n.language === 'en' ? 'attempts' : 'спроб'}: ${r.attempts}</div>` : ''}${problem(r) ? `<div class="sub">${esc(at('stHint_' + r.status))}</div>${mailReason(r.error)}` : ''}</td><td>${problem(r) ? `<button class="secondary" data-action="mail-retry" data-id="${r.id}">${mt('mailRetry')}</button>` : ''}</td></tr>`)
          .join('')}</tbody></table></div>`
      : noRows(at(mailFilter === 'all' ? 'mailNone' : 'mailNoProblems'))
  }</section><p class="hint">${mt('mailStatusHint')}</p>`;
};

businessesView = function () {
  const owners = new Map(data.users.map((u) => [u.id, u])),
    bots = new Map((data.bots || []).map((b) => [b.business_id, b])),
    query = search.toLowerCase();
  const rows = data.businesses.filter((b) => `${b.name} ${b.owner_name} ${owners.get(b.account_id)?.email || ''}`.toLowerCase().includes(query));
  const bot = (b) => {
    const s = bots.get(b.id);
    if (!s) return ['', OrbitI18n.t('botNotConnected')];
    return s.hosting === 'external' ? [s.connected ? 'on' : '', s.connected ? OrbitI18n.t('botOnOwnServer') : OrbitI18n.t('botWaiting')] : [s.connected ? 'on' : '', s.connected ? '@' + s.username : OrbitI18n.t('botNotConnected')];
  };
  const row = (b) => {
    const owner = owners.get(b.account_id),
      team = 1 + data.users.filter((u) => u.account_id === b.account_id).length,
      [state, botText] = bot(b);
    return `<tr><td><div class="company-cell"><span class="company-mark">${esc((b.name.match(/[\p{L}\p{N}]/u) || ['•'])[0].toUpperCase())}</span><div><strong>${esc(b.name)}</strong><div class="sub">${esc(b.owner_name)}${owner ? ` · ${esc(owner.email)}` : ''}</div></div></div></td><td>${owner ? `<span class="badge status-${owner.stage}">${stages[owner.stage]}</span><div class="sub">${at('until')} ${date(owner.expires).split(',')[0]}</div>` : '—'}</td><td><span class="bot-state ${state}">${esc(botText)}</span></td><td class="num">${team}</td><td><div class="table-actions"><button class="secondary" data-action="business-profile" data-id="${b.id}">${OrbitI18n.t('m442')}</button><button class="secondary" data-action="business-catalog" data-id="${b.id}">${OrbitI18n.t('m008')}</button></div></td></tr>`;
  };
  return `<div class="list-toolbar company-toolbar"><input id="search" class="search" value="${esc(search)}" placeholder="${OrbitI18n.t('companySearch')}"><span class="company-count">${OrbitI18n.t('companyCount')}: ${data.businesses.length}</span><button class="primary" data-action="business-add">${OrbitI18n.t('m448')}</button></div><p class="company-hint">${OrbitI18n.t('companyHint')}</p>${
    data.businesses.length
      ? rows.length
        ? `<section class="panel"><div class="table-wrap"><table class="table companies-table"><thead><tr><th>${at('companiesCol')}</th><th>${at('companiesAccess')}</th><th>Telegram</th><th class="num">${OrbitI18n.t('companyTeam')}</th><th></th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div></section>`
        : noRows(OrbitI18n.t('companyNone'))
      : `<section class="panel">${noRows(OrbitI18n.t('m446'))}</section>`
  }`;
};

connectionView = function () {
  return `<section class="card backup-card"><h2>${at('backupTitle')}</h2><p>${at('backupSubtitle')}</p><h3>${at('backupWhat')}</h3><p>${at('backupList')}</p><p>${at('backupWhen')}</p><div class="card-buttons"><button class="primary" data-action="export">${at('backupDownload')}</button></div><p class="hint">${at('backupServer')}: <span class="mono-inline">${esc(data.endpoint || '')}</span></p></section>`;
};

// Security: every kind of refusal explained, a calm or alert summary, active sign-ins and admin actions.
securityView = function () {
  const s = data.security || { rejections: [] },
    day = Date.now() - 86400000,
    week = Date.now() - 7 * 86400000,
    kind = (r) => (r.status === 429 ? '429' : r.status === 409 ? '409' : r.category === 'website' ? 'website' : [401, 403].includes(r.status) ? `${r.category}_${r.status}` : 'other'),
    groups = new Map();
  for (const r of s.rejections) {
    const k = kind(r),
      g = groups.get(k) || { day: 0, week: 0 };
    if (r.minute > day) g.day += r.count;
    if (r.minute > week) g.week += r.count;
    groups.set(k, g);
  }
  const alarm = (groups.get('admin_401')?.day || 0) >= 20 || (groups.get('429')?.day || 0) >= 50 || (groups.get('admin_403')?.day || 0) >= 5;
  const order = ['admin_401', 'admin_403', '429', 'client_403', '409', 'client_401', 'website', 'other'].filter((k) => groups.get(k)?.week);
  const sessions = data.devices.filter((d) => !d.revoked).sort((a, b) => b.last_seen - a.last_seen);
  return `<div class="security-status ${alarm ? 'alert' : 'calm'}"><strong>${at(alarm ? 'secAttention' : 'secAllGood')}</strong><span>${alarm ? at('sect_admin_401') : at('secAllGoodText')}</span>${alarm ? `<div class="table-actions"><button class="primary" data-action="admin-account">${at('secChangePassword')}</button><button class="secondary" data-page="admins">${at('secAdmins')}</button></div>` : ''}</div>
  <section class="panel mt"><div class="table-wrap"><table class="table security-table"><thead><tr><th>${at('secWhat')}</th><th class="num">${at('secCount24')}</th><th class="num">${at('secCount7')}</th><th>${at('secMeaning')}</th><th>${at('secTodo')}</th></tr></thead><tbody>${
    order.length
      ? order.map((k) => `<tr><td><strong>${at('sec_' + k)}</strong></td><td class="num">${groups.get(k).day}</td><td class="num">${groups.get(k).week}</td><td class="sub-cell">${at('secm_' + k)}</td><td class="sub-cell">${at('sect_' + k)}</td></tr>`).join('')
      : `<tr><td colspan="5">${noRows(at('secAllGoodText'))}</td></tr>`
  }</tbody></table></div></section>
  <section class="panel mt"><div class="panel-head"><h2>${at('secSessions')} · ${sessions.length}</h2></div><p class="hint panel-note">${at('secSessionsHint')}</p>${
    sessions.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>${OrbitI18n.t('m139')}</th><th>${OrbitI18n.t('m416')}</th><th>${OrbitI18n.t('m418')}</th><th></th></tr></thead><tbody>${sessions.map((d) => `<tr><td><strong>${esc(d.user_name)}</strong><div class="sub">${esc(d.business)}</div></td><td>${esc(d.platform === 'web' ? (OrbitI18n.language === 'en' ? 'Browser' : 'Браузер') : OrbitI18n.language === 'en' ? 'Old desktop app' : 'Стара програма для комп’ютера')}<div class="sub">${OrbitI18n.language === 'en' ? 'first sign-in' : 'перший вхід'} ${date(d.activated_at)}</div></td><td>${date(d.last_seen)}</td><td><button class="danger" data-action="revoke" data-id="${d.id}">${OrbitI18n.t('m221')}</button></td></tr>`).join('')}</tbody></table></div>`
      : noRows(OrbitI18n.t('m420'))
  }</section>
  <section class="panel mt"><div class="panel-head"><h2>${at('secAdminLog')}</h2></div>${eventTable(data.events.filter((e) => /^(site\.|user\.|device\.revoked|invite\.|password\.|admin\.|purchase|document\.)/.test(e.event)).slice(0, 50))}</section>
  ${(s.routes || []).length ? `<details class="panel mt tech-details"><summary>${at('secDetails')}</summary><div class="table-wrap"><table class="table"><tbody>${s.routes.map((r) => `<tr><td class="mono-inline">${esc(r.route)}</td><td>${r.status}</td><td>${r.count}</td><td>${date(r.last)}</td></tr>`).join('')}</tbody></table></div></details>` : ''}`;
};

Object.assign(actions, {
  'mail-filter': (b) => {
    mailFilter = b.dataset.filter;
    render();
  },
});
pages.connection = [at('backupTitle'), at('backupSubtitle')];
// Navigation: "Devices" now lives inside Security; "Server and export" is the backup page.
(function tidyNavigation() {
  document.querySelector('.nav[data-page="devices"]')?.remove();
  const backup = document.querySelector('.nav[data-page="connection"] [data-i18n]');
  if (backup) {
    backup.dataset.i18n = 'backupTitle';
    backup.textContent = at('backupTitle');
  }
})();
