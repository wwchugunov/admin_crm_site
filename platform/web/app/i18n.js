(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OrbitI18n = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const messages = {
    staffCannotDo: { uk: "Цей спеціаліст не виконує обрану послугу", en: "This specialist does not provide the selected service" },
    staffScheduleInvalid: { uk: "Перевірте графік: потрібен хоча б один робочий день", en: "Check the schedule: at least one working day is needed" },
    staffAbsenceInvalid: { uk: "Перевірте дати відсутності", en: "Check the absence dates" },
    clientMissing: { uk: "Клієнта не знайдено", en: "Client not found" },
    clientDeletedName: { uk: "Видалений клієнт", en: "Deleted client" },
    webGateTitle: {
      uk: "Записи, клієнти й оплати в одному місці",
      en: "Bookings, clients and payments in one place",
    },
    webGateText: {
      uk: "Увійдіть до своєї компанії або почніть безкоштовно до 1 березня 2027 — без встановлення, з комп’ютера чи телефона.",
      en: "Sign in to your company or start free until 1 March 2027 — nothing to install, on a computer or a phone.",
    },
    webUnavailable: {
      uk: "Ця дія недоступна у веб-версії",
      en: "Not available in the web version",
    },
    // More about the client
    clientBirthdayInvalid: { uk: "Перевірте дату народження", en: "Check the date of birth" },
    clientEmailInvalid: { uk: "Перевірте email, наприклад name@gmail.com", en: "Check the email, e.g. name@gmail.com" },
    clientPhoneInvalid: { uk: "Перевірте номер телефону: 10–15 цифр, наприклад +380 67 123 45 67", en: "Check the phone number: 10–15 digits, e.g. +380 67 123 45 67" },
    clientEmail: { uk: "Email", en: "Email" },
    clientBirthday: { uk: "Дата народження", en: "Date of birth" },
    clientVehicle: { uk: "Автомобіль", en: "Car" },
    clientVehicleHint: { uk: "Марка, модель, рік", en: "Make, model, year" },
    clientPlate: { uk: "Держномер", en: "Plate number" },
    clientSource: { uk: "Звідки дізнався", en: "Came from" },
    source_instagram: { uk: "Instagram", en: "Instagram" },
    source_google: { uk: "Google / Карти", en: "Google / Maps" },
    source_referral: { uk: "Рекомендація знайомих", en: "Recommendation" },
    source_street: { uk: "Побачив вивіску", en: "Saw the sign" },
    source_ads: { uk: "Реклама", en: "Ads" },
    source_page: { uk: "Сторінка запису", en: "Booking page" },
    source_telegram: { uk: "Telegram-бот", en: "Telegram bot" },
    source_other: { uk: "Інше", en: "Other" },
    clientTags: { uk: "Мітки", en: "Tags" },
    clientTagsHint: { uk: "через кому: VIP, постійна", en: "comma separated: VIP, regular" },
    clientAlert: { uk: "Важливо знати", en: "Important" },
    clientAlertHint: { uk: "алергії, протипоказання, побажання", en: "allergies, contraindications, wishes" },
    birthdayToday: { uk: "сьогодні", en: "today" },
    clientSearch: { uk: "Пошук: ім’я, телефон, email, мітка", en: "Search: name, phone, email, tag" },
    clientSearchAuto: { uk: "Пошук: ім’я, телефон, держномер, авто", en: "Search: name, phone, plate, car" },
    birthdayIn: { uk: "через {days} дн.", en: "in {days} days" },
    birthdaysTitle: { uk: "Іменинники", en: "Birthdays" },
    birthdaysEmpty: { uk: "Цього тижня днів народження немає", en: "No birthdays this week" },
    birthdaysEmptyHint: { uk: "Відкрийте клієнта → «Змінити» → «Дата народження». Тут з’являться ті, кого варто привітати.", en: "Add the date of birth in a client's card — the ones to congratulate will show here." },
    // 1.9: waiting list, buttons in reminders, clients who have not come for a while
    lapsedDaysInvalid: { uk: "Вкажіть від 3 до 365 днів", en: "Enter from 3 to 365 days" },
    waitDateInvalid: { uk: "Оберіть дату від сьогодні й не пізніше ніж за рік", en: "Choose a date from today and within a year" },
    waitMissing: { uk: "Цього запису в листі очікування вже немає", en: "This waiting list entry is no longer there" },
    botCome: { uk: "✅ Прийду", en: "✅ I'll come" },
    botMove: { uk: "🔁 Перенести", en: "🔁 Reschedule" },
    botCancelShort: { uk: "❌ Скасувати", en: "❌ Cancel" },
    botComeThanks: { uk: "Дякуємо! Чекаємо на вас.", en: "Thank you! See you soon." },
    botMoveChoose: { uk: "На який день перенести? Показую вільний час того ж спеціаліста.", en: "Which day suits you? Showing free times of the same specialist." },
    botMoveQuote: { uk: "Перенести запис на цей час?", en: "Move your visit to this time?" },
    botMoveConfirm: { uk: "✅ Перенести", en: "✅ Move" },
    botMoved: { uk: "Готово, запис перенесено.", en: "Done, your visit has been moved." },
    botNoGoodTime: { uk: "🕓 Немає зручного часу", en: "🕓 No convenient time" },
    botWaitJoin: { uk: "🕓 Чекати, якщо звільниться", en: "🕓 Wait for a free time" },
    botNearest: { uk: "Найближчий вільний час:", en: "Nearest free times:" },
    botWaitAsk: { uk: "Можу записати вас у лист очікування на цей день: щойно хтось скасує запис, я одразу напишу.", en: "I can put you on the waiting list for this day: as soon as someone cancels, I will message you." },
    botWaitJoined: { uk: "Готово, ви в листі очікування. Щойно на цей день звільниться час, я одразу напишу.", en: "Done, you are on the waiting list. As soon as a time opens up that day, I will message you." },
    botWaitOffer: { uk: "🔔 Звільнився час! Записуємо того, хто першим натисне.", en: "🔔 A time has opened up! The first to tap gets it." },
    botWaitStop: { uk: "Більше не чекаю", en: "Stop waiting" },
    botWaitTaken: { uk: "На жаль, цей час уже забрали. Якщо звільниться ще, я напишу.", en: "Sorry, this time has already been taken. If another one opens up, I will message you." },
    botWaitStopped: { uk: "Добре, прибрав вас із листа очікування.", en: "OK, you are off the waiting list." },
    botInvite: { uk: "Давно вас не бачили! Запишіться на зручний час — це займе хвилину.", en: "We haven't seen you for a while! Book a convenient time — it takes a minute." },
    coming: { uk: "Прийде", en: "Coming" },
    comingHint: { uk: "Клієнт натиснув «Прийду» в нагадуванні", en: "The client tapped “I'll come” in the reminder" },
    waitTitle: { uk: "Лист очікування", en: "Waiting list" },
    waitHint: { uk: "Хто чекає, якщо звільниться час", en: "Who is waiting for a free time" },
    waitIntro: { uk: "Коли на день звільняється час, бот сам пропонує його всім, хто чекає в Telegram, — записується той, хто першим натисне. Решті можна зателефонувати.", en: "When a time opens up, the bot offers it to everyone waiting in Telegram at once — the first to tap gets it. Call the others." },
    waitNobody: { uk: "На цей день ніхто не чекає.", en: "Nobody is waiting for this day." },
    waitAdd: { uk: "Додати в лист очікування", en: "Add to the waiting list" },
    waitAddHint: { uk: "Клієнт із Telegram отримає повідомлення від бота, щойно звільниться час.", en: "A client with Telegram gets a message from the bot as soon as a time opens up." },
    waitAddButton: { uk: "Додати", en: "Add" },
    waitAdded: { uk: "Додано в лист очікування", en: "Added to the waiting list" },
    waitAnyone: { uk: "Будь-хто", en: "Anyone" },
    waitWanted: { uk: "Бажано о", en: "Preferably at" },
    waitRemove: { uk: "Прибрати", en: "Remove" },
    waitBook: { uk: "Записати", en: "Book" },
    waitClient: { uk: "Клієнт", en: "Client" },
    waitSpecialist: { uk: "Спеціаліст", en: "Specialist" },
    waitFromBot: { uk: "з бота", en: "from the bot" },
    waitFromPage: { uk: "зі сторінки запису", en: "from the booking page" },
    waitFromApp: { uk: "додано вручну", en: "added by hand" },
    clientsFilter: { uk: "Які клієнти", en: "Which clients" },
    clientsAll: { uk: "Усі", en: "All" },
    lapsedTitle: { uk: "Давно не були", en: "Not seen lately" },
    lapsedNote: { uk: "Клієнти, які не приходять довше, ніж зазвичай для них, і не мають запису наперед.", en: "Clients who have stayed away longer than usual for them and have no visit booked." },
    lapsedMin: { uk: "Не раніше ніж через", en: "Not before" },
    lapsedDaysUnit: { uk: "днів", en: "days" },
    lapsedEmpty: { uk: "Усі клієнти приходять вчасно", en: "All clients come back on time" },
    lapsedEmptyHint: { uk: "Тут з’являться ті, хто давно не був. Їх можна запросити через Telegram-бота або зателефонувати.", en: "Clients who have stayed away will show here. Invite them through the Telegram bot or call them." },
    lapsedUsual: { uk: "Зазвичай", en: "Usually" },
    lapsedAway: { uk: "{days} дн. тому", en: "{days} days ago" },
    lapsedEvery: { uk: "раз на {days} дн.", en: "every {days} days" },
    lapsedInvite: { uk: "Запросити в Telegram", en: "Invite in Telegram" },
    lapsedInvited: { uk: "Запрошено", en: "Invited" },
    lapsedSent: { uk: "Запрошення надіслано", en: "Invitation sent" },
    lapsedNoTelegram: { uk: "Клієнт не підключений до Telegram-бота", en: "The client is not connected to the Telegram bot" },

    welcomePreview: {uk: "Приклад можливостей", en: "Feature preview"},
    welcomeSampleClient: {uk: "Олена — новий клієнт", en: "Olena — new customer"},
    welcomeSampleService: {uk: "Консультація", en: "Consultation"},
    welcomeVisualSchedule: { uk: "Розклад", en: "Schedule" },
    welcomeVisualCustomers: { uk: "Клієнти", en: "Customers" },
    welcomeVisualServices: { uk: "Послуги", en: "Services" },
    welcomeVisualPhone: { uk: "Телефон", en: "Phone" },
    welcomeVisualAvailability: { uk: "Вільний час", en: "Availability" },
    welcomeVisualBooking: { uk: "Запис", en: "Booking" },
    welcomeVisualHosting: { uk: "Ваш сервер", en: "Your server" },
    fiveMinutes: { uk: "5 хвилин", en: "5 minutes" },
    companyBots: { uk: "Боти компаній", en: "Company bots" },
    botWaiting: { uk: "Очікує запуску", en: "Waiting for worker" },
    botOnOwnServer: { uk: "Власний сервер", en: "Own server" },
    botNotConnected: { uk: "Не підключено", en: "Not connected" },
    trialStarted: { uk: "Початок пробного періоду", en: "Trial started" },
    registrationRequested: { uk: "Реєстрація", en: "Registration" },
    botExternalOnline: { uk: "✓ Власний сервер", en: "✓ Own server" },
    botExternalWaiting: {
      uk: "Очікує запуску на власному сервері",
      en: "Waiting for your server",
    },
    botKitSaved: {
      uk: "Комплект збережено. Інструкція запуску — у README.txt цієї папки.",
      en: "Server kit saved. Follow README.txt in that folder.",
    },
    registrationRestart: {
      uk: "Почніть реєстрацію знову",
      en: "Start registration again",
    },
    registerFreeTrial: {
      uk: "Спробувати безкоштовно",
      en: "Try every feature free",
    },
    registrationHint: {
      uk: "Усі функції без обмеження тарифом. Підтвердіть email кодом із листа — тоді почнеться пробний період.",
      en: "All features are included. Verify your email with the code we send to start your trial.",
    },
    verifyEmail: { uk: "Підтвердіть email", en: "Verify your email" },
    verifyEmailHint: {
      uk: "Введіть шестизначний код із листа. Він діє 15 хвилин. Якщо лист не прийшов за кілька хвилин, перевірте «Спам». Якщо обліковий запис із цим email уже існує, код не надсилається — ми надіслали лист-підказку, просто увійдіть.",
      en: "Enter the six-digit code from your email. It expires in 15 minutes. If it does not arrive within a few minutes, check your spam folder. If an account with this email already exists, no code is sent — we emailed you a hint; just sign in.",
    },
    clockSkew: {
      uk: "Дата або час на комп’ютері встановлені неправильно. Увімкніть автоматичне налаштування часу й спробуйте ще раз.",
      en: "This computer’s date or time is wrong. Turn on automatic time setting and try again.",
    },
    verificationCode: { uk: "Код із листа", en: "Email code" },
    sendCode: { uk: "Отримати код", en: "Send verification code" },
    bookingTimezoneHint: {
      uk: "Час запису показано для часового поясу",
      en: "Appointment time is shown in",
    },
    bookingPeople: { uk: "Кількість людей", en: "Number of people" },
    bookingPeopleHint: {
      uk: "Для групової послуги: скільки людей прийде разом.",
      en: "For a group service: how many people will attend together.",
    },
    bookingPhoneRequired: {
      uk: "Вкажіть телефон нового клієнта — щонайменше 7 цифр.",
      en: "Enter the new client phone number: at least 7 digits.",
    },
    accountAccess: {
      uk: "Ваш обліковий запис і доступ",
      en: "Your account and access",
    },
    accountAccessHint: {
      uk: "Створіть обліковий запис для пробного доступу або увійдіть. Якщо вам видали одноразовий ключ, його можна використати тут.",
      en: "Register for a trial or sign in. If you received a one-time key, you can activate it here.",
    },
    activateWithKey: {
      uk: "Активувати одноразовий ключ",
      en: "Activate a one-time key",
    },
    showWelcome: { uk: "Знайомство з LOMVIKO", en: "Explore LOMVIKO" },
    legalDocuments: { uk: "Правові документи", en: "Legal documents" },
    scheduleView: { uk: "Вигляд розкладу", en: "Schedule view" },
    scheduleGrid: { uk: "Сітка", en: "Grid" },
    scheduleList: { uk: "Список", en: "List" },
    gridHint: {
      uk: "Натисніть на вільний час у колонці спеціаліста, щоб створити запис.",
      en: "Click free time in a specialist’s column to create a booking.",
    },
    setupTitle: { uk: "Почніть роботу з LOMVIKO", en: "Get started with LOMVIKO" },
    setupBody: {
      uk: "Створіть акаунт для спільної роботи команди й онлайн-запису або налаштуйте бізнес лише на цьому комп’ютері.",
      en: "Create an account for team work and online booking, or set up your business on this computer only.",
    },
    setupLocal: { uk: "Налаштувати на цьому комп’ютері", en: "Set up on this computer" },
    welcomeSkip: { uk: "Пропустити знайомство", en: "Skip the tour" },
    bookingDate: { uk: "Дата", en: "Date" },
    bookingTime: { uk: "Час", en: "Time" },
    bookingResourceRequired: {
      uk: "Оберіть спеціаліста для цієї послуги.",
      en: "Choose a specialist for this service.",
    },
    slotBusy: { uk: "зайнято", en: "busy" },
    slotOutside: { uk: "поза робочим часом", en: "outside working hours" },
    slotBusyHint: {
      uk: "Обраний спеціаліст у цей час уже зайнятий — оберіть інший час або іншого спеціаліста.",
      en: "The chosen specialist is busy at this time — pick another time or specialist.",
    },
    slotOutsideHint: { uk: "Поза робочим часом. Графік:", en: "Outside working hours. Schedule:" },
    slotDayOff: { uk: "Цей день — вихідний за графіком.", en: "This day is a day off in your schedule." },
    slotNoneLeft: {
      uk: "На цей день вільного часу вже не залишилося — оберіть іншу дату.",
      en: "No time left on this day — choose another date.",
    },
    apptPaid: { uk: "сплачено", en: "paid" },
    apptCancel: { uk: "Скасувати запис", en: "Cancel booking" },
    close: { uk: "Закрити", en: "Close" },
    zoneHint: { uk: "Усі записи, нагадування й бот працюють за цим поясом. Перехід на літній і зимовий час враховується автоматично.", en: "Bookings, reminders and the bot use this zone. Summer and winter time changes are applied automatically." },
    zoneClient: { uk: "Часовий пояс клієнта", en: "Client’s time zone" },
    zoneForClient: { uk: "у клієнта", en: "client’s time" },
    zoneSummer: { uk: "літній час", en: "summer time" },
    zoneWinter: { uk: "зимовий час", en: "winter time" },
    registerCompany: { uk: "Назва компанії", en: "Company name" },
    registerName: { uk: "Ваше ім’я", en: "Your name" },
    registerEmail: { uk: "Пошта", en: "Email" },
    registerPasswordAgain: { uk: "Повторіть пароль", en: "Repeat the password" },
    registerPasswordHint: { uk: "Пароль — щонайменше 12 символів.", en: "The password needs at least 12 characters." },
    registerPasswordMismatch: { uk: "Паролі не збігаються", en: "The passwords do not match" },
    forgotPassword: { uk: "Забули пароль?", en: "Forgot password?" },
    goCatalog: { uk: "Додати послуги й спеціалістів", en: "Add services and staff" },
    subscriptionTitle: { uk: "Підписка", en: "Subscription" },
    subscriptionTrialLeft: { uk: "Пробний період до {date}: залишилось {days} {unit}", en: "Free trial until {date}: {days} {unit} left" },
    subscriptionPaidLeft: { uk: "Оплачено до {date}: залишилось {days} {unit}", en: "Paid until {date}: {days} {unit} left" },
    subscriptionEnded: { uk: "Доступ завершився {date}", en: "Access ended on {date}" },
    subscriptionSoonHint: { uk: "Щоб працювати без перерви, продовжіть заздалегідь — новий місяць додасться після поточного терміну.", en: "Renew ahead to keep working without a break — the new month starts after the current one." },
    subscriptionEndedHint: { uk: "Дані збережені: можна переглядати й вивантажити базу. Нові записи, бот і сторінка запису відновляться після оплати.", en: "Your data is safe: you can view it and export it. New bookings, the bot and the booking page come back after payment." },
    subscriptionExtend: { uk: "Продовжити", en: "Renew" },
    subscriptionPriceHint: { uk: "Тарифи: «Старт» 199, «Бізнес» 499, «Про» 899 грн на місяць.", en: "Plans: Start UAH 199, Business UAH 499, Pro UAH 899 a month." },
    subscriptionRequest: { uk: "Добрий день! Хочу продовжити LOMVIKO для «{business}». Мене цікавить тариф: «Старт» (199 грн/міс), «Бізнес» (499 грн/міс) або «Про» (899 грн/міс) — допоможіть обрати. Надішліть, будь ласка, реквізити для оплати.", en: "Hello! I would like to renew LOMVIKO for “{business}”. I am looking at Start (UAH 199/mo), Business (UAH 499/mo) or Pro (UAH 899/mo) — please help me choose and send the payment details." },
    forgotPasswordTitle: { uk: "Відновити пароль", en: "Reset your password" },
    forgotPasswordHint: { uk: "Вкажіть email, з яким входите. Надішлемо шестизначний код.", en: "Enter the email you sign in with. We will send a six-digit code." },
    forgotPasswordCodeTitle: { uk: "Новий пароль", en: "New password" },
    forgotPasswordCodeHint: { uk: "Якщо такий обліковий запис є, код уже в пошті. Він діє 15 хвилин. Не бачите листа — перевірте «Спам».", en: "If the account exists, the code is in your inbox. It is valid for 15 minutes. No letter? Check your spam folder." },
    forgotPasswordNew: { uk: "Новий пароль", en: "New password" },
    forgotPasswordSave: { uk: "Зберегти й увійти", en: "Save and sign in" },
    forgotPasswordDone: { uk: "Пароль змінено. На інших пристроях потрібно увійти знову.", en: "Password changed. Other devices need to sign in again." },
    staffWho: { uk: "Хто виконує", en: "Who provides it" },
    staffWhoHint: { uk: "Нікого не відмічено — послугу може виконати будь-хто. Бот і сайт пропонуватимуть лише відмічених.", en: "Nobody ticked means anyone can do it. The bot and website offer only the ticked people." },
    staffAnyone: { uk: "будь-хто", en: "anyone" },
    staffSchedule: { uk: "Графік", en: "Schedule" },
    staffEveryDay: { uk: "Усі робочі дні", en: "Every opening day" },
    staffWeekdays: { uk: "Дні тижня", en: "Days of the week" },
    staffCycle: { uk: "Змінний (наприклад, 2/2)", en: "Shifts (e.g. 2 on / 2 off)" },
    staffOn: { uk: "Робочих днів", en: "Days on" },
    staffOff: { uk: "Вихідних днів", en: "Days off" },
    staffCycleStart: { uk: "Перший робочий день", en: "First working day" },
    staffFrom: { uk: "з", en: "from" },
    staffScheduleHint: { uk: "Бот, сайт і сітка показують людину лише в її робочі дні. Години роботи — спільні для компанії.", en: "The bot, website and grid show a person only on their working days. Opening hours are shared by the company." },
    staffAbsences: { uk: "Відпустки й лікарняні", en: "Leave and sick days" },
    staffNoAbsences: { uk: "Найближчим часом відсутностей немає.", en: "No upcoming absences." },
    staffAbsenceAdd: { uk: "Додати відсутність", en: "Add absence" },
    staffAbsenceFrom: { uk: "З", en: "From" },
    staffAbsenceTo: { uk: "По", en: "To" },
    staffAbsenceReason: { uk: "Причина", en: "Reason" },
    staffVacation: { uk: "Відпустка", en: "Vacation" },
    staffSick: { uk: "Лікарняний", en: "Sick leave" },
    staffDayOff: { uk: "Вихідний", en: "Day off" },
    staffAbsenceHint: { uk: "На ці дні бот і сайт не прийматимуть записи до цієї людини.", en: "The bot and website stop taking bookings for this person on these days." },
    staffAbsenceBusy: { uk: "Збережено. На ці дні вже є записів: {n} — перенесіть їх у розкладі.", en: "Saved. {n} bookings already fall on these days — move them in the schedule." },
    staffAway: { uk: "відсутність", en: "away" },
    staffResting: { uk: "Сьогодні вихідні", en: "Off today" },
    staffNobody: { uk: "Цього дня ніхто не працює", en: "Nobody works this day" },
    staffNobodyHint: { uk: "За графіками всі мають вихідний. Змініть графік у «Послуги та ресурси».", en: "Everyone is off by their schedules. Change schedules in Services and resources." },
    staffOffThatDay: { uk: "У цей день не працює за графіком", en: "Off this day by schedule" },
    staffDeleteFuture: { uk: "За цією людиною є майбутніх записів: {n}. Перенесемо їх на інших спеціалістів того ж часу, а тоді видалимо.", en: "{n} future bookings belong to this person. We will move them to other specialists at the same time, then delete." },
    staffMoveTo: { uk: "Перенести на", en: "Move to" },
    staffMoveAuto: { uk: "Будь-кого вільного, хто виконує послугу", en: "Anyone free who provides the service" },
    staffMoveHint: { uk: "Час і клієнт не змінюються; змінюється тільки спеціаліст.", en: "Time and client stay the same; only the specialist changes." },
    staffMoveAndDelete: { uk: "Перенести й видалити", en: "Move and delete" },
    staffMovePartial: { uk: "Перенесено: {moved}. Не вдалося: {left} — немає вільного спеціаліста на той час. Перенесіть їх вручну, тоді видаліть.", en: "Moved: {moved}. Not moved: {left} — nobody free at that time. Move them manually, then delete." },
    staffAbsenceVisits: { uk: "{name}: записів на ці дні — {n}", en: "{name}: {n} bookings on these days" },
    staffAbsenceVisitsHint: { uk: "Відсутність збережено. Ці клієнти прийдуть, а спеціаліста не буде. Передайте записи комусь іншому — час і клієнт не зміняться.", en: "The absence is saved. These clients will come but the specialist won't be there. Give the bookings to someone else — time and client stay the same." },
    staffAbsenceMove: { uk: "Передати записи", en: "Give bookings away" },
    staffMovedOnly: { uk: "Записів передано: {n}.", en: "{n} bookings moved." },
    staffCallTitle: { uk: "Потрібно домовитися з клієнтами", en: "Call these clients" },
    staffCallHint: { uk: "Передано: {moved}. Ще {left} — на цей час немає вільного спеціаліста. Зателефонуйте клієнтам і перенесіть або скасуйте ці записи.", en: "Moved: {moved}. {left} more — nobody is free at that time. Call these clients and move or cancel the bookings." },
    staffMovedAll: { uk: "Записів перенесено: {n}. Спеціаліста видалено.", en: "{n} bookings moved. Specialist deleted." },
    staffReport: { uk: "По спеціалістах", en: "By specialist" },
    staffReportHint: { uk: "Завершені візити за місяць", en: "Completed visits this month" },
    staffPerson: { uk: "Спеціаліст", en: "Specialist" },
    staffRevenue: { uk: "Виручка", en: "Revenue" },
    staffAverage: { uk: "Середній чек", en: "Average" },
    clientEdit: { uk: "Змінити", en: "Edit" },
    clientDelete: { uk: "Видалити клієнта", en: "Delete client" },
    clientDeleteAnon: { uk: "Ім’я, телефон, нотатки й Telegram буде стерто. Візити залишаться у звітах як «Видалений клієнт».", en: "Name, phone, notes and Telegram will be erased. Visits stay in reports as “Deleted client”." },
    clientDeleteFull: { uk: "Клієнта буде видалено повністю.", en: "The client will be deleted completely." },
    clientDeleted: { uk: "Дані клієнта видалено", en: "Client data deleted" },
    visitEdit: { uk: "Змінити суму", en: "Edit amount" },
    visitEditHint: { uk: "Наприклад, після діагностики додали запчастини чи роботу. Оплати не змінюються.", en: "For example, parts or work added after diagnosis. Payments stay as they are." },
    updateStagePrepare: { uk: "Перевіряємо оновлення…", en: "Checking the update…" },
    updateStageBackup: { uk: "Створюємо резервну копію даних…", en: "Backing up your data…" },
    updateStageDownload: { uk: "Завантажуємо нову версію…", en: "Downloading the new version…" },
    updateStageVerify: { uk: "Перевіряємо цілісність файлу…", en: "Verifying the file…" },
    updateStageInstall: { uk: "Встановлюємо. Застосунок закриється і відкриється знову.", en: "Installing. The app will close and reopen." },
    settingsGeneral: { uk: "Загальні", en: "General" },
    settingsCompany: { uk: "Компанія", en: "Company" },
    settingsData: { uk: "Дані та копії", en: "Data & backups" },
    settingsAbout: { uk: "Про LOMVIKO", en: "About LOMVIKO" },
    settingsHelp: { uk: "Довідка", en: "Help" },
    settingsOpen: { uk: "Відкрити", en: "Open" },
    settingsStatus: { uk: "Стан", en: "Status" },
    settingsExport: { uk: "Експорт", en: "Export" },
    settingsCreate: { uk: "Створити", en: "Create" },
    settingsUpdates: { uk: "Оновлення", en: "Updates" },
    settingsVersion: { uk: "Версія", en: "Version" },
    settingsUpToDate: { uk: "Встановлено останню версію", en: "You have the latest version" },
    appearanceTitle: { uk: "Вигляд", en: "Appearance" },
    appearanceTheme: { uk: "Тема", en: "Theme" },
    appearanceLight: { uk: "Світла", en: "Light" },
    appearanceDark: { uk: "Темна", en: "Dark" },
    appearanceBlocks: { uk: "Розташування блоків", en: "Block layout" },
    appearanceLayout: { uk: "Змінити розташування", en: "Rearrange" },
    apptCompletePay: { uk: "Прийшов і оплатив", en: "Came and paid" },
    apptCompleted: { uk: "Клієнт прийшов, оплату записано", en: "Client came, payment recorded" },
    apptMove: { uk: "Перенести", en: "Reschedule" },
    apptMoved: { uk: "Запис перенесено", en: "Appointment rescheduled" },
    apptMoveResources: { uk: "Оберіть стільки ж спеціалістів, скільки в записі: {n}", en: "Choose as many specialists as the booking has: {n}" },
    apptDue: { uk: "До сплати", en: "Due" },
    apptPaidFull: { uk: "Сплачено повністю", en: "Paid in full" },
    clientCard: { uk: "Картка клієнта", en: "Client card" },
    clientVisits: { uk: "Візити", en: "Visits" },
    clientPaid: { uk: "Сплачено", en: "Paid" },
    clientLast: { uk: "Останній візит", en: "Last visit" },
    clientNext: { uk: "Наступний", en: "Next" },
    clientNoVisits: { uk: "Ще не було візитів", en: "No visits yet" },
    clientInvite: { uk: "Запросити в бот", en: "Invite to bot" },
    financeDue: { uk: "Не оплачено", en: "Unpaid" },
    financeDueHint: { uk: "Завершених візитів без повної оплати", en: "Completed visits not fully paid" },
    accountTitle: { uk: "Акаунт", en: "Account" },
    accountDelete: { uk: "Видалити акаунт", en: "Delete account" },
    accountDeleteOwnerHint: { uk: "Ви власник: видалення акаунта назавжди прибере компанії, команду та всі дані на сервері.", en: "You are the owner: deleting the account permanently removes the companies, team and all server data." },
    accountDeleteMemberHint: { uk: "Видалення прибере лише ваш доступ; дані компанії залишаться у власника.", en: "Deleting removes only your access; company data stays with the owner." },
    accountDeleteOwner: { uk: "Буде назавжди видалено ваш акаунт, усіх співробітників, компанії з клієнтами, записами, платежами, ботом і резервними копіями на сервері. Скасувати неможливо. Перед видаленням можна зробити експорт у «Налаштування та дані».", en: "Your account, all team members, and the companies with clients, appointments, payments, bot and server backups will be deleted permanently. This cannot be undone. You can export your data in Settings before deleting." },
    accountDeleteMember: { uk: "Буде назавжди видалено ваш акаунт, пристрої та сеанси. Дані компанії залишаться у власника. Скасувати неможливо.", en: "Your account, devices and sessions will be deleted permanently. Company data stays with the owner. This cannot be undone." },
    accountDeletePassword: { uk: "Поточний пароль", en: "Current password" },
    accountDeleteConfirm: { uk: "Я розумію, що дані не можна буде відновити", en: "I understand the data cannot be recovered" },
    accountDeleted: { uk: "Акаунт видалено", en: "Account deleted" },
    legalDocumentsHint: {
      uk: "Умови користування сервісом і як LOMVIKO захищає ваші дані й дані ваших клієнтів.",
      en: "The terms of the service and how LOMVIKO protects your data and your clients’ data.",
    },
    privacyPolicy: { uk: "Політика конфіденційності", en: "Privacy policy" },
    registrationPrivacy: {
      uk: "Реєструючись, ви погоджуєтеся з умовами обробки даних:",
      en: "By registering, you agree to how we process data:",
    },
    welcomeTitle: {
      uk: "LOMVIKO — помічник вашого бізнесу",
      en: "LOMVIKO — your business assistant",
    },
    welcomeBody: {
      uk: "Ваш розклад, клієнти й команда в одному місці. Налаштуйте послуги та співробітників, а потім почніть приймати записи.",
      en: "Your schedule, customers and team in one place. Add your services and staff, then start taking appointments.",
    },
    welcomeBookingTitle: {
      uk: "Новий клієнт — одразу в записі",
      en: "New customer? Book them right here.",
    },
    welcomeBookingBody: {
      uk: "Вкажіть телефон та ім’я, оберіть послугу й час. LOMVIKO збереже клієнта разом із візитом і перевірить, чи не зайнятий час.",
      en: "Enter a phone and name, choose a service and time. LOMVIKO saves the customer and appointment together and checks for conflicts.",
    },
    welcomeBotTitle: {
      uk: "Бот — коли будете готові",
      en: "Connect a bot when you are ready",
    },
    welcomeBotBody: {
      uk: "Записуйте клієнтів вручну без Telegram. Пізніше підключіть бота: на нашому сервері або на своєму. Демо включає всі функції.",
      en: "Book customers manually without Telegram. Connect a bot later, hosted by us or on your server. The trial includes every feature.",
    },
    welcomeNext: { uk: "Далі", en: "Next" },
    welcomeDone: { uk: "Почати роботу", en: "Get started" },
    offlineMode: { uk: "Без мережі · перегляд", en: "Offline · view only" },
    sharedBase: { uk: "Спільна база · онлайн", en: "Shared database · online" },
    localBase: { uk: "Локальна база", en: "Local database" },
    botHosting: { uk: "Де працюватиме бот", en: "Bot hosting" },
    botHosted: { uk: "На сервері LOMVIKO", en: "On the LOMVIKO server" },
    botExternal: { uk: "На власному сервері", en: "On your server" },
    botExternalHint: {
      uk: "Завантажте комплект, додайте токен бота на своєму сервері та запустіть Docker Compose. Дані записів залишаються синхронізованими з LOMVIKO.",
      en: "Download the kit, add your bot token on your server and run Docker Compose. Appointments stay synchronized with LOMVIKO.",
    },
    companyLoginUnavailable: {
      uk: "Вхід у компанію ще не налаштовано в цій версії. Зверніться до підтримки.",
      en: "Company sign-in is not set up in this version yet. Contact support.",
    },
    layoutCustomize: { uk: "Налаштувати вигляд", en: "Customize layout" },
    layoutDone: { uk: "Готово", en: "Done" },
    layoutReset: { uk: "Скинути розташування", en: "Reset layout" },
    layoutMove: { uk: "Перемістити", en: "Move" },
    layoutMoveHint: {
      uk: "Перетягніть або використовуйте клавіші зі стрілками",
      en: "Drag or use the arrow keys",
    },
    layoutHelp: {
      uk: "Перетягуйте за ⠿, щоб змінити порядок блоків і пунктів. На ручці також працюють стрілки, Home та End. Escape скасовує перетягування. Час візитів не змінюється.",
      en: "Drag ⠿ to reorder blocks and items. Handles also support arrow keys, Home and End. Escape cancels a drag. Appointment times stay unchanged.",
    },
    layoutSaved: {
      uk: "Розташування збережено на цьому пристрої",
      en: "Layout saved on this device",
    },
    layoutSaveFailed: {
      uk: "Не вдалося зберегти розташування на цьому пристрої",
      en: "Could not save layout on this device",
    },
    layoutResetDone: {
      uk: "Стандартне розташування відновлено",
      en: "Default layout restored",
    },
    scheduleWeek: { uk: "Тиждень розкладу", en: "Schedule week" },
    bookingCount: { uk: "Записів", en: "Bookings" },
    bookingActions: { uk: "Дії із записом", en: "Booking actions" },
    m000: {
      uk: "Підтверджено",
      en: "Confirmed",
    },
    m001: {
      uk: "Завершено",
      en: "Completed",
    },
    m002: {
      uk: "Скасовано",
      en: "Cancelled",
    },
    m003: {
      uk: "Не прийшов",
      en: "No-show",
    },
    m004: {
      uk: "Розклад",
      en: "Schedule",
    },
    m005: {
      uk: "Кожен запис на своєму місці.",
      en: "Every appointment in its place.",
    },
    m006: {
      uk: "Клієнти",
      en: "Clients",
    },
    m007: {
      uk: "Історія взаємин, до якої легко повернутися.",
      en: "Your client relationships at a glance.",
    },
    m008: {
      uk: "Послуги та ресурси",
      en: "Services and resources",
    },
    m009: {
      uk: "Налаштуйте застосунок для свого бізнесу.",
      en: "Set up the app for your business.",
    },
    m010: {
      uk: "Інтеграції",
      en: "Integrations",
    },
    m011: {
      uk: "Менше рутини. Більше часу для клієнтів.",
      en: "Less routine. More time for your clients.",
    },
    m012: {
      uk: "Налаштування та дані",
      en: "Settings and data",
    },
    m013: {
      uk: "Ваш бізнес. Ваші правила. Ваші дані.",
      en: "Your business. Your rules. Your data.",
    },
    m014: {
      uk: "Дашборд",
      en: "Dashboard",
    },
    m015: {
      uk: "Завантаженість, доходи та популярні послуги за вибраний період.",
      en: "Occupancy, income and popular services for the selected period.",
    },
    m016: {
      uk: "Фінансовий звіт",
      en: "Financial report",
    },
    m017: {
      uk: "Вартість візитів, отримані платежі та повернення.",
      en: "Appointment values, payments and refunds.",
    },
    m018: {
      uk: "Користувачі та ролі",
      en: "Users and roles",
    },
    m019: {
      uk: "Головний власник керує доступом до компаній.",
      en: "The main owner manages company access.",
    },
    m020: {
      uk: "● Підключення…",
      en: "● Connecting…",
    },
    m021: {
      uk: "● Без зв’язку · перегляд",
      en: "● Offline · view only",
    },
    m022: {
      uk: "● Спільна база · підключено",
      en: "● Shared database · connected",
    },
    m023: {
      uk: "● Локальна база",
      en: "● Local database",
    },
    m024: {
      uk: "Збережені дані доступні для перегляду. Зв’язок відновиться автоматично.",
      en: "Saved data is available to view. Reconnection is automatic.",
    },
    m025: {
      uk: "Зміни одразу бачать співробітники та бот.",
      en: "Staff and the bot see changes right away.",
    },
    m026: {
      uk: "Працюйте навіть без інтернету. Ваші дані належать вам.",
      en: "Work even without internet. Your data belongs to you.",
    },
    m027: {
      uk: "Підключення до компанії.",
      en: "Connecting to your company.",
    },
    m028: {
      uk: "Немає зв’язку з компанією.",
      en: "Cannot reach your company.",
    },
    m029: {
      uk: "· оновлено",
      en: "· updated",
    },
    m030: {
      uk: "Доступний перегляд збереженого розкладу",
      en: "You can view the saved schedule",
    },
    m031: {
      uk: ". Створення та зміна записів відновляться після підключення. Бот на робочому сервері продовжує приймати записи.",
      en: ". Creating and editing appointments will resume after reconnection. The bot continues taking bookings on a running server.",
    },
    m032: {
      uk: "Спільна база компанії",
      en: "Shared company database",
    },
    m033: {
      uk: "База на вашому пристрої",
      en: "Database on your device",
    },
    m034: {
      uk: "Зміни видно на всіх підключених пристроях.",
      en: "Changes are visible on all connected devices.",
    },
    m035: {
      uk: "Вийти",
      en: "Sign out",
    },
    m036: {
      uk: "Увійти",
      en: "Sign in",
    },
    m037: {
      uk: "Логотип компанії",
      en: "Company logo",
    },
    m038: {
      uk: "Зберегти профіль",
      en: "Save profile",
    },
    m039: {
      uk: "Логотип",
      en: "Logo",
    },
    m040: {
      uk: "Телефон компанії",
      en: "Business phone",
    },
    m041: {
      uk: "Валюта · UAH, EUR, USD",
      en: "Currency · UAH, EUR, USD",
    },
    m042: {
      uk: "Адреса",
      en: "Address",
    },
    m043: {
      uk: "Часовий пояс",
      en: "Time zone",
    },
    m044: {
      uk: "Початок робочого дня",
      en: "Opening time",
    },
    m045: {
      uk: "Кінець робочого дня",
      en: "Closing time",
    },
    m046: {
      uk: "Пн",
      en: "Mon",
    },
    m047: {
      uk: "Вт",
      en: "Tue",
    },
    m048: {
      uk: "Ср",
      en: "Wed",
    },
    m049: {
      uk: "Чт",
      en: "Thu",
    },
    m050: {
      uk: "Пт",
      en: "Fri",
    },
    m051: {
      uk: "Сб",
      en: "Sat",
    },
    m052: {
      uk: "Нд",
      en: "Sun",
    },
    m053: {
      uk: "Вибрати логотип",
      en: "Choose logo",
    },
    m054: {
      uk: "PNG/JPEG · до 2 МБ",
      en: "PNG/JPEG · up to 2 MB",
    },
    m055: {
      uk: "Робочі дні для онлайн-запису",
      en: "Working days for online booking",
    },
    m056: {
      uk: "Увімкнути API запису для сайту",
      en: "Enable website booking API",
    },
    m057: {
      uk: "Без сайту залиште вимкненим. API працює в серверному режимі; послуги публікуються окремо.",
      en: "Leave off if you have no website. The API works in server mode; publish services separately.",
    },
    m058: {
      uk: "Вітаємо в LOMVIKO",
      en: "Welcome to LOMVIKO",
    },
    m059: {
      uk: "Компанію вже створив адміністратор? Увійдіть за логіном і паролем. Для власного бізнесу заповніть профіль нижче.",
      en: "Company already set up by your administrator? Sign in. To run your own business, fill in the profile below.",
    },
    m060: {
      uk: "Увійти в готову компанію",
      en: "Sign in to an existing company",
    },
    m061: {
      uk: "Назва компанії",
      en: "Company name",
    },
    m062: {
      uk: "Моя компанія",
      en: "My company",
    },
    m063: {
      uk: "Тип бізнесу",
      en: "Business type",
    },
    m064: {
      uk: "Б’юті та послуги",
      en: "Beauty and services",
    },
    m065: {
      uk: "СТО та автосервіс",
      en: "Vehicle repair and service",
    },
    m066: {
      uk: "Інший бізнес",
      en: "Other business",
    },
    m067: {
      uk: "Компанію налаштовано. Додайте послуги та спеціалістів.",
      en: "Company configured. Add services and specialists.",
    },
    m068: {
      uk: "Створити свою компанію",
      en: "Create your company",
    },
    m069: {
      uk: "День",
      en: "Day",
    },
    m070: {
      uk: "Місяць",
      en: "Month",
    },
    m071: {
      uk: "Рік",
      en: "Year",
    },
    m072: {
      uk: "Період",
      en: "Period",
    },
    m073: {
      uk: "Завантаженість",
      en: "Occupancy",
    },
    m074: {
      uk: "год зайнято /",
      en: "h booked /",
    },
    m075: {
      uk: "год доступно",
      en: "h available",
    },
    m076: {
      uk: "Записи",
      en: "Bookings",
    },
    m077: {
      uk: "учасників",
      en: "participants",
    },
    m078: {
      uk: "Дохід",
      en: "Income",
    },
    m079: {
      uk: "Платежі",
      en: "Payments",
    },
    m080: {
      uk: "· повернення",
      en: "· refunds",
    },
    m081: {
      uk: "Популярна послуга",
      en: "Most popular service",
    },
    m082: {
      uk: "Немає записів",
      en: "No bookings",
    },
    m083: {
      uk: "записів ·",
      en: "bookings ·",
    },
    m084: {
      uk: "Виберіть інший період",
      en: "Choose another period",
    },
    m085: {
      uk: "годинами",
      en: "hour",
    },
    m086: {
      uk: "днями",
      en: "day",
    },
    m087: {
      uk: "місяцями",
      en: "month",
    },
    m088: {
      uk: "Завантаженість у відсотках",
      en: "Occupancy percentage",
    },
    m089: {
      uk: "Платежі за вирахуванням повернень",
      en: "Payments minus refunds",
    },
    m090: {
      uk: "Дохід за",
      en: "Income by",
    },
    m091: {
      uk: "Послуга",
      en: "Service",
    },
    m092: {
      uk: "Записи",
      en: "Bookings",
    },
    m093: {
      uk: "Учасники",
      en: "Participants",
    },
    m094: {
      uk: "Частка записів",
      en: "Booking share",
    },
    m095: {
      uk: "Немає записів за період",
      en: "No bookings in this period",
    },
    m096: {
      uk: "Після створення записів тут з’явиться рейтинг послуг.",
      en: "The service ranking will appear once bookings are created.",
    },
    m097: {
      uk: "Дохід",
      en: "Income",
    },
    m098: {
      uk: "Дохід — фактичні платежі за вирахуванням повернень за датою платежу; це не прибуток.",
      en: "Income is actual payments minus refunds by payment date; it is not profit.",
    },
    m099: {
      uk: "Завантаженість за",
      en: "Occupancy by",
    },
    m100: {
      uk: "Популярні послуги",
      en: "Popular services",
    },
    m101: {
      uk: "За кількістю записів за період",
      en: "By bookings in this period",
    },
    m102: {
      uk: "Показники за періодами",
      en: "Period breakdown",
    },
    m103: {
      uk: "Період",
      en: "Period",
    },
    m104: {
      uk: "Завантаженість",
      en: "Occupancy",
    },
    m105: {
      uk: "Завантаженість — зайнятий час співробітників і постів у робочі години за поточним графіком компанії. Кілька ресурсів враховуються окремо. Записи та популярність рахуються за датою візиту; скасування й неявки виключені.",
      en: "Occupancy is booked staff and bay time within the current business schedule. Each reserved resource is counted separately. Bookings and popularity use appointment dates; cancellations and no-shows are excluded.",
    },
    m106: {
      uk: "Недостатньо прав",
      en: "Insufficient permissions",
    },
    m107: {
      uk: "Фінансовий звіт доступний власнику та адміністратору.",
      en: "The financial report is available to owners and administrators.",
    },
    m108: {
      uk: "Вартість візитів",
      en: "Appointment value",
    },
    m109: {
      uk: "Збережена на момент запису",
      en: "Fixed when booked",
    },
    m110: {
      uk: "Отримано з урахуванням повернень",
      en: "Received after refunds",
    },
    m111: {
      uk: "За датою фактичного платежу",
      en: "By actual payment date",
    },
    m112: {
      uk: "Витрати завершених візитів",
      en: "Completed appointment costs",
    },
    m113: {
      uk: "За датою запису",
      en: "By appointment date",
    },
    m114: {
      uk: "Платежі мінус витрати",
      en: "Payments minus costs",
    },
    m115: {
      uk: "Управлінська оцінка",
      en: "Management estimate",
    },
    m116: {
      uk: "Готівка",
      en: "Cash",
    },
    m117: {
      uk: "Картка",
      en: "Card",
    },
    m118: {
      uk: "Переказ",
      en: "Transfer",
    },
    m119: {
      uk: "Повернення",
      en: "Refund",
    },
    m120: {
      uk: "Дата",
      en: "Date",
    },
    m121: {
      uk: "Сума",
      en: "Amount",
    },
    m122: {
      uk: "Спосіб",
      en: "Method",
    },
    m123: {
      uk: "Платежів поки немає",
      en: "No payments yet",
    },
    m124: {
      uk: "У розкладі натисніть «Оплата» біля потрібного запису. Вартість послуги й отриманий платіж враховуються окремо.",
      en: "Select Payment next to the appointment in your schedule. Service value and payments are tracked separately.",
    },
    m125: {
      uk: "Місяць звіту",
      en: "Report month",
    },
    m126: {
      uk: "Платежі та повернення",
      en: "Payments and refunds",
    },
    m127: {
      uk: "Це управлінський звіт. Податки та фіскальні чеки тут не розраховуються. Повернення — окрема від’ємна операція; зміна ціни послуги не змінює вже створені візити.",
      en: "This is a management report. It does not calculate taxes or issue fiscal receipts. Refunds are separate negative transactions; price changes do not alter existing appointments.",
    },
    m128: {
      uk: "Увійдіть у спільну компанію",
      en: "Sign in to a shared company",
    },
    m129: {
      uk: "Користувачами керує головний власник компанії на сервері.",
      en: "The main company owner manages users on the server.",
    },
    m130: {
      uk: "Головний власник",
      en: "Main owner",
    },
    m131: {
      uk: "Адміністратор",
      en: "Administrator",
    },
    m132: {
      uk: "Співробітник",
      en: "Staff member",
    },
    m133: {
      uk: "＋ Ще один бізнес",
      en: "＋ Another business",
    },
    m134: {
      uk: "＋ Користувач",
      en: "＋ User",
    },
    m135: {
      uk: "Вимкнено",
      en: "Disabled",
    },
    m136: {
      uk: "Доступний",
      en: "Enabled",
    },
    m137: {
      uk: "Керувати",
      en: "Manage",
    },
    m138: {
      uk: "Ваш акаунт",
      en: "Your account",
    },
    m139: {
      uk: "Користувач",
      en: "User",
    },
    m140: {
      uk: "Роль",
      en: "Role",
    },
    m141: {
      uk: "Статус",
      en: "Status",
    },
    m142: {
      uk: "Дії",
      en: "Actions",
    },
    m143: {
      uk: "Завантажте користувачів",
      en: "Load users",
    },
    m144: {
      uk: "Натисніть «Оновити список», щоб отримати поточні ролі.",
      en: "Select Refresh list to load current roles.",
    },
    m145: {
      uk: "Оновити список",
      en: "Refresh list",
    },
    m146: {
      uk: "Доступом керує власник",
      en: "Access is managed by the owner",
    },
    m147: {
      uk: "Адміністратор керує послугами, фінансами й інтеграціями. Співробітник працює з клієнтами та записами.",
      en: "Administrators manage services, finances and integrations. Staff manage clients and bookings.",
    },
    m148: {
      uk: "Ваша роль:",
      en: "Your role:",
    },
    m149: {
      uk: "Вхід виконано",
      en: "Signed in",
    },
    m150: {
      uk: "Локальний режим",
      en: "Local mode",
    },
    m152: {
      uk: "Збірка для оцінювання. Комерційний захист вмикається зі штатним ключем видавця.",
      en: "Evaluation build. Commercial protection is enabled with the publisher trust key.",
    },
    m153: {
      uk: "Акаунт і підключення",
      en: "Account and connection",
    },
    m154: {
      uk: "Вхід за логіном і паролем завантажує компанію, права та спільну базу із сервера. Видавець враховує користувача, пристрої й час зв’язку. Токени інтеграцій недоступні інтерфейсу.",
      en: "Signing in loads your company, permissions and shared database. The publisher tracks users, devices and connection times. Integration tokens are not exposed to the interface.",
    },
    m155: {
      uk: "Увійти в компанію",
      en: "Sign in to company",
    },
    m156: {
      uk: "Резервне підключення за запрошенням",
      en: "Alternative connection by invitation",
    },
    m157: {
      uk: "Записи на день",
      en: "Bookings for the day",
    },
    m158: {
      uk: "У розкладі",
      en: "In the schedule",
    },
    bookingPhoneExists: {
      uk: "Цей телефон уже є в базі. Оберіть клієнта зі списку підказок.",
      en: "This phone is already in your contacts. Choose the client from the suggestions.",
    },
    bookingClientMissing: {
      uk: "Клієнта не знайдено. Оновіть список і оберіть знову.",
      en: "Client not found. Refresh the list and choose again.",
    },
    bookingClientSearch: {
      uk: "Клієнт — введіть ім’я або знайдіть за телефоном",
      en: "Client — enter a name or search by phone",
    },
    bookingClientPhone: {
      uk: "Телефон клієнта",
      en: "Client phone",
    },
    bookingClientHint: {
      uk: "Оберіть знайомого клієнта з підказок. Для нового просто введіть ім’я: збережемо його разом із записом.",
      en: "Pick a returning client from the suggestions. For someone new, just enter a name: we will save them with the booking.",
    },
    bookingClientRequired: {
      uk: "Введіть ім’я нового клієнта або оберіть наявного.",
      en: "Enter a new client name or choose an existing client.",
    },
    bookingClientRemove: { uk: "Прибрати з запису", en: "Remove from booking" },
    bookingSetupRequired: {
      uk: "Спочатку додайте послугу та співробітника або ресурс.",
      en: "Add a service and staff member or resource first.",
    },
    catalogResourceMissing: {
      uk: "Співробітника або ресурс не знайдено",
      en: "Staff member or resource not found",
    },
    m159: {
      uk: "Вартість записів",
      en: "Booking value",
    },
    m160: {
      uk: "Сума послуг за день",
      en: "Total service value for the day",
    },
    m161: {
      uk: "Завершено",
      en: "Completed",
    },
    m162: {
      uk: "Візити за вибраний день",
      en: "Appointments on the selected day",
    },
    m163: {
      uk: "У вашій клієнтській базі",
      en: "In your client database",
    },
    m164: {
      uk: "Пост / майстер",
      en: "Bay / specialist",
    },
    m165: {
      uk: "Спеціаліст",
      en: "Specialist",
    },
    m166: {
      uk: "Оплата / повернення",
      en: "Payment / refund",
    },
    m167: {
      uk: "Прийшов",
      en: "Came",
    },
    m168: {
      uk: "Скасувати",
      en: "Cancel",
    },
    m169: {
      uk: "до",
      en: "until",
    },
    m170: {
      uk: "Час",
      en: "Time",
    },
    m171: {
      uk: "Клієнт / послуга",
      en: "Client / service",
    },
    m172: {
      uk: "День відкритий для нових записів",
      en: "This day is open for bookings",
    },
    m173: {
      uk: "Додайте клієнта, послугу та спеціаліста — створіть перший запис.",
      en: "Add a client, service and specialist to create your first booking.",
    },
    m174: {
      uk: "＋ Додати запис",
      en: "＋ Add booking",
    },
    m175: {
      uk: "підключено",
      en: "connected",
    },
    m176: {
      uk: "не підключено",
      en: "not connected",
    },
    m177: {
      uk: "Остання копія:",
      en: "Last backup:",
    },
    m178: {
      uk: "Резервне копіювання ще не налаштовано.",
      en: "Backups are not configured yet.",
    },
    m179: {
      uk: "Бот працює на сервері компанії.",
      en: "The bot runs on your company server.",
    },
    m180: {
      uk: "Для локального бота застосунок має бути відкритим.",
      en: "The app must stay open for the local bot.",
    },
    m181: {
      uk: "Попередній день",
      en: "Previous day",
    },
    m182: {
      uk: "Дата розкладу",
      en: "Schedule date",
    },
    m183: {
      uk: "Наступний день",
      en: "Next day",
    },
    m184: {
      uk: "Усе під контролем",
      en: "Everything under control",
    },
    m185: {
      uk: "Локальна база доступна",
      en: "Local database available",
    },
    m186: {
      uk: "Налаштувати інтеграції ↗",
      en: "Set up integrations ↗",
    },
    m187: {
      uk: "Менше пропущених візитів",
      en: "Fewer missed appointments",
    },
    m188: {
      uk: "Бот нагадає клієнтам про запис за 24 години та за 2 години.",
      en: "The bot reminds clients 24 hours and 2 hours before their appointment.",
    },
    m189: {
      uk: "Підключено",
      en: "Connected",
    },
    m190: {
      uk: "Посилання підключення",
      en: "Connection link",
    },
    m191: {
      uk: "Клієнт",
      en: "Client",
    },
    m192: {
      uk: "Телефон",
      en: "Phone",
    },
    m193: {
      uk: "Нічого не знайдено",
      en: "No results",
    },
    m194: {
      uk: "Тут будуть ваші клієнти",
      en: "Your clients will appear here",
    },
    m195: {
      uk: "Додайте клієнта вручну або підключіть бота: нові клієнти з’являться після згоди на обробку даних.",
      en: "Add clients manually or connect the bot. New clients appear after giving consent.",
    },
    m196: {
      uk: "Пошук за ім’ям або телефоном",
      en: "Search by name or phone",
    },
    m197: {
      uk: "＋ Додати клієнта",
      en: "＋ Add client",
    },
    m198: {
      uk: "видима",
      en: "visible",
    },
    m199: {
      uk: "прихована",
      en: "hidden",
    },
    m200: {
      uk: "хв · до",
      en: "min · up to",
    },
    m201: {
      uk: "учасників ·",
      en: "participants ·",
    },
    m202: {
      uk: "ресурсів",
      en: "resources",
    },
    m203: {
      uk: "Бот:",
      en: "Bot:",
    },
    m204: {
      uk: "· Сайт:",
      en: "· Website:",
    },
    m205: {
      uk: "/ особу",
      en: "/ person",
    },
    m206: {
      uk: "Змінити",
      en: "Edit",
    },
    m207: {
      uk: "Додайте першу послугу",
      en: "Add your first service",
    },
    m208: {
      uk: "Укажіть тривалість, ціну на учасника та доступність для запису.",
      en: "Set the duration, price per participant and booking channels.",
    },
    m209: {
      uk: "Пости та майстри",
      en: "Bays and specialists",
    },
    m210: {
      uk: "Спеціалісти та ресурси",
      en: "Specialists and resources",
    },
    m211: {
      uk: "Хто або де надає послугу?",
      en: "Who provides the service, and where?",
    },
    m212: {
      uk: "Створіть спеціалістів, кабінети або пости. В одному записі можна зарезервувати кілька ресурсів.",
      en: "Add specialists, rooms or bays. A booking can reserve multiple resources.",
    },
    m213: {
      uk: "Послуги",
      en: "Services",
    },
    m214: {
      uk: "＋ Послуга",
      en: "＋ Service",
    },
    m215: {
      uk: "＋ Ресурс",
      en: "＋ Resource",
    },
    m216: {
      uk: "Бот читає актуальні послуги при виборі. Нова ціна або назва доступні для нових записів; старі візити зберігають вартість. Робочі години та дні задаються у профілі. Додаткові вільні ресурси бот підбирає автоматично.",
      en: "The bot reads the current service list. Changes apply to new bookings; existing visits retain their value. Set working hours and days in your profile. The bot assigns additional free resources automatically.",
    },
    m217: {
      uk: "Не підключено",
      en: "Not connected",
    },
    m218: {
      uk: "Скопіюйте посилання для нових клієнтів. Для наявних використовуйте персональне посилання з розділу «Клієнти».",
      en: "Copy this link for new clients. For existing clients, use their personal link in Clients.",
    },
    m219: {
      uk: "Перевірити бота",
      en: "Check bot",
    },
    m220: {
      uk: "Замінити токен",
      en: "Replace token",
    },
    m221: {
      uk: "Відключити",
      en: "Disconnect",
    },
    m222: {
      uk: "Підключити бота",
      en: "Connect bot",
    },
    m223: {
      uk: "На сервері він зберігається зашифрованим.",
      en: "It is stored encrypted on the server.",
    },
    m224: {
      uk: "На комп’ютері він зберігається у захищеному сховищі ОС.",
      en: "It is stored in the OS secure storage on your computer.",
    },
    m225: {
      uk: "Збережених копій ще немає.",
      en: "No backups saved yet.",
    },
    m226: {
      uk: "Зберегти зараз",
      en: "Back up now",
    },
    m227: {
      uk: "Зберегти ключ відновлення",
      en: "Save recovery key",
    },
    m228: {
      uk: "Очікуємо входу в Google…",
      en: "Waiting for Google sign-in…",
    },
    m229: {
      uk: "Увійти через Google",
      en: "Sign in with Google",
    },
    m230: {
      uk: "Скасувати вхід",
      en: "Cancel sign-in",
    },
    m231: {
      uk: "Натисніть кнопку та надайте доступ у браузері. Після підключення збережіть ключ відновлення копій.",
      en: "Select the button and grant access in your browser. Save your recovery key after connecting.",
    },
    m232: {
      uk: "Підключення Google ще не налаштоване видавцем застосунку.",
      en: "Google connection has not been configured by the publisher yet.",
    },
    m233: {
      uk: "Увімкнено",
      en: "Enabled",
    },
    m234: {
      uk: "Вимкнено",
      en: "Disabled",
    },
    m235: {
      uk: "API для сайту",
      en: "Website API",
    },
    m236: {
      uk: "Вмикається у профілі компанії. Публікуйте послуги для сайту окремо від Telegram. Сервер сайту отримує каталог і вільний час, а потім створює запис.",
      en: "Enable it in the company profile. Publish website services separately from Telegram. Your website server loads services and availability, then creates a booking.",
    },
    m237: {
      uk: "Записи та послуги спільні для всієї команди і бота. Бот і сторінка запису працюють цілодобово на сервері LOMVIKO. Копію бази можна скачати в «Налаштування та дані».",
      en: "Your team and the bot share bookings and services. The bot and the booking page run around the clock on the LOMVIKO server. Download a copy of your data in Settings.",
    },
    m238: {
      uk: "У локальному режимі бот працює лише з відкритим застосунком. Для спільної бази й серверного бота увійдіть за логіном і паролем.",
      en: "The local bot requires the app to stay open. Sign in for a shared database and a server bot.",
    },
    m239: {
      uk: "Telegram-бот",
      en: "Telegram bot",
    },
    m240: {
      uk: "Клієнт вибирає послугу, спеціаліста й вільний час. Отримує нагадування та може скасувати запис.",
      en: "Clients choose a service, specialist and available time. They receive reminders and can cancel bookings.",
    },
    m241: {
      uk: "Стан:",
      en: "Status:",
    },
    m242: {
      uk: "Токен від BotFather вводиться один раз.",
      en: "Enter your BotFather token once.",
    },
    m243: {
      uk: "Бот має бути виділений цій CRM. Клієнт сам запускає бота й дає згоду.",
      en: "Use a dedicated bot for this CRM. Clients start the bot and give consent themselves.",
    },
    m246: {
      uk: "Копії не містять токенів.",
      en: "Backups do not include tokens.",
    },
    m248: {
      uk: "Уся база · JSON",
      en: "Full database · JSON",
    },
    m249: {
      uk: "Усі таблиці · CSV",
      en: "All tables · CSV",
    },
    m250: {
      uk: "Зашифрована копія",
      en: "Encrypted backup",
    },
    m251: {
      uk: "Відновити локальну копію",
      en: "Restore local backup",
    },
    m252: {
      uk: "Повний експорт доступний власнику та адміністратору.",
      en: "Full export is available to owners and administrators.",
    },
    m253: {
      uk: "У збірці налаштований довірений ключ видавця.",
      en: "The publisher trust key is configured in this build.",
    },
    m254: {
      uk: "Збірка для оцінювання: комерційне блокування вимкнене. Для випуску задайте публічний ключ сервера.",
      en: "Evaluation build: commercial enforcement is off. Configure the server public key for release.",
    },
    m255: {
      uk: "Спільна серверна база",
      en: "Shared server database",
    },
    m256: {
      uk: "Локальна база",
      en: "Local database",
    },
    m257: {
      uk: "Компанія, команда і бот працюють з однією базою на сервері. Відкривайте LOMVIKO з будь-якого комп’ютера чи телефона.",
      en: "Your company, team and bot share one server database. Open LOMVIKO from any computer or phone.",
    },
    m258: {
      uk: "Локальний режим працює на одному комп’ютері. Для співробітників і кількох пристроїв увійдіть у серверну компанію.",
      en: "Local mode runs on one computer. Sign in to a server company for staff and multiple devices.",
    },
    m259: {
      uk: "Профіль компанії",
      en: "Company profile",
    },
    m260: {
      uk: "Назва",
      en: "Name",
    },
    m261: {
      uk: "Експорт і резервні копії",
      en: "Export and backups",
    },
    m262: {
      uk: "Повна база вибраної компанії: клієнти, учасники візитів, ресурси, ціни, платежі та журнал дій.",
      en: "The full company database: clients, participants, resources, prices, payments and activity log.",
    },
    m263: {
      uk: "JSON і CSV містять персональні дані відкритим текстом. Копія .orbit захищена паролем. Відновлення з копії робить служба підтримки LOMVIKO.",
      en: "JSON and CSV contain personal data in plain text. The .orbit backup is password protected. LOMVIKO support restores data from a backup.",
    },
    m265: {
      uk: "Зареєструйтеся й користуйтеся всім безкоштовно до 1 березня 2027 або увійдіть. Якщо отримали одноразовий ключ, активуйте його нижче.",
      en: "Register and use every feature free until 1 March 2027, or sign in. If you received a one-time key, activate it below.",
    },
    m266: {
      uk: "Увійти за логіном",
      en: "Sign in",
    },
    m267: {
      uk: "Увести ключ",
      en: "Enter key",
    },
    m268: {
      uk: "ID пристрою",
      en: "Device ID",
    },
    m269: {
      uk: "Зберігання даних",
      en: "Data storage",
    },
    m271: {
      uk: "Зберегти",
      en: "Save",
    },
    m272: {
      uk: "Спочатку додайте клієнта, послугу та ресурс у відповідних розділах.",
      en: "First add a client, service and resource in their sections.",
    },
    m273: {
      uk: "Новий запис",
      en: "New booking",
    },
    m274: {
      uk: "Клієнти · можна вибрати кількох",
      en: "Clients · multiple selection",
    },
    m275: {
      uk: "Послуга",
      en: "Service",
    },
    m276: {
      uk: "Спеціалісти / пости · кілька одночасно",
      en: "Specialists / bays · multiple selection",
    },
    m277: {
      uk: "Дата та час запису",
      en: "Appointment date and time",
    },
    m278: {
      uk: "Часовий пояс:",
      en: "Time zone:",
    },
    m279: {
      uk: "Кількість людей",
      en: "Number of people",
    },
    m280: {
      uk: "Повна вартість візиту",
      en: "Total appointment value",
    },
    m281: {
      uk: "Додаткові витрати на візит",
      en: "Extra costs of the visit",
    },
    m282: {
      uk: "Коментар",
      en: "Notes",
    },
    m283: {
      uk: "Запис створено",
      en: "Booking created",
    },
    m285: {
      uk: "Не вдалося визначити час",
      en: "Could not determine the time",
    },
    m286: {
      uk: "Тривалість, хвилин",
      en: "Duration in minutes",
    },
    m287: {
      uk: "Ціна на учасника",
      en: "Price per participant",
    },
    m288: {
      uk: "Максимум учасників",
      en: "Maximum participants",
    },
    m289: {
      uk: "Потрібна кількість ресурсів",
      en: "Required resource count",
    },
    m290: {
      uk: "Показувати в Telegram-боті",
      en: "Show in the Telegram bot",
    },
    m291: {
      uk: "Показувати на сторінці онлайн-запису і на сайті",
      en: "Show on the online booking page and the website",
    },
    m292: {
      uk: "Сервер компанії",
      en: "Company server",
    },
    m293: {
      uk: "Увійти до своєї компанії",
      en: "Sign in to your company",
    },
    m294: {
      uk: "Логін · email",
      en: "Login · email",
    },
    m295: {
      uk: "Пароль",
      en: "Password",
    },
    m296: {
      uk: "Увійдіть email і паролем. Вхід зберігається в цьому браузері на 7 днів.",
      en: "Sign in with your email and password. This browser stays signed in for 7 days.",
    },
    m297: {
      uk: "У цій тестовій збірці адресу компанії ще не задав видавець.",
      en: "The publisher has not configured a company address in this test build yet.",
    },
    m298: {
      uk: "Вхід виконано. Можна працювати.",
      en: "Signed in. Ready to work.",
    },
    m299: {
      uk: "Змінити послугу",
      en: "Edit service",
    },
    m300: {
      uk: "Оплата або повернення",
      en: "Payment or refund",
    },
    m301: {
      uk: "Сума · повернення зі знаком мінус",
      en: "Amount · negative for a refund",
    },
    m302: {
      uk: "Спосіб",
      en: "Method",
    },
    m303: {
      uk: "Додати користувача",
      en: "Add user",
    },
    m304: {
      uk: "Ім’я",
      en: "Name",
    },
    m305: {
      uk: "Початковий пароль",
      en: "Initial password",
    },
    m306: {
      uk: "Роль",
      en: "Role",
    },
    m307: {
      uk: "Доступ користувача",
      en: "User access",
    },
    m308: {
      uk: "Доступ",
      en: "Access",
    },
    m309: {
      uk: "Дозволено",
      en: "Allowed",
    },
    m310: {
      uk: "Новий пароль · необов’язково",
      en: "New password · optional",
    },
    m311: {
      uk: "Ще один бізнес",
      en: "Another business",
    },
    m312: {
      uk: "Компанію створено. Налаштуйте послуги та профіль.",
      en: "Company created. Configure services and your profile.",
    },
    m313: {
      uk: "Бот @",
      en: "Bot @",
    },
    m314: {
      uk: "відповідає на getMe. Для перевірки запису клієнт має надіслати /start.",
      en: "responds to getMe. A client should send /start to test booking.",
    },
    m315: {
      uk: "Обліковий запис LOMVIKO",
      en: "Connect to the LOMVIKO account",
    },
    m316: {
      uk: "Адреса сервера видавця",
      en: "Publisher server address",
    },
    m317: {
      uk: "Код запрошення",
      en: "Invitation code",
    },
    m318: {
      uk: "Натискаючи «Підключити», ви реєструєте пристрій у видавця. Передаються ключ пристрою, ОС, версія та час зв’язку. Записи клієнтів, Google і Telegram-токени не передаються.",
      en: "Connecting registers this device with the publisher. Its key, OS, version and connection time are shared. Client bookings and Google or Telegram tokens are not sent.",
    },
    m319: {
      uk: "Пристрій зареєстровано у видавця",
      en: "Device registered with the publisher",
    },
    m320: {
      uk: "Підключити",
      en: "Connect",
    },
    m321: {
      uk: "Додати клієнта",
      en: "Add client",
    },
    m322: {
      uk: "Телефон",
      en: "Phone",
    },
    m323: {
      uk: "Примітка / автомобіль",
      en: "Notes / vehicle",
    },
    m324: {
      uk: "Додати послугу",
      en: "Add service",
    },
    m325: {
      uk: "Додати ресурс",
      en: "Add resource",
    },
    m326: {
      uk: "Ім’я спеціаліста або назва поста",
      en: "Specialist name or bay name",
    },
    m327: {
      uk: "Підключити Telegram-бота",
      en: "Connect Telegram bot",
    },
    m328: {
      uk: "Створіть окремого бота через @BotFather і вставте токен. Після збереження він не показуватиметься.",
      en: "Create a dedicated bot with @BotFather and paste its token. It is hidden after saving.",
    },
    m329: {
      uk: "Токен бота",
      en: "Bot token",
    },
    m330: {
      uk: "Бота підключено. Нові записи перевіряються кожні 10 секунд.",
      en: "Bot connected. New updates are checked every 10 seconds.",
    },
    m331: {
      uk: "Бота відключено від цієї CRM",
      en: "Bot disconnected from this CRM",
    },
    m333: {
      uk: "Резервні копії зберігатимуться на підключеному диску. Збережіть ключ відновлення окремо від застосунку: він потрібен на іншому комп’ютері.",
      en: "Backups will be saved to the connected Drive. Save the recovery key separately; it is required on another computer.",
    },
    m334: {
      uk: "Ключ відновлення",
      en: "Recovery key",
    },
    m335: {
      uk: "Зберегти ключ у файл",
      en: "Save key to file",
    },
    m336: {
      uk: "Готово",
      en: "Done",
    },
    m337: {
      uk: "Ключ збережено. Зберігайте його окремо від застосунку.",
      en: "Key saved. Keep it separate from the app.",
    },
    m339: {
      uk: "Копію збережено",
      en: "Backup saved",
    },
    m340: {
      uk: "Drive відключено. Дозвіл можна відкликати в акаунті Google.",
      en: "Drive disconnected. You can revoke access in your Google account.",
    },
    m341: {
      uk: "Повну базу експортовано",
      en: "Full database exported",
    },
    m342: {
      uk: "Усі таблиці експортовано",
      en: "All tables exported",
    },
    m343: {
      uk: "Пароль копії",
      en: "Backup password",
    },
    m344: {
      uk: "Зберігайте пароль окремо: відновлення без нього неможливе.",
      en: "Keep the password separately; recovery is impossible without it.",
    },
    m345: {
      uk: "Зберегти копію",
      en: "Save backup",
    },
    m346: {
      uk: "Відновити базу",
      en: "Restore database",
    },
    m347: {
      uk: "Пароль або ключ відновлення",
      en: "Password or recovery key",
    },
    m349: {
      uk: "Базу відновлено",
      en: "Database restored",
    },
    m350: {
      uk: "Вибрати копію",
      en: "Choose backup",
    },
    m354: {
      uk: "Активувати",
      en: "Activate",
    },
    m355: {
      uk: "Підключити наявного клієнта",
      en: "Link an existing client",
    },
    m356: {
      uk: "Персональне посилання",
      en: "Personal link",
    },
    m357: {
      uk: "Передайте посилання цьому клієнту. Він запустить бота й погодиться на сповіщення. Нове посилання скасовує попереднє.",
      en: "Send this link to the client. They will start the bot and consent to notifications. A new link invalidates the previous one.",
    },
    m358: {
      uk: "Скасувати запис?",
      en: "Cancel this booking?",
    },
    m359: {
      uk: "Запис буде скасовано, час стане доступним для інших клієнтів.",
      en: "The booking will be cancelled and the time will become available.",
    },
    m360: {
      uk: "Скасувати запис",
      en: "Cancel booking",
    },
    m361: {
      uk: "Налаштування збережено",
      en: "Settings saved",
    },
    m362: {
      uk: "Для змін дочекайтеся підключення до компанії.",
      en: "Wait for reconnection to make changes.",
    },
    m363: {
      uk: "Новий контакт",
      en: "New contact",
    },
    m364: {
      uk: "Пробний період",
      en: "Trial",
    },
    m365: {
      uk: "Активний",
      en: "Active",
    },
    m366: {
      uk: "Призупинено",
      en: "Suspended",
    },
    m367: {
      uk: "Користувача додано",
      en: "User added",
    },
    m368: {
      uk: "Умови оновлено",
      en: "Terms updated",
    },
    m369: {
      uk: "Запрошення видано",
      en: "Invitation issued",
    },
    m370: {
      uk: "Пристрій активовано",
      en: "Device activated",
    },
    m371: {
      uk: "Пристрій вимкнено",
      en: "Device disabled",
    },
    m372: { uk: "Скачування (архів)", en: "Download (archive)" },
    m373: {
      uk: "Файл передано",
      en: "File delivered",
    },
    m374: {
      uk: "Завантаження перервано",
      en: "Download interrupted",
    },
    m375: {
      uk: "Огляд",
      en: "Overview",
    },
    m376: {
      uk: "Хто користується LOMVIKO і як зростає продукт.",
      en: "Who uses LOMVIKO and how your product grows.",
    },
    m377: {
      uk: "Користувачі",
      en: "Users",
    },
    m378: {
      uk: "Компанії, контакти й умови доступу.",
      en: "Companies, contacts and access terms.",
    },
    m379: { uk: "Пристрої", en: "Devices" },
    m380: { uk: "Браузери й телефони, з яких входять у LOMVIKO, і останній вхід.", en: "Browsers and phones used to sign in to LOMVIKO, with the last sign-in." },
    m381: {
      uk: "Завантаження",
      en: "Downloads",
    },
    m382: { uk: "Архів подій скачування.", en: "Archived download events." },
    m383: {
      uk: "Сервер і експорт",
      en: "Server and export",
    },
    m384: {
      uk: "Центральна база продукту під вашим контролем.",
      en: "The central product database under your control.",
    },
    m385: {
      uk: "Компанії та налаштування",
      en: "Companies and setup",
    },
    m386: {
      uk: "Підготуйте профіль, послуги й ресурси до першого входу клієнта.",
      en: "Prepare the profile, services and resources before the client signs in.",
    },
    m387: {
      uk: "Пароль змінено",
      en: "Password changed",
    },
    m388: {
      uk: "Компанію створено",
      en: "Company created",
    },
    m389: {
      uk: "Вхід у застосунок",
      en: "App sign-in",
    },
    m390: {
      uk: "Користувачі та події з’являться після видачі запрошень і підключення застосунків до сервера.",
      en: "Users and events appear after invitations and app connections.",
    },
    m391: {
      uk: "Термін сплив",
      en: "Expired",
    },
    m392: {
      uk: "передач файлу",
      en: "file deliveries",
    },
    m393: {
      uk: "Запросити",
      en: "Invite",
    },
    m394: {
      uk: "Умови",
      en: "Terms",
    },
    m395: {
      uk: "Користувач / компанія",
      en: "User / company",
    },
    m396: {
      uk: "Доступ до",
      en: "Access until",
    },
    m397: {
      uk: "Пристрої",
      en: "Devices",
    },
    m398: {
      uk: "Користувачів поки немає",
      en: "No users yet",
    },
    m399: {
      uk: "Коли",
      en: "When",
    },
    m400: {
      uk: "Подія",
      en: "Event",
    },
    m401: {
      uk: "Платформа",
      en: "Platform",
    },
    m402: {
      uk: "Подій поки немає",
      en: "No events yet",
    },
    m403: {
      uk: "Контакти та компанії",
      en: "Contacts and companies",
    },
    m404: {
      uk: "Активні за 24 години",
      en: "Active in 24 hours",
    },
    m405: {
      uk: "За останнім зв’язком пристрою",
      en: "By last device connection",
    },
    m406: {
      uk: "Активовані пристрої",
      en: "Activated devices",
    },
    m407: {
      uk: "З доступом до сервера",
      en: "With server access",
    },
    m408: {
      uk: "Файли передано",
      en: "Files delivered",
    },
    m409: {
      uk: "Встановлення враховується окремо",
      en: "Installation is tracked separately",
    },
    m410: {
      uk: "Зараз сервер працює на цьому комп’ютері. Для користувачів з інтернету розгорніть сервер з HTTPS і підключіть до нього панель. Посилання 127.0.0.1 працюють лише на вашому комп’ютері.",
      en: "The server is running on this computer. Deploy an HTTPS server for internet users and connect this panel to it. Links to 127.0.0.1 work only on your computer.",
    },
    m411: {
      uk: "Останні користувачі",
      en: "Recent users",
    },
    m412: {
      uk: "Усі користувачі →",
      en: "All users →",
    },
    m413: {
      uk: "Останні події",
      en: "Recent events",
    },
    m414: {
      uk: "Ім’я, email або компанія",
      en: "Name, email or company",
    },
    m415: {
      uk: "Email заданий власником, не підтверджений листом",
      en: "Email supplied by the owner, not verified",
    },
    m416: {
      uk: "Пристрій",
      en: "Device",
    },
    m417: { uk: "Перший вхід", en: "First sign-in" },
    m418: {
      uk: "Останній зв’язок",
      en: "Last connection",
    },
    m419: {
      uk: "Доступ",
      en: "Access",
    },
    m420: {
      uk: "Пристроїв поки немає",
      en: "No devices yet",
    },
    m421: { uk: "Браузери й телефони, з яких входили в LOMVIKO. Відключення одразу завершує вхід на цьому пристрої й звільняє місце в компанії.", en: "Browsers and phones used to sign in to LOMVIKO. Revoking ends the sign-in on that device at once and frees a seat in the company." },
    m422: {
      uk: "Власник видає персональне посилання конкретному користувачу. «Файл передано» — завершене передавання сервером, а не встановлення. Пересилання посилання змінює фактичного одержувача. Завантаження в обхід сервера не видно. Останні 500 подій.",
      en: "The owner issues a personal link to a specific user. File delivered means transfer completion, not installation. Forwarded links may be downloaded by someone else. Downloads outside this server are not tracked. Latest 500 events.",
    },
    m423: {
      uk: "На цьому комп’ютері",
      en: "On this computer",
    },
    m424: {
      uk: "Підключений сервер",
      en: "Connected server",
    },
    m425: {
      uk: "Сервер продукту",
      en: "Product server",
    },
    m426: {
      uk: "Панель звертається до API через основний процес. Ключ адміністратора зберігається у захищеному сховищі ОС і не передається інтерфейсу.",
      en: "The panel accesses the API through the main process. The admin key stays in the OS secure storage and is never exposed to the interface.",
    },
    m427: {
      uk: "Підключити сервер",
      en: "Connect server",
    },
    m428: {
      uk: "Експорт CRM власника",
      en: "Export owner CRM",
    },
    m429: {
      uk: "Контакти, пристрої та журнал подій у JSON. Приватні ключі, ключ адміністратора й секрети запрошень не експортуються.",
      en: "Contacts, devices and events in JSON. Private keys, the admin key and invitation secrets are not exported.",
    },
    m430: {
      uk: "Експортувати базу",
      en: "Export database",
    },
    m431: {
      uk: "Це дані для аналізу. Повна аварійна копія сервера потребує окремого захищеного збереження бази й ключів.",
      en: "This export is for analysis. A complete disaster recovery backup also requires secure copies of server databases and keys.",
    },
    m433: {
      uk: "Для локального сервера виберіть DMG та EXE на комп’ютері. Для віддаленого сервера шляхи задаються в конфігурації.",
      en: "Choose local DMG and EXE files for a local server. Configure file paths on a remote server.",
    },
    m434: {
      uk: "Вибрати DMG",
      en: "Choose DMG",
    },
    m435: {
      uk: "Вибрати EXE",
      en: "Choose EXE",
    },
    m437: {
      uk: "Що бачить власник",
      en: "What the owner sees",
    },
    m439: {
      uk: "Записи відвідувачів, телефони клієнтів, Google OAuth і Telegram-токени залишаються в CRM бізнесу та не передаються цій панелі.",
      en: "Visitor bookings, client phone numbers, Google OAuth and Telegram tokens remain in the business CRM and are not sent to this panel.",
    },
    m440: {
      uk: "● Локальний сервер",
      en: "● Local server",
    },
    m441: {
      uk: "● Сервер підключено",
      en: "● Server connected",
    },
    m442: {
      uk: "Профіль і логотип",
      en: "Profile and logo",
    },
    m443: {
      uk: "Компанія",
      en: "Company",
    },
    m444: {
      uk: "Головний користувач",
      en: "Main user",
    },
    m445: {
      uk: "Початкове налаштування",
      en: "Initial setup",
    },
    m446: {
      uk: "Компаній поки немає",
      en: "No companies yet",
    },
    m447: {
      uk: "Головний користувач може мати кілька компаній. Співробітникам надається доступ за ролями.",
      en: "The main user can own several companies. Staff access is role based.",
    },
    m448: {
      uk: "＋ Компанія",
      en: "＋ Company",
    },
    m449: { uk: "Створіть головного користувача з логіном і паролем і підготуйте компанію. Після входу на app.lomviko.com профіль і послуги вже будуть на місці.", en: "Create the main user with a login and password and prepare the company. After signing in at app.lomviko.com the profile and services are already there." },
    m450: {
      uk: "Хвилин",
      en: "Minutes",
    },
    m451: {
      uk: "Ресурсів одночасно",
      en: "Simultaneous resources",
    },
    m452: {
      uk: "Доступна в боті",
      en: "Available in the bot",
    },
    m453: {
      uk: "Новий користувач",
      en: "New user",
    },
    m454: {
      uk: "Контактна особа",
      en: "Contact person",
    },
    m455: {
      uk: "Компанія та доступ",
      en: "Company and access",
    },
    m456: {
      uk: "Нова компанія · головний власник",
      en: "New company · main owner",
    },
    m457: {
      uk: "Назва нової компанії",
      en: "New company name",
    },
    m458: {
      uk: "Роль у наявній компанії",
      en: "Role in existing company",
    },
    m459: {
      uk: "Пробний період, днів",
      en: "Trial days",
    },
    m460: {
      uk: "Ліміт пристроїв компанії",
      en: "Company device limit",
    },
    m461: {
      uk: "Для співробітника умови підписки успадковуються від головної компанії. Передайте логін і пароль захищеним каналом.",
      en: "Staff inherit the main company subscription. Send credentials through a secure channel.",
    },
    m462: {
      uk: "Змінити пароль",
      en: "Change password",
    },
    m463: {
      uk: "Новий пароль",
      en: "New password",
    },
    m464: {
      uk: "Поточні сесії користувача завершаться. Старий пароль відновити неможливо.",
      en: "Current user sessions will end. The old password cannot be recovered.",
    },
    m465: {
      uk: "Нова компанія",
      en: "New company",
    },
    m466: {
      uk: "Головний користувач",
      en: "Main user",
    },
    m467: {
      uk: "Б’юті",
      en: "Beauty",
    },
    m468: {
      uk: "СТО",
      en: "Vehicle repair",
    },
    m469: {
      uk: "Інший",
      en: "Other",
    },
    m470: {
      uk: "Валюта",
      en: "Currency",
    },
    m471: {
      uk: "Початок дня",
      en: "Opening time",
    },
    m472: {
      uk: "Кінець дня",
      en: "Closing time",
    },
    m473: {
      uk: "Увімкнути API сайту",
      en: "Enable website API",
    },
    m474: {
      uk: "Послуги та ресурси компанії",
      en: "Company services and resources",
    },
    m475: {
      uk: "увімк.",
      en: "on",
    },
    m476: {
      uk: "вимк.",
      en: "off",
    },
    m477: {
      uk: "хв ·",
      en: "min ·",
    },
    m478: {
      uk: "· бот",
      en: "· bot",
    },
    m479: {
      uk: "Ресурси",
      en: "Resources",
    },
    m480: {
      uk: "＋ Спеціаліст / пост",
      en: "＋ Specialist / bay",
    },
    m481: {
      uk: "Нова послуга",
      en: "New service",
    },
    m482: {
      uk: "Додати спеціаліста / пост",
      en: "Add specialist / bay",
    },
    m483: {
      uk: "Умови доступу",
      en: "Access terms",
    },
    m484: {
      uk: "Стан",
      en: "Status",
    },
    m485: {
      uk: "Доступ до, включно",
      en: "Access through",
    },
    m486: {
      uk: "Ліміт пристроїв",
      en: "Device limit",
    },
    m487: {
      uk: "Запрошення та завантаження",
      en: "Invitation and download",
    },
    m488: {
      uk: "Адреса сервера для застосунку",
      en: "App server address",
    },
    m489: { uk: "Одноразовий ключ доступу", en: "One-time access key" },
    m492: {
      uk: "Діє до",
      en: "Valid until",
    },
    m493: {
      uk: ". Скопіюйте зараз: код не зберігається відкритим текстом і більше не показуватиметься. Передайте конкретному користувачу. Для кожного додаткового пристрою видайте нове запрошення.",
      en: ". Copy it now: it is not stored in plain text and will not be shown again. Send it to the intended user. Issue a new invitation for each additional device.",
    },
    m494: {
      uk: "Відключити пристрій?",
      en: "Revoke this device?",
    },
    m495: { uk: "Вхід на цьому пристрої одразу завершиться, місце в компанії звільниться.", en: "The sign-in on this device ends at once and its seat is freed." },
    m496: {
      uk: "Підключити сервер власника",
      en: "Connect owner server",
    },
    m497: {
      uk: "HTTPS-адреса сервера",
      en: "HTTPS server address",
    },
    m498: {
      uk: "Ключ адміністратора",
      en: "Administrator key",
    },
    m499: {
      uk: "Ключ створюється на сервері та зберігається в admin.secret. Не передавайте його користувачам CRM.",
      en: "The server creates the key in admin.secret. Do not share it with CRM users.",
    },
    m500: {
      uk: "Дані експортовано",
      en: "Data exported",
    },
    m503: {
      uk: "Некоректна дата",
      en: "Invalid date",
    },
    m504: {
      uk: "Виберіть коректний період",
      en: "Choose a valid period",
    },
    m509: {
      uk: "Дію заблоковано з міркувань безпеки. Перезапустіть застосунок і спробуйте ще раз.",
      en: "The action was blocked for security. Restart the app and try again.",
    },
    m510: {
      uk: "Не вдалося виконати дію. Спробуйте ще раз — якщо повториться, натисніть «Написати нам», і ми допоможемо.",
      en: "The action could not be completed. Try again — if it repeats, press “Write to us” and we will help.",
    },
    m511: {
      uk: "Логотип до 2 МБ",
      en: "Logo must not exceed 2 MB",
    },
    m512: {
      uk: "Виберіть PNG або JPEG",
      en: "Choose PNG or JPEG",
    },
    m513: {
      uk: "Бот обробляє запит. Повторіть за кілька секунд.",
      en: "The bot is processing an update. Try again in a few seconds.",
    },
    m514: {
      uk: "Спочатку підключіть бота",
      en: "Connect the bot first",
    },
    m515: {
      uk: "Клієнта не знайдено",
      en: "Client not found",
    },
    m516: {
      uk: "Клієнт уже підключений",
      en: "Client already linked",
    },
    m519: {
      uk: "Зберігайте окремо від застосунку. Цей ключ є паролем для відновлення .orbit.",
      en: "Keep this separate from the app. This key is the password for restoring .orbit backups.",
    },
    m521: {
      uk: "Відключено · доступ можна відкликати в Google",
      en: "Disconnected · revoke access in Google",
    },
    m522: {
      uk: "Це збірка для оцінювання. Комерційний ключ перевірки ще не налаштований.",
      en: "This is an evaluation build. The commercial verification key is not configured.",
    },
    m523: {
      uk: "Неправильний формат",
      en: "Invalid format",
    },
    m524: {
      uk: "Експорт усієї бази",
      en: "Export full database",
    },
    m525: {
      uk: "Відновлення доступне для локальної бази. Спільну базу відновлює оператор із серверної копії.",
      en: "Restore is available for the local database. The operator restores shared databases from server backups.",
    },
    m526: {
      uk: "Дочекайтеся завершення інтеграцій і повторіть",
      en: "Wait for integrations to finish and retry",
    },
    m527: {
      uk: "Відновити резервну копію",
      en: "Restore backup",
    },
    m528: {
      uk: "Файл більший за 100 МБ",
      en: "File exceeds 100 MB",
    },
    m529: {
      uk: "Замінити базу",
      en: "Replace database",
    },
    m530: {
      uk: "Поточну базу буде замінено",
      en: "The current database will be replaced",
    },
    m531: {
      uk: "Спочатку експортуйте поточну базу. Токени інтеграцій залишаться на цьому комп’ютері.",
      en: "Export the current database first. Integration tokens stay on this computer.",
    },
    m532: {
      uk: "Інтеграція ще виконується. Повторіть відновлення за кілька секунд.",
      en: "An integration is still running. Retry restore in a few seconds.",
    },
    m533: {
      uk: "Перевірте поля форми: деякі порожні або задовгі.",
      en: "Check the form: some fields are empty or too long.",
    },
    m534: {
      uk: "Некоректна сума",
      en: "Invalid amount",
    },
    m535: {
      uk: "Некоректний час у вибраному часовому поясі",
      en: "Invalid time in the selected time zone",
    },
    m536: {
      uk: "Мій бізнес",
      en: "My business",
    },
    m537: {
      uk: "Перевірте тривалість, кількість учасників і ресурсів",
      en: "Check duration, participants and resources",
    },
    m538: {
      uk: "Послугу не знайдено",
      en: "Service not found",
    },
    m539: {
      uk: "Виберіть час у майбутньому, не далі року",
      en: "Choose a future time within one year",
    },
    m540: {
      uk: "Перевірте учасників, місткість послуги й кількість ресурсів",
      en: "Check participants, service capacity and resource count",
    },
    m541: {
      uk: "Цей час уже зайнятий. Виберіть інший інтервал.",
      en: "This time is already booked. Choose another time.",
    },
    m542: {
      uk: "Клієнт уже має запис на цей час.",
      en: "The client already has an appointment at this time.",
    },
    m543: {
      uk: "Сума завелика",
      en: "Amount is too large",
    },
    m544: {
      uk: "Цю дію не можна застосувати до запису в його поточному стані.",
      en: "This action does not apply to the visit in its current state.",
    },
    m545: {
      uk: "Запис уже закритий",
      en: "Booking is already closed",
    },
    m546: {
      uk: "Непідтримуваний формат резервної копії",
      en: "Unsupported backup format",
    },
    m547: {
      uk: "Резервна копія завелика",
      en: "Backup is too large",
    },
    m548: {
      uk: "Некоректна сума платежу",
      en: "Invalid payment amount",
    },
    m549: {
      uk: "Некоректний час платежу",
      en: "Invalid payment time",
    },
    m550: {
      uk: "Від’ємна сума дозволена лише для повернення",
      en: "Negative amounts are only allowed for refunds",
    },
    m551: {
      uk: "Запис не знайдено",
      en: "Booking not found",
    },
    m552: {
      uk: "Перевірте тип бізнесу",
      en: "Check the business type",
    },
    m553: {
      uk: "Некоректний часовий пояс",
      en: "Invalid time zone",
    },
    m554: {
      uk: "Валюта: код із трьох літер",
      en: "Currency must be a three-letter code",
    },
    m555: {
      uk: "Перевірте робочі години",
      en: "Check the working hours",
    },
    m556: {
      uk: "Перевірте робочі дні",
      en: "Check the working days",
    },
    m557: {
      uk: "Потрібен логотип PNG/JPEG до 2 МБ",
      en: "A PNG/JPEG logo up to 2 MB is required",
    },
    m558: {
      uk: "Укажіть HTTPS-адресу видавця або локальну http://127.0.0.1:4545",
      en: "Enter the publisher HTTPS address or local http://127.0.0.1:4545",
    },
    m559: {
      uk: "Немає зв’язку. Перевірте інтернет; застосунок підключиться автоматично.",
      en: "No connection. Check your internet; the app reconnects automatically.",
    },
    m560: {
      uk: "Сервер LOMVIKO тимчасово не відповідає. Ваші дані збережені — спробуйте ще раз за хвилину.",
      en: "The LOMVIKO server is not responding right now. Your data is safe — try again in a minute.",
    },
    m562: {
      uk: "Сервер не пройшов перевірку безпеки, тому з’єднання зупинено. Напишіть нам — ми допоможемо.",
      en: "The server failed the security check, so the connection was stopped. Write to us — we will help.",
    },
    m563: {
      uk: "Дочекайтеся завершення підключення",
      en: "Wait for the connection to finish",
    },
    m565: {
      uk: "Адміністратор ще не надав доступ до компанії",
      en: "The administrator has not assigned a company yet",
    },
    m566: {
      uk: "Ви вийшли з акаунта",
      en: "Signed out",
    },
    m567: {
      uk: "Увійдіть в акаунт",
      en: "Sign in to your account",
    },
    m568: {
      uk: "Немає доступу до компанії",
      en: "No access to this company",
    },
    m569: {
      uk: "Зараз доступний перегляд збереженого розкладу. Для змін дочекайтеся підключення.",
      en: "You can view the saved schedule. Wait for reconnection to make changes.",
    },
    m570: {
      uk: "Акаунт або компанія змінилися. Оновіть екран.",
      en: "The account or company changed. Refresh the screen.",
    },
    m571: {
      uk: "Захищений ключ цього комп’ютера недоступний. Розблокуйте сховище паролів системи або перезапустіть комп’ютер.",
      en: "This computer's protected key is unavailable. Unlock the system password store or restart the computer.",
    },
    m572: {
      uk: "Пристрій зареєстровано",
      en: "Device registered",
    },
    m573: {
      uk: "Зв’язок із видавцем активний",
      en: "Publisher connection active",
    },
    m574: {
      uk: "Захищене сховище ОС недоступне. Токен не збережено.",
      en: "OS secure storage is unavailable. The token was not saved.",
    },
    m575: {
      uk: "Розблокуйте захищене сховище ОС",
      en: "Unlock OS secure storage",
    },
    m576: {
      uk: "Пароль копії: від 12 до 1024 символів",
      en: "Backup password: 12 to 1024 characters",
    },
    m577: {
      uk: "Неправильний пароль або пошкоджена копія",
      en: "Wrong password or damaged backup",
    },
    m579: {
      uk: "Сервіс недоступний. Перевірте інтернет.",
      en: "Service unavailable. Check your internet connection.",
    },
    m580: {
      uk: "Сервіс відхилив запит (HTTP",
      en: "Service rejected the request (HTTP",
    },
    m581: {
      uk: "). Перевірте підключення та дозволи.",
      en: "). Check your connection and permissions.",
    },
    m582: {
      uk: "Сервіс надіслав незрозумілу відповідь. Спробуйте ще раз за хвилину.",
      en: "The service sent an unexpected reply. Try again in a minute.",
    },
    m583: {
      uk: "Підключіть Telegram-бота",
      en: "Connect your Telegram bot",
    },
    m584: {
      uk: "Telegram відхилив запит. Перевірте права бота.",
      en: "Telegram rejected the request. Check bot permissions.",
    },
    m585: {
      uk: "Некоректний токен Telegram",
      en: "Invalid Telegram token",
    },
    m586: {
      uk: "Бот уже має webhook. Використайте окремого бота або вимкніть попередню інтеграцію.",
      en: "The bot already has a webhook. Use a dedicated bot or disconnect the previous integration.",
    },
    m587: {
      uk: "Будь-який вільний",
      en: "Any available",
    },
    m588: {
      uk: "Посилання недійсне. Зверніться до адміністратора.",
      en: "Invalid link. Contact your administrator.",
    },
    m589: {
      uk: "Для запису й нагадувань натисніть «Погоджуюсь». Ми збережемо ім’я та Telegram ID у базі бізнесу. /stop вимикає сповіщення. /privacy — про дані.",
      en: "Select I agree to book and receive reminders. We save your name and Telegram ID in the business database. /stop disables notifications. /privacy explains data use.",
    },
    m590: {
      uk: "Погоджуюсь · записатися",
      en: "I agree · book",
    },
    m591: { uk: "Власник бізнесу зберігає ім’я, Telegram ID та історію записів у CRM LOMVIKO. Для видалення даних зверніться до власника. /stop відключає Telegram.", en: "The business owner stores your name, Telegram ID and booking history in the LOMVIKO CRM. Contact the owner to delete your data. /stop disconnects Telegram." },
    m592: {
      uk: "Сповіщення вимкнено. Для нового запису: /start",
      en: "Notifications disabled. Start again with /start",
    },
    m593: {
      uk: "Посилання прострочене. Отримайте нове в адміністратора.",
      en: "Link expired. Ask your administrator for a new link.",
    },
    m594: {
      uk: "Клієнт Telegram",
      en: "Telegram client",
    },
    m595: {
      uk: "Для запису й згоди на сповіщення надішліть /start",
      en: "Send /start to book and consent to notifications",
    },
    m596: {
      uk: "Виберіть послугу",
      en: "Choose a service",
    },
    m597: {
      uk: "Послуг поки немає. Зверніться до адміністратора.",
      en: "No services yet. Contact your administrator.",
    },
    m598: {
      uk: "Ваші майбутні записи. Кнопка скасовує вибраний запис.",
      en: "Your upcoming appointments. Select a booking to cancel.",
    },
    m599: {
      uk: "Майбутніх записів немає. /book — записатися.",
      en: "No upcoming appointments. Send /book to book.",
    },
    m600: {
      uk: "Скасувати:",
      en: "Cancel:",
    },
    m601: {
      uk: "Запис скасовано. /book — вибрати інший час.",
      en: "Booking cancelled. Send /book to choose another time.",
    },
    m602: {
      uk: "Послуга більше недоступна. Виберіть знову: /book",
      en: "This service is no longer available. Choose again with /book",
    },
    m603: {
      uk: "Скільки учасників буде на візиті?",
      en: "How many people will attend?",
    },
    m604: {
      uk: "осіб",
      en: "people",
    },
    m605: {
      uk: "Виберіть спеціаліста / пост або будь-якого вільного",
      en: "Choose a specialist / bay, or any available",
    },
    m606: {
      uk: "Виберіть послугу: /book. /appointments — ваші записи.",
      en: "Choose a service with /book. /appointments shows your bookings.",
    },
    m607: {
      uk: "Виберіть основного спеціаліста / пост або будь-якого вільного. Додаткові ресурси резервуються автоматично.",
      en: "Choose a primary specialist / bay, or any available. Additional resources are reserved automatically.",
    },
    m608: {
      uk: "Виберіть дату за часом компанії",
      en: "Choose a date in the business time zone",
    },
    m609: {
      uk: "Вільний час (",
      en: "Available times (",
    },
    m610: {
      uk: "Немає вільного часу. /book — вибрати інший день.",
      en: "No available times. Send /book to choose another day.",
    },
    m611: {
      uk: "Ви записані:",
      en: "You are booked:",
    },
    m612: {
      uk: "Спеціаліст / пост:",
      en: "Specialist / bay:",
    },
    m613: {
      uk: "Учасників:",
      en: "Participants:",
    },
    m614: {
      uk: "/appointments — переглянути або скасувати запис.",
      en: "/appointments — view or cancel your booking.",
    },
    m615: {
      uk: "Час уже недоступний. Виберіть знову: /book",
      en: "This time is no longer available. Choose again with /book",
    },
    m616: {
      uk: "Нагадування:",
      en: "Reminder:",
    },
    m617: {
      uk: "/appointments — керування записом",
      en: "/appointments — manage your booking",
    },
    m618: {
      uk: "Працює на сервері · CRM можна закрити",
      en: "Running on the server · you can close the CRM",
    },
    m619: {
      uk: "Працює · застосунок має бути відкритим",
      en: "Running · the app must stay open",
    },
    m620: {
      uk: "Вхід у Google вже відкритий",
      en: "Google sign-in is already open",
    },
    m621: {
      uk: "Дочекайтеся завершення резервного копіювання",
      en: "Wait for the backup to finish",
    },
    m622: {
      uk: "Вхід у Google ще не налаштований видавцем застосунку",
      en: "Google sign-in has not been configured by the publisher",
    },
    m623: {
      uk: "Захищене сховище ОС недоступне",
      en: "OS secure storage unavailable",
    },
    m624: {
      uk: "Вхід у Google скасовано",
      en: "Google sign-in cancelled",
    },
    m625: {
      uk: "Авторизацію отримано. Поверніться в LOMVIKO.",
      en: "Authorization received. Return to LOMVIKO.",
    },
    m626: {
      uk: "Не вдалося відкрити локальну адресу авторизації",
      en: "Could not open the local authorization address",
    },
    m627: {
      uk: "Час авторизації сплив",
      en: "Authorization timed out",
    },
    m628: {
      uk: "Google не надав фоновий доступ. Повторіть підключення.",
      en: "Google did not grant background access. Try connecting again.",
    },
    m629: {
      uk: "Підключено · повторний вхід не завершено",
      en: "Connected · reauthorization incomplete",
    },
    m630: {
      uk: "Вхід у Google не завершено",
      en: "Google sign-in incomplete",
    },
    m631: {
      uk: "Використайте HTTPS-адресу сервера або локальну http://127.0.0.1:4545",
      en: "Use an HTTPS server address or local http://127.0.0.1:4545",
    },
    m632: {
      uk: "Сервер LOMVIKO зараз недоступний. Перевірте інтернет — ваші дані збережені.",
      en: "The LOMVIKO server is unavailable right now. Check your internet — your data is safe.",
    },
    m634: {
      uk: "Потрібен PNG або JPEG",
      en: "PNG or JPEG required",
    },
    m635: {
      uk: "Перевірте ключ адміністратора",
      en: "Check the administrator key",
    },
    m637: {
      uk: "Некоректна платформа",
      en: "Invalid platform",
    },
    m638: {
      uk: "LOMVIKO Admin · CRM власника",
      en: "LOMVIKO Admin · owner CRM",
    },
    m639: {
      uk: "Пароль: від 12 до 128 символів",
      en: "Password: 12 to 128 characters",
    },
    m640: {
      uk: "Доступ призупинено або підписка закінчилась. Ваші дані збережені — продовжте підписку або напишіть нам.",
      en: "Access is paused or the subscription has ended. Your data is safe — renew or write to us.",
    },
    m641: {
      uk: "Користувача не знайдено",
      en: "User not found",
    },
    m642: {
      uk: "Сесія спливла. Увійдіть знову",
      en: "Session expired. Sign in again",
    },
    m643: {
      uk: "Немає доступу до цього бізнесу",
      en: "No access to this business",
    },
    m644: {
      uk: "Забагато спроб. Повторіть через 15 хвилин",
      en: "Too many attempts. Try again in 15 minutes",
    },
    m645: {
      uk: "Неправильний логін або пароль",
      en: "Incorrect login or password",
    },
    m646: {
      uk: "Ключ цього комп’ютера пошкоджено. Вийдіть з акаунта й увійдіть знову.",
      en: "This computer's key is damaged. Sign out and sign in again.",
    },
    m647: {
      uk: "Ключ цього комп’ютера застарілого типу. Вийдіть з акаунта й увійдіть знову.",
      en: "This computer's key is outdated. Sign out and sign in again.",
    },
    m648: {
      uk: "Час входу сплив",
      en: "Sign-in timed out",
    },
    m649: {
      uk: "Комп’ютер не підтвердив свою справжність. Вийдіть з акаунта й увійдіть знову.",
      en: "This computer could not prove its identity. Sign out and sign in again.",
    },
    m650: {
      uk: "Пристрій вимкнений або прив’язаний до іншого акаунта",
      en: "Device revoked or linked to another account",
    },
    m651: {
      uk: "Досягнуто ліміту комп’ютерів компанії. Вимкніть старий пристрій або напишіть нам — додамо місце.",
      en: "The company's device limit is reached. Disable an old device or write to us to add more.",
    },
    m652: { uk: "Ця дія недоступна. Оновіть сторінку й спробуйте ще раз.", en: "This action is not available. Reload the page and try again." },
    m653: {
      uk: "Цей бот уже підключений до іншого бізнесу",
      en: "This bot is already linked to another business",
    },
    m654: {
      uk: "Бот обробляє запит",
      en: "Bot is processing an update",
    },
    m655: {
      uk: "Перевірте клієнта й підключення бота",
      en: "Check the client and bot connection",
    },
    m656: {
      uk: "Користувачами керує головний власник",
      en: "Only the main owner can manage users",
    },
    m657: {
      uk: "Виберіть роль адміністратора або співробітника",
      en: "Choose administrator or staff role",
    },
    m658: {
      uk: "Перевірте email",
      en: "Check the email address",
    },
    m659: {
      uk: "Потрібна роль головного власника",
      en: "Main owner role required",
    },
    m660: {
      uk: "Не можна вимкнути власний доступ",
      en: "You cannot revoke your own access",
    },
    m661: {
      uk: "Немає доступу до користувача",
      en: "No access to this user",
    },
    m662: {
      uk: "Перевірте роль і стан",
      en: "Check role and status",
    },
    m663: {
      uk: "Новий бізнес створює головний власник",
      en: "Only the main owner can create a business",
    },
    m664: {
      uk: "Бізнес не знайдено",
      en: "Business not found",
    },
    m665: {
      uk: "API сайту вимкнений",
      en: "Website API is disabled",
    },
    m666: {
      uk: "Потрібна згода на обробку даних",
      en: "Consent to data processing is required",
    },
    m667: {
      uk: "Послуга не опублікована",
      en: "Service is not published",
    },
    m668: {
      uk: "Потрібен унікальний request_id",
      en: "A unique request_id is required",
    },
    m669: {
      uk: "Час недоступний",
      en: "Time unavailable",
    },
    m670: {
      uk: "Забагато даних в одному запиті. Зменште файл або текст і спробуйте ще раз.",
      en: "Too much data in one request. Make the file or text smaller and try again.",
    },
    m671: { uk: "Сервер не зміг прочитати запит. Оновіть сторінку й спробуйте ще раз.", en: "The server could not read the request. Reload the page and try again." },
    m672: {
      uk: "Некоректний термін або кількість пристроїв",
      en: "Invalid term or device count",
    },
    m673: {
      uk: "Недійсне запрошення",
      en: "Invalid invitation",
    },
    m674: {
      uk: "Запрошення недійсне, використане або прострочене",
      en: "Invitation invalid, used or expired",
    },
    m675: {
      uk: "Потрібен доступ власника",
      en: "Owner access required",
    },
    m676: {
      uk: "Запит не пройшов перевірку безпеки. Переконайтеся, що дата й час на комп’ютері встановлюються автоматично, і спробуйте ще раз.",
      en: "The request failed the security check. Make sure the computer's date and time are set automatically and try again.",
    },
    m677: {
      uk: "Цей запит уже виконано. Оновіть екран.",
      en: "This request was already processed. Refresh the screen.",
    },
    m678: {
      uk: "Виберіть роль",
      en: "Choose a role",
    },
    m679: {
      uk: "Перевірте термін і пристрої",
      en: "Check the term and devices",
    },
    m680: {
      uk: "Пристрій не знайдено",
      en: "Device not found",
    },
    m681: {
      uk: "Забагато спроб поспіль. Зачекайте хвилину і спробуйте ще раз.",
      en: "Too many attempts in a row. Wait a minute and try again.",
    },
    m682: {
      uk: "Підписка закінчилась. Ваші дані збережені — продовжте підписку, і все запрацює як раніше.",
      en: "The subscription has ended. Your data is safe — renew and everything works as before.",
    },
    m684: {
      uk: "Комп’ютер не підтвердив свій ключ. Вийдіть з акаунта й увійдіть знову.",
      en: "This computer could not confirm its key. Sign out and sign in again.",
    },
    m686: {
      uk: "Пристрій уже зареєстрований або вимкнений",
      en: "Device already registered or revoked",
    },
    m687: {
      uk: "Досягнуто ліміту комп’ютерів у тарифі. Вимкніть старий пристрій або напишіть нам — додамо місце.",
      en: "The device limit of your plan is reached. Disable an old device or write to us to add more.",
    },
    m689: {
      uk: "Не вдалося виконати дію. Спробуйте ще раз — якщо повториться, натисніть «Написати нам».",
      en: "The action could not be completed. Try again — if it repeats, press “Write to us”.",
    },
    m690: {
      uk: "Запис і бізнес",
      en: "Booking and business",
    },
    m691: {
      uk: "М",
      en: "M",
    },
    m692: {
      uk: "Робочий простір",
      en: "Workspace",
    },
    m693: {
      uk: "Керування",
      en: "Management",
    },
    m694: {
      uk: "Працюйте навіть без інтернету.",
      en: "Work even without internet.",
    },
    m695: {
      uk: "Ваші дані належать вам.",
      en: "Your data belongs to you.",
    },
    m696: {
      uk: "LOMVIKO · рання версія",
      en: "LOMVIKO · preview",
    },
    m697: {
      uk: "Ваш бізнес у порядку",
      en: "Your business at a glance",
    },
    m698: {
      uk: "＋ Новий запис",
      en: "＋ New booking",
    },
    m699: {
      uk: "Вибір компанії",
      en: "Choose company",
    },
    m700: {
      uk: "Закрити",
      en: "Close",
    },
    m701: {
      uk: "Панель власника",
      en: "Owner panel",
    },
    m702: {
      uk: "L",
      en: "L",
    },
    m703: {
      uk: "Ваш продукт",
      en: "Your product",
    },
    m704: {
      uk: "Керування LOMVIKO",
      en: "LOMVIKO management",
    },
    m705: {
      uk: "Бізнес продукту",
      en: "Product business",
    },
    m706: {
      uk: "Доступ лише власнику",
      en: "Owner access only",
    },
    m707: { uk: "Користувачі, компанії та підписки.", en: "Users, companies and subscriptions." },
    m708: {
      uk: "Початкове налаштування бізнесу.",
      en: "Initial business setup.",
    },
    m709: {
      uk: "LOMVIKO Admin · рання версія",
      en: "LOMVIKO Admin · preview",
    },
    m710: {
      uk: "● Сервер",
      en: "● Server",
    },
    m711: {
      uk: "Ваш продукт у цифрах",
      en: "Your product at a glance",
    },
    m712: {
      uk: "＋ Додати користувача",
      en: "＋ Add user",
    },
    language: {
      uk: "Мова",
      en: "Language",
    },
    light: {
      uk: "Денна тема",
      en: "Light theme",
    },
    dark: {
      uk: "Нічна тема",
      en: "Dark theme",
    },
    theme: {
      uk: "Оформлення",
      en: "Appearance",
    },
    botMenu: {
      uk: "Вітаємо! Оберіть дію нижче 👇",
      en: "Welcome! Choose an option below 👇",
    },
    botBook: {
      uk: "📅 Записатися",
      en: "📅 Book an appointment",
    },
    botVisits: {
      uk: "🗓 Мої записи",
      en: "🗓 My appointments",
    },
    botInfo: {
      uk: "📍 Про компанію",
      en: "📍 Business details",
    },
    botLanguage: {
      uk: "🌐 Мова / Language",
      en: "🌐 Language / Мова",
    },
    botHome: {
      uk: "🏠 Головне меню",
      en: "🏠 Main menu",
    },
    botBack: {
      uk: "← Назад",
      en: "← Back",
    },
    botNext: {
      uk: "Далі →",
      en: "Next →",
    },
    botAgree: {
      uk: "✅ Погоджуюсь і продовжую",
      en: "✅ I agree, continue",
    },
    botConsent: {
      uk: "Щоб записатися й отримувати нагадування, потрібна ваша згода. Компанія збереже ваше ім’я, Telegram ID та історію записів. Ви можете відключити сповіщення командою /stop або звернутися до компанії для видалення даних.",
      en: "To book and receive reminders, we need your consent. The business stores your name, Telegram ID and booking history. Send /stop to disconnect notifications or contact the business to delete your data.",
    },
    botChooseService: {
      uk: "Яка послуга вас цікавить?",
      en: "Which service would you like?",
    },
    botChooseResource: {
      uk: "До кого бажаєте записатися? Можна обрати будь-якого вільного спеціаліста / пост.",
      en: "Who would you like to book with? You can choose any available specialist / bay.",
    },
    botChooseDay: {
      uk: "Оберіть зручний день. Усі дати й час — за часовим поясом компанії:",
      en: "Choose a day. All dates and times use the business time zone:",
    },
    botChooseTime: {
      uk: "Оберіть зручний час:",
      en: "Choose a time:",
    },
    botNoTimes: {
      uk: "На цей день вільного часу немає. Оберіть іншу дату або іншого спеціаліста.",
      en: "No times are available on this day. Choose another date or specialist.",
    },
    botDates: {
      uk: "📆 Інша дата",
      en: "📆 Another date",
    },
    botResources: {
      uk: "👤 Інший спеціаліст",
      en: "👤 Another specialist",
    },
    botQuote: {
      uk: "Перевірте ваш запис перед підтвердженням:",
      en: "Review your booking before confirming:",
    },
    botConfirm: {
      uk: "✅ Підтвердити запис",
      en: "✅ Confirm booking",
    },
    botEdit: {
      uk: "✏️ Змінити час",
      en: "✏️ Change time",
    },
    botBooked: {
      uk: "✅ Запис підтверджено! Чекаємо на вас.",
      en: "✅ Booking confirmed! We look forward to seeing you.",
    },
    botCancel: {
      uk: "Скасувати запис",
      en: "Cancel booking",
    },
    botCancelQuestion: {
      uk: "Скасувати цей запис? Час стане доступним для інших клієнтів.",
      en: "Cancel this appointment? Its time will become available to other clients.",
    },
    botCancelConfirm: {
      uk: "Так, скасувати",
      en: "Yes, cancel it",
    },
    botKeep: {
      uk: "Залишити запис",
      en: "Keep booking",
    },
    botCancelled: {
      uk: "Запис скасовано. Можете обрати новий зручний час.",
      en: "Booking cancelled. You can choose another time.",
    },
    botNoVisits: {
      uk: "У вас поки немає майбутніх записів. Оберемо зручний час?",
      en: "You have no upcoming appointments. Shall we find a time?",
    },
    botVisitList: {
      uk: "Ваші майбутні записи. Натисніть, щоб переглянути деталі.",
      en: "Your upcoming appointments. Select one to see details.",
    },
    botService: {
      uk: "Послуга",
      en: "Service",
    },
    botWhen: {
      uk: "Дата й час",
      en: "Date and time",
    },
    botResource: {
      uk: "Спеціаліст / пост",
      en: "Specialist / bay",
    },
    botPeople: {
      uk: "Учасників",
      en: "Participants",
    },
    botPrice: {
      uk: "Вартість",
      en: "Total price",
    },
    botMinutes: {
      uk: "хв",
      en: "min",
    },
    botMissingInfo: {
      uk: "Уточніть у адміністратора компанії.",
      en: "Please ask the business administrator.",
    },
    botExpired: {
      uk: "Цей крок уже неактуальний. Почніть запис знову або відкрийте свої записи.",
      en: "This step has expired. Start a new booking or view your appointments.",
    },
    botChanged: {
      uk: "Умови послуги змінилися. Оберіть послугу знову, щоб перевірити нову вартість і час.",
      en: "The service details have changed. Choose it again to review the current price and duration.",
    },
    botTaken: {
      uk: "Цей час щойно зайняли. Оберіть інший час — ми перевіримо доступність знову.",
      en: "This time was just booked. Choose another time and we will check availability again.",
    },
    payNeedsAccount: {
      uk: "Онлайн-оплата працює, коли ви увійшли в компанію (сервер LOMVIKO): банк повідомляє про оплату на сервер, навіть коли комп’ютер вимкнено.",
      en: "Online payments work when you are signed in to a company: the bank reports payments to the server even when this computer is off.",
    },
    payMonoTitle: {
      uk: "Оплата monobank",
      en: "monobank payments",
    },
    payMonoAbout: {
      uk: "Клієнт оплачує карткою, Apple Pay або Google Pay на сторінці monobank — за QR-кодом, посиланням або кнопкою в Telegram. Гроші надходять одразу на ваш рахунок, а візит позначається оплаченим автоматично.",
      en: "The client pays by card, Apple Pay or Google Pay on the monobank page — via QR code, link or a Telegram button. Money goes straight to your account and the visit is marked paid automatically.",
    },
    payMonoConnect: {
      uk: "Підключити monobank",
      en: "Connect monobank",
    },
    payMonoToken: {
      uk: "Токен з кабінету monobank",
      en: "Token from the monobank account",
    },
    payMonoTokenHint: {
      uk: "Токен: web.monobank.ua → Інтернет-еквайринг → Налаштування. Для перевірки підійде тестовий токен з api.monobank.ua — тоді гроші не списуються.",
      en: "Token: web.monobank.ua → Internet acquiring → Settings. For a trial use the test token from api.monobank.ua — no money is charged.",
    },
    payMonoLegal: {
      uk: "Договір еквайрингу укладено між вами і monobank, комісію банку і фіскальні чеки (ПРРО) налаштовуєте у кабінеті monobank. LOMVIKO не отримує гроші й не бачить дані карток — лише створює рахунок і фіксує оплату.",
      en: "The acquiring agreement is between you and monobank; bank fees and fiscal receipts are set up in your monobank account. LOMVIKO never receives the money or sees card details — it only creates the invoice and records the payment.",
    },
    payMonoDisconnect: {
      uk: "Відключити",
      en: "Disconnect",
    },
    payMonoDone: {
      uk: "monobank підключено",
      en: "monobank connected",
    },
    payMonoOff: {
      uk: "monobank відключено",
      en: "monobank disconnected",
    },
    payInvoice: {
      uk: "Рахунок на оплату",
      en: "Payment link",
    },
    payInvoiceAmount: {
      uk: "Сума до оплати",
      en: "Amount to pay",
    },
    payInvoiceSend: {
      uk: "Надіслати клієнту в Telegram",
      en: "Send to the client in Telegram",
    },
    payInvoiceCreate: {
      uk: "Створити рахунок",
      en: "Create invoice",
    },
    payInvoiceReady: {
      uk: "Рахунок на оплату",
      en: "Payment request",
    },
    payInvoiceScan: {
      uk: "Клієнт сканує QR-код камерою телефону або відкриває посилання. Рахунок діє 3 дні.",
      en: "The client scans the QR code with a phone camera or opens the link. The invoice is valid for 3 days.",
    },
    payInvoiceSent: {
      uk: "✓ Надіслано клієнту в Telegram",
      en: "✓ Sent to the client in Telegram",
    },
    payNoTelegram: {
      uk: "Клієнт не підключений до бота — покажіть QR-код або надішліть посилання.",
      en: "The client is not connected to the bot — show the QR code or send the link.",
    },
    payCopy: {
      uk: "Копіювати",
      en: "Copy",
    },
    payCopied: {
      uk: "Посилання скопійовано",
      en: "Link copied",
    },
    payWaiting: {
      uk: "Очікує оплату",
      en: "Awaiting payment",
    },
    payDone: {
      uk: "✓ Оплачено",
      en: "✓ Paid",
    },
    payShow: {
      uk: "Рахунок monobank",
      en: "monobank invoice",
    },
    payCancel: {
      uk: "Скасувати рахунок",
      en: "Cancel invoice",
    },
    payCancelled: {
      uk: "Рахунок скасовано",
      en: "Invoice cancelled",
    },
    botPayInvoice: {
      uk: "💳 Рахунок на оплату",
      en: "💳 Payment request",
    },
    botPayButton: {
      uk: "Оплатити",
      en: "Pay",
    },
    errUnknown: {
      uk: "Щось пішло не так, але ваші дані в безпеці. Спробуйте ще раз — якщо повториться, натисніть «Написати нам», і ми розберемося.",
      en: "Something went wrong, but your data is safe. Try again — if it repeats, press “Write to us” and we will sort it out.",
    },
    errServerReply: {
      uk: "Сервер LOMVIKO оновлюється або тимчасово недоступний. Ваші дані збережені — спробуйте ще раз за хвилину.",
      en: "The LOMVIKO server is updating or temporarily unavailable. Your data is safe — try again in a minute.",
    },
    errTrialUsed: {
      uk: "Пробний період уже використано на цьому комп’ютері або з цією поштою. Напишіть нам — допоможемо продовжити роботу.",
      en: "The free trial was already used on this computer or with this email. Write to us — we will help you continue.",
    },
    errAccessKey: {
      uk: "Ключ доступу недійсний або вже використаний. Попросіть новий у адміністратора або напишіть нам.",
      en: "The access key is invalid or already used. Ask your administrator for a new one or write to us.",
    },
    errDatabase: {
      uk: "База даних на комп’ютері зайнята іншою операцією. Зачекайте кілька секунд і спробуйте ще раз.",
      en: "The local database is busy with another operation. Wait a few seconds and try again.",
    },
    errNotFound: {
      uk: "Цей запис уже не існує — можливо, його змінили на іншому комп’ютері. Оновіть екран.",
      en: "This item no longer exists — it may have been changed on another computer. Refresh the screen.",
    },
    supportNav: {
      uk: "Допомога",
      en: "Help",
    },
    settingsSupport: {
      uk: "Підтримка",
      en: "Support",
    },
    supportTitle: {
      uk: "Напишіть нам",
      en: "Write to us",
    },
    supportIntro: {
      uk: "Ми — команда LOMVIKO і читаємо кожне повідомлення самі. Розкажіть, що сталося або що хотілося б покращити, — відповімо на вашу пошту, зазвичай протягом одного робочого дня.",
      en: "We are the LOMVIKO team and read every message ourselves. Tell us what happened or what you would like improved — we reply to your email, usually within one business day.",
    },
    supportTopic: {
      uk: "Тема",
      en: "Topic",
    },
    supportTopicProblem: {
      uk: "Щось не працює",
      en: "Something is broken",
    },
    supportTopicQuestion: {
      uk: "Питання",
      en: "Question",
    },
    supportTopicIdea: {
      uk: "Пропозиція",
      en: "Idea",
    },
    supportTopicBilling: {
      uk: "Оплата і доступ",
      en: "Billing and access",
    },
    supportMessage: {
      uk: "Ваше повідомлення",
      en: "Your message",
    },
    supportMessageHint: {
      uk: "Що ви робили, що сталося і що очікували побачити",
      en: "What you did, what happened and what you expected",
    },
    supportEmail: {
      uk: "Пошта для відповіді",
      en: "Email for our reply",
    },
    supportName: {
      uk: "Ваше ім’я",
      en: "Your name",
    },
    supportAttach: {
      uk: "Додати технічні дані: версію застосунку, систему й останню помилку. Це допоможе розібратися швидше; дані ваших клієнтів не передаються.",
      en: "Attach technical details: app version, system and the last error. It helps us find the cause faster; your clients' data is not sent.",
    },
    supportSend: {
      uk: "Надіслати",
      en: "Send",
    },
    supportSent: {
      uk: "Дякуємо! Повідомлення отримали — відповімо на",
      en: "Thank you! We got your message and will reply to",
    },
    supportOffline: {
      uk: "Не вдалося надіслати: немає зв’язку із сервером. Напишіть нам на пошту",
      en: "Could not send: no connection to the server. Email us at",
    },
    supportOfflineLater: {
      uk: "Не вдалося надіслати: немає зв’язку із сервером. Перевірте інтернет і спробуйте ще раз.",
      en: "Could not send: no connection to the server. Check your internet and try again.",
    },
    supportFromError: {
      uk: "Написати нам",
      en: "Write to us",
    },
    supportDirect: {
      uk: "Пошта підтримки",
      en: "Support email",
    },
    supportWrite: {
      uk: "Написати в підтримку",
      en: "Contact support",
    },
    supportWriteHint: {
      uk: "Питання, проблема чи ідея — ми поруч і допоможемо.",
      en: "A question, a problem or an idea — we are here to help.",
    },
    zoneMismatchTitle: {
      uk: "Час компанії відрізняється від часу на цьому комп’ютері",
      en: "The company time differs from this computer's time",
    },
    zoneMismatchBody: {
      uk: "У компанії зараз {company}, а на комп’ютері — {local}. Вільні години й «минулий час» рахуються за часом компанії, тому запис може потрапити на час, який у вас уже минув. Якщо компанія працює за вашим часом — змініть часовий пояс.",
      en: "The company clock shows {company}, this computer shows {local}. Free hours and past time follow the company clock, so a booking may land on a time that has already passed for you. If the company works on your time, switch the time zone.",
    },
    zoneMismatchFix: {
      uk: "Перейти на час",
      en: "Switch to",
    },
    zoneMismatchKeep: {
      uk: "Залишити як є",
      en: "Keep as is",
    },
    zoneMismatchDone: {
      uk: "Часовий пояс компанії змінено. Перевірте час майбутніх записів.",
      en: "The company time zone was changed. Check the times of upcoming visits.",
    },
    supportSentNumber: {
      uk: "Звернення №{number} прийнято. Відповімо на {email} і в розділі «Підтримка».",
      en: "Request №{number} received. We will reply to {email} and in Support.",
    },
    supportMine: {
      uk: "Мої звернення",
      en: "My requests",
    },
    supportNoRequests: {
      uk: "Звернень поки немає. Якщо щось знадобиться — ми поруч.",
      en: "No requests yet. If you need anything, we are here.",
    },
    supportSignedOut: {
      uk: "Історія звернень з’явиться, коли ви увійдете в акаунт. Без входу відповідь приходить на пошту.",
      en: "Your request history appears after you sign in. Without sign-in, replies come by email.",
    },
    supportRequest: {
      uk: "Звернення",
      en: "Request",
    },
    supportStatusOpen: {
      uk: "Розглядаємо",
      en: "We are on it",
    },
    supportStatusWaiting: {
      uk: "Є відповідь",
      en: "Replied",
    },
    supportStatusSolved: {
      uk: "Вирішено",
      en: "Solved",
    },
    supportStatusClosed: {
      uk: "Закрито",
      en: "Closed",
    },
    supportNewReply: {
      uk: "Нова відповідь",
      en: "New reply",
    },
    supportTeam: {
      uk: "команда LOMVIKO",
      en: "LOMVIKO team",
    },
    supportYou: {
      uk: "Ви",
      en: "You",
    },
    supportReply: {
      uk: "Відповісти",
      en: "Reply",
    },
    supportReplySent: {
      uk: "Надіслано. Ми побачимо ваше повідомлення в цьому ж зверненні.",
      en: "Sent. We will see it in the same request.",
    },
    supportRateQuestion: {
      uk: "Чи вирішили ми ваше питання?",
      en: "Did we solve your issue?",
    },
    supportRateGood: {
      uk: "Так",
      en: "Yes",
    },
    supportRateBad: {
      uk: "Ні",
      en: "No",
    },
    supportRateThanks: {
      uk: "Дякуємо за оцінку — це допомагає нам ставати кращими.",
      en: "Thank you for the rating — it helps us improve.",
    },
    supportRated: {
      uk: "Дякуємо за вашу оцінку.",
      en: "Thank you for your rating.",
    },
    supportClosedHint: {
      uk: "Звернення закрите. Якщо питання повернулося — створіть нове, ми побачимо цю переписку.",
      en: "This request is closed. If the issue is back, start a new one — we will see this conversation.",
    },
    supportNewFollow: {
      uk: "Написати нове звернення",
      en: "Start a new request",
    },
    supportContinues: {
      uk: "продовження звернення",
      en: "continues request",
    },
    legalAcceptLabel: {
      uk: "Я приймаю",
      en: "I accept the",
    },
    legalOffer: {
      uk: "Публічну оферту",
      en: "Public offer",
    },
    legalAnd: {
      uk: "та",
      en: "and the",
    },
    legalAcceptRequired: {
      uk: "Щоб зареєструватися, позначте, що приймаєте Публічну оферту та Політику конфіденційності.",
      en: "To register, tick that you accept the Public offer and the Privacy policy.",
    },
    legalTerms: {
      uk: "Умови користування",
      en: "Terms of use",
    },
    legalTermsTitle: {
      uk: "Умови користування",
      en: "Terms of use",
    },
    legalAcceptRequiredTerms: {
      uk: "Щоб зареєструватися, позначте, що приймаєте Умови користування та Політику конфіденційності.",
      en: "To register, tick that you accept the Terms of use and the Privacy policy.",
    },
    legalCodeSignsTerms: {
      uk: "Код із листа підтверджує вашу пошту і є вашим електронним підписом під згодою з Умовами користування та Політикою конфіденційності.",
      en: "The code from the email confirms your address and works as your electronic signature under the Terms of use and Privacy policy.",
    },
    legalBannerFirstTerms: {
      uk: "Перш ніж продовжити, перегляньте й прийміть Умови користування та Політику конфіденційності LOMVIKO. Це займе хвилину.",
      en: "Before you continue, please review and accept the LOMVIKO Terms of use and Privacy policy. It takes a minute.",
    },
    legalBannerUpdatedTerms: {
      uk: "Ми оновили Умови користування або Політику конфіденційності. Перегляньте нову редакцію й підтвердьте згоду.",
      en: "We have updated the Terms of use or the Privacy policy. Please review the new version and confirm your consent.",
    },
    legalAcceptRequiredPrivacy: {
      uk: "Щоб зареєструватися, позначте, що приймаєте Політику конфіденційності.",
      en: "To register, tick that you accept the Privacy policy.",
    },
    legalCodeSignsPrivacy: {
      uk: "Код із листа підтверджує вашу пошту і є вашим електронним підписом під згодою з Політикою конфіденційності.",
      en: "The code from the email confirms your address and works as your electronic signature under the Privacy policy.",
    },
    legalCodeSigns: {
      uk: "Код із листа підтверджує вашу пошту і є вашим електронним підписом під згодою з Публічною офертою та Політикою конфіденційності.",
      en: "The code from the email confirms your address and works as your electronic signature under the Public offer and Privacy policy.",
    },
    legalBannerTitle: {
      uk: "Ми оновили умови користування",
      en: "We have updated our terms",
    },
    legalBannerFirst: {
      uk: "Перш ніж продовжити, перегляньте й прийміть Публічну оферту та Політику конфіденційності LOMVIKO. Це займе хвилину — і так ми обидва захищені.",
      en: "Before you continue, please review and accept the LOMVIKO Public offer and Privacy policy. It takes a minute and protects us both.",
    },
    legalBannerUpdated: {
      uk: "Ми оновили Публічну оферту або Політику конфіденційності. Перегляньте, будь ласка, нову редакцію й підтвердьте згоду — без цього ми не можемо гарантувати вам ті самі умови.",
      en: "We have updated the Public offer or the Privacy policy. Please review the new version and confirm your consent.",
    },
    legalBannerPrivacyOnly: {
      uk: "Перш ніж продовжити, перегляньте й прийміть Політику конфіденційності LOMVIKO. Це займе хвилину.",
      en: "Before you continue, please review and accept the LOMVIKO Privacy policy. It takes a minute.",
    },
    legalAccept: {
      uk: "Приймаю",
      en: "I accept",
    },
    legalAccepted: {
      uk: "Дякуємо! Згоду збережено.",
      en: "Thank you! Your consent is saved.",
    },
    legalDocuments: {
      uk: "Документи",
      en: "Documents",
    },
    legalBannerTitleFirst: {
      uk: "Прийміть умови користування LOMVIKO",
      en: "Please accept the LOMVIKO terms",
    },
    legalOfferTitle: {
      uk: "Публічна оферта",
      en: "Public offer",
    },
    legalPrivacyAccusative: {
      uk: "Політику конфіденційності",
      en: "Privacy policy",
    },
    payTooMuch: {
      uk: "Сума більша за залишок до оплати ({due}). Якщо вартість візиту змінилася — спочатку натисніть «Змінити суму».",
      en: "The amount is more than what is due ({due}). If the visit price changed, use “Change amount” first.",
    },
    payNothingDue: {
      uk: "Візит уже повністю оплачено. Щоб повернути гроші, введіть суму зі знаком мінус.",
      en: "The visit is already fully paid. To refund, enter the amount with a minus sign.",
    },
    refundTooMuch: {
      uk: "Повернути можна не більше, ніж сплачено ({paid}).",
      en: "You can refund at most what was paid ({paid}).",
    },
    payOverpaid: {
      uk: "Переплата",
      en: "Overpaid",
    },
    payCompensate: {
      uk: "Якщо це повернення — зменшити вартість візиту на цю суму (компенсація клієнту, а не борг)",
      en: "If this is a refund, lower the visit price by this amount (compensation, not a debt)",
    },
    payRefundSaved: {
      uk: "Повернення збережено",
      en: "Refund saved",
    },
    payAmountHint: {
      uk: "Щоб оформити повернення, введіть суму зі знаком мінус, наприклад −200, і оберіть, як повернули гроші.",
      en: "For a refund enter the amount with a minus sign, e.g. −200, and choose how the money was returned.",
    },
    payLiqTitle: {
      uk: "Оплата LiqPay (ПриватБанк)",
      en: "LiqPay payments (PrivatBank)",
    },
    payLiqAbout: {
      uk: "Клієнт оплачує карткою будь-якого банку, Apple Pay, Google Pay або через Приват24 на сторінці LiqPay — за QR-кодом, посиланням або кнопкою в Telegram. Гроші надходять одразу на ваш рахунок, а візит позначається оплаченим автоматично.",
      en: "The client pays by any bank card, Apple Pay, Google Pay or Privat24 on the LiqPay page — via QR code, link or a Telegram button. Money goes straight to your account and the visit is marked paid automatically.",
    },
    payLiqConnect: {
      uk: "Підключити LiqPay",
      en: "Connect LiqPay",
    },
    payLiqPublic: {
      uk: "Публічний ключ (public_key)",
      en: "Public key (public_key)",
    },
    payLiqPrivate: {
      uk: "Приватний ключ (private_key)",
      en: "Private key (private_key)",
    },
    payLiqHint: {
      uk: "Ключі: liqpay.ua → кабінет → Налаштування → API. Для перевірки підійдуть тестові ключі (починаються з sandbox_) — тоді гроші не списуються.",
      en: "Keys: liqpay.ua → account → Settings → API. For a trial use the test keys (starting with sandbox_) — no money is charged.",
    },
    payLiqLegal: {
      uk: "Договір еквайрингу укладено між вами і ПриватБанком, комісію і фіскальні чеки (ПРРО) налаштовуєте у кабінеті LiqPay. LOMVIKO не отримує гроші й не бачить дані карток — лише створює посилання на оплату і фіксує її.",
      en: "The acquiring agreement is between you and PrivatBank; fees and fiscal receipts are set up in your LiqPay account. LOMVIKO never receives the money or sees card details — it only creates the payment link and records the payment.",
    },
    payLiqDone: {
      uk: "LiqPay підключено",
      en: "LiqPay connected",
    },
    payLiqOff: {
      uk: "LiqPay відключено",
      en: "LiqPay disconnected",
    },
    intMore: {
      uk: "Детальніше",
      en: "Details",
    },
    intGroupClients: {
      uk: "Запис клієнтів",
      en: "Client booking",
    },
    intGroupPay: {
      uk: "Онлайн-оплата",
      en: "Online payments",
    },
    intGroupBackup: {
      uk: "Резервні копії",
      en: "Backups",
    },
    intBotShort: {
      uk: "Запис, нагадування і скасування в Telegram",
      en: "Booking, reminders and cancelling in Telegram",
    },
    intMonoShort: {
      uk: "Картка, Apple Pay, Google Pay — гроші одразу на ваш рахунок",
      en: "Card, Apple Pay, Google Pay — money straight to your account",
    },
    intLiqShort: {
      uk: "Картка будь-якого банку, Apple Pay, Google Pay, Приват24",
      en: "Any bank card, Apple Pay, Google Pay, Privat24",
    },
    bookTitle: { uk: "Онлайн-запис", en: "Online booking" },
    bookShort: {
      uk: "Сторінка запису з вашим логотипом: посилання, QR-код і кнопка для сайту",
      en: "A booking page with your logo: link, QR code and a website button",
    },
    bookAboutLong: {
      uk: "Клієнт відкриває посилання з Instagram, Google Карт чи вашого сайту, обирає послугу, спеціаліста і вільний час, залишає ім’я і телефон — і запис одразу з’являється в розкладі. Без реєстрації і без застосунків. Показуються лише послуги з позначкою «Показувати на сайті» і лише справді вільний час.",
      en: "The client opens the link from Instagram, Google Maps or your website, picks a service, specialist and free time, leaves a name and phone — and the visit appears in the schedule at once. No sign-up, no apps. Only services marked “Show on website” and only truly free times are offered.",
    },
    bookTurnOn: { uk: "Увімкнути", en: "Turn on" },
    bookSettings: { uk: "Налаштувати", en: "Settings" },
    bookShareButton: { uk: "Поділитися", en: "Share" },
    bookOpen: { uk: "Відкрити сторінку", en: "Open page" },
    bookEnabled: { uk: "Сторінка запису увімкнена", en: "Booking page is on" },
    bookNoServices: {
      uk: "Жодна послуга ще не показується онлайн. Відкрийте послугу і позначте «Показувати на сайті», інакше клієнтам не буде що обрати.",
      en: "No service is shown online yet. Open a service and tick “Show on website”, otherwise clients have nothing to choose.",
    },
    bookAddress: { uk: "Адреса сторінки", en: "Page address" },
    bookAddressHint: {
      uk: "Латинські літери, цифри і дефіс. Її бачитимуть клієнти, тож краще коротка і схожа на назву.",
      en: "Latin letters, digits and hyphens. Clients will see it, so keep it short and close to your name.",
    },
    bookStyle: { uk: "Стиль", en: "Style" },
    bookStyle_minimal: { uk: "Мінімал", en: "Minimal" },
    bookStyle_warm: { uk: "Тепла", en: "Warm" },
    bookStyle_lux: { uk: "Люкс", en: "Luxe" },
    bookStyle_bright: { uk: "Яскрава", en: "Bright" },
    bookColor: { uk: "Колір", en: "Colour" },
    bookColorOwn: { uk: "Свій колір", en: "Own colour" },
    bookLogo: { uk: "Логотип", en: "Logo" },
    bookLogoHint: {
      uk: "Квадратний, PNG або JPEG. Це той самий логотип, що й у профілі компанії.",
      en: "Square, PNG or JPEG. It is the same logo as in the company profile.",
    },
    bookCover: { uk: "Обкладинка", en: "Cover" },
    bookCoverHint: {
      uk: "Широке фото інтер’єру або робіт. Без обкладинки буде гарний фон у вашому кольорі.",
      en: "A wide photo of the salon or your work. Without it the page uses a background in your colour.",
    },
    bookImageUpload: { uk: "Завантажити", en: "Upload" },
    bookImageRemove: { uk: "Прибрати", en: "Remove" },
    bookImageSet: { uk: "Завантажено", en: "Uploaded" },
    bookImageNone: { uk: "Не додано", en: "Not added" },
    bookAbout: { uk: "Коротко про вас", en: "About you" },
    bookAboutHint: {
      uk: "Наприклад: Затишна студія манікюру біля метро Лук’янівська",
      en: "For example: A cosy nail studio next to the metro",
    },
    bookInstagram: { uk: "Instagram (назва профілю)", en: "Instagram (profile name)" },
    bookProfileHint: {
      uk: "Назва, телефон і адреса беруться з Налаштування → Компанія.",
      en: "Name, phone and address come from Settings → Company.",
    },
    bookSaved: { uk: "Сторінку запису збережено", en: "Booking page saved" },
    bookSavedOff: { uk: "Сторінку запису вимкнено", en: "Booking page turned off" },
    bookShare: { uk: "Поділитися сторінкою запису", en: "Share the booking page" },
    bookShareHint: {
      uk: "Поставте посилання в шапку Instagram, у Google Карти і в повідомлення клієнтам. QR-код — на ресепшн і дзеркала. Кнопку — на свій сайт.",
      en: "Put the link in your Instagram bio, Google Maps and messages. The QR code goes on the counter and mirrors. The button goes on your website.",
    },
    bookLink: { uk: "Посилання", en: "Link" },
    bookQr: { uk: "QR-код", en: "QR code" },
    bookQrHint: {
      uk: "Клієнт наводить камеру телефона — і відкривається запис.",
      en: "The client points the phone camera and booking opens.",
    },
    bookQrSave: { uk: "Зберегти картинку", en: "Save image" },
    bookEmbed: { uk: "Кнопка «Записатися» для сайту", en: "“Book now” button for a website" },
    bookEmbedCopy: { uk: "Скопіювати код кнопки", en: "Copy button code" },
    bookEmbedHint: {
      uk: "Вставте цей рядок у блок «HTML» або «Код» на своєму сайті (Tilda, Wix, WordPress, Хорошоп). На сайті з’явиться кнопка, яка відкриває запис поверх сторінки. Додайте data-float=\"1\", щоб кнопка завжди була в кутку екрана.",
      en: "Paste this line into an “HTML” or “Code” block on your website (Tilda, Wix, WordPress). A button appears that opens booking over the page. Add data-float=\"1\" to keep it in the screen corner.",
    },
    notifyTitle: { uk: "Сповіщення", en: "Notifications" },
    notifyNeedsServer: {
      uk: "Сповіщення надсилає сервер LOMVIKO, навіть коли комп’ютер вимкнений. Увійдіть в обліковий запис компанії, щоб їх налаштувати.",
      en: "Notifications are sent by the LOMVIKO server, even when this computer is off. Sign in to your company account to set them up.",
    },
    notifyOwnersOnly: {
      uk: "Сповіщення про записи й гроші налаштовують власник і адміністратори.",
      en: "Booking and money notifications are set up by the owner and administrators.",
    },
    notifyWhere: { uk: "Куди надсилати", en: "Where to send" },
    notifyWhat: { uk: "Що надсилати", en: "What to send" },
    notifyLink: { uk: "Підключити мій Telegram", en: "Connect my Telegram" },
    notifyLinked: { uk: "Підключено ✓", en: "Connected ✓" },
    notifyLinkHint: {
      uk: "Відкриється бот вашої компанії — натисніть «Старт». Кожен адміністратор підключає свій Telegram.",
      en: "Your company bot opens — press Start. Each administrator connects their own Telegram.",
    },
    notifyLinkedHint: { uk: "Повідомлення приходять від бота {bot}.", en: "Messages come from {bot}." },
    notifyNoBot: { uk: "Спочатку підключіть Telegram-бота", en: "Connect the Telegram bot first" },
    notifyEmail: { uk: "Також на пошту", en: "Also by email" },
    notifyNoMail: { uk: "Пошта ще не налаштована на сервері", en: "Email is not set up on the server yet" },
    notifyMorning: { uk: "Ранкове зведення", en: "Morning summary" },
    notifyMorningTime: { uk: "Час ранкового зведення", en: "Morning summary time" },
    notifyMorningHint: {
      uk: "Записи на сьогодні по майстрах, очікуваний виторг, вільні вікна і підсумки вчорашнього дня.",
      en: "Today's bookings per specialist, expected revenue, free windows and yesterday's results.",
    },
    notifyBooking: { uk: "Нові онлайн-записи", en: "New online bookings" },
    notifyBookingHint: { uk: "Зі сторінки запису, сайту і Telegram-бота.", en: "From the booking page, website and Telegram bot." },
    notifyCancel: { uk: "Скасування й перенесення клієнтами через бота", en: "Cancellations and moves by clients in the bot" },
    notifyPayment: { uk: "Онлайн-оплати monobank і LiqPay", en: "Online payments (monobank, LiqPay)" },
    notifyWeekly: { uk: "Тижневий звіт", en: "Weekly report" },
    notifyWeeklyHint: {
      uk: "Щопонеділка о 9:00: виторг і порівняння з минулим тижнем, візити, неявки, нові клієнти, кожен майстер і його завантаження.",
      en: "Mondays at 9:00: revenue vs the week before, visits, no-shows, new clients, each specialist and their load.",
    },
    notifyMonthly: { uk: "Місячний звіт", en: "Monthly report" },
    notifyMonthlyHint: { uk: "1-го числа о 9:00 — те саме за минулий місяць.", en: "On the 1st at 9:00 — the same for last month." },
    notifyTest: { uk: "Надіслати пробне зведення зараз", en: "Send a test summary now" },
    notifyTestSent: { uk: "Надіслано — перевірте Telegram або пошту", en: "Sent — check Telegram or email" },
    notifyLinkOpened: { uk: "Відкрили Telegram — натисніть «Старт» у боті", en: "Telegram opened — press Start in the bot" },
    notifyLinkedToast: { uk: "Telegram підключено", en: "Telegram connected" },
    payProvider: {
      uk: "Через що оплатити",
      en: "Pay through",
    },
    registrationClosedTitle: { uk: "Реєстрацію тимчасово закрито", en: "Registration is closed for now" },
    registrationClosedText: { uk: "Зараз ми не приймаємо нових користувачів. Залиште заявку на сайті — напишемо, щойно відкриємо реєстрацію.", en: "We are not taking new users right now. Leave a request on the site and we will write as soon as registration opens." },
    registrationClosedButton: { uk: "Залишити заявку", en: "Leave a request" },
    planLockTitle: { uk: "Доступно в тарифі «{plan}» — {price} грн/міс", en: "Available on the {plan} plan — UAH {price}/month" },
    planLockText: { uk: "Щоб перейти на інший тариф, напишіть нам у «Допомога» — перенесемо все за хвилину.", en: "To switch plans, write to us under Help — we will move everything in a minute." },
    planLockButton: { uk: "Порівняти тарифи", en: "Compare plans" },
    planCurrent: { uk: "Тариф", en: "Plan" },
    planFiscal: { uk: "Фіскальні чеки", en: "Fiscal receipts" },
    teamAccess: { uk: "Доступ", en: "Access" },
    teamAccessAll: { uk: "Усе", en: "Everything" },
    teamAccessSchedule: { uk: "Лише розклад", en: "Schedule only" },
    teamAccessHint: { uk: "Розклад бачать усі. Решту вмикайте окремо — роль лише задає початковий набір.", en: "Everyone sees the schedule. Switch the rest on one by one; the role only sets the starting set." },
    teamLoading: { uk: "Завантажуємо команду…", en: "Loading your team…" },
    teamHint: { uk: "Власник має доступ до всього. Права адміністратора й співробітника можна змінити кнопкою «Змінити».", en: "The owner has access to everything. Administrator and employee access can be changed with “Edit”." },
    botReminder: {
      uk: "🔔 Нагадуємо про ваш запис",
      en: "🔔 Your appointment reminder",
    },
    googleConfig: {
      uk: "Некоректна конфігурація Google у видавця застосунку",
      en: "Invalid publisher Google configuration",
    },
    calendarMonth: { uk: "Місяць", en: "Month" },
    calendarYear: { uk: "Рік", en: "Year" },
    calendarHour: { uk: "Година", en: "Hour" },
    calendarMinute: { uk: "Хвилина", en: "Minute" },
    calendarApply: { uk: "Обрати", en: "Select" },
    calendarToday: { uk: "Сьогодні", en: "Today" },
    calendarChoose: { uk: "Обрати дату", en: "Choose date" },
    updateRequired: {
      uk: "Потрібне оновлення. Перегляд і експорт доступні.",
      en: "Update required. Viewing and export remain available.",
    },
    updateSignature: {
      uk: "Не вдалося перевірити підпис оновлення.",
      en: "Update signature could not be verified.",
    },
    updateHash: {
      uk: "Файл оновлення пошкоджений або підмінений.",
      en: "The update file is corrupted or has been replaced.",
    },
    updateDownloadError: {
      uk: "Не вдалося завантажити оновлення.",
      en: "Could not download the update.",
    },
    updatePackagedOnly: {
      uk: "Автоматичне оновлення доступне у встановленій версії LOMVIKO.",
      en: "Automatic updates are available in the installed LOMVIKO app.",
    },
    updatesTitle: { uk: "Версії та оновлення", en: "Versions and updates" },
    updatesSubtitle: {
      uk: "Публікації, обов’язкові оновлення та версії пристроїв.",
      en: "Releases, mandatory updates and device versions.",
    },
    publishRelease: { uk: "Опублікувати версію", en: "Publish release" },
    minimumVersion: { uk: "Мінімальна версія", en: "Minimum version" },
    updateDeadline: { uk: "Термін переходу", en: "Update deadline" },
    updateMessage: { uk: "Повідомлення клієнту", en: "Client message" },
    updateScope: { uk: "Для всіх клієнтів", en: "All customers" },
    updatePolicy: { uk: "Обов’язкове оновлення", en: "Mandatory update" },
    clearPolicy: { uk: "Скасувати вимогу", en: "Clear requirement" },
    releaseVersion: { uk: "Версія", en: "Version" },
    releaseNotes: { uk: "Що нового", en: "Release notes" },
    releasePublished: { uk: "Версію опубліковано", en: "Release published" },
    releaseWithdraw: { uk: "Відкликати версію", en: "Withdraw release" },
    demoCreate: { uk: "Створити демодоступ", en: "Create demo access" },
    demoDays: { uk: "Днів демонстрації (1–30)", en: "Demo days (1–30)" },
    demoCredentials: {
      uk: "Дані демодоступу — збережіть зараз",
      en: "Demo credentials — save now",
    },
    revokeKey: { uk: "Відкликати ключ", en: "Revoke key" },
    licenseAccounts: { uk: "Клієнти", en: "Customers" },
    licenseActive: { uk: "Входи з доступом", en: "Sign-ins with access" },
    licenseTrial: { uk: "На пробному періоді", en: "On free trial" },
    licenseBlocked: { uk: "Вимкнені / прострочені", en: "Disabled / expired" },
    totpCode: { uk: "Код автентифікатора", en: "Authenticator code" },
    totpHint: {
      uk: "Віддалений доступ: секрет адміністратора та одноразовий код. Сесія діє 15 хвилин.",
      en: "Remote access requires the admin secret and a one-time code. Sessions last 15 minutes.",
    },
    updateButton: {
      uk: "Оновити й перезапустити",
      en: "Update and restart",
    },
    updateBackupPassword: {
      uk: "Пароль резервної копії (від 12 символів)",
      en: "Backup password (at least 12 characters)",
    },
    updateBackupHint: {
      uk: "LOMVIKO збереже захищену резервну копію, завантажить перевірене оновлення, встановить його та перезапуститься.",
      en: "LOMVIKO will save a protected backup, download the verified update, install it and restart.",
    },
    updateAvailable: { uk: "Доступне оновлення", en: "Update available" },
    updateInstalling: {
      uk: "Оновлення встановлюється. LOMVIKO перезапуститься автоматично.",
      en: "The update is being installed. LOMVIKO will restart automatically.",
    },
    updateCompleted: {
      uk: "LOMVIKO успішно оновлено до версії",
      en: "LOMVIKO was updated successfully to version",
    },
    updateCancelled: { uk: "Оновлення скасовано", en: "Update cancelled" },
    updateCurrent: { uk: "Поточна версія", en: "Current version" },
    updateNoRelease: {
      uk: "Для цього пристрою немає нової версії.",
      en: "No newer release is available for this device.",
    },
    keyRevokeQuestion: { uk: "Відкликати посилання доступу? Воно більше не спрацює.", en: "Revoke the access link? It will no longer work." },
    updateBlockedBanner: {
      uk: "Оновлення обов’язкове. Перегляд та експорт доступні; зміни заблоковано.",
      en: "An update is required. Viewing and export remain available; changes are blocked.",
    },
    pendingUpdate: { uk: "Оновіть до", en: "Update by" },
    catalogDelete: { uk: "Видалити", en: "Delete" },
    catalogDeleteService: {
      uk: "Видалити послугу?",
      en: "Delete this service?",
    },
    catalogDeleteResource: {
      uk: "Видалити співробітника або ресурс?",
      en: "Delete this staff member or resource?",
    },
    catalogDeleteHint: {
      uk: "Більше не буде доступно для нових записів. Наявні візити, їхні назви та історія залишаться без змін.",
      en: "This will no longer be available for new bookings. Existing appointments, their names and history will be preserved.",
    },
    publisherMissing: {
      uk: "Видавець має налаштувати ключ сервера перед випуском CRM.",
      en: "The publisher must configure the server key before distributing this CRM.",
    },
  };
  let language = "uk";
  try {
    if (globalThis.localStorage?.getItem("orbit.language") === "en")
      language = "en";
  } catch {}
  function t(key, lang = language) {
    const value = messages[key];
    if (!value) throw Error("Unknown message: " + key);
    return value[lang === "en" ? "en" : "uk"];
  }
  function setLanguage(lang) {
    if (!["uk", "en"].includes(lang)) throw Error("Unsupported language");
    language = lang;
  }
  function message(value) {
    const text = String(value || "");
    for (const v of Object.values(messages))
      if (text === v.uk || text === v.en) return v[language];
    return Object.values(messages)
      .filter((v) => v.uk.length > 12 && v.en.length > 12)
      .sort((a, b) => b.uk.length - a.uk.length)
      .reduce(
        (s, v) => s.replaceAll(language === "en" ? v.uk : v.en, v[language]),
        text,
      );
  }
  function locale() {
    return language === "en" ? "en-GB" : "uk-UA";
  }
  return {
    t,
    setLanguage,
    locale,
    message,
    get language() {
      return language;
    },
    supported: ["uk", "en"],
    messages,
  };
});
