'use strict';
document.documentElement.classList.add('js');

const SITE_URL = 'https://lomviko.com';
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
};
const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const featureIcons = ['calendar', 'send', 'chart', 'cloud', 'layers', 'download'];

const translations = {
  uk: {
    meta: {
      title: 'LOMVIKO — CRM для бізнесу за записом: онлайн-запис, клієнти, фінанси',
      description: 'Застосунок для macOS і Windows: онлайн-запис через Telegram 24/7, нагадування клієнтам, спільний розклад команди, клієнтська база та фінансові звіти.',
      ogTitle: 'LOMVIKO — ваш день в ідеальному ритмі',
      ogDescription: 'Онлайн-запис через Telegram, нагадування клієнтам, розклад команди та фінанси — в одному застосунку для macOS і Windows.',
      ogAlt: 'LOMVIKO — CRM для бізнесу за записом',
      locale: 'uk_UA', alternate: 'en_US',
    },
    skip: 'До вмісту', navLabel: 'Навігація', navFeatures: 'Можливості', navHow: 'Як це працює', navCalc: 'Калькулятор', navBusiness: 'Для кого', navFaq: 'Питання', navDownload: 'Завантажити',
    ctaDemo: 'Отримати демо', ctaDownload: 'Завантажити', seeHow: 'Як це працює',
    heroEyebrow: 'CRM для бізнесу, що працює за записом',
    heroTitle: ['Ваш день —', 'в ідеальному ритмі.'],
    heroDescription: 'Клієнти записуються самі через Telegram, нагадування приходять вчасно, а розклад, оплати й команда — в одному вікні. LOMVIKO бере рутину на себе, щоб ви займалися своєю справою.',
    trustOne: 'macOS і Windows', trustTwo: 'Запис через Telegram 24/7', trustThree: 'Експорт даних будь-коли',
    marqueeLabel: 'Для бізнесу, який працює за записом',
    marquee: ['Салони краси', 'Барбершопи', 'Манікюр і педикюр', 'Косметологія', 'Масаж і SPA', 'Стоматологія', 'Приватні клініки', 'Психологи', 'Фітнес і йога', 'Танцювальні студії', 'Репетитори', 'Тату-студії', 'Автосервіси', 'Фотостудії', 'Грумінг'],
    whyKicker: 'Навіщо', whyTitle: ['Хаос у чатах —', 'у минулому.'], whyIntro: 'Знайомо? Ось що змінюється з першого дня.',
    beforeTitle: 'Як зараз', afterTitle: 'З LOMVIKO',
    pains: ['Записи в зошиті, Instagram і трьох месенджерах', '«А хто в нас на дванадцяту?» — і ще один дзвінок адміністратору', 'Клієнт забув про візит — година простою та втрачені гроші', 'Скільки заробили за місяць — лише здогадки'],
    gains: ['Один розклад для всієї команди — на кожному комп’ютері', 'Вільні вікна видно одразу: хто, коли й на скільки', 'Бот сам нагадує клієнту за 24 і за 2 години до візиту', 'Виручка, завантаженість і популярні послуги — у звітах'],
    calcKicker: 'Калькулятор', calcTitle: ['Скільки коштують', 'неявки?'],
    calcIntro: 'Клієнт забув про запис — майстер простоює, а час уже не продати. Порахуйте, скільки це коштує вашому бізнесу.',
    calcCheck: 'Середній чек', calcVisits: 'Записів на день', calcNoShow: 'Неявок і запізнілих скасувань', calcDays: 'Робочих днів на місяць', calcSaved: 'Скільки неявок повернуть нагадування',
    calcLoss: 'Ви втрачаєте щомісяця', calcBack: 'Можна повернути з нагадуваннями LOMVIKO',
    calcMissed: (n) => `≈ ${n} пропущених візитів на місяць`, calcYear: (v) => `${v} за рік`,
    calcNote: 'Це оцінка за вашими числами. Частку повернутих візитів ви задаєте самі. Бот нагадує клієнту за 24 і за 2 години до візиту.',
    currency: 'грн', locale: 'uk-UA',
    featuresKicker: 'Можливості', featuresTitle: ['Усе, що потрібно.', 'Нічого зайвого.'], featuresIntro: 'Інструменти, які щодня економлять години — без складних налаштувань.',
    howKicker: 'Як це працює', howTitle: ['Один день', 'з LOMVIKO.'], howIntro: 'Оберіть сценарій і подивіться, що відбувається між записом клієнта та завершеним візитом.', storiesLabel: 'Сценарії',
    stories: [
      { tab: 'Хто, коли й до кого', tag: 'Розклад', title: '«А на дванадцяту хтось є?»', body: 'Не питайте в чаті — подивіться в розклад. Хто працює, де вільне вікно й скільки триває послуга — видно всій команді одразу.', foot: 'Один запис — спільний план для команди.', labels: ['Олена', 'Максим', 'Стрижка · Ірина', 'Масаж · Олег', 'Вільне вікно', 'Записати', 'Фарбування · Юлія', 'Манікюр · Анна'] },
      { tab: 'Запис без переписки', tag: 'Telegram-бот', title: 'Клієнт записується. Ви працюєте.', body: 'Послугу, майстра й час клієнт обирає сам — удень чи о третій ночі. Бот працює на сервері, навіть коли застосунок закритий, і сам нагадає про візит.', foot: 'Спробуйте записатися самі — праворуч.', bot: { hint: 'Спробуйте самі', hello: 'Вітаємо! 👋 На яку послугу вас записати?', services: ['Манікюр', 'Стрижка', 'Масаж'], when: 'Чудово! Оберіть зручний час сьогодні:', times: ['11:00', '12:30', '15:00'], done: (s, t) => `Готово! ${s}, сьогодні о ${t}. Нагадаю за 24 і за 2 години ✓`, crm: 'Запис уже в розкладі LOMVIKO', again: 'Почати спочатку' } },
      { tab: 'Куди пішов робочий день', tag: 'Результати', title: 'День завершився. Цифри — залишились.', body: 'Внесли оплату — вона вже в обліку. Виручка, завантаженість і популярні послуги за будь-який період — без таблиць і калькулятора.', foot: 'Фінанси бачать лише ті, кому ви дозволили.', chart: { label: 'Виручка за тиждень', value: '86 400 грн', delta: '+18% до минулого тижня', days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] } },
    ],
    peekKicker: 'Продукт', peekTitle: ['Відкрили. Побачили день.', 'До роботи.'], peekBody: 'Розклад, клієнти й оплати поруч. Не потрібно згадувати, в якому чаті домовлялися.', peekCaption: 'Справжній інтерфейс застосунку. На зображенні — демонстраційні дані.', peekAlt: 'Інтерфейс LOMVIKO: розклад на день із записами клієнтів',
    businessKicker: 'Для кого', businessTitle: ['Не потрібно підлаштовуватися', 'під CRM.'], segmentsLabel: 'Тип бізнесу',
    segments: {
      beauty: ['Краса', 'Від першого запису до постійного клієнта', 'Майстри, послуги й тривалість — у спільному розкладі. Клієнт обирає зручний час сам.', ['Майстер на вибір або будь-хто вільний', 'Нагадування зменшують кількість неявок', 'Історія візитів і нотатки по кожному клієнту'], ['Салони', 'Барбершопи', 'Нігтьові студії', 'Косметологи', 'Брови та вії']],
      health: ['Здоров’я', 'Прийом без накладок і черг', 'Спеціалісти, кабінети й обладнання — ресурси одного розкладу. Пацієнт отримує нагадування заздалегідь.', ['Кілька спеціалістів і кабінетів', 'Різна тривалість прийомів', 'Ролі доступу для адміністратора та лікаря'], ['Стоматології', 'Масаж', 'Психологи', 'Реабілітація', 'Приватні кабінети']],
      studio: ['Навчання і спорт', 'Групові та індивідуальні заняття', 'Тренери, зали та місткість груп — в одному розкладі. Учні записуються через Telegram без дзвінків.', ['Груповий запис із лімітом місць', 'Тренери й зали як ресурси', 'Запис і нагадування через бота'], ['Йога', 'Фітнес', 'Танці', 'Репетитори', 'Мовні школи']],
      service: ['Сервіс', 'Робота без простоїв', 'Розподіляйте час майстрів, постів і обладнання. Клієнт знає, коли приїхати, а команда — що робити далі.', ['Спільна робота кількох ресурсів', 'Тривалість, ціна та доступність послуг', 'Окремі команди для кількох бізнесів'], ['Автосервіси', 'Ремонт техніки', 'Фотостудії', 'Грумінг', 'Оренда залів']],
    },
    trustKicker: 'Безпека', trustTitle: ['Ваші дані —', 'тільки ваші.'], trustIntro: 'Клієнтська база — найцінніше, що є у бізнесу. Тому вона захищена й завжди залишається у вас.',
    trust: [
      ['lock', 'Шифровані копії', 'Резервні копії на Google Drive шифруються AES-256. Ключ відновлення є тільки у вас.'],
      ['cloud', 'Ваш власний диск', 'Копії зберігаються на Google Drive власника бізнесу — ви завжди знаєте, де вони.'],
      ['key', 'Захищені доступи', 'Токени бота й ключі зберігаються в системному сховищі macOS і Windows.'],
      ['users', 'Ролі та права', 'Власник, адміністратор і співробітник бачать лише своє. Фінанси — тільки за дозволом.'],
    ],
    statsLabel: 'LOMVIKO у цифрах',
    stats: [['24/7', 'бот приймає записи, навіть коли застосунок закритий'], ['×2', 'нагадування клієнту — за 24 і за 2 години до візиту'], ['AES-256', 'шифрування резервних копій на вашому Google Drive'], ['UA · EN', 'інтерфейс українською та англійською']],
    demoKicker: 'Старт', stepOne: 'Розкажіть про ваш бізнес — це займе хвилину.', stepTwo: 'Покажемо LOMVIKO і підготуємо демодоступ.', stepThree: 'Встановіть застосунок і працюйте.',
    formTitle: 'Заявка на демо', formName: 'Ваше ім’я', formBusiness: 'Назва бізнесу', formMessage: 'Що для вас найважливіше?', formSubmit: 'Надіслати заявку',
    offTitle: 'Почніть уже сьогодні', offBody: 'Завантажте LOMVIKO для macOS або Windows. Онлайн-заявки відкриються найближчим часом.', offBodyMail: 'Напишіть нам — покажемо LOMVIKO і підготуємо доступ для вашого бізнесу.', writeUs: 'Написати нам',
    downloadsKicker: 'Завантаження', downloadsTitle: ['Наступний робочий день —', 'у LOMVIKO.'], downloadHint: 'Для роботи потрібен бізнес-акаунт — ми налаштуємо його після знайомства.',
    downloadSafety: 'Оновлюєте LOMVIKO? Спочатку створіть резервну копію в застосунку. Встановлення нової версії зберігає ваші дані.',
    download: 'Завантажити', macSub: 'Apple Silicon та Intel', winSub: 'Windows 10 і 11', integrity: 'Контрольна сума SHA-256', noRelease: 'Скоро. Залиште заявку — повідомимо першими.',
    newsKicker: 'Оновлення', newsTitle: 'Що нового',
    faqKicker: 'Питання', faqTitle: ['Перед', 'початком.'],
    finalTitle: ['Почніть новий день', 'з LOMVIKO.'], finalBody: 'Налаштуємо застосунок під ваш бізнес і покажемо, як він працює.', finalWord: 'РИТМ',
    footerTagline: 'CRM для бізнесу, що працює за записом.', footerMade: 'macOS · Windows · Українська · English',
    legalLabel: 'Документи', docPrivacy: 'Політика конфіденційності', docOffer: 'Публічна оферта', docPresentation: 'Презентація', privacyLink: 'Політика конфіденційності',
    deckTitle: ['Покажіть LOMVIKO', 'своїй команді.'], deckBody: 'Коротка презентація: можливості, сценарії роботи, безпека даних і запуск. Зручно переслати партнеру чи власнику бізнесу.', deckButton: 'Відкрити презентацію',
    sending: 'Надсилаємо…', success: 'Дякуємо! Заявку отримано. Зв’яжемося за вказаним email.', error: 'Не вдалося надіслати заявку. Спробуйте пізніше.', rate: 'Забагато спроб. Спробуйте пізніше.',
    unavailable: 'Сервіс тимчасово недоступний. Завантаження з’являться після відновлення зв’язку.', waiting: 'Перевіряємо доступні версії…',
    board: { boardTitle: 'Розклад · сьогодні', boardDate: 'Четвер, 14 жовтня', statBookings: 'Записів', statRevenue: 'Виручка', statRevenueValue: '24 600 грн', statLoad: 'Завантаженість', memberOne: 'Олена', memberTwo: 'Максим', memberThree: 'Ірина', memberFour: 'Софія', bkOne: 'Фарбування', bkOneClient: 'Ірина К.', bkTwo: 'Стрижка', bkTwoClient: 'Дмитро', bkThree: 'Масаж спини', bkThreeClient: 'Олег', bkFour: 'SPA-догляд', bkFourClient: 'Марія', bkFive: 'Манікюр', bkFiveClient: 'Вікторія', bkSix: 'Манікюр + покриття', bkSixClient: 'Анна · Telegram', bkSeven: 'Корекція брів', bkSevenClient: 'Катерина', bkEight: 'Догляд за обличчям', bkEightClient: 'Юлія', toastBooking: 'Новий запис через Telegram', toastBookingDetail: 'Анна · Манікюр · 11:00', toastReminder: 'Нагадування надіслано', toastReminderDetail: 'Ігор · завтра о 10:00', boardNote: 'Демонстрація сценарію · вигадані дані' },
  },
  en: {
    meta: {
      title: 'LOMVIKO — booking CRM for service businesses: scheduling, clients, payments',
      description: 'A desktop app for macOS and Windows: 24/7 Telegram booking, client reminders, a shared team schedule, client records and financial reports.',
      ogTitle: 'LOMVIKO — your day, perfectly in rhythm',
      ogDescription: 'Telegram booking, client reminders, a team schedule and finances — in one app for macOS and Windows.',
      ogAlt: 'LOMVIKO — booking CRM for service businesses',
      locale: 'en_US', alternate: 'uk_UA',
    },
    skip: 'Skip to content', navLabel: 'Navigation', navFeatures: 'Features', navHow: 'How it works', navCalc: 'Calculator', navBusiness: 'Who it’s for', navFaq: 'FAQ', navDownload: 'Download',
    ctaDemo: 'Get a demo', ctaDownload: 'Download', seeHow: 'See how it works',
    heroEyebrow: 'The CRM for appointment-based businesses',
    heroTitle: ['Your day,', 'perfectly in rhythm.'],
    heroDescription: 'Clients book themselves through Telegram, reminders go out on time, and your schedule, payments and team live in one window. LOMVIKO handles the routine so you can focus on your craft.',
    trustOne: 'macOS and Windows', trustTwo: '24/7 Telegram booking', trustThree: 'Export your data anytime',
    marqueeLabel: 'For businesses that run on appointments',
    marquee: ['Beauty salons', 'Barbershops', 'Nail studios', 'Cosmetology', 'Massage & spa', 'Dental clinics', 'Private clinics', 'Therapists', 'Fitness & yoga', 'Dance studios', 'Tutors', 'Tattoo studios', 'Car service', 'Photo studios', 'Pet grooming'],
    whyKicker: 'Why', whyTitle: ['Chaos in chats is', 'a thing of the past.'], whyIntro: 'Sound familiar? Here’s what changes from day one.',
    beforeTitle: 'Today', afterTitle: 'With LOMVIKO',
    pains: ['Bookings in a notebook, Instagram and three messengers', '“Who’s booked at noon?” — and another call to the front desk', 'A client forgot their visit — an idle hour and lost money', 'Monthly revenue? Only a rough guess'],
    gains: ['One schedule for the whole team — on every computer', 'Free slots at a glance: who, when and for how long', 'The bot reminds clients 24 hours and 2 hours before', 'Revenue, workload and top services — in clear reports'],
    calcKicker: 'Calculator', calcTitle: ['What do no-shows', 'really cost?'],
    calcIntro: 'A client forgets — your specialist sits idle and that hour can’t be sold again. See what it costs your business.',
    calcCheck: 'Average ticket', calcVisits: 'Appointments per day', calcNoShow: 'No-shows and late cancellations', calcDays: 'Working days per month', calcSaved: 'No-shows recovered by reminders',
    calcLoss: 'You lose every month', calcBack: 'Recoverable with LOMVIKO reminders',
    calcMissed: (n) => `≈ ${n} missed visits per month`, calcYear: (v) => `${v} per year`,
    calcNote: 'An estimate based on your numbers. You choose the recovered share yourself. The bot reminds clients 24 hours and 2 hours before their visit.',
    currency: 'UAH', locale: 'en-GB',
    featuresKicker: 'Features', featuresTitle: ['Everything you need.', 'Nothing you don’t.'], featuresIntro: 'Tools that save hours every day — with no complicated setup.',
    howKicker: 'How it works', howTitle: ['A day', 'with LOMVIKO.'], howIntro: 'Pick a scenario and see what happens between a client booking and a completed visit.', storiesLabel: 'Scenarios',
    stories: [
      { tab: 'Who, when and with whom', tag: 'Schedule', title: '“Is anyone free at noon?”', body: 'Don’t ask in a group chat — check the schedule. Who’s working, where the free slot is and how long the service takes — the whole team sees it at once.', foot: 'One booking — one shared plan for the team.', labels: ['Olena', 'Max', 'Haircut · Iryna', 'Massage · Oleh', 'Free slot', 'Book', 'Colouring · Julia', 'Manicure · Anna'] },
      { tab: 'Booking without the back-and-forth', tag: 'Telegram bot', title: 'Clients book. You work.', body: 'Clients choose the service, specialist and time themselves — at noon or at 3 a.m. The bot runs on the server even when the app is closed, and sends reminders on its own.', foot: 'Try booking yourself — on the right.', bot: { hint: 'Try it yourself', hello: 'Hi there! 👋 Which service would you like to book?', services: ['Manicure', 'Haircut', 'Massage'], when: 'Great! Pick a time that suits you today:', times: ['11:00', '12:30', '15:00'], done: (s, t) => `Done! ${s}, today at ${t}. I’ll remind you 24 and 2 hours before ✓`, crm: 'The booking is already in LOMVIKO', again: 'Start over' } },
      { tab: 'Where the workday went', tag: 'Results', title: 'The day is over. The numbers stay.', body: 'Record a payment and it’s already in your books. Revenue, workload and top services for any period — no spreadsheets or calculators.', foot: 'Only people you allow can see finances.', chart: { label: 'Revenue this week', value: 'UAH 86,400', delta: '+18% vs last week', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] } },
    ],
    peekKicker: 'Product', peekTitle: ['Open it. See your day.', 'Get to work.'], peekBody: 'Schedule, clients and payments side by side. No need to remember which chat you agreed in.', peekCaption: 'The real app interface. The image shows illustrative demo data.', peekAlt: 'LOMVIKO interface: a daily schedule with client appointments',
    businessKicker: 'Who it’s for', businessTitle: ['Your CRM should fit', 'the way you work.'], segmentsLabel: 'Business type',
    segments: {
      beauty: ['Beauty', 'From the first booking to a loyal client', 'Specialists, services and durations in one shared schedule. Clients pick a convenient time themselves.', ['A chosen specialist or anyone available', 'Reminders reduce no-shows', 'Visit history and notes for every client'], ['Salons', 'Barbershops', 'Nail studios', 'Cosmetologists', 'Brows & lashes']],
      health: ['Health', 'Appointments without overlaps or queues', 'Specialists, rooms and equipment as resources in one schedule. Patients get reminded in advance.', ['Multiple specialists and rooms', 'Different appointment lengths', 'Access roles for front desk and doctors'], ['Dental clinics', 'Massage', 'Therapists', 'Rehabilitation', 'Private practices']],
      studio: ['Education & sport', 'Group and one-to-one sessions', 'Coaches, rooms and class capacity in one schedule. Students book through Telegram — no calls.', ['Group booking with a seat limit', 'Coaches and rooms as resources', 'Booking and reminders via the bot'], ['Yoga', 'Fitness', 'Dance', 'Tutors', 'Language schools']],
      service: ['Services', 'Work without downtime', 'Allocate the time of specialists, bays and equipment. Clients know when to come, and the team knows what’s next.', ['Multiple resources working together', 'Service duration, price and availability', 'Separate teams for multiple businesses'], ['Car service', 'Device repair', 'Photo studios', 'Pet grooming', 'Venue rental']],
    },
    trustKicker: 'Security', trustTitle: ['Your data —', 'yours alone.'], trustIntro: 'Your client base is the most valuable thing your business owns. That’s why it’s protected and always stays with you.',
    trust: [
      ['lock', 'Encrypted backups', 'Backups on Google Drive are encrypted with AES-256. Only you hold the recovery key.'],
      ['cloud', 'Your own Drive', 'Backups live on the business owner’s Google Drive — you always know where they are.'],
      ['key', 'Protected credentials', 'Bot tokens and keys are kept in the macOS and Windows system keychain.'],
      ['users', 'Roles & permissions', 'Owner, admin and staff see only what they need. Finances — by permission only.'],
    ],
    statsLabel: 'LOMVIKO in numbers',
    stats: [['24/7', 'the bot takes bookings even when the app is closed'], ['×2', 'client reminders — 24 hours and 2 hours before the visit'], ['AES-256', 'encryption for backups on your Google Drive'], ['UA · EN', 'interface in Ukrainian and English']],
    demoKicker: 'Get started', stepOne: 'Tell us about your business — it takes a minute.', stepTwo: 'We’ll show you LOMVIKO and prepare demo access.', stepThree: 'Install the app and get to work.',
    formTitle: 'Request a demo', formName: 'Your name', formBusiness: 'Business name', formMessage: 'What matters most to you?', formSubmit: 'Send request',
    offTitle: 'Start today', offBody: 'Download LOMVIKO for macOS or Windows. Online requests will open soon.', offBodyMail: 'Write to us — we’ll show you LOMVIKO and prepare access for your business.', writeUs: 'Write to us',
    downloadsKicker: 'Download', downloadsTitle: ['Your next workday', 'starts in LOMVIKO.'], downloadHint: 'You’ll need a business account — we set it up after our first conversation.',
    downloadSafety: 'Updating LOMVIKO? Create a backup in the app first. Installing a new version keeps your data.',
    download: 'Download', macSub: 'Apple Silicon and Intel', winSub: 'Windows 10 and 11', integrity: 'SHA-256 checksum', noRelease: 'Coming soon. Request a demo and be the first to know.',
    newsKicker: 'Updates', newsTitle: 'What’s new',
    faqKicker: 'FAQ', faqTitle: ['Before', 'you start.'],
    finalTitle: ['Start a new day', 'with LOMVIKO.'], finalBody: 'We’ll set the app up for your business and show you how it works.', finalWord: 'RHYTHM',
    footerTagline: 'The CRM for appointment-based businesses.', footerMade: 'macOS · Windows · Українська · English',
    legalLabel: 'Documents', docPrivacy: 'Privacy policy', docOffer: 'Public offer', docPresentation: 'Presentation', privacyLink: 'Privacy policy',
    deckTitle: ['Show LOMVIKO', 'to your team.'], deckBody: 'A short presentation: features, everyday scenarios, data security and getting started. Easy to forward to a partner or the business owner.', deckButton: 'Open the presentation',
    sending: 'Sending…', success: 'Thank you! We received your request and will contact you by email.', error: 'We could not send your request. Please try again later.', rate: 'Too many attempts. Please try again later.',
    unavailable: 'The service is temporarily unavailable. Downloads will return when the connection is restored.', waiting: 'Checking available versions…',
    board: { boardTitle: 'Schedule · today', boardDate: 'Thursday, 14 October', statBookings: 'Bookings', statRevenue: 'Revenue', statRevenueValue: 'UAH 24,600', statLoad: 'Utilisation', memberOne: 'Olena', memberTwo: 'Max', memberThree: 'Iryna', memberFour: 'Sofia', bkOne: 'Colouring', bkOneClient: 'Iryna K.', bkTwo: 'Haircut', bkTwoClient: 'Dmytro', bkThree: 'Back massage', bkThreeClient: 'Oleh', bkFour: 'Spa care', bkFourClient: 'Maria', bkFive: 'Manicure', bkFiveClient: 'Victoria', bkSix: 'Manicure + gel', bkSixClient: 'Anna · Telegram', bkSeven: 'Brow shaping', bkSevenClient: 'Kateryna', bkEight: 'Facial care', bkEightClient: 'Julia', toastBooking: 'New booking via Telegram', toastBookingDetail: 'Anna · Manicure · 11:00', toastReminder: 'Reminder sent', toastReminderDetail: 'Ihor · tomorrow at 10:00', boardNote: 'Scenario demo · fictional data' },
  },
};

