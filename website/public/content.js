'use strict';
// The same public copy and markup are used by Node and the browser. No crawler-specific output.
((root, factory) => {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LomvikoPublic = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
const SITE_URL = 'https://lomviko.com', APP_URL = 'https://app.lomviko.com', CONTACT_EMAIL = 'info@lomviko.com';
const icons = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  send: '<path d="m21 4-18 7 6 2m12-9-3 16-9-7m12-9-12 9v6l3-4"/>',
  chart: '<path d="M3 20h18M6 16v-5m5 5V7m5 9v-3m4 3V5"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  download: '<path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9m-4 4 3 3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7m5.5 8.5a6.5 6.5 0 0 0-4-6"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  cross: '<path d="M6 6l12 12M18 6 6 18"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zm4 4h4"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9.5h4.5a2 2 0 0 1 0 4H9m0-4v6m0-2h5"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
  chat: '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const featureIcons = ['calendar', 'send', 'chart', 'cloud', 'layers', 'download'];
const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10h10m-4-4 4 4-4 4"/></svg>';

const translations = {
  uk: {
    meta: {
      title: 'CRM для сфери послуг та онлайн-запис клієнтів | LOMVIKO',
      description: 'LOMVIKO — CRM для малого бізнесу у сфері послуг: онлайн-запис клієнтів, розклад команди, нагадування у Telegram, клієнтська база, оплати та фінансові звіти.',
      ogTitle: 'LOMVIKO — клієнти записуються самі',
      ogDescription: 'Онлайн-запис 24/7, нагадування, оплата за посиланням, розклад команди й фінанси — в одному застосунку. Для бізнесу у сфері послуг.',
      ogAlt: 'LOMVIKO — CRM для бізнесу за записом',
      locale: 'uk_UA', alternate: 'en_US',
    },
    noScriptHelp: 'Для інтерактивних прикладів і заявки увімкніть JavaScript або напишіть нам:', closeLabel: 'Закрити', skip: 'До вмісту', navLabel: 'Навігація', navFeatures: 'Можливості', navHow: 'Як це працює', navCalc: 'Калькулятор', navBusiness: 'Для кого', navIntegrations: 'Інтеграції', navFaq: 'Питання', navDownload: 'Увійти', haveAccount: 'Вже є акаунт?', navPrice: 'Ціна',
    ctaDemo: 'Отримати демо', ctaDownload: 'Завантажити', ctaTrial: 'Спробувати безкоштовно', ctaShort: 'Спробувати', stickyText: 'Безкоштовно до 1 березня · без картки', seeHow: 'Як це працює',
    heroEyebrow: 'CRM для салонів, клінік, студій і СТО',
    heroTitle: ['Онлайн-\u2060запис і CRM', 'для вашого бізнесу.'],
    heroDescription: 'LOMVIKO — CRM для малого бізнесу у сфері послуг. Клієнти записуються самі 24/7, бот нагадує про візит, а розклад, оплати, витрати й зарплати команди — в одній програмі. Для салонів, клінік, СТО, студій і всіх, хто працює за записом.',
    trustOne: 'Усі функції безкоштовно до 1 березня', trustTwo: 'Без банківської картки', trustThree: 'Браузер і телефон — без встановлення',
    marqueeLabel: 'Для бізнесу, який працює за записом',
    marquee: ['Салони краси', 'Барбершопи', 'Манікюр і педикюр', 'Косметологія', 'Масаж і SPA', 'Стоматологія', 'Приватні клініки', 'Психологи', 'Фітнес і йога', 'Танцювальні студії', 'Репетитори', 'Тату-студії', 'Автосервіси', 'Фотостудії', 'Грумінг'],
    whyKicker: 'Навіщо', whyTitle: ['Хаос у чатах —', 'у минулому.'], whyIntro: 'Знайомо? Ось що змінюється з першого дня.',
    beforeTitle: 'Як зараз', afterTitle: 'З LOMVIKO',
    pains: ['Записи в зошиті, Instagram і трьох месенджерах', 'Клієнт пише о 23:00 — відповідаєте зранку, а він уже записався до інших', 'Клієнт забув про візит — година простою та втрачені гроші', 'Реквізити в Direct і очікування скриншота оплати', 'Скільки заробив кожен майстер — лише здогадки'],
    gains: ['Клієнт сам обирає послугу, майстра й час — у Telegram або на вашій сторінці', 'Один розклад для всієї команди: вільні вікна видно одразу', 'Бот сам нагадує клієнту за 24 і за 2 години до візиту', 'Посилання на оплату — і візит сам позначається оплаченим', 'Виручка за будь-який період і по кожному спеціалісту'],
    calcKicker: 'Калькулятор', calcTitle: ['Скільки коштують', 'неявки?'],
    calcIntro: 'Клієнт забув про запис — майстер простоює, а час уже не продати. Порахуйте, скільки це коштує вашому бізнесу.',
    calcCheck: 'Середній чек', calcVisits: 'Записів на день', calcNoShow: 'Неявок і запізнілих скасувань', calcDays: 'Робочих днів на місяць',
    calcLoss: 'Ви втрачаєте щомісяця', calcBack: 'Якщо нагадування збережуть третину цих візитів',
    calcMissed: (n) => `≈ ${n} пропущених візитів на місяць`, calcYear: (v) => `${v} за рік`,
    calcNote: 'Це оцінка за вашими числами, а не обіцянка. Бот сам нагадує клієнту про візит у Telegram за добу і за 2 години.',
    currency: 'грн', locale: 'uk-UA',
    featuresKicker: 'Можливості', featuresTitle: ['Усе для бізнесу за записом.', 'В одному вікні.'], featuresIntro: 'Кожну функцію можна увімкнути, коли вона знадобиться. Решта не заважає.',
    features: [
      [2, 'calendar', 'Розклад для всієї команди', 'Майстри, кабінети й обладнання в одній сітці. Свій графік у кожного спеціаліста, вихідні й відпустки — а записи з цих днів можна одразу передати колезі.'],
      [1, 'send', 'Telegram-бот 24/7', 'Клієнт записується сам навіть о третій ночі. Бот працює на сервері — коли ваш комп’ютер вимкнено.'],
      [1, 'link', 'Ваша сторінка запису', 'Посилання з логотипом для Instagram і Google Карт, QR-код на ресепшн і кнопка «Записатися» для сайту.'],
      [2, 'bell', 'Нагадування, що рятують виручку', 'Бот нагадує клієнту за 24 і за 2 години до візиту. Менше неявок — менше годин, які вже не продати.'],
      [1, 'card', 'monobank і ПриватБанк — уже підключені', 'Інтеграції з monobank і LiqPay (ПриватБанк) ми зробили за вас: без програмістів і окремих договорів на розробку. Вставте свій ключ — і клієнти платять за посиланням чи QR, гроші одразу на ваш рахунок.'],
      [1, 'chart', 'Фінанси без таблиць', 'Виручка, матеріали, повернення й завантаженість — за будь-який період і по кожному спеціалісту.'],
      [2, 'layers', 'Витрати, матеріали й зарплати', 'Записуйте оренду, закупівлі, рекламу й податки. Матеріали списуються з кожної послуги, а залишок видно одразу. Зарплата майстра рахується сама: відсоток від послуг плюс ставка за день.'],
      [1, 'users', 'Команда на зв’язку', 'Кожен отримує в Telegram план на день і нові онлайн-записи, власник — тижневі й місячні звіти.'],
      [2, 'lock', 'Ролі, доступи й кілька бізнесів', 'Власник, адміністратор і майстер бачать лише своє, фінанси — тільки за дозволом. Кілька компаній — один вхід.'],
      [1, 'download', 'Ваші дані — ваші', 'Експорт усієї бази в JSON, CSV або зашифрований файл — будь-коли.'],
    ],
    integrationsTitle: ['Працює з тим,', 'чим ви вже користуєтесь.'], integrationsIntro: 'Підключення займає кілька хвилин: вставте ключ або посилання у налаштуваннях. Програміст не потрібен.',
    integrations: [
      ['monobank', 'Оплата', 'Еквайринг monobank: клієнт платить за посиланням чи QR, гроші одразу на ваш рахунок, візит позначається оплаченим.'],
      ['ПриватБанк', 'Оплата', 'LiqPay від ПриватБанку: картка будь-якого банку, Apple Pay чи Google Pay.'],
      ['Telegram', 'Клієнти й команда', 'Бот компанії записує клієнтів 24/7, нагадує про візит, а команді надсилає план на день.'],
      ['Checkbox', 'Каса', 'Програмний РРО: фіскальний чек після оплати формується сам. Підключаєте, лише якщо він вам потрібен.'],
      ['Вчасно.Каса', 'Каса', 'Ще один програмний РРО на вибір, з тими самими автоматичними чеками.'],
      ['Google', 'Відгуки й карти', 'Задоволених клієнтів бот веде залишити відгук у Google, а посилання на запис ставиться в Google Карти.'],
      ['Instagram', 'Сторінка запису', 'Посилання на вашу сторінку запису в шапку профілю й у сторіз.'],
      ['Tilda, Wix, WordPress, Хорошоп', 'Сайт', 'Кнопка «Записатися» на ваш сайт одним рядком коду.'],
      ['Excel і Google Таблиці', 'Дані', 'Перенесіть клієнтів із таблиці чи іншої програми, а всю базу вивантажуйте будь-коли.'],
    ],
    replaceTitle: ['Один сервіс', 'замість усього цього.'], replaceIntro: 'Не потрібно платити за окремі сервіси запису, нагадувань і звітів — і зводити їх між собою.',
    pageTitle: ['Своя сторінка запису.', 'Без сайту.'],
    pageIntro: 'Клієнт відкриває посилання з Instagram чи Google Карт, обирає послугу, майстра й вільний час, залишає ім’я і телефон — і запис уже у вашому розкладі. Без реєстрації і без застосунків.',
    pagePoints: ['Посилання для шапки Instagram і Google Карт', 'QR-код на ресепшн, дзеркала й візитки', 'Кнопка «Записатися» для Tilda, Wix, WordPress, Хорошоп', 'Ваші логотип, обкладинка й колір', 'Лише справді вільний час — без подвійних записів'],
    pageStylesLabel: 'Оберіть стиль — подивіться, як це виглядатиме:',
    pageStyles: [['warm', 'Тепла'], ['lux', 'Люкс'], ['minimal', 'Мінімал'], ['bright', 'Яскрава']],
    bp: { name: 'Studio Nova', about: 'Манікюр, брови й догляд · біля метро Лук’янівська', service: 'Послуга', services: [['Манікюр + покриття', '1 год 30 хв', '900 грн'], ['Корекція брів', '45 хв', '450 грн'], ['Догляд за обличчям', '1 год', '1 200 грн']], who: 'Спеціаліст', people: ['Будь-хто вільний', 'Олена', 'Ірина'], when: 'Завтра, п’ятниця', times: ['10:00', '11:30', '13:00', '15:30', '17:00', '18:30'], book: 'Записатися на 11:30' },
    ownerTitle: ['Бізнес під контролем.', 'Навіть з телефона.'],
    ownerIntro: 'Не потрібно відкривати комп’ютер, щоб знати, як іде день. Бот вашої компанії сам надішле головне — навіть коли комп’ютер вимкнено.',
    ownerPoints: ['Щоранку: записи по майстрах, очікуваний виторг, вільні вікна й підсумки вчора', 'Одразу: нові онлайн-записи, скасування й оплати', 'Щопонеділка — тижневий звіт з порівнянням, 1-го числа — місячний', 'Кожен майстер підключає свій Telegram і бачить свій день'],
    tg: { bot: 'Studio Nova', status: 'бот компанії', msgs: [['08:30', '☀️ Доброго ранку! Сьогодні, четвер', '18 записів · очікується 24 600 грн\nОлена — 6 · Максим — 5 · Ірина — 7\nВільно: Максим 14:00–16:00\nВчора: 21 900 грн, неявок — 1'], ['11:02', '🆕 Новий онлайн-запис', 'Анна · Манікюр + покриття\nЗавтра 11:30 · Ірина · зі сторінки запису'], ['11:40', '💳 Оплата monobank', '900 грн · Олег · Масаж спини']] },
    replace: [['Зошит і Google Таблиці', 'Розклад і база клієнтів з історією візитів'], ['Окремий сервіс онлайн-запису', 'Telegram-бот і ваша сторінка запису'], ['Дзвінки й повідомлення «Нагадуємо про запис»', 'Автоматичні нагадування'], ['Реквізити в Direct і скриншоти оплат', 'Оплата за посиланням або QR'], ['Excel для виручки', 'Фінансові звіти по спеціалістах'], ['Чат команди «хто завтра працює?»', 'План на день кожному в Telegram']],
    howKicker: 'Як це працює', howTitle: ['Один день', 'з LOMVIKO.'], howIntro: 'Оберіть сценарій і подивіться, що відбувається між записом клієнта та завершеним візитом.', storiesLabel: 'Сценарії',
    stories: [
      { tab: 'Хто, коли й до кого', tag: 'Розклад', title: '«А на дванадцяту хтось є?»', body: 'Не питайте в чаті — подивіться в розклад. Хто працює, де вільне вікно й скільки триває послуга — видно всій команді одразу.', foot: 'Один запис — спільний план для команди.', labels: ['Олена', 'Максим', 'Стрижка · Ірина', 'Масаж · Олег', 'Вільне вікно', 'Записати', 'Фарбування · Юлія', 'Манікюр · Анна'] },
      { tab: 'Запис без переписки', tag: 'Telegram-бот', title: 'Клієнт записується. Ви працюєте.', body: 'Послугу, майстра й час клієнт обирає сам — удень чи о третій ночі. Бот працює на сервері, навіть коли застосунок закритий, і сам нагадає про візит.', foot: 'Спробуйте записатися самі — праворуч.', bot: { hint: 'Спробуйте самі', hello: 'Вітаємо! 👋 На яку послугу вас записати?', services: ['Манікюр', 'Стрижка', 'Масаж'], when: 'Чудово! Оберіть зручний час сьогодні:', times: ['11:00', '12:30', '15:00'], done: (s, t) => `Готово! ${s}, сьогодні о ${t}. Нагадаю за 24 і за 2 години ✓`, crm: 'Запис уже в розкладі LOMVIKO', again: 'Почати спочатку' } },
      { tab: 'Куди пішов робочий день', tag: 'Результати', title: 'День завершився. Цифри — залишились.', body: 'Внесли оплату — вона вже в обліку. Виручка, завантаженість і популярні послуги за будь-який період — без таблиць і калькулятора.', foot: 'Фінанси бачать лише ті, кому ви дозволили.', chart: { label: 'Виручка за тиждень', value: '86 400 грн', delta: '+18% до минулого тижня', days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] } },
    ],
    peekKicker: 'Продукт', peekTitle: ['Відкрили. Побачили день.', 'До роботи.'], peekBody: 'Розклад, клієнти й оплати поруч. Не потрібно згадувати, в якому чаті домовлялися.', peekCaption: 'Справжній інтерфейс LOMVIKO. На зображенні — демонстраційні дані.', peekAlt: 'Інтерфейс LOMVIKO: розклад на день із записами клієнтів',
    businessKicker: 'Для кого', businessTitle: ['Не потрібно підлаштовуватися', 'під CRM.'], segmentsLabel: 'Тип бізнесу',
    segments: {
      beauty: ['Краса', 'Від першого запису до постійного клієнта', 'Майстри, послуги й тривалість — у спільному розкладі. Клієнт обирає зручний час сам.', ['Майстер на вибір або будь-хто вільний', 'Нагадування зменшують кількість неявок', 'Історія візитів і нотатки по кожному клієнту'], ['Салони', 'Барбершопи', 'Нігтьові студії', 'Косметологи', 'Брови та вії']],
      health: ['Здоров’я', 'Прийом без накладок і черг', 'Спеціалісти, кабінети й обладнання — ресурси одного розкладу. Пацієнт отримує нагадування заздалегідь.', ['Кілька спеціалістів і кабінетів', 'Різна тривалість прийомів', 'Ролі доступу для адміністратора та лікаря'], ['Стоматології', 'Масаж', 'Психологи', 'Реабілітація', 'Приватні кабінети']],
      studio: ['Навчання і спорт', 'Групові та індивідуальні заняття', 'Тренери, зали та місткість груп — в одному розкладі. Учні записуються через Telegram без дзвінків.', ['Груповий запис із лімітом місць', 'Тренери й зали як ресурси', 'Запис і нагадування через бота'], ['Йога', 'Фітнес', 'Танці', 'Репетитори', 'Мовні школи']],
      service: ['Сервіс', 'Робота без простоїв', 'Розподіляйте час майстрів, постів і обладнання. Клієнт знає, коли приїхати, а команда — що робити далі.', ['Спільна робота кількох ресурсів', 'Тривалість, ціна та доступність послуг', 'Окремі команди для кількох бізнесів'], ['Автосервіси', 'Ремонт техніки', 'Фотостудії', 'Грумінг', 'Оренда залів']],
    },
    trustKicker: 'Україна', trustTitle: ['Створено для роботи', 'в Україні.'], trustIntro: 'Українською мовою, у гривні, з українськими банками — і з урахуванням того, що світло буває не завжди.',
    trust: [
      ['bolt', 'Блекаут не зупиняє запис', 'Бот і сторінка запису працюють на сервері. Поки у вас немає світла, клієнти й далі записуються, а розклад відкривається з телефона через мобільний інтернет.'],
      ['coin', 'monobank і Приват — інтеграції вже готові', 'Ми вже інтегрували LOMVIKO з monobank і LiqPay від ПриватБанку. Підключення — за хвилину, ключем із кабінету банку. Картка будь-якого банку, Apple Pay, Google Pay, Приват24 — гроші напряму на ваш рахунок.'],
      ['shield', 'Без подвійних записів', 'Бот, сторінка запису й адміністратор пишуть в один розклад. Зайнятий час ніхто не займе вдруге.'],
      ['lock', 'Дані під захистом', 'Вхід за паролем, зашифроване з’єднання, кожна дія підписана. Експорт усієї бази — будь-коли, одним натисканням.'],
      ['users', 'Ролі та права', 'Власник, адміністратор і майстер бачать лише своє. Фінанси — тільки за дозволом.'],
      ['chat', 'Підтримка всередині LOMVIKO', 'Питання чи ідея — пишете прямо з LOMVIKO українською. Відповідь приходить на пошту і в розділ «Підтримка».'],
    ],
    statsLabel: 'LOMVIKO у цифрах',
    stats: [['30', 'днів безкоштовно — з усіма функціями й без картки'], ['24/7', 'приймаються записи — бот і сторінка запису не сплять'], ['×2', 'нагадування клієнту — за 24 і за 2 години до візиту'], ['3', 'способи записатися: Telegram, посилання і кнопка на сайті']],
    demoKicker: 'Старт', stepOne: 'Натисніть «Спробувати безкоштовно» — LOMVIKO відкриється в браузері, нічого не треба встановлювати.', stepTwo: 'Вкажіть назву бізнесу, email і пароль, підтвердьте email кодом із листа.', stepThree: 'Додайте послуги й команду, поділіться посиланням на запис — клієнти записуються самі.', stepOneTitle: 'Відкрийте LOMVIKO', stepTwoTitle: 'Створіть компанію', stepThreeTitle: 'Поділіться посиланням', launchTitle: ['Перший онлайн-запис', 'за три кроки.'], launchIntro: 'Без дзвінків менеджера й без встановлення. Більшість власників приймають перший запис у день реєстрації.',
    priceTitle: ['Три тарифи.', 'Платите лише за потрібне.'], priceNoteSales: 'Без картки й без дзвінків менеджера. Тариф можна змінити будь-коли — дані залишаються.', freeBanner: 'Зараз усі функції безкоштовні до {date} — без картки. Ціни нижче почнуть діяти після цього.', planMonth: 'грн / міс', planChoose: 'Обрати', planTry: 'Спробувати безкоштовно', planRequest: 'Залишити заявку', planPopular: 'Найчастіше обирають', planIncludes: 'Усе з «{plan}», а також:', planUsers: 'Користувачі без обмежень', closedBanner: 'Реєстрацію тимчасово закрито. Залиште заявку — напишемо, щойно відкриємо.', priceNote: 'Без картки й без дзвінків менеджера. Зареєструйтеся прямо в браузері — і приймайте перші онлайн-записи вже сьогодні.',
    planKicker: 'Один тариф · усі функції', planPer: 'грн / місяць за компанію', planList: ['безкоштовно до 1 березня 2027, без картки', 'Telegram-бот, сторінка запису й нагадування', 'Готові інтеграції з monobank і ПриватБанком (LiqPay)', 'Уся команда — з комп’ютера чи телефона'], planNote: 'Після пробного періоду дані не зникнуть: переглядати й експортувати їх можна ще 30 днів.',
    faq: [
      ['Скільки це коштує?', 'Три тарифи: «Старт» — 199 грн/міс (розклад, бот, сторінка запису, нагадування), «Бізнес» — 499 грн/міс (+ онлайн-оплати, звіти, розсилки), «Про» — 899 грн/міс (+ сертифікати, склад, зарплати, ПРРО, філії). До 1 березня 2027 усі функції безкоштовні, без картки.'],
      ['Що буде після пробного періоду?', 'Нічого не зникне. Без оплати зміни зупиняються, але переглядати й експортувати дані можна ще 30 днів.'],
      ['Чи підійде моєму бізнесу?', 'Так, якщо ви працюєте за записом: салони, барбершопи, клініки, масаж, студії, репетитори, СТО. Підтримуються групові заняття, кабінети й обладнання.'],
      ['Чи потрібен свій сайт?', 'Ні. Ви отримуєте власну сторінку запису з логотипом і QR-кодом. Якщо сайт є — кнопка «Записатися» додається одним рядком коду (Tilda, Wix, WordPress, Хорошоп).'],
      ['Бот працює, коли комп’ютер вимкнено?', 'Так. Бот, сторінка запису й нагадування працюють на сервері LOMVIKO цілодобово — вмикати нічого не треба.'],
      ['Як приймати оплату онлайн?', 'Інтеграції з monobank і LiqPay (ПриватБанк) уже зроблені — вам не потрібен програміст. Вставте ключ зі свого кабінету банку. Клієнт платить за посиланням чи QR-кодом, гроші надходять прямо на ваш рахунок, а візит позначається оплаченим.'],
      ['Що потрібно встановити?', 'Нічого. LOMVIKO працює в браузері на комп’ютері, планшеті й телефоні. На телефоні додайте іконку на головний екран — і відкривайте як застосунок.'],
      ['Чи можна забрати всі свої дані?', 'Так. Експорт усієї бази в JSON, CSV або зашифрований файл — будь-коли.'],
      ['Як з вами зв’язатися?', 'Напишіть на info@lomviko.com або прямо з LOMVIKO: розділ «Підтримка». Відповідь прийде на пошту.'],
    ],
    formTitle: 'Залишити заявку', formIntro: 'Залиште контакти — напишемо протягом робочого дня.', formConsent: 'Погоджуюся, щоб мені відповіли на цю пошту.', formName: 'Ваше ім’я', formBusiness: 'Назва бізнесу', formMessage: 'Що для вас найважливіше?', formSubmit: 'Надіслати заявку',
    offTitle: 'Почніть уже сьогодні', offBody: 'Спробуйте LOMVIKO безкоштовно — прямо в браузері, без встановлення.', offBodyMail: 'Напишіть нам — покажемо LOMVIKO і підготуємо доступ для вашого бізнесу.', writeUs: 'Написати нам', askTitle: 'Залишилися питання?', askBody: 'Напишіть нам — відповімо українською і підкажемо, як налаштувати LOMVIKO під ваш бізнес.',
    downloadSafety: 'Оновлюєте LOMVIKO? Спочатку створіть резервну копію в застосунку. Встановлення нової версії зберігає ваші дані.',
    download: 'Завантажити', macSub: 'Apple Silicon та Intel', winSub: 'Windows 10 і 11', integrity: 'Контрольна сума SHA-256', noRelease: 'Скоро. Слідкуйте за оновленнями на цій сторінці.',
    newsKicker: 'Оновлення', newsTitle: 'Що нового',
    faqKicker: 'Питання', faqTitle: ['Перед', 'початком.'],
    finalTitle: ['Перший онлайн-запис —', 'вже сьогодні.'], finalBody: 'Зареєструйтеся за дві хвилини прямо в браузері й користуйтеся всім безкоштовно до 1 березня 2027.', finalWord: 'РИТМ',
    footerTagline: 'CRM для бізнесу, що працює за записом.', footerMade: 'Комп’ютер · Телефон · Українська · English',
    legalLabel: 'Документи', operator: 'Власник сервісу — Чугунов, Україна', docTerms: 'Умови користування', docPrivacy: 'Політика конфіденційності', docOffer: 'Публічна оферта', docPresentation: 'Презентація', privacyLink: 'Політика конфіденційності',
    deckTitle: ['Покажіть LOMVIKO', 'своїй команді.'], deckCover: ['Ваш день —', 'в ідеальному ритмі.'], deckBody: 'Коротка презентація: можливості, сценарії роботи, безпека даних і запуск. Зручно переслати партнеру чи власнику бізнесу.', deckButton: 'Відкрити презентацію',
    sending: 'Надсилаємо…', invalid: 'Перевірте ім’я та email і спробуйте ще раз.', success: 'Дякуємо! Заявку отримано. Зв’яжемося за вказаним email.', error: 'Не вдалося надіслати заявку. Спробуйте пізніше.', rate: 'Забагато спроб. Спробуйте пізніше.',
    unavailable: 'Сервіс тимчасово недоступний. Спробуйте трохи пізніше.', waiting: 'Перевіряємо доступні версії…',
    board: { boardTitle: 'Розклад · сьогодні', boardDate: 'Четвер, 14 жовтня', statBookings: 'Записів', statRevenue: 'Виручка', statRevenueValue: '24 600 грн', statLoad: 'Завантаженість', memberOne: 'Олена', memberTwo: 'Максим', memberThree: 'Ірина', memberFour: 'Софія', bkOne: 'Фарбування', bkOneClient: 'Ірина К.', bkTwo: 'Стрижка', bkTwoClient: 'Дмитро', bkThree: 'Масаж спини', bkThreeClient: 'Олег', bkFour: 'SPA-догляд', bkFourClient: 'Марія', bkFive: 'Манікюр', bkFiveClient: 'Вікторія', bkSix: 'Манікюр + покриття', bkSixClient: 'Анна · Telegram', bkSeven: 'Корекція брів', bkSevenClient: 'Катерина', bkEight: 'Догляд за обличчям', bkEightClient: 'Юлія', toastBooking: 'Новий запис через Telegram', toastBookingDetail: 'Анна · Манікюр · 11:00', toastReminder: 'Нагадування надіслано', toastReminderDetail: 'Ігор · завтра о 10:00', boardNote: 'Демонстрація сценарію · вигадані дані', scrWelcome: 'Вітаємо в LOMVIKO', scrEmail: 'olena@studio.ua', scrStart: 'Спробувати безкоштовно', scrBrowser: 'Працює в браузері на комп’ютері й телефоні', scrCompany: 'Нова компанія', scrCode: 'Код із листа', scrShare: 'Ваше посилання' },
  },
  en: {
    meta: {
      title: 'Service business CRM & online appointment booking | LOMVIKO',
      description: 'LOMVIKO brings online appointment booking, team schedules, Telegram reminders, client records, payments and financial reports together for service businesses.',
      ogTitle: 'LOMVIKO — clients book themselves',
      ogDescription: '24/7 online booking, reminders, payment links, a team schedule and finances — in one app. For appointment-based service businesses.',
      ogAlt: 'LOMVIKO — booking CRM for service businesses',
      locale: 'en_US', alternate: 'uk_UA',
    },
    noScriptHelp: 'Enable JavaScript for interactive demos and the request form, or email us:', closeLabel: 'Close', skip: 'Skip to content', navLabel: 'Navigation', navFeatures: 'Features', navHow: 'How it works', navCalc: 'Calculator', navBusiness: 'Who it’s for', navIntegrations: 'Integrations', navFaq: 'FAQ', navDownload: 'Sign in', haveAccount: 'Already have an account?', navPrice: 'Pricing',
    ctaDemo: 'Get a demo', ctaDownload: 'Download', ctaTrial: 'Try it free', ctaShort: 'Try free', stickyText: 'Free until 1 March · no card', seeHow: 'See how it works',
    heroEyebrow: 'The CRM for salons, clinics, studios and car services',
    heroTitle: ['Online booking and CRM', 'for your business.'],
    heroDescription: 'Clients book themselves 24/7, a bot reminds them of the visit, and your schedule, payments, expenses and team pay live in one app. For salons, clinics, car services, studios and anyone who works by appointment.',
    trustOne: 'Every feature free until 1 March', trustTwo: 'No card needed', trustThree: 'Browser and phone — nothing to install',
    marqueeLabel: 'For businesses that run on appointments',
    marquee: ['Beauty salons', 'Barbershops', 'Nail studios', 'Cosmetology', 'Massage & spa', 'Dental clinics', 'Private clinics', 'Therapists', 'Fitness & yoga', 'Dance studios', 'Tutors', 'Tattoo studios', 'Car service', 'Photo studios', 'Pet grooming'],
    whyKicker: 'Why', whyTitle: ['Chaos in chats is', 'a thing of the past.'], whyIntro: 'Sound familiar? Here’s what changes from day one.',
    beforeTitle: 'Today', afterTitle: 'With LOMVIKO',
    pains: ['Bookings in a notebook, Instagram and three messengers', 'A client writes at 11 p.m. — you reply in the morning, and they’ve booked elsewhere', 'A client forgot their visit — an idle hour and lost money', 'Bank details in DMs and waiting for a payment screenshot', 'What each specialist earned? Only a rough guess'],
    gains: ['Clients pick the service, specialist and time themselves — in Telegram or on your page', 'One schedule for the whole team: free slots at a glance', 'The bot reminds clients 24 hours and 2 hours before', 'Send a payment link — the visit marks itself as paid', 'Revenue for any period and per specialist'],
    calcKicker: 'Calculator', calcTitle: ['What do no-shows', 'really cost?'],
    calcIntro: 'A client forgets — your specialist sits idle and that hour can’t be sold again. See what it costs your business.',
    calcCheck: 'Average ticket', calcVisits: 'Appointments per day', calcNoShow: 'No-shows and late cancellations', calcDays: 'Working days per month',
    calcLoss: 'You lose every month', calcBack: 'If reminders save a third of these visits',
    calcMissed: (n) => `≈ ${n} missed visits per month`, calcYear: (v) => `${v} per year`,
    calcNote: 'An estimate from your numbers, not a promise. The bot reminds each client in Telegram a day and 2 hours before the visit.',
    currency: 'UAH', locale: 'en-GB',
    featuresKicker: 'Features', featuresTitle: ['Everything an appointment business needs.', 'In one window.'], featuresIntro: 'Turn each feature on when you need it. The rest stays out of your way.',
    features: [
      [2, 'calendar', 'One schedule for your team', 'Specialists, rooms and equipment in one grid. Personal working days, days off and holidays — and visits on those days can be handed to a colleague right away.'],
      [1, 'send', '24/7 Telegram bot', 'Clients book themselves even at 3 a.m. The bot runs on the server — while your computer is off.'],
      [1, 'link', 'Your own booking page', 'A link with your logo for Instagram and Google Maps, a QR code for the front desk and a “Book now” button for your website.'],
      [2, 'bell', 'Reminders that save revenue', 'The bot reminds clients 24 hours and 2 hours before the visit. Fewer no-shows — fewer hours you can’t sell again.'],
      [1, 'card', 'monobank and PrivatBank — already built in', 'We built the monobank and LiqPay (PrivatBank) integrations for you: no developers, no extra contracts. Paste your key — clients pay by link or QR and the money goes straight to your account.'],
      [1, 'chart', 'Finances without spreadsheets', 'Revenue, materials, refunds and workload — for any period and per specialist.'],
      [2, 'layers', 'Expenses, materials and pay', 'Log rent, purchases, ads and taxes. Materials are written off with every service and you always see what is left. Specialist pay is calculated for you: a share of services plus a day rate.'],
      [1, 'users', 'A team in sync', 'Everyone gets their day plan and new online bookings in Telegram; the owner gets weekly and monthly reports.'],
      [2, 'lock', 'Roles, access and several businesses', 'Owner, admin and specialist see only their part; finances by permission only. Several companies — one login.'],
      [1, 'download', 'Your data is yours', 'Export the whole database as JSON, CSV or an encrypted file — anytime.'],
    ],
    integrationsTitle: ['Works with the tools', 'you already use.'], integrationsIntro: 'Connecting takes a few minutes: paste a key or a link in the settings. No developer needed.',
    integrations: [
      ['monobank', 'Payments', 'monobank acquiring: clients pay by link or QR, money goes straight to your account and the visit is marked paid.'],
      ['PrivatBank', 'Payments', 'LiqPay by PrivatBank: any bank card, Apple Pay or Google Pay.'],
      ['Telegram', 'Clients and team', 'Your company bot books clients 24/7, sends reminders and gives the team their day plan.'],
      ['Checkbox', 'Receipts', 'Software cash register: the fiscal receipt is issued after payment by itself. Connect it only if you need it.'],
      ['Vchasno.Kasa', 'Receipts', 'Another software cash register to choose from, with the same automatic receipts.'],
      ['Google', 'Reviews and Maps', 'Happy clients are invited to leave a Google review, and your booking link goes on Google Maps.'],
      ['Instagram', 'Booking page', 'Your booking page link for the profile bio and stories.'],
      ['Tilda, Wix, WordPress', 'Website', 'A “Book now” button for your site in one line of code.'],
      ['Excel and Google Sheets', 'Data', 'Bring clients over from a spreadsheet or another app, and export the whole database anytime.'],
    ],
    replaceTitle: ['One service', 'instead of all this.'], replaceIntro: 'No separate subscriptions for booking, reminders and reports — and no stitching them together.',
    pageTitle: ['Your own booking page.', 'No website needed.'],
    pageIntro: 'A client opens the link from Instagram or Google Maps, picks a service, specialist and free time, leaves a name and phone — and the booking is already in your schedule. No sign-up, no apps.',
    pagePoints: ['A link for your Instagram bio and Google Maps', 'A QR code for the front desk, mirrors and business cards', 'A “Book now” button for Tilda, Wix or WordPress', 'Your logo, cover and colour', 'Only truly free time — no double bookings'],
    pageStylesLabel: 'Pick a style and see how it looks:',
    pageStyles: [['warm', 'Warm'], ['lux', 'Luxe'], ['minimal', 'Minimal'], ['bright', 'Bright']],
    bp: { name: 'Studio Nova', about: 'Nails, brows and skincare · near Lukianivska metro', service: 'Service', services: [['Manicure + gel', '1 h 30 min', 'UAH 900'], ['Brow shaping', '45 min', 'UAH 450'], ['Facial care', '1 h', 'UAH 1,200']], who: 'Specialist', people: ['Anyone available', 'Olena', 'Iryna'], when: 'Tomorrow, Friday', times: ['10:00', '11:30', '13:00', '15:30', '17:00', '18:30'], book: 'Book for 11:30' },
    ownerTitle: ['Your business under control.', 'Even from your phone.'],
    ownerIntro: 'No need to open the computer to know how the day is going. Your company bot sends the essentials — even while the computer is off.',
    ownerPoints: ['Every morning: bookings per specialist, expected revenue, free slots and yesterday’s totals', 'Instantly: new online bookings, cancellations and payments', 'Every Monday a weekly report with comparison; on the 1st, a monthly one', 'Each specialist connects their own Telegram and sees their day'],
    tg: { bot: 'Studio Nova', status: 'company bot', msgs: [['08:30', '☀️ Good morning! Today, Thursday', '18 bookings · UAH 24,600 expected\nOlena — 6 · Max — 5 · Iryna — 7\nFree: Max 14:00–16:00\nYesterday: UAH 21,900, no-shows — 1'], ['11:02', '🆕 New online booking', 'Anna · Manicure + gel\nTomorrow 11:30 · Iryna · from the booking page'], ['11:40', '💳 monobank payment', 'UAH 900 · Oleh · Back massage']] },
    replace: [['Notebook and Google Sheets', 'Schedule and client base with visit history'], ['A separate online booking service', 'Telegram bot and your own booking page'], ['Calls and “just a reminder” messages', 'Automatic reminders'], ['Bank details in DMs and payment screenshots', 'Payment by link or QR'], ['Excel for revenue', 'Financial reports per specialist'], ['Team chat: “who’s working tomorrow?”', 'Everyone’s day plan in Telegram']],
    howKicker: 'How it works', howTitle: ['A day', 'with LOMVIKO.'], howIntro: 'Pick a scenario and see what happens between a client booking and a completed visit.', storiesLabel: 'Scenarios',
    stories: [
      { tab: 'Who, when and with whom', tag: 'Schedule', title: '“Is anyone free at noon?”', body: 'Don’t ask in a group chat — check the schedule. Who’s working, where the free slot is and how long the service takes — the whole team sees it at once.', foot: 'One booking — one shared plan for the team.', labels: ['Olena', 'Max', 'Haircut · Iryna', 'Massage · Oleh', 'Free slot', 'Book', 'Colouring · Julia', 'Manicure · Anna'] },
      { tab: 'Booking without the back-and-forth', tag: 'Telegram bot', title: 'Clients book. You work.', body: 'Clients choose the service, specialist and time themselves — at noon or at 3 a.m. The bot runs on the server even when the app is closed, and sends reminders on its own.', foot: 'Try booking yourself — on the right.', bot: { hint: 'Try it yourself', hello: 'Hi there! 👋 Which service would you like to book?', services: ['Manicure', 'Haircut', 'Massage'], when: 'Great! Pick a time that suits you today:', times: ['11:00', '12:30', '15:00'], done: (s, t) => `Done! ${s}, today at ${t}. I’ll remind you 24 and 2 hours before ✓`, crm: 'The booking is already in LOMVIKO', again: 'Start over' } },
      { tab: 'Where the workday went', tag: 'Results', title: 'The day is over. The numbers stay.', body: 'Record a payment and it’s already in your books. Revenue, workload and top services for any period — no spreadsheets or calculators.', foot: 'Only people you allow can see finances.', chart: { label: 'Revenue this week', value: 'UAH 86,400', delta: '+18% vs last week', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] } },
    ],
    peekKicker: 'Product', peekTitle: ['Open it. See your day.', 'Get to work.'], peekBody: 'Schedule, clients and payments side by side. No need to remember which chat you agreed in.', peekCaption: 'The real LOMVIKO interface. The image shows illustrative demo data.', peekAlt: 'LOMVIKO interface: a daily schedule with client appointments',
    businessKicker: 'Who it’s for', businessTitle: ['Your CRM should fit', 'the way you work.'], segmentsLabel: 'Business type',
    segments: {
      beauty: ['Beauty', 'From the first booking to a loyal client', 'Specialists, services and durations in one shared schedule. Clients pick a convenient time themselves.', ['A chosen specialist or anyone available', 'Reminders reduce no-shows', 'Visit history and notes for every client'], ['Salons', 'Barbershops', 'Nail studios', 'Cosmetologists', 'Brows & lashes']],
      health: ['Health', 'Appointments without overlaps or queues', 'Specialists, rooms and equipment as resources in one schedule. Patients get reminded in advance.', ['Multiple specialists and rooms', 'Different appointment lengths', 'Access roles for front desk and doctors'], ['Dental clinics', 'Massage', 'Therapists', 'Rehabilitation', 'Private practices']],
      studio: ['Education & sport', 'Group and one-to-one sessions', 'Coaches, rooms and class capacity in one schedule. Students book through Telegram — no calls.', ['Group booking with a seat limit', 'Coaches and rooms as resources', 'Booking and reminders via the bot'], ['Yoga', 'Fitness', 'Dance', 'Tutors', 'Language schools']],
      service: ['Services', 'Work without downtime', 'Allocate the time of specialists, bays and equipment. Clients know when to come, and the team knows what’s next.', ['Multiple resources working together', 'Service duration, price and availability', 'Separate teams for multiple businesses'], ['Car service', 'Device repair', 'Photo studios', 'Pet grooming', 'Venue rental']],
    },
    trustKicker: 'Ukraine', trustTitle: ['Built for work', 'in Ukraine.'], trustIntro: 'In Ukrainian, in hryvnias, with Ukrainian banks — and built for the days when the power goes out.',
    trust: [
      ['bolt', 'Blackouts don’t stop bookings', 'The bot and booking page run on the server. While your power is out, clients keep booking, and your schedule opens on your phone over mobile data.'],
      ['coin', 'monobank and Privat — integrations ready', 'LOMVIKO is already integrated with monobank and PrivatBank’s LiqPay. Connecting takes a minute with a key from your bank account. Any card, Apple Pay, Google Pay, Privat24 — money goes straight to your account.'],
      ['shield', 'No double bookings', 'The bot, booking page and front desk write to one schedule. A taken slot can’t be taken twice.'],
      ['lock', 'Your data is protected', 'Password sign-in, an encrypted connection and every action signed. Export the whole database anytime, in one click.'],
      ['users', 'Roles & permissions', 'Owner, admin and specialist see only their part. Finances by permission only.'],
      ['chat', 'Support inside LOMVIKO', 'A question or an idea — write straight from LOMVIKO. Replies arrive by email and in the Support section.'],
    ],
    statsLabel: 'LOMVIKO in numbers',
    stats: [['30', 'days free — every feature, no card needed'], ['24/7', 'bookings come in — the bot and booking page never sleep'], ['×2', 'client reminders — 24 hours and 2 hours before the visit'], ['3', 'ways to book: Telegram, a link and a button on your site']],
    demoKicker: 'Get started', stepOne: 'Click “Try it free” — LOMVIKO opens in your browser, nothing to install.', stepTwo: 'Enter your business name, email and password, then confirm your email with the code we send.', stepThree: 'Add services and your team, share your booking link — clients book themselves.', stepOneTitle: 'Open LOMVIKO', stepTwoTitle: 'Create your company', stepThreeTitle: 'Share your link', launchTitle: ['Your first online booking', 'in three steps.'], launchIntro: 'No sales calls, nothing to install. Most owners take their first booking on the day they sign up.',
    priceTitle: ['Three plans.', 'Pay only for what you need.'], priceNoteSales: 'No card and no sales calls. Change your plan any time — your data stays.', freeBanner: 'Every feature is free until {date} — no card. The prices below apply after that.', planMonth: 'UAH / month', planChoose: 'Choose', planTry: 'Try it free', planRequest: 'Leave a request', planPopular: 'Most popular', planIncludes: 'Everything in {plan}, plus:', planUsers: 'Unlimited users', closedBanner: 'Registration is closed for now. Leave a request and we will write as soon as it opens.', priceNote: 'No card and no sales calls. Sign up right in your browser — and take your first online bookings today.',
    planKicker: 'One plan · every feature', planPer: 'UAH / month per company', planList: ['Free until 1 March 2027, no card needed', 'Telegram bot, booking page and reminders', 'Ready-made monobank and PrivatBank (LiqPay) integrations', 'The whole team, on a computer or a phone'], planNote: 'After the trial your data stays: you can view and export it for another 30 days.',
    faq: [
      ['How much does it cost?', 'Three plans: Start — UAH 199/month (schedule, bot, booking page, reminders), Business — UAH 499/month (+ online payments, reports, mailings), Pro — UAH 899/month (+ certificates, stock, pay, fiscal receipts, branches). Every feature is free until 1 March 2027, no card needed.'],
      ['What happens after the trial?', 'Nothing is lost. Without payment, editing stops, but you can view and export your data for another 30 days.'],
      ['Will it fit my business?', 'Yes, if you work by appointment: salons, barbershops, clinics, massage, studios, tutors, car services. Group classes, rooms and equipment are supported.'],
      ['Do I need my own website?', 'No. You get your own booking page with your logo and a QR code. If you have a site, the “Book now” button is one line of code (Tilda, Wix, WordPress).'],
      ['Does the bot work when my computer is off?', 'Yes. The bot, booking page and reminders run on the LOMVIKO server around the clock — nothing to keep switched on.'],
      ['How do I take payments online?', 'The monobank and LiqPay (PrivatBank) integrations are already built — no developer needed. Paste the key from your bank account. The client pays by link or QR code, the money goes straight to your account and the visit is marked paid.'],
      ['What do I need to install?', 'Nothing. LOMVIKO runs in the browser on a computer, tablet or phone. On a phone, add the icon to your home screen and open it like an app.'],
      ['Can I take all my data with me?', 'Yes. Export the whole database as JSON, CSV or an encrypted file — anytime.'],
      ['How do I reach you?', 'Write to info@lomviko.com or straight from LOMVIKO in the Support section. We reply by email.'],
    ],
    formTitle: 'Leave a request', formIntro: 'Leave your contacts and we will write back within a business day.', formConsent: 'I agree to be contacted at this email.', formName: 'Your name', formBusiness: 'Business name', formMessage: 'What matters most to you?', formSubmit: 'Send request',
    offTitle: 'Start today', offBody: 'Try LOMVIKO free — right in your browser, nothing to install.', offBodyMail: 'Write to us — we’ll show you LOMVIKO and prepare access for your business.', writeUs: 'Write to us', askTitle: 'Still have questions?', askBody: 'Write to us — we’ll reply and help you set LOMVIKO up for your business.',
    downloadSafety: 'Updating LOMVIKO? Create a backup in the app first. Installing a new version keeps your data.',
    download: 'Download', macSub: 'Apple Silicon and Intel', winSub: 'Windows 10 and 11', integrity: 'SHA-256 checksum', noRelease: 'Coming soon. Check back on this page.',
    newsKicker: 'Updates', newsTitle: 'What’s new',
    faqKicker: 'FAQ', faqTitle: ['Before', 'you start.'],
    finalTitle: ['Your first online booking —', 'today.'], finalBody: 'Sign up in two minutes right in your browser and use everything free until 1 March 2027.', finalWord: 'RHYTHM',
    footerTagline: 'The CRM for appointment-based businesses.', footerMade: 'Computer · Phone · Українська · English',
    legalLabel: 'Documents', operator: 'Service owner — Chuhunov, Ukraine', docTerms: 'Terms of use', docPrivacy: 'Privacy policy', docOffer: 'Public offer', docPresentation: 'Presentation', privacyLink: 'Privacy policy',
    deckTitle: ['Show LOMVIKO', 'to your team.'], deckCover: ['Your day —', 'in perfect rhythm.'], deckBody: 'A short presentation: features, everyday scenarios, data security and getting started. Easy to forward to a partner or the business owner.', deckButton: 'Open the presentation',
    sending: 'Sending…', invalid: 'Check your name and email and try again.', success: 'Thank you! We received your request and will contact you by email.', error: 'We could not send your request. Please try again later.', rate: 'Too many attempts. Please try again later.',
    unavailable: 'The service is temporarily unavailable. Please try again a little later.', waiting: 'Checking available versions…',
    board: { boardTitle: 'Schedule · today', boardDate: 'Thursday, 14 October', statBookings: 'Bookings', statRevenue: 'Revenue', statRevenueValue: 'UAH 24,600', statLoad: 'Utilisation', memberOne: 'Olena', memberTwo: 'Max', memberThree: 'Iryna', memberFour: 'Sofia', bkOne: 'Colouring', bkOneClient: 'Iryna K.', bkTwo: 'Haircut', bkTwoClient: 'Dmytro', bkThree: 'Back massage', bkThreeClient: 'Oleh', bkFour: 'Spa care', bkFourClient: 'Maria', bkFive: 'Manicure', bkFiveClient: 'Victoria', bkSix: 'Manicure + gel', bkSixClient: 'Anna · Telegram', bkSeven: 'Brow shaping', bkSevenClient: 'Kateryna', bkEight: 'Facial care', bkEightClient: 'Julia', toastBooking: 'New booking via Telegram', toastBookingDetail: 'Anna · Manicure · 11:00', toastReminder: 'Reminder sent', toastReminderDetail: 'Ihor · tomorrow at 10:00', boardNote: 'Scenario demo · fictional data', scrWelcome: 'Welcome to LOMVIKO', scrEmail: 'olena@studio.com', scrStart: 'Try it free', scrBrowser: 'Works in the browser on computer and phone', scrCompany: 'New company', scrCode: 'Code from the email', scrShare: 'Your booking link' },
  },
};

