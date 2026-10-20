// Text for the LOMVIKO sales presentation. Edit wording here; layout lives in build.cjs and presentation.css.
module.exports = {
  uk: {
    lang: 'uk', locale: 'uk-UA', file: 'LOMVIKO-presentation-uk.pdf', docTitle: 'LOMVIKO — презентація продукту',
    footer: 'lomviko.com',
    cover: { title: ['Ваш день —', 'в ідеальному ритмі.'], body: 'CRM для бізнесу, що працює за записом. Онлайн-запис через Telegram, нагадування клієнтам, розклад команди й фінанси — в одному сервісі в браузері, з комп’ютера чи телефона.', note: 'Презентація продукту · 2026' },
    problem: {
      title: ['Бізнес за записом втрачає гроші', 'там, де їх не видно.'],
      items: [
        ['Записи розкидані', 'Зошит, Instagram і три месенджери. Подвійні записи й накладки — лише питання часу.'],
        ['Дзвінки й уточнення', '«А хто в нас на дванадцяту?» — адміністратор цілий день відповідає на ті самі питання.'],
        ['Неявки', 'Клієнт забув про візит: майстер простоює, а цю годину вже не продати.'],
        ['Цифри наосліп', 'Виручка, завантаженість і популярні послуги — здогадки замість звітів.'],
      ],
    },
    cost: {
      title: ['Скільки коштують', 'неявки?'], body: 'Порахуймо на прикладі невеликої студії. Навіть кілька пропущених візитів на тиждень складаються в помітну суму.',
      inputs: [['Середній чек', '800 грн'], ['Записів на день', '16'], ['Неявок і пізніх скасувань', '8%'], ['Робочих днів на місяць', '24']],
      loss: 'Втрачено за місяць', lossValue: '24 576 грн', missed: '≈ 31 пропущений візит',
      back: 'Можна повернути, якщо нагадування збережуть 40% візитів', backValue: '9 830 грн / міс', year: '117 965 грн за рік',
      note: 'Приклад розрахунку. Порахуйте свої цифри в калькуляторі на lomviko.com.',
    },
    solution: {
      title: ['LOMVIKO — один робочий простір', 'для всього дня.'],
      items: [
        ['calendar', 'Розклад команди', 'Майстри, кабінети й пости — на одному екрані, на кожному комп’ютері.'],
        ['send', 'Запис через Telegram', 'Клієнти записуються самі 24/7, без дзвінків і переписки.'],
        ['bell', 'Нагадування', 'Бот сам нагадує про візит за 24 і за 2 години.'],
        ['users', 'Клієнтська база', 'Контакти, нотатки й історія візитів кожного клієнта.'],
        ['chart', 'Фінанси й аналітика', 'Оплати, виручка, завантаженість і популярні послуги.'],
        ['layers', 'Команда й кілька бізнесів', 'Ролі доступу та окремі простори для кожної компанії.'],
      ],
    },
    flow: {
      title: ['Від запису до оплати —', 'без жодного дзвінка.'],
      steps: [
        ['Клієнт пише боту', 'Обирає послугу, майстра й зручний час.'],
        ['Запис у розкладі', 'Одразу з’являється в LOMVIKO у всієї команди.'],
        ['Нагадування', 'Бот нагадує за 24 і за 2 години до візиту.'],
        ['Візит і оплата', 'Оплату вносять прямо в записі.'],
        ['Звіт', 'Виручка й завантаженість рахуються самі.'],
      ],
    },
    schedule: {
      title: ['Увесь день команди —', 'на одному екрані.'],
      points: ['Колонки майстрів, кабінетів або постів', 'Вільні вікна видно одразу', 'Групові записи з лімітом місць', 'Той самий розклад на кожному комп’ютері'],
      board: { title: 'Розклад · сьогодні', date: 'Четвер, 14 жовтня', members: ['Олена', 'Максим', 'Ірина', 'Софія'], bookings: [['Фарбування', 'Ірина К.'], ['Стрижка', 'Дмитро'], ['Масаж спини', 'Олег'], ['SPA-догляд', 'Марія'], ['Манікюр', 'Вікторія'], ['Манікюр + покриття', 'Анна · Telegram'], ['Корекція брів', 'Катерина'], ['Догляд за обличчям', 'Юлія']], stats: [['Записів', '18'], ['Виручка', '24 600 грн'], ['Завантаженість', '86%']] },
    },
    bot: {
      title: ['Запис 24/7 — навіть коли', 'застосунок закритий.'],
      points: ['Клієнт сам обирає послугу, майстра й час', 'Бот працює на сервері, а не на вашому комп’ютері', 'Можна розмістити бота на власному сервері', 'Запис одразу потрапляє в розклад'],
      chat: { name: 'Студія «Ритм»', status: 'бот', messages: [['bot', 'Вітаємо! 👋 На яку послугу вас записати?'], ['me', 'Манікюр'], ['bot', 'Оберіть майстра й зручний час сьогодні:'], ['slots', '11:00', '12:30', '15:00'], ['me', '12:30 · Ірина'], ['bot', 'Готово! Манікюр сьогодні о 12:30 у Ірини. Нагадаю за 24 і за 2 години ✓']] },
    },
    reminders: {
      title: ['Менше неявок —', 'без жодного зусилля.'], body: 'Бот сам нагадує клієнту двічі. Адміністратору не потрібно дзвонити й писати кожному — клієнти приходять вчасно або заздалегідь переносять візит.',
      big: '×2', bigNote: 'автоматичні нагадування на кожен запис',
      cards: [['За 24 години', 'Нагадуємо: завтра о 12:30 — манікюр у студії «Ритм».'], ['За 2 години', 'Чекаємо вас сьогодні о 12:30. До зустрічі!']],
    },
    clients: {
      title: ['Кожен клієнт — з історією,', 'а не просто номером.'],
      points: ['Пошук за ім’ям і телефоном', 'Нотатки та кількість візитів', 'Прив’язка Telegram для нагадувань', 'Новий клієнт — прямо під час запису'],
      card: { name: 'Анна Коваленко', phone: '+380 67 ••• 12 34', telegram: 'Telegram підключено', visits: 'Візитів', visitsValue: '12', next: 'Наступний візит', nextValue: 'Пт, 12:30 · Манікюр', notes: 'Нотатки', notesValue: 'Любить ранковий час. Покриття — нюдові відтінки.' },
    },
    finance: {
      title: ['День завершився.', 'Цифри — залишились.'],
      points: ['Оплати й повернення в записах', 'Звіти за будь-який період', 'Популярні послуги та завантаженість', 'Фінанси бачать лише ті, кому дозволено'],
      kpis: [['Виручка за тиждень', '86 400 грн'], ['Завантаженість', '86%'], ['Записів', '112'], ['Топ-послуга', 'Манікюр']],
      days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'], delta: '+18% до минулого тижня',
    },
    team: {
      title: ['Росте бізнес —', 'LOMVIKO росте разом із ним.'],
      items: [
        ['users', 'Ролі та права', 'Власник, адміністратор і співробітник бачать лише своє. Фінанси — тільки за дозволом.'],
        ['layers', 'Кілька бізнесів', 'Окремі робочі простори для кожної компанії під одним входом.'],
        ['grid', 'Ресурси', 'Кабінети, пости й обладнання — плануйте не лише людей, а й місця.'],
      ],
    },
    security: {
      title: ['Ваші дані —', 'тільки ваші.'], body: 'Клієнтська база — найцінніше, що є у бізнесу. Тому вона захищена й завжди залишається у вас.',
      items: [
        ['lock', 'Копія бази будь-коли', 'Повна копія у JSON, CSV або зашифрованому файлі — одним натисканням.'],
        ['cloud', 'Доступ за ролями', 'Майстер бачить розклад і клієнтів, фінанси — лише власник і адміністратор.'],
        ['key', 'Захищені доступи', 'Токени бота й ключі банків зберігаються зашифрованими на сервері й більше не показуються.'],
        ['download', 'Експорт будь-коли', 'Вивантажте базу у JSON або CSV — без запитів і очікування.'],
      ],
    },
    audience: {
      title: ['Для будь-якого бізнесу,', 'що працює за записом.'],
      segments: [
        ['Краса', ['Салони', 'Барбершопи', 'Нігтьові студії', 'Косметологи']],
        ['Здоров’я', ['Стоматології', 'Масаж', 'Психологи', 'Реабілітація']],
        ['Навчання і спорт', ['Йога', 'Фітнес', 'Танці', 'Репетитори']],
        ['Сервіс', ['Автосервіси', 'Ремонт техніки', 'Фотостудії', 'Грумінг']],
      ],
    },
    product: { title: ['Відкрили. Побачили день.', 'До роботи.'], chips: ['Комп’ютер і телефон', 'Українська та English', 'Світла й темна тема', '199 грн/міс · безкоштовно до 1 березня 2027'], caption: 'Справжній інтерфейс LOMVIKO. На зображенні — демонстраційні дані.' },
    start: {
      title: ['Почніть новий день', 'з LOMVIKO.'],
      steps: [['Реєстрація', 'Натисніть «Спробувати безкоштовно» на lomviko.com і підтвердьте пошту.'], ['Налаштування', 'Додайте послуги, майстрів і графік — або попросіть нас допомогти.'], ['Працюєте', 'Діліться сторінкою запису й ботом — і приймайте записи.']],
      contact: 'Сайт', word: 'РИТМ',
    },
  },
  en: {
    lang: 'en', locale: 'en-GB', file: 'LOMVIKO-presentation-en.pdf', docTitle: 'LOMVIKO — product presentation',
    footer: 'lomviko.com',
    cover: { title: ['Your day,', 'perfectly in rhythm.'], body: 'The CRM for appointment-based businesses. Telegram booking, client reminders, a team schedule and finances — in one service in your browser, on a computer or a phone.', note: 'Product presentation · 2026' },
    problem: {
      title: ['Appointment businesses lose money', 'where no one is looking.'],
      items: [
        ['Scattered bookings', 'A notebook, Instagram and three messengers. Double bookings are only a matter of time.'],
        ['Endless calls', '“Who’s booked at noon?” — the front desk answers the same questions all day.'],
        ['No-shows', 'A client forgets: the specialist sits idle and that hour can’t be sold again.'],
        ['Flying blind', 'Revenue, workload and top services are guesses instead of reports.'],
      ],
    },
    cost: {
      title: ['What do no-shows', 'really cost?'], body: 'Let’s take a small studio as an example. Even a few missed visits a week add up to a noticeable sum.',
      inputs: [['Average ticket', 'UAH 800'], ['Appointments per day', '16'], ['No-shows and late cancellations', '8%'], ['Working days per month', '24']],
      loss: 'Lost every month', lossValue: 'UAH 24,576', missed: '≈ 31 missed visits',
      back: 'Recoverable if reminders save 40% of those visits', backValue: 'UAH 9,830 / mo', year: 'UAH 117,965 per year',
      note: 'An example calculation. Try your own numbers in the calculator at lomviko.com.',
    },
    solution: {
      title: ['LOMVIKO — one workspace', 'for the whole day.'],
      items: [
        ['calendar', 'Team schedule', 'Specialists, rooms and bays on one screen, on every computer.'],
        ['send', 'Telegram booking', 'Clients book themselves 24/7 — no calls, no back-and-forth.'],
        ['bell', 'Reminders', 'The bot reminds clients 24 hours and 2 hours before.'],
        ['users', 'Client records', 'Contacts, notes and visit history for every client.'],
        ['chart', 'Finance & analytics', 'Payments, revenue, workload and top services.'],
        ['layers', 'Teams & multiple businesses', 'Access roles and a separate workspace for each company.'],
      ],
    },
    flow: {
      title: ['From booking to payment —', 'without a single call.'],
      steps: [
        ['The client messages the bot', 'Picks a service, specialist and time.'],
        ['Booked in the schedule', 'Instantly visible to the whole team.'],
        ['Reminders', 'The bot reminds 24 h and 2 h before.'],
        ['Visit & payment', 'Payment is recorded right in the booking.'],
        ['Report', 'Revenue and workload add up on their own.'],
      ],
    },
    schedule: {
      title: ['Your team’s whole day', 'on one screen.'],
      points: ['Columns for specialists, rooms or bays', 'Free slots at a glance', 'Group bookings with a seat limit', 'The same schedule on every computer'],
      board: { title: 'Schedule · today', date: 'Thursday, 14 October', members: ['Olena', 'Max', 'Iryna', 'Sofia'], bookings: [['Colouring', 'Iryna K.'], ['Haircut', 'Dmytro'], ['Back massage', 'Oleh'], ['Spa care', 'Maria'], ['Manicure', 'Victoria'], ['Manicure + gel', 'Anna · Telegram'], ['Brow shaping', 'Kateryna'], ['Facial care', 'Julia']], stats: [['Bookings', '18'], ['Revenue', 'UAH 24,600'], ['Utilisation', '86%']] },
    },
    bot: {
      title: ['24/7 booking — even when', 'the app is closed.'],
      points: ['Clients choose the service, specialist and time', 'The bot runs on a server, not on your computer', 'You can host the bot on your own server', 'Bookings land in the schedule instantly'],
      chat: { name: 'Rhythm Studio', status: 'bot', messages: [['bot', 'Hi there! 👋 Which service would you like to book?'], ['me', 'Manicure'], ['bot', 'Pick a specialist and a time today:'], ['slots', '11:00', '12:30', '15:00'], ['me', '12:30 · Iryna'], ['bot', 'Done! Manicure today at 12:30 with Iryna. I’ll remind you 24 and 2 hours before ✓']] },
    },
    reminders: {
      title: ['Fewer no-shows —', 'with zero effort.'], body: 'The bot reminds each client twice. Nobody at the front desk has to call or text — clients arrive on time or reschedule in advance.',
      big: '×2', bigNote: 'automatic reminders for every booking',
      cards: [['24 hours before', 'A reminder: tomorrow at 12:30 — manicure at Rhythm Studio.'], ['2 hours before', 'We look forward to seeing you today at 12:30!']],
    },
    clients: {
      title: ['Every client has a story,', 'not just a number.'],
      points: ['Search by name or phone', 'Notes and visit count', 'Telegram linked for reminders', 'Add a new client right while booking'],
      card: { name: 'Anna Kovalenko', phone: '+380 67 ••• 12 34', telegram: 'Telegram linked', visits: 'Visits', visitsValue: '12', next: 'Next visit', nextValue: 'Fri, 12:30 · Manicure', notes: 'Notes', notesValue: 'Prefers mornings. Nude shades for gel.' },
    },
    finance: {
      title: ['The day is over.', 'The numbers stay.'],
      points: ['Payments and refunds inside bookings', 'Reports for any period', 'Top services and utilisation', 'Only people you allow see finances'],
      kpis: [['Revenue this week', 'UAH 86,400'], ['Utilisation', '86%'], ['Bookings', '112'], ['Top service', 'Manicure']],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], delta: '+18% vs last week',
    },
    team: {
      title: ['As your business grows,', 'LOMVIKO grows with it.'],
      items: [
        ['users', 'Roles & permissions', 'Owner, admin and staff see only what they need. Finances — by permission only.'],
        ['layers', 'Multiple businesses', 'A separate workspace for each company under one login.'],
        ['grid', 'Resources', 'Rooms, bays and equipment — plan places, not just people.'],
      ],
    },
    security: {
      title: ['Your data —', 'yours alone.'], body: 'Your client base is the most valuable thing your business owns. That’s why it’s protected and always stays with you.',
      items: [
        ['lock', 'A copy anytime', 'A full copy as JSON, CSV or an encrypted file — in one click.'],
        ['cloud', 'Role-based access', 'Staff see the schedule and clients; finances are for the owner and admins only.'],
        ['key', 'Protected credentials', 'Bot tokens and bank keys are stored encrypted on the server and never shown again.'],
        ['download', 'Export anytime', 'Download your database as JSON or CSV — no requests, no waiting.'],
      ],
    },
    audience: {
      title: ['For any business', 'that runs on appointments.'],
      segments: [
        ['Beauty', ['Salons', 'Barbershops', 'Nail studios', 'Cosmetologists']],
        ['Health', ['Dental clinics', 'Massage', 'Therapists', 'Rehabilitation']],
        ['Education & sport', ['Yoga', 'Fitness', 'Dance', 'Tutors']],
        ['Services', ['Car service', 'Device repair', 'Photo studios', 'Pet grooming']],
      ],
    },
    product: { title: ['Open it. See your day.', 'Get to work.'], chips: ['Computer and phone', 'Ukrainian and English', 'Light and dark theme', 'UAH 199 a month · free until 1 March 2027'], caption: 'The real LOMVIKO interface. The image shows illustrative demo data.' },
    start: {
      title: ['Start a new day', 'with LOMVIKO.'],
      steps: [['Sign up', 'Press “Try it free” at lomviko.com and confirm your email.'], ['Set up', 'Add services, staff and hours — or ask us to help.'], ['Get to work', 'Share your booking page and bot and start taking bookings.']],
      contact: 'Website', word: 'RHYTHM',
    },
  },
};