// Stock texts that the site admin may also hold. When the published text still equals these,
// the page shows the editorial copy above; any custom admin text is shown as is.
const fallbackContent = {"uk":{"eyebrow":"РОБОЧИЙ ПРОСТІР ДЛЯ ВАШОГО БІЗНЕСУ","title":"Менше рутини. Більше часу для вашого бізнесу.","description":"Записи, клієнти та фінанси в одному застосунку. Для салону краси, СТО та бізнесу, який працює за розкладом.","price":"Почніть зі знайомства","priceNote":"Залиште заявку: покажемо застосунок і підберемо умови для вашого бізнесу.","about":"Один робочий простір для кількох бізнесів, команд і послуг.","privacy":"Надаючи ім’я та email, ви погоджуєтеся на їх використання для відповіді на вашу заявку. Ми не створюємо обліковий запис автоматично. Щоб видалити заявку, зверніться за контактним email на цій сторінці.","features":[["▦","Розклад для всієї команди","Вільний майстер, кілька співробітників або груповий запис — під кожну послугу."],["↗","Запис через Telegram","Клієнт обирає послугу та час. Бот приймає записи й надсилає нагадування через сервер, навіть коли CRM закрита."],["◫","Зрозумілі результати","Завантаженість, доходи та популярні послуги з фільтрами за періодом."],["☁","Копії на вашому Google Drive","Підключіть диск через авторизацію Google. Зберігайте резервні копії на диску власника бізнесу."],["♙","Кілька бізнесів. Один доступ.","Команди, ролі та окремі робочі простори для ваших компаній."],["↓","Ваші дані залишаються вашими","Експортуйте базу та створюйте резервні копії перед оновленням."]],"faq":[["Чи потрібен інтернет?","Так, для створення та зміни записів і синхронізації потрібен інтернет. Без мережі можна переглядати збережений розклад."],["Бот працює, коли комп’ютер вимкнено?","Так, якщо сервер бізнесу працює. Бот і нагадування запускаються на сервері, незалежно від десктопного застосунку."],["Що потрібно для початку?","Залиште заявку. Підготуємо бізнес і демодоступ. Після встановлення достатньо увійти за логіном і паролем; ключ може використовуватися як альтернативний спосіб активації."],["Чи можна забрати всі свої дані?","Так. CRM підтримує експорт бази. Google Drive використовується для резервних копій; спільна робота команди синхронізується через сервер."]]},"en":{"eyebrow":"YOUR BUSINESS, IN ONE PLACE","title":"Less routine. More time for your business.","description":"Appointments, customers and finances in one desktop app. For beauty salons, repair shops and businesses that run on a schedule.","price":"Start with a conversation","priceNote":"Request a demo: we will show you the app and discuss terms for your business.","about":"One workspace for multiple businesses, teams and services.","privacy":"By providing your name and email, you agree to their use to respond to your request. We do not automatically create an account. To delete your request, contact the email displayed on this page.","features":[["▦","One schedule for your team","An available specialist, multiple staff members or group bookings — configured per service."],["↗","Bookings through Telegram","Customers choose a service and time. The server runs the bot and reminders even when the desktop CRM is closed."],["◫","Results you can understand","Workload, revenue and popular services, filtered by period."],["☁","Backups on your Google Drive","Connect with Google sign-in. Store backups on the business owner’s Drive."],["♙","Multiple businesses. One login.","Teams, roles and separate workspaces for your companies."],["↓","Your business data is yours","Export your database and create backups before updating."]],"faq":[["Do I need internet access?","Yes, to create or change appointments and synchronize data. Offline, you can view the saved schedule."],["Does the bot work when my computer is off?","Yes, while your business server is running. The server runs the bot and reminders independently of the desktop app."],["What do I need to get started?","Request a demo. We prepare your business and access. Install the app and sign in with your login and password; a key is an alternative activation method."],["Can I take all my data with me?","Yes. The CRM supports database export. Google Drive stores backups; shared team data synchronizes through the server."]]}};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let language = location.pathname.replace(/\/$/, '') === '/en' ? 'en' : 'uk';
if (language === 'uk' && location.pathname === '/') {
  try { if (localStorage.getItem('ch.language') === 'en') language = 'en'; } catch {}
}
let site = null, loadFailed = false, segment = 'beauty', story = 0, bot = { step: 0 };
const t = (key) => translations[language][key];
const content = () => site?.locales?.[language] || fallbackContent[language];

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
}