// Stock texts that the site admin may also hold. When the published text still equals these,
// the page shows the editorial copy above; any custom admin text is shown as is.
const fallbackContent = {"uk":{"eyebrow":"CRM для салонів, клінік, студій і СТО","title":"Онлайн-запис і CRM для вашого бізнесу.","description":"Клієнти записуються самі 24/7, бот нагадує про візит, а розклад, оплати, витрати й зарплати команди — в одній програмі. Для салонів, клінік, СТО, студій і всіх, хто працює за записом.","price":"199 грн на місяць або 1 990 грн на рік. До 1 березня 2027 — безкоштовно.","priceNote":"Без картки й без дзвінків менеджера. Зареєструйтеся прямо в браузері — і приймайте перші онлайн-записи вже сьогодні.","about":"Один робочий простір для кількох бізнесів, команд і послуг.","privacy":"Надаючи ім’я та email, ви погоджуєтеся на їх використання для відповіді на вашу заявку. Ми не створюємо обліковий запис автоматично. Щоб видалити заявку, зверніться за контактним email на цій сторінці.","features":[["▦","Розклад для всієї команди","Майстри, кабінети й обладнання в одній сітці. Свій графік у кожного спеціаліста, вихідні й відпустки — а записи з цих днів можна одразу передати колезі."],["↗","Telegram-бот 24/7","Клієнт записується сам навіть о третій ночі. Бот працює на сервері — коли ваш комп’ютер вимкнено."],["◫","Ваша сторінка запису","Посилання з логотипом для Instagram і Google Карт, QR-код на ресепшн і кнопка «Записатися» для сайту."],["☁","Нагадування, що рятують виручку","Бот нагадує клієнту за 24 і за 2 години до візиту. Менше неявок — менше годин, які вже не продати."],["♙","monobank і ПриватБанк — уже підключені","Інтеграції з monobank і LiqPay (ПриватБанк) ми зробили за вас: без програмістів і окремих договорів на розробку. Вставте свій ключ — і клієнти платять за посиланням чи QR, гроші одразу на ваш рахунок."],["↓","Фінанси без таблиць","Виручка, матеріали, повернення й завантаженість — за будь-який період і по кожному спеціалісту."]],"faq":[["Скільки це коштує?","Три тарифи: «Старт» — 199 грн/міс (розклад, бот, сторінка запису, нагадування), «Бізнес» — 499 грн/міс (+ онлайн-оплати, звіти, розсилки), «Про» — 899 грн/міс (+ сертифікати, склад, зарплати, ПРРО, філії). До 1 березня 2027 усі функції безкоштовні, без картки."],["Що буде після пробного періоду?","Нічого не зникне. Без оплати зміни зупиняються, але переглядати й експортувати дані можна ще 30 днів."],["Чи підійде моєму бізнесу?","Так, якщо ви працюєте за записом: салони, барбершопи, клініки, масаж, студії, репетитори, СТО. Підтримуються групові заняття, кабінети й обладнання."],["Чи потрібен свій сайт?","Ні. Ви отримуєте власну сторінку запису з логотипом і QR-кодом. Якщо сайт є — кнопка «Записатися» додається одним рядком коду (Tilda, Wix, WordPress, Хорошоп)."]]},"en":{"eyebrow":"The CRM for salons, clinics, studios and car services","title":"Online booking and CRM for your business.","description":"Clients book themselves 24/7, a bot reminds them of the visit, and your schedule, payments, expenses and team pay live in one app. For salons, clinics, car services, studios and anyone who works by appointment.","price":"UAH 199 a month or UAH 1,990 a year. Free until 1 March 2027.","priceNote":"No card and no sales calls. Sign up right in your browser — and take your first online bookings today.","about":"One workspace for multiple businesses, teams and services.","privacy":"By providing your name and email, you agree to their use to respond to your request. We do not automatically create an account. To delete your request, contact the email displayed on this page.","features":[["▦","One schedule for your team","Specialists, rooms and equipment in one grid. Personal working days, days off and holidays — and visits on those days can be handed to a colleague right away."],["↗","24/7 Telegram bot","Clients book themselves even at 3 a.m. The bot runs on the server — while your computer is off."],["◫","Your own booking page","A link with your logo for Instagram and Google Maps, a QR code for the front desk and a “Book now” button for your website."],["☁","Reminders that save revenue","The bot reminds clients 24 hours and 2 hours before the visit. Fewer no-shows — fewer hours you can’t sell again."],["♙","monobank and PrivatBank — already built in","We built the monobank and LiqPay (PrivatBank) integrations for you: no developers, no extra contracts. Paste your key — clients pay by link or QR and the money goes straight to your account."],["↓","Finances without spreadsheets","Revenue, materials, refunds and workload — for any period and per specialist."]],"faq":[["How much does it cost?","Three plans: Start — UAH 199/month (schedule, bot, booking page, reminders), Business — UAH 499/month (+ online payments, reports, mailings), Pro — UAH 899/month (+ certificates, stock, pay, fiscal receipts, branches). Every feature is free until 1 March 2027, no card needed."],["What happens after the trial?","Nothing is lost. Without payment, editing stops, but you can view and export your data for another 30 days."],["Will it fit my business?","Yes, if you work by appointment: salons, barbershops, clinics, massage, studios, tutors, car services. Group classes, rooms and equipment are supported."],["Do I need my own website?","No. You get your own booking page with your logo and a QR code. If you have a site, the “Book now” button is one line of code (Tilda, Wix, WordPress)."]]}};

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const PLAN_FALLBACK = {
  sales: false, registration: true, free_until: Date.parse('2027-03-01T00:00:00+02:00'),
  base: { uk: ['Розклад і клієнтська база', 'Telegram-бот для запису 24/7', 'Сторінка онлайн-запису', 'Нагадування клієнтам'], en: ['Schedule and client base', 'Telegram booking bot 24/7', 'Online booking page', 'Client reminders'] },
  plans: [
    { id: 'start', price: 199, uk: 'Старт', en: 'Start', for: { uk: 'Для майстра, який працює сам або вдвох', en: 'For a specialist working alone or in pairs' }, features: [] },
    { id: 'business', price: 499, uk: 'Бізнес', en: 'Business', popular: true, for: { uk: 'Для салону чи студії з командою', en: 'For a salon or studio with a team' }, features: [{ uk: 'Онлайн-оплати monobank і LiqPay, передоплата', en: 'Online payments (monobank, LiqPay), prepayment' }, { uk: 'Дашборд, фінансовий звіт, витрати, звіти в Telegram', en: 'Dashboard, finance report, expenses, Telegram reports' }, { uk: '«Давно не були», відгуки в Google', en: 'Win-back invitations, Google reviews' }] },
    { id: 'pro', price: 899, uk: 'Про', en: 'Pro', for: { uk: 'Для бізнесу з обліком, касою та філіями', en: 'For businesses with accounting, receipts and branches' }, features: [{ uk: 'Подарункові сертифікати й абонементи', en: 'Gift certificates and passes' }, { uk: 'Матеріали та склад', en: 'Materials and stock' }, { uk: 'Зарплати спеціалістів', en: 'Specialists’ pay' }, { uk: 'Фіскальні чеки (ПРРО)', en: 'Fiscal receipts' }, { uk: 'Кілька філій в одному акаунті', en: 'Several branches in one account' }] },
  ],
};

function renderPublic(document, { language = 'uk', site = null, segment = 'beauty', story = 0, pageStyle = 'warm', bot = { step: 0 } } = {}, part = 'all') {
const $ = (s) => document.querySelector(s), $$ = (s) => document.querySelectorAll(s);
const t = (key) => translations[language][key];
const content = () => site?.locales?.[language] || fallbackContent[language];
const documentSlugs = { 'site-privacy': 'privacy', 'site-terms': 'terms', 'site-offer': 'offer', presentation: 'presentation' };
const documentHref = (kind) => (language === 'en' ? '/en/' : '/') + documentSlugs[kind];
function heading(el, parts) { el.innerHTML = `${esc(parts[0])} <em>${esc(parts[1])}</em>`; }

function editorial(id, key, stock) {
  const el = $('#' + id); if (!el) return;
  const value = content()[stock];
  if (!value || value === fallbackContent[language][stock]) {
    const text = t(key);
    if (Array.isArray(text)) heading(el, text); else el.textContent = text;
  } else el.textContent = value;
}

function setMeta(selector, attribute, value) { const el = document.querySelector(selector); if (el) el.setAttribute(attribute, value); }

function meta() {
  const m = t('meta'), url = SITE_URL + (language === 'en' ? '/en' : '/');
  document.documentElement.lang = language;
  document.title = m.title;
  setMeta('meta[name="description"]', 'content', m.description);
  setMeta('link[rel="canonical"]', 'href', url);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('meta[property="og:locale"]', 'content', m.locale);
  setMeta('meta[property="og:locale:alternate"]', 'content', m.alternate);
  setMeta('meta[property="og:title"]', 'content', m.ogTitle);
  setMeta('meta[property="og:description"]', 'content', m.ogDescription);
  setMeta('meta[property="og:image:alt"]', 'content', m.ogAlt);
  setMeta('meta[name="twitter:title"]', 'content', m.ogTitle);
  setMeta('meta[name="twitter:description"]', 'content', m.ogDescription);
  const image = SITE_URL + '/assets/' + (language === 'en' ? 'og-en.png' : 'og.png');
  setMeta('meta[property="og:image"]', 'content', image);
  setMeta('meta[name="twitter:image"]', 'content', image);
  const description = content().description === fallbackContent[language].description ? t('heroDescription') : content().description;
  $('#structured-data').textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': SITE_URL + '/#organization', name: 'LOMVIKO', alternateName: ['Lomviko', 'Ломвіко', 'Ломвико'], url: SITE_URL + '/', logo: SITE_URL + '/assets/icon-512.png' },
    { '@type': 'WebSite', '@id': SITE_URL + '/#website', name: 'LOMVIKO', url: SITE_URL + '/', inLanguage: ['uk', 'en'], publisher: { '@id': SITE_URL + '/#organization' } },
    { '@type': 'SoftwareApplication', '@id': url + '#software', name: 'LOMVIKO', url, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: language, description, publisher: { '@id': SITE_URL + '/#organization' } },
  ] }).replace(/</g, '\\u003c');
}