function staticText() {
  $$('[data-t]').forEach((el) => { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
  $$('[data-h]').forEach((el) => heading(el, t(el.dataset.h)));
  $$('[data-t-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.tLabel)));
  $$('[data-t-alt]').forEach((el) => el.setAttribute('alt', t(el.dataset.tAlt)));
  const board = t('board');
  $$('[data-m]').forEach((el) => { if (board[el.dataset.m]) el.textContent = board[el.dataset.m]; });
  $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === language)));
  editorial('hero-eyebrow', 'heroEyebrow', 'eyebrow');
  editorial('hero-title', 'heroTitle', 'title');
  editorial('hero-description', 'heroDescription', 'description');
  const c = content();
  for (const [id, key] of Object.entries({ 'site-about': 'about', 'site-price': 'price', 'site-price-note': 'priceNote', 'site-privacy': 'privacy' })) $('#' + id).textContent = c[key] || fallbackContent[language][key];
}

function lists() {
  $('#pains').innerHTML = t('pains').map((p) => `<li>${svg('cross')}<span>${esc(p)}</span></li>`).join('');
  $('#gains').innerHTML = t('gains').map((p) => `<li>${svg('check')}<span>${esc(p)}</span></li>`).join('');
  const items = t('marquee').map((m) => `<span>${esc(m)}</span>`).join('');
  $('#marquee-track').innerHTML = items + items.replace(/<span>/g, '<span aria-hidden="true">');
  const features = content().features || fallbackContent[language].features;
  const spans = [2, 1, 1, 2, 1, 2];
  $('#features-grid').innerHTML = features.map(([, title, body], i) => `<article class="card reveal${spans[i % 6] === 2 ? ' span-2' : ''}"><span class="card-icon">${svg(featureIcons[i % featureIcons.length])}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('');
  $('#trust-grid').innerHTML = t('trust').map(([icon, title, body]) => `<article class="trust-item reveal"><span class="card-icon">${svg(icon)}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('');
  $('#stats').innerHTML = t('stats').map(([value, label]) => `<div class="stat reveal"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('');
  const faq = content().faq || fallbackContent[language].faq;
  $('#faq-list').innerHTML = faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
}

/* Stories */
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
function selectStory(i, focus) {
  story = i; storyTabs(); renderStory();
  if (focus) $('#story-tab-' + i).focus();
}
$('#story-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-story]'); if (b) selectStory(Number(b.dataset.story)); });
$('#story-tabs').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const n = t('stories').length;
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (story + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : n - 1)) % n;
  selectStory(next, true);
});
$('#story-panel').addEventListener('click', (e) => {
  const service = e.target.closest('[data-bot-service]'), time = e.target.closest('[data-bot-time]');
  if (service) bot = { step: 1, service: Number(service.dataset.botService) };
  else if (time) {
    bot = { ...bot, step: 2, time: Number(time.dataset.botTime) };
    setTimeout(() => { if (bot.step === 2) { bot.step = 3; if (story === 1) $('#bot').innerHTML = botView(); } }, reduceMotion ? 0 : 900);
  } else if (e.target.closest('[data-bot-restart]')) bot = { step: 0 };
  else return;
  $('#bot').innerHTML = botView();
});

/* Business segments */
function renderSegments() {
  const segs = t('segments');
  $('#segments').innerHTML = Object.entries(segs).map(([key, s]) => `<button role="tab" id="tab-${key}" aria-controls="business-panel" aria-selected="${key === segment}" tabindex="${key === segment ? 0 : -1}" data-segment="${key}">${esc(s[0])}</button>`).join('');
  const s = segs[segment];
  $('#business-panel').setAttribute('aria-labelledby', 'tab-' + segment);
  $('#business-panel').innerHTML = `<div><h3>${esc(s[1])}</h3><p>${esc(s[2])}</p><div class="examples">${s[4].map((x) => `<span>${esc(x)}</span>`).join('')}</div></div><ul>${s[3].map((x) => `<li>${svg('check')}<span>${esc(x)}</span></li>`).join('')}</ul>`;
}
$('#segments').addEventListener('click', (e) => { const b = e.target.closest('[data-segment]'); if (b) { segment = b.dataset.segment; renderSegments(); } });
$('#segments').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const keys = Object.keys(t('segments')), i = keys.indexOf(segment);
  segment = e.key === 'Home' ? keys[0] : e.key === 'End' ? keys[keys.length - 1] : keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length];
  renderSegments(); $('#tab-' + segment).focus();
});

/* Calculator */
const calcState = { loss: 0, back: 0 };
const money = (v) => `${new Intl.NumberFormat(t('locale'), { maximumFractionDigits: 0 }).format(Math.round(v))} ${t('currency')}`;
function tween(el, key, to, format) {
  const from = calcState[key]; calcState[key] = to;
  if (reduceMotion || from === to) { el.textContent = format(to); return; }
  const start = performance.now(), duration = 450;
  const frame = (now) => { const k = Math.min(1, (now - start) / duration), e = 1 - Math.pow(1 - k, 3); el.textContent = format(from + (to - from) * e); if (k < 1 && calcState[key] === to) requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
function calc() {
  const v = (id) => Number($('#calc-' + id).value);
  const check = v('check'), visits = v('visits'), noshow = v('noshow'), days = v('days'), saved = v('saved');
  for (const input of $$('#calc-form input[type=range]')) input.style.setProperty('--p', ((input.value - input.min) / (input.max - input.min)) * 100 + '%');
  $('#calc-check-out').textContent = money(check);
  $('#calc-visits-out').textContent = visits;
  $('#calc-noshow-out').textContent = noshow + '%';
  $('#calc-days-out').textContent = days;
  $('#calc-saved-out').textContent = saved + '%';
  const missed = (visits * days * noshow) / 100, loss = missed * check, back = (loss * saved) / 100;
  $('#calc-missed').textContent = t('calcMissed')(Math.round(missed));
  tween($('#calc-loss'), 'loss', loss, money);
  tween($('#calc-back'), 'back', back, money);
  $('#calc-year').textContent = t('calcYear')(money(back * 12));
}
$('#calc-form').addEventListener('input', calc);
$('#calc-form').addEventListener('submit', (e) => e.preventDefault());

/* Live data: downloads, news, demo availability */
function ctas() {
  const demo = Boolean(site?.demoAvailable);
  $$('[data-cta]').forEach((a) => { a.setAttribute('href', demo ? '#demo' : '#downloads'); const label = a.querySelector('[data-cta-label]'); if (label) label.textContent = t(demo ? 'ctaDemo' : 'ctaDownload'); });
  $('#demo-form').hidden = !demo;
  $('#demo-fallback').hidden = demo;
  const mail = site?.contactEmail, link = $('#demo-fallback-mail');
  link.hidden = !mail;
  if (mail) link.href = 'mailto:' + mail;
  $('#demo-fallback-text').textContent = t(mail ? 'offBodyMail' : 'offBody');
  const footerMail = $('#contact-email');
  footerMail.hidden = !mail;
  if (mail) { footerMail.textContent = mail; footerMail.href = 'mailto:' + mail; }
}
function downloads() {
  $('#service-status').textContent = loadFailed ? t('unavailable') : site ? '' : t('waiting');
  const archLabel = (p, a) => (a === 'arm64' ? (p === 'mac' ? 'Apple Silicon' : 'ARM64') : p === 'mac' ? 'Intel' : 'x64');
  $('#download-grid').innerHTML = ['mac', 'win'].map((p) => {
    const releases = (site?.releases || []).filter((r) => r.platform === p).sort((a, b) => (a.arch === 'arm64' ? -1 : 1) - (b.arch === 'arm64' ? -1 : 1));
    const builds = releases.length
      ? releases.map((r) => `<div class="build"><a class="btn ${releases[0] === r ? 'btn-light' : 'btn-ghost'}" href="${esc(r.path)}"><span>${esc(t('download'))} · ${esc(archLabel(p, r.arch))}</span>${svg('download')}</a><div class="build-meta"><span>v${esc(r.version)} · ${(Number(r.size) / 1024 / 1024).toFixed(1)} MB</span></div>${r.sha256 ? `<details><summary class="build-meta">${esc(t('integrity'))}</summary><code>SHA-256: ${esc(r.sha256)}</code>${r.notes ? `<p>${esc(r.notes)}</p>` : ''}</details>` : ''}</div>`).join('')
      : `<p class="soon">${esc(t('noRelease'))}</p>`;
    return `<article class="download-card glass reveal"><header><span class="card-icon">${svg(p === 'mac' ? 'laptop' : 'monitor')}</span><div><h3>${p === 'mac' ? 'macOS' : 'Windows'}</h3><p>${esc(t(p === 'mac' ? 'macSub' : 'winSub'))}</p></div></header>${builds}</article>`;
  }).join('');
}
function news() {
  const items = site?.announcements || [];
  $('#news').hidden = !items.length;
  $('#announcements').innerHTML = items.map((a) => `<article class="announcement reveal"><time datetime="${esc(new Date(a.at).toISOString())}">${esc(new Date(a.at).toLocaleDateString(t('locale'), { day: 'numeric', month: 'short', year: 'numeric' }))}</time><h3>${esc(a[language]?.title)}</h3><p>${esc(a[language]?.body)}</p></article>`).join('');
}

// Links to replaceable documents appear only after the website admin uploads them.
const documentSlugs = { 'site-privacy': 'privacy', 'site-offer': 'offer', presentation: 'presentation' };
const documentHref = (kind) => (language === 'en' ? '/en/' : '/') + documentSlugs[kind];
function legal() {
  const docs = site?.documents || {}, has = (kind) => Boolean(docs[kind]?.[language]);
  $('#footer-legal').innerHTML = [['site-privacy', 'docPrivacy'], ['site-offer', 'docOffer'], ['presentation', 'docPresentation']].filter(([kind]) => has(kind)).map(([kind, key]) => `<a href="${documentHref(kind)}" target="_blank" rel="noopener">${esc(t(key))}</a>`).join('');
  const inline = $('#privacy-inline');
  inline.hidden = !has('site-privacy');
  if (has('site-privacy')) { inline.href = documentHref('site-privacy'); inline.textContent = t('privacyLink'); }
  const deck = docs.presentation?.[language];
  $('#presentation').hidden = !deck;
  if (deck) { $('#deck-download').href = documentHref('presentation'); $('#deck-meta').textContent = `${deck.extension.toUpperCase()} · ${(deck.size / 1048576).toFixed(1)} MB`; }
}

function render() {
  meta(); staticText(); lists(); storyTabs(); renderStory(); renderSegments(); calc(); ctas(); downloads(); news(); legal();
  $('#year').textContent = new Date().getFullYear();
  document.dispatchEvent(new CustomEvent('lomviko:render'));
}

$$('[data-lang]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.lang === language) return;
  language = b.dataset.lang;
  try { localStorage.setItem('ch.language', language); } catch {}
  try { history.replaceState(null, '', (language === 'en' ? '/en' : '/') + location.search + location.hash); } catch {}
  $('#form-status').textContent = '';
  render(); accessCopy();
}));

$('#demo-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!site?.demoAvailable) return;
  const values = Object.fromEntries(new FormData(e.target)), status = $('#form-status'), submit = $('#demo-submit');
  submit.disabled = true; submit.setAttribute('aria-busy', 'true');
  status.classList.remove('is-error'); status.textContent = t('sending');
  try {
    const response = await fetch('/public/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, consent: values.consent === 'on', language }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) { status.classList.add('is-error'); status.textContent = t(response.status === 429 ? 'rate' : 'error'); return; }
    e.target.reset(); status.textContent = t('success');
  } catch { status.classList.add('is-error'); status.textContent = t('error'); }
  finally { submit.removeAttribute('aria-busy'); submit.disabled = !site?.demoAvailable; }
});

render();
(async () => {
  try { const response = await fetch('/public/site', { signal: AbortSignal.timeout(15000) }); if (!response.ok) throw Error(); site = await response.json(); }
  catch { loadFailed = true; }
  render();
})();

// Keep the one-time secret out of URLs, navigation, localStorage and requests until submission.
let accessToken = '';
function readAccessLink() {
  if (!location.hash.startsWith('#access=')) return;
  accessToken = location.hash.slice(8);
  history.replaceState(null, '', location.pathname);
  $('#access-section').hidden = false; $('#access-form').reset(); $('#access-status').textContent = '';
  $('#access-password').disabled = false; $('#access-confirm').disabled = false; $('#access-submit').disabled = false;
  accessCopy(); $('#access-section').scrollIntoView();
}
function accessCopy() {
  const en = language === 'en';
  $('#access-title').textContent = en ? 'Set your password' : 'Встановіть пароль';
  $('#access-help').textContent = en ? 'Choose a password of at least 12 characters. The link can be used once. Then sign in to the CRM with the login from your email.' : 'Оберіть пароль від 12 символів. Посилання одноразове. Після цього увійдіть у CRM з логіном із листа.';
  $('#access-label').textContent = en ? 'New password' : 'Новий пароль';
  $('#access-confirm-label').textContent = en ? 'Repeat password' : 'Повторіть пароль';
  $('#access-submit').textContent = en ? 'Save password' : 'Зберегти пароль';
}
accessCopy();
$('#access-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const en = language === 'en', password = $('#access-password').value, status = $('#access-status');
  status.classList.remove('is-error');
  if (password !== $('#access-confirm').value) { status.classList.add('is-error'); status.textContent = en ? 'Passwords do not match.' : 'Паролі не збігаються.'; return; }
  $('#access-submit').disabled = true;
  try {
    const r = await fetch('/public/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: accessToken, password }), signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw Error();
    const result = await r.json();
    status.textContent = (en ? 'Password saved. Your login: ' : 'Пароль збережено. Ваш логін: ') + result.login;
    accessToken = ''; e.target.reset(); $('#access-password').disabled = true; $('#access-confirm').disabled = true;
  } catch {
    status.classList.add('is-error');
    status.textContent = en ? 'The link is invalid, expired or already used, or the server is unavailable. Request a new key from support.' : 'Посилання недійсне, прострочене чи використане, або сервер недоступний. Зверніться для отримання нового ключа.';
    $('#access-submit').disabled = false;
  }
});
window.addEventListener('hashchange', readAccessLink);
readAccessLink();