function staticText() {
  $$('[data-t]').forEach((el) => { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
  $$('[data-h]').forEach((el) => heading(el, t(el.dataset.h)));
  $$('[data-t-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.tLabel)));
  $$('[data-t-alt]').forEach((el) => el.setAttribute('alt', t(el.dataset.tAlt)));
  const board = t('board');
  $$('[data-m]').forEach((el) => { if (board[el.dataset.m]) el.textContent = board[el.dataset.m]; });
  $$('[data-lang]').forEach((b) => b.setAttribute('aria-current', b.dataset.lang === language ? 'page' : 'false'));
  editorial('hero-eyebrow', 'heroEyebrow', 'eyebrow');
  editorial('hero-title', 'heroTitle', 'title');
  editorial('hero-description', 'heroDescription', 'description');
  heading($('#site-price'), t('priceTitle'));
  const c = content();
  for (const [id, key] of Object.entries({ 'site-about': 'about' })) $('#' + id).textContent = c[key] || fallbackContent[language][key];
}

function lists() {
  $('#pains').innerHTML = t('pains').map((p) => `<li>${svg('cross')}<span>${esc(p)}</span></li>`).join('');
  $('#gains').innerHTML = t('gains').map((p) => `<li>${svg('check')}<span>${esc(p)}</span></li>`).join('');
  const items = t('marquee').map((m) => `<span>${esc(m)}</span>`).join('');
  $('#marquee-track').innerHTML = items + items.replace(/<span>/g, '<span aria-hidden="true">');
  // Admin-edited features and FAQ win; while the admin still holds the stock texts, the page shows the editorial copy.
  const custom = (key) => { const v = content()[key]; return v && JSON.stringify(v) !== JSON.stringify(fallbackContent[language][key]) ? v : null; };
  const spans = [2, 1, 1, 2, 1, 2];
  const features = custom('features')?.map(([, title, body], i) => [spans[i % 6], featureIcons[i % featureIcons.length], title, body]) || t('features');
  $('#features-grid').innerHTML = features.map(([span, icon, title, body]) => `<article class="card reveal${span === 2 ? ' span-2' : ''}"><span class="card-icon">${svg(icon)}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('');
  $('#integrations-grid').innerHTML = t('integrations').map(([name, kind, body]) => `<article class="integration reveal"><span class="integration-kind">${esc(kind)}</span><h3>${esc(name)}</h3><p>${esc(body)}</p></article>`).join('');
  $('#replace-list').innerHTML = t('replace').map(([from, to]) => `<div class="replace-row reveal"><s>${esc(from)}</s>${arrow}<strong>${esc(to)}</strong></div>`).join('');
  $('#trust-grid').innerHTML = t('trust').map(([icon, title, body]) => `<article class="trust-item reveal"><span class="card-icon">${svg(icon)}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('');
  const ticks = (items) => items.map((p) => `<li>${svg('check')}<span>${esc(p)}</span></li>`).join('');
  $('#page-points').innerHTML = ticks(t('pagePoints'));
  $('#owner-points').innerHTML = ticks(t('ownerPoints'));
  $('#page-styles').setAttribute('aria-label', t('pageStylesLabel'));
  $('#page-styles').innerHTML = t('pageStyles').map(([key, label]) => `<button type="button" data-page-style="${key}" aria-pressed="${key === pageStyle}">${esc(label)}</button>`).join('');
  bookingPhone(); telegramPhone();
  const faq = custom('faq') || t('faq');
  $('#faq-list').innerHTML = faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
}

function bookingPhone() {
  const b = t('bp'), el = $('#bp');
  el.className = `phone bp style-${pageStyle}`;
  el.innerHTML = `<div class="bp-cover"></div><div class="bp-body"><span class="bp-logo">SN</span><strong class="bp-name">${esc(b.name)}</strong><p class="bp-about">${esc(b.about)}</p>
    <p class="bp-label">${esc(b.service)}</p>${b.services.map(([n, d, p], i) => `<div class="bp-row${i === 0 ? ' on' : ''}"><span><b>${esc(n)}</b><small>${esc(d)}</small></span><em>${esc(p)}</em></div>`).join('')}
    <p class="bp-label">${esc(b.who)}</p><div class="bp-chips">${b.people.map((n, i) => `<span class="bp-chip${i === 2 ? ' on' : ''}">${esc(n)}</span>`).join('')}</div>
    <p class="bp-label">${esc(b.when)}</p><div class="bp-times">${b.times.map((n, i) => `<span class="bp-time${i === 1 ? ' on' : ''}">${esc(n)}</span>`).join('')}</div>
    <span class="bp-btn">${esc(b.book)}</span></div>`;
}

function telegramPhone() {
  const g = t('tg');
  $('#tg').innerHTML = `<div class="tg-head"><span class="tg-ava">SN</span><span><strong>${esc(g.bot)}</strong><small>${esc(g.status)}</small></span></div><div class="tg-feed">${g.msgs.map(([time, title, body]) => `<div class="tg-msg"><strong>${esc(title)}</strong>${body.split('\n').map((l) => `<span>${esc(l)}</span>`).join('')}<time>${esc(time)}</time></div>`).join('')}</div>`;
}

function storyTabs() {
  $('#story-tabs').innerHTML = t('stories').map((s, i) => `<button class="story-tab" role="tab" id="story-tab-${i}" aria-controls="story-panel" aria-selected="${i === story}" tabindex="${i === story ? 0 : -1}" data-story="${i}"><span>0${i + 1}</span><strong>${esc(s.tab)}</strong></button>`).join('');
}

function storyVisual(i) {
  const s = t('stories')[i];
  if (i === 0) {
    const l = s.labels;
    return `<div class="story-visual"><div class="sv-row sv-head"><span></span><span>${esc(l[0])}</span><span>${esc(l[1])}</span></div>
      <div class="sv-row"><span>10:00</span><div class="sv-cell busy">${esc(l[2])}</div><div class="sv-cell busy">${esc(l[3])}</div></div>
      <div class="sv-row"><span>11:00</span><div class="sv-cell busy">${esc(l[6])}</div><div class="sv-cell busy">${esc(l[3])}</div></div>
      <div class="sv-row"><span>12:00</span><div class="sv-cell busy">${esc(l[6])}</div><div class="sv-cell free">${esc(l[4])}<b>${esc(l[5])}</b></div></div>
      <div class="sv-row"><span>13:00</span><div class="sv-cell"></div><div class="sv-cell busy">${esc(l[7])}</div></div></div>`;
  }
  if (i === 1) return `<div class="story-visual chat" id="bot">${botView()}</div>`;
  const c = s.chart, heights = ['h40', 'h55', 'h48', 'h70', 'h92', 'h100', 'h35'];
  return `<div class="story-visual"><div class="chart-head"><div><span>${esc(c.label)}</span><strong>${esc(c.value)}</strong></div><em>${esc(c.delta)}</em></div>
    <div class="bars">${heights.map((h, k) => `<i class="${h}${k === 5 ? ' top' : ''}"></i>`).join('')}</div>
    <div class="bar-labels">${c.days.map((d) => `<span>${esc(d)}</span>`).join('')}</div></div>`;
}

function botView() {
  const b = t('stories')[1].bot;
  let html = `<p class="chat-hint">${esc(b.hint)}</p><div class="msg bot">${esc(b.hello)}</div>`;
  if (bot.step === 0) return html + `<div class="chat-choices">${b.services.map((s, k) => `<button type="button" data-bot-service="${k}">${esc(s)}</button>`).join('')}</div>`;
  html += `<div class="msg me">${esc(b.services[bot.service])}</div><div class="msg bot">${esc(b.when)}</div>`;
  if (bot.step === 1) return html + `<div class="chat-choices">${b.times.map((s, k) => `<button type="button" class="mono" data-bot-time="${k}">${esc(s)}</button>`).join('')}</div>`;
  html += `<div class="msg me">${esc(b.times[bot.time])}</div>`;
  if (bot.step === 2) return html + '<div class="typing" aria-label="…"><i></i><i></i><i></i></div>';
  return html + `<div class="msg bot">${esc(b.done(b.services[bot.service], b.times[bot.time]))}</div><div class="slots"><span class="on">✓ ${esc(b.crm)}</span></div><button type="button" class="chat-restart" data-bot-restart>${esc(b.again)}</button>`;
}

function renderStory() {
  const s = t('stories')[story];
  $('#story-panel').setAttribute('aria-labelledby', 'story-tab-' + story);
  $('#story-panel').innerHTML = `<div class="story-copy"><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p><p class="story-foot">${esc(s.foot)}</p></div>${storyVisual(story)}`;
}

function renderSegments() {
  const segs = t('segments');
  $('#segments').innerHTML = Object.entries(segs).map(([key, s]) => `<button role="tab" id="tab-${key}" aria-controls="business-panel" aria-selected="${key === segment}" tabindex="${key === segment ? 0 : -1}" data-segment="${key}">${esc(s[0])}</button>`).join('');
  const s = segs[segment];
  $('#business-panel').setAttribute('aria-labelledby', 'tab-' + segment);
  $('#business-panel').innerHTML = `<div><h3>${esc(s[1])}</h3><p>${esc(s[2])}</p><div class="examples">${s[4].map((x) => `<span>${esc(x)}</span>`).join('')}</div></div><ul>${s[3].map((x) => `<li>${svg('check')}<span>${esc(x)}</span></li>`).join('')}</ul>`;
}

function ctas() {
  $$('[data-cta]').forEach((a) => { a.href = APP_URL + '/?start=register'; });
  $$('[data-login]').forEach((a) => { a.href = APP_URL + '/'; });
  // Self-service trial is the main path; the request form is always there for those who prefer to be contacted.
  // Registration closed in the admin: every "Try" button leads to the request form instead.
  const closed = site?.product?.registration === false;
  if (closed) $$('[data-cta]').forEach((a) => { a.href = '#request'; });
  $$('[data-cta-label]').forEach((label) => { label.textContent = closed ? t('planRequest') : t('ctaTrial'); });
  $$('[data-cta-short]').forEach((label) => { label.textContent = closed ? t('planRequest') : t('ctaShort'); });
  const mail = site?.contactEmail || CONTACT_EMAIL, link = $('#demo-fallback-mail');
  link.hidden = !mail;
  if (mail) link.href = 'mailto:' + mail;
  const footerMail = $('#contact-email');
  footerMail.hidden = !mail;
  if (mail) { footerMail.textContent = mail; footerMail.href = 'mailto:' + mail; }
  $$('[data-mail]').forEach((a) => { a.textContent = mail; a.href = 'mailto:' + mail; });
}

function news() {
  const items = site?.announcements || [];
  $('#news').hidden = !items.length;
  $('#announcements').innerHTML = items.map((a) => `<article class="announcement reveal"><time datetime="${esc(new Date(a.at).toISOString())}">${esc(new Date(a.at).toLocaleDateString(t('locale'), { day: 'numeric', month: 'short', year: 'numeric' }))}</time><h3>${esc(a[language]?.title)}</h3><p>${esc(a[language]?.body)}</p></article>`).join('');
}

function legal() {
  const docs = site?.documents || {}, has = (kind) => Boolean(docs[kind]?.[language]);
  $('#footer-legal').innerHTML = [['site-privacy', 'docPrivacy'], ['site-terms', 'docTerms'], ['site-offer', 'docOffer'], ['presentation', 'docPresentation']].filter(([kind]) => has(kind)).map(([kind, key]) => `<a href="${documentHref(kind)}" target="_blank" rel="noopener">${esc(t(key))}</a>`).join('');
  const inline = $('#privacy-inline');
  inline.hidden = !has('site-privacy');
  if (has('site-privacy')) { inline.href = documentHref('site-privacy'); inline.textContent = t('privacyLink'); }
  const deck = docs.presentation?.[language];
  $('#presentation').hidden = !deck;
  if (deck) { $('#deck-download').href = documentHref('presentation'); $('#deck-meta').textContent = `${deck.extension.toUpperCase()} · ${(deck.size / 1048576).toFixed(1)} MB`; }
}

function pricing() {
  const p = site?.product || PLAN_FALLBACK, en = language === 'en', L = (o) => (en ? o.en : o.uk);
  const date = new Date(p.free_until || PLAN_FALLBACK.free_until).toLocaleDateString(en ? 'en-GB' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' });
  const banner = $('#free-banner');
  banner.hidden = p.sales && p.registration;
  banner.textContent = !p.registration ? t('closedBanner') : t('freeBanner').replace('{date}', date);
  $('#site-price-note').textContent = t('priceNoteSales');
  const label = !p.registration ? t('planRequest') : p.sales ? t('planChoose') : t('planTry');
  const href = !p.registration ? '#request' : APP_URL + '/?start=register';
  let previous = null;
  $('#plans').innerHTML = p.plans.map((plan) => {
    // Each plan lists only what it adds; the first one lists the base every plan has.
    const own = previous ? plan.features.filter((f) => !previous.features.some((g) => L(g) === L(f))) : [];
    const items = previous ? own.map(L) : (p.base ? L(p.base) : L(PLAN_FALLBACK.base));
    const intro = previous ? `<p class="plan-includes">${esc(t('planIncludes').replace('{plan}', L(previous)))}</p>` : '';
    const card = `<article class="tier${plan.popular ? ' tier-popular' : ''}">${plan.popular ? `<span class="tier-badge">${esc(t('planPopular'))}</span>` : ''}<h3>${esc(L(plan))}</h3><p class="tier-for">${esc(L(plan.for))}</p><p class="tier-price"><strong>${plan.price}</strong><span>${esc(t('planMonth'))}</span></p><a class="btn ${plan.popular ? 'btn-primary' : 'btn-ghost'} btn-block" href="${href}">${esc(label)}</a>${intro}<ul class="tier-list">${items.map((i) => `<li>${svg('check')}<span>${esc(i)}</span></li>`).join('')}<li>${svg('check')}<span>${esc(t('planUsers'))}</span></li></ul></article>`;
    previous = plan;
    return card;
  }).join('');
}
if (part === 'bot') return botView();
const parts = { bookingPhone, storyTabs, renderStory, renderSegments };
if (part !== 'all') return parts[part]();
meta(); staticText(); lists(); storyTabs(); renderStory(); renderSegments(); ctas(); pricing(); news(); legal();
$('#year').textContent = new Date().getFullYear();
}
// Only fields displayed by the marketing site enter the initial HTML. Never serialize API envelopes.
function publicSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid public site response');
  const pick = (object, keys) => Object.fromEntries(keys.filter(key => object?.[key] !== undefined).map(key => [key, object[key]]));
  const result = pick(value, ['contactEmail']);
  if (value.locales) result.locales = Object.fromEntries(['uk', 'en'].map(lang => [lang,
    pick(value.locales[lang], ['eyebrow', 'title', 'description', 'price', 'priceNote', 'about', 'privacy', 'features', 'faq'])]));
  if (value.announcements) result.announcements = value.announcements.map(item => ({ at: item.at, uk: pick(item.uk, ['title', 'body']), en: pick(item.en, ['title', 'body']) }));
  result.documents = Object.fromEntries(['site-privacy', 'site-terms', 'site-offer', 'presentation'].filter(kind => value.documents?.[kind]).map(kind => [kind,
    Object.fromEntries(['uk', 'en'].filter(lang => value.documents[kind][lang]).map(lang => [lang, pick(value.documents[kind][lang], ['extension', 'size'])]))]));
  if (value.product) {
    result.product = pick(value.product, ['sales', 'registration', 'free_until']);
    if (value.product.base) result.product.base = pick(value.product.base, ['uk', 'en']);
    result.product.plans = value.product.plans.map(plan => ({ ...pick(plan, ['price', 'uk', 'en', 'popular']),
      for: pick(plan.for, ['uk', 'en']), features: plan.features.map(feature => pick(feature, ['uk', 'en'])) }));
  }
  return result;
}

return { translations, renderPublic, publicSnapshot, svg, esc };
});
