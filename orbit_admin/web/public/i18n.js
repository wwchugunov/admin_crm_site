(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.OrbitI18n=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const messages={
"fiveMinutes":{"uk": "5 хвилин", "en": "5 minutes"},"companyBots":{"uk": "Боти компаній", "en": "Company bots"},"botWaiting":{"uk": "Очікує запуску", "en": "Waiting for worker"},"botOnOwnServer":{"uk": "Власний сервер", "en": "Own server"},"botNotConnected":{"uk": "Не підключено", "en": "Not connected"},"trialStarted":{"uk": "Початок пробного періоду", "en": "Trial started"},"registrationRequested":{"uk": "Реєстрація", "en": "Registration"},"botExternalOnline":{"uk": "✓ Власний сервер", "en": "✓ Own server"},"botExternalWaiting":{"uk": "Очікує запуску на власному сервері", "en": "Waiting for your server"},
"panelTitle": {"uk": "Адмін-панель застосунку", "en": "Application admin panel"},
"panelName": {"uk": "Застосунок", "en": "App admin"},
  "m000": {
    "uk": "Підтверджено",
    "en": "Confirmed"
  },
  "m001": {
    "uk": "Завершено",
    "en": "Completed"
  },
  "m002": {
    "uk": "Скасовано",
    "en": "Cancelled"
  },
  "m003": {
    "uk": "Не прийшов",
    "en": "No-show"
  },
  "m004": {
    "uk": "Розклад",
    "en": "Schedule"
  },
  "m005": {
    "uk": "Кожен запис на своєму місці.",
    "en": "Every appointment in its place."
  },
  "m006": {
    "uk": "Клієнти",
    "en": "Clients"
  },
  "m007": {
    "uk": "Історія взаємин, до якої легко повернутися.",
    "en": "Your client relationships at a glance."
  },
  "m008": {
    "uk": "Послуги та ресурси",
    "en": "Services and resources"
  },
  "m009": {
    "uk": "Налаштуйте застосунок для свого бізнесу.",
    "en": "Set up the app for your business."
  },
  "m010": {
    "uk": "Інтеграції",
    "en": "Integrations"
  },
  "m011": {
    "uk": "Менше рутини. Більше часу для клієнтів.",
    "en": "Less routine. More time for your clients."
  },
  "m012": {
    "uk": "Налаштування та дані",
    "en": "Settings and data"
  },
  "m013": {
    "uk": "Ваш бізнес. Ваші правила. Ваші дані.",
    "en": "Your business. Your rules. Your data."
  },
  "m014": {
    "uk": "Дашборд",
    "en": "Dashboard"
  },
  "m015": {
    "uk": "Завантаженість, доходи та популярні послуги за вибраний період.",
    "en": "Occupancy, income and popular services for the selected period."
  },
  "m016": {
    "uk": "Фінансовий звіт",
    "en": "Financial report"
  },
  "m017": {
    "uk": "Вартість візитів, отримані платежі та повернення.",
    "en": "Appointment values, payments and refunds."
  },
  "m018": {
    "uk": "Користувачі та ролі",
    "en": "Users and roles"
  },
  "m019": {
    "uk": "Головний власник керує доступом до компаній.",
    "en": "The main owner manages company access."
  },
  "m020": {
    "uk": "● Підключення…",
    "en": "● Connecting…"
  },
  "m021": {
    "uk": "● Без зв’язку · перегляд",
    "en": "● Offline · view only"
  },
  "m022": {
    "uk": "● Спільна база · підключено",
    "en": "● Shared database · connected"
  },
  "m023": {
    "uk": "● Локальна база",
    "en": "● Local database"
  },
  "m024": {
    "uk": "Збережені дані доступні для перегляду. Зв’язок відновиться автоматично.",
    "en": "Saved data is available to view. Reconnection is automatic."
  },
  "m025": {
    "uk": "Зміни бачать співробітники та бот. Розклад зберігається на цьому пристрої для перегляду без інтернету.",
    "en": "Changes are shared with staff and the bot. A schedule copy is saved on this device for offline viewing."
  },
  "m026": {
    "uk": "Працюйте навіть без інтернету. Ваші дані належать вам.",
    "en": "Work even without internet. Your data belongs to you."
  },
  "m027": {
    "uk": "Підключення до компанії.",
    "en": "Connecting to your company."
  },
  "m028": {
    "uk": "Немає зв’язку з компанією.",
    "en": "Cannot reach your company."
  },
  "m029": {
    "uk": "· оновлено",
    "en": "· updated"
  },
  "m030": {
    "uk": "Доступний перегляд збереженого розкладу",
    "en": "You can view the saved schedule"
  },
  "m031": {
    "uk": ". Створення та зміна записів відновляться після підключення. Бот на робочому сервері продовжує приймати записи.",
    "en": ". Creating and editing appointments will resume after reconnection. The bot continues taking bookings on a running server."
  },
  "m032": {
    "uk": "Спільна база компанії",
    "en": "Shared company database"
  },
  "m033": {
    "uk": "База на вашому пристрої",
    "en": "Database on your device"
  },
  "m034": {
    "uk": "Зміни видно на всіх підключених пристроях.",
    "en": "Changes are visible on all connected devices."
  },
  "m035": {
    "uk": "Вийти",
    "en": "Sign out"
  },
  "m036": {
    "uk": "Увійти",
    "en": "Sign in"
  },
  "m037": {
    "uk": "Логотип компанії",
    "en": "Company logo"
  },
  "m038": {
    "uk": "Зберегти профіль",
    "en": "Save profile"
  },
  "m039": {
    "uk": "Логотип",
    "en": "Logo"
  },
  "m040": {
    "uk": "Телефон компанії",
    "en": "Business phone"
  },
  "m041": {
    "uk": "Валюта · UAH, EUR, USD",
    "en": "Currency · UAH, EUR, USD"
  },
  "m042": {
    "uk": "Адреса",
    "en": "Address"
  },
  "m043": {
    "uk": "Часовий пояс",
    "en": "Time zone"
  },
  "m044": {
    "uk": "Початок робочого дня",
    "en": "Opening time"
  },
  "m045": {
    "uk": "Кінець робочого дня",
    "en": "Closing time"
  },
  "m046": {
    "uk": "Пн",
    "en": "Mon"
  },
  "m047": {
    "uk": "Вт",
    "en": "Tue"
  },
  "m048": {
    "uk": "Ср",
    "en": "Wed"
  },
  "m049": {
    "uk": "Чт",
    "en": "Thu"
  },
  "m050": {
    "uk": "Пт",
    "en": "Fri"
  },
  "m051": {
    "uk": "Сб",
    "en": "Sat"
  },
  "m052": {
    "uk": "Нд",
    "en": "Sun"
  },
  "m053": {
    "uk": "Вибрати логотип",
    "en": "Choose logo"
  },
  "m054": {
    "uk": "PNG/JPEG · до 2 МБ",
    "en": "PNG/JPEG · up to 2 MB"
  },
  "m055": {
    "uk": "Робочі дні для онлайн-запису",
    "en": "Working days for online booking"
  },
  "m056": {
    "uk": "Увімкнути API запису для сайту",
    "en": "Enable website booking API"
  },
  "m057": {
    "uk": "Без сайту залиште вимкненим. API працює в серверному режимі; послуги публікуються окремо.",
    "en": "Leave off if you have no website. The API works in server mode; publish services separately."
  },
  "m058": {
    "uk": "Вітаємо в Orbit",
    "en": "Welcome to Orbit"
  },
  "m059": {
    "uk": "Компанію вже створив адміністратор? Увійдіть за логіном і паролем. Для власного бізнесу заповніть профіль нижче.",
    "en": "Company already set up by your administrator? Sign in. To run your own business, fill in the profile below."
  },
  "m060": {
    "uk": "Увійти в готову компанію",
    "en": "Sign in to an existing company"
  },
  "m061": {
    "uk": "Назва компанії",
    "en": "Company name"
  },
  "m062": {
    "uk": "Моя компанія",
    "en": "My company"
  },
  "m063": {
    "uk": "Тип бізнесу",
    "en": "Business type"
  },
  "m064": {
    "uk": "Б’юті та послуги",
    "en": "Beauty and services"
  },
  "m065": {
    "uk": "СТО та автосервіс",
    "en": "Vehicle repair and service"
  },
  "m066": {
    "uk": "Інший бізнес",
    "en": "Other business"
  },
  "m067": {
    "uk": "Компанію налаштовано. Додайте послуги та спеціалістів.",
    "en": "Company configured. Add services and specialists."
  },
  "m068": {
    "uk": "Створити свою компанію",
    "en": "Create your company"
  },
  "m069": {
    "uk": "День",
    "en": "Day"
  },
  "m070": {
    "uk": "Місяць",
    "en": "Month"
  },
  "m071": {
    "uk": "Рік",
    "en": "Year"
  },
  "m072": {
    "uk": "Період",
    "en": "Period"
  },
  "m073": {
    "uk": "Завантаженість",
    "en": "Occupancy"
  },
  "m074": {
    "uk": "год зайнято /",
    "en": "h booked /"
  },
  "m075": {
    "uk": "год доступно",
    "en": "h available"
  },
  "m076": {
    "uk": "Записи",
    "en": "Bookings"
  },
  "m077": {
    "uk": "учасників",
    "en": "participants"
  },
  "m078": {
    "uk": "Дохід",
    "en": "Income"
  },
  "m079": {
    "uk": "Платежі",
    "en": "Payments"
  },
  "m080": {
    "uk": "· повернення",
    "en": "· refunds"
  },
  "m081": {
    "uk": "Популярна послуга",
    "en": "Most popular service"
  },
  "m082": {
    "uk": "Немає записів",
    "en": "No bookings"
  },
  "m083": {
    "uk": "записів ·",
    "en": "bookings ·"
  },
  "m084": {
    "uk": "Виберіть інший період",
    "en": "Choose another period"
  },
  "m085": {
    "uk": "годинами",
    "en": "hour"
  },
  "m086": {
    "uk": "днями",
    "en": "day"
  },
  "m087": {
    "uk": "місяцями",
    "en": "month"
  },
  "m088": {
    "uk": "Завантаженість у відсотках",
    "en": "Occupancy percentage"
  },
  "m089": {
    "uk": "Платежі за вирахуванням повернень",
    "en": "Payments minus refunds"
  },
  "m090": {
    "uk": "Дохід за",
    "en": "Income by"
  },
  "m091": {
    "uk": "ПОСЛУГА",
    "en": "SERVICE"
  },
  "m092": {
    "uk": "ЗАПИСИ",
    "en": "BOOKINGS"
  },
  "m093": {
    "uk": "УЧАСНИКИ",
    "en": "PARTICIPANTS"
  },
  "m094": {
    "uk": "ЧАСТКА ЗАПИСІВ",
    "en": "BOOKING SHARE"
  },
  "m095": {
    "uk": "Немає записів за період",
    "en": "No bookings in this period"
  },
  "m096": {
    "uk": "Після створення записів тут з’явиться рейтинг послуг.",
    "en": "The service ranking will appear once bookings are created."
  },
  "m097": {
    "uk": "ДОХІД",
    "en": "INCOME"
  },
  "m098": {
    "uk": "Дохід — фактичні платежі за вирахуванням повернень за датою платежу; це не прибуток.",
    "en": "Income is actual payments minus refunds by payment date; it is not profit."
  },
  "m099": {
    "uk": "Завантаженість за",
    "en": "Occupancy by"
  },
  "m100": {
    "uk": "Популярні послуги",
    "en": "Popular services"
  },
  "m101": {
    "uk": "За кількістю записів за період",
    "en": "By bookings in this period"
  },
  "m102": {
    "uk": "Показники за періодами",
    "en": "Period breakdown"
  },
  "m103": {
    "uk": "ПЕРІОД",
    "en": "PERIOD"
  },
  "m104": {
    "uk": "ЗАВАНТАЖЕНІСТЬ",
    "en": "OCCUPANCY"
  },
  "m105": {
    "uk": "Завантаженість — зайнятий час співробітників і постів у робочі години за поточним графіком компанії. Кілька ресурсів враховуються окремо. Записи та популярність рахуються за датою візиту; скасування й неявки виключені.",
    "en": "Occupancy is booked staff and bay time within the current business schedule. Each reserved resource is counted separately. Bookings and popularity use appointment dates; cancellations and no-shows are excluded."
  },
  "m106": {
    "uk": "Недостатньо прав",
    "en": "Insufficient permissions"
  },
  "m107": {
    "uk": "Фінансовий звіт доступний власнику та адміністратору.",
    "en": "The financial report is available to owners and administrators."
  },
  "m108": {
    "uk": "Вартість візитів",
    "en": "Appointment value"
  },
  "m109": {
    "uk": "Збережена на момент запису",
    "en": "Fixed when booked"
  },
  "m110": {
    "uk": "Отримано з урахуванням повернень",
    "en": "Received after refunds"
  },
  "m111": {
    "uk": "За датою фактичного платежу",
    "en": "By actual payment date"
  },
  "m112": {
    "uk": "Витрати завершених візитів",
    "en": "Completed appointment costs"
  },
  "m113": {
    "uk": "За датою запису",
    "en": "By appointment date"
  },
  "m114": {
    "uk": "Платежі мінус витрати",
    "en": "Payments minus costs"
  },
  "m115": {
    "uk": "Управлінська оцінка",
    "en": "Management estimate"
  },
  "m116": {
    "uk": "Готівка",
    "en": "Cash"
  },
  "m117": {
    "uk": "Картка",
    "en": "Card"
  },
  "m118": {
    "uk": "Переказ",
    "en": "Transfer"
  },
  "m119": {
    "uk": "Повернення",
    "en": "Refund"
  },
  "m120": {
    "uk": "ДАТА",
    "en": "DATE"
  },
  "m121": {
    "uk": "СУМА",
    "en": "AMOUNT"
  },
  "m122": {
    "uk": "СПОСІБ",
    "en": "METHOD"
  },
  "m123": {
    "uk": "Платежів поки немає",
    "en": "No payments yet"
  },
  "m124": {
    "uk": "У розкладі натисніть «Оплата» біля потрібного запису. Вартість послуги й отриманий платіж враховуються окремо.",
    "en": "Select Payment next to the appointment in your schedule. Service value and payments are tracked separately."
  },
  "m125": {
    "uk": "Місяць звіту",
    "en": "Report month"
  },
  "m126": {
    "uk": "Платежі та повернення",
    "en": "Payments and refunds"
  },
  "m127": {
    "uk": "Це управлінський звіт. Податки та фіскальні чеки тут не розраховуються. Повернення — окрема від’ємна операція; зміна ціни послуги не змінює вже створені візити.",
    "en": "This is a management report. It does not calculate taxes or issue fiscal receipts. Refunds are separate negative transactions; price changes do not alter existing appointments."
  },
  "m128": {
    "uk": "Увійдіть у спільну компанію",
    "en": "Sign in to a shared company"
  },
  "m129": {
    "uk": "Користувачами керує головний власник компанії на сервері.",
    "en": "The main company owner manages users on the server."
  },
  "m130": {
    "uk": "Головний власник",
    "en": "Main owner"
  },
  "m131": {
    "uk": "Адміністратор",
    "en": "Administrator"
  },
  "m132": {
    "uk": "Співробітник",
    "en": "Staff member"
  },
  "m133": {
    "uk": "＋ Ще один бізнес",
    "en": "＋ Another business"
  },
  "m134": {
    "uk": "＋ Користувач",
    "en": "＋ User"
  },
  "m135": {
    "uk": "Вимкнено",
    "en": "Disabled"
  },
  "m136": {
    "uk": "Доступний",
    "en": "Enabled"
  },
  "m137": {
    "uk": "Керувати",
    "en": "Manage"
  },
  "m138": {
    "uk": "Ваш акаунт",
    "en": "Your account"
  },
  "m139": {
    "uk": "КОРИСТУВАЧ",
    "en": "USER"
  },
  "m140": {
    "uk": "РОЛЬ",
    "en": "ROLE"
  },
  "m141": {
    "uk": "СТАТУС",
    "en": "STATUS"
  },
  "m142": {
    "uk": "ДІЇ",
    "en": "ACTIONS"
  },
  "m143": {
    "uk": "Завантажте користувачів",
    "en": "Load users"
  },
  "m144": {
    "uk": "Натисніть «Оновити список», щоб отримати поточні ролі.",
    "en": "Select Refresh list to load current roles."
  },
  "m145": {
    "uk": "Оновити список",
    "en": "Refresh list"
  },
  "m146": {
    "uk": "Доступом керує власник",
    "en": "Access is managed by the owner"
  },
  "m147": {
    "uk": "Адміністратор керує послугами, фінансами й інтеграціями. Співробітник працює з клієнтами та записами.",
    "en": "Administrators manage services, finances and integrations. Staff manage clients and bookings."
  },
  "m148": {
    "uk": "Ваша роль:",
    "en": "Your role:"
  },
  "m149": {
    "uk": "Вхід виконано",
    "en": "Signed in"
  },
  "m150": {
    "uk": "Локальний режим",
    "en": "Local mode"
  },
  "m151": {
    "uk": "Доступ ліцензується сервером і прив’язаний до ключа пристрою.",
    "en": "Access is licensed by the server and tied to the device key."
  },
  "m152": {
    "uk": "Збірка для оцінювання. Комерційний захист вмикається зі штатним ключем видавця.",
    "en": "Evaluation build. Commercial protection is enabled with the publisher trust key."
  },
  "m153": {
    "uk": "Акаунт і підключення",
    "en": "Account and connection"
  },
  "m154": {
    "uk": "Вхід за логіном і паролем завантажує компанію, права та спільну базу із сервера. Видавець враховує користувача, пристрої й час зв’язку. Токени інтеграцій недоступні інтерфейсу.",
    "en": "Signing in loads your company, permissions and shared database. The publisher tracks users, devices and connection times. Integration tokens are not exposed to the interface."
  },
  "m155": {
    "uk": "Увійти в компанію",
    "en": "Sign in to company"
  },
  "m156": {
    "uk": "Резервне підключення за запрошенням",
    "en": "Alternative connection by invitation"
  },
  "m157": {
    "uk": "Записи на день",
    "en": "Bookings for the day"
  },
  "m158": {
    "uk": "У розкладі",
    "en": "In the schedule"
  },
  "m159": {
    "uk": "Очікувана виручка",
    "en": "Expected revenue"
  },
  "m160": {
    "uk": "За вартістю послуг · без платежів",
    "en": "By service value · excluding payments"
  },
  "m161": {
    "uk": "Завершено",
    "en": "Completed"
  },
  "m162": {
    "uk": "Візити за вибраний день",
    "en": "Appointments on the selected day"
  },
  "m163": {
    "uk": "У вашій клієнтській базі",
    "en": "In your client database"
  },
  "m164": {
    "uk": "ПОСТ / МАЙСТЕР",
    "en": "BAY / SPECIALIST"
  },
  "m165": {
    "uk": "СПЕЦІАЛІСТ",
    "en": "SPECIALIST"
  },
  "m166": {
    "uk": "Оплата / повернення",
    "en": "Payment / refund"
  },
  "m167": {
    "uk": "Завершити",
    "en": "Complete"
  },
  "m168": {
    "uk": "Скасувати",
    "en": "Cancel"
  },
  "m169": {
    "uk": "до",
    "en": "until"
  },
  "m170": {
    "uk": "ЧАС",
    "en": "TIME"
  },
  "m171": {
    "uk": "КЛІЄНТ / ПОСЛУГА",
    "en": "CLIENT / SERVICE"
  },
  "m172": {
    "uk": "День відкритий для нових записів",
    "en": "This day is open for bookings"
  },
  "m173": {
    "uk": "Додайте клієнта, послугу та спеціаліста — створіть перший запис.",
    "en": "Add a client, service and specialist to create your first booking."
  },
  "m174": {
    "uk": "＋ Додати запис",
    "en": "＋ Add booking"
  },
  "m175": {
    "uk": "підключено",
    "en": "connected"
  },
  "m176": {
    "uk": "не підключено",
    "en": "not connected"
  },
  "m177": {
    "uk": "Остання копія:",
    "en": "Last backup:"
  },
  "m178": {
    "uk": "Резервне копіювання ще не налаштовано.",
    "en": "Backups are not configured yet."
  },
  "m179": {
    "uk": "Бот працює на сервері компанії.",
    "en": "The bot runs on your company server."
  },
  "m180": {
    "uk": "Для локального бота застосунок має бути відкритим.",
    "en": "The app must stay open for the local bot."
  },
  "m181": {
    "uk": "Попередній день",
    "en": "Previous day"
  },
  "m182": {
    "uk": "Дата розкладу",
    "en": "Schedule date"
  },
  "m183": {
    "uk": "Наступний день",
    "en": "Next day"
  },
  "m184": {
    "uk": "Усе під контролем",
    "en": "Everything under control"
  },
  "m185": {
    "uk": "Локальна база доступна",
    "en": "Local database available"
  },
  "m186": {
    "uk": "Налаштувати інтеграції ↗",
    "en": "Set up integrations ↗"
  },
  "m187": {
    "uk": "Менше пропущених візитів",
    "en": "Fewer missed appointments"
  },
  "m188": {
    "uk": "Бот нагадає клієнтам про запис за 24 години та за 2 години.",
    "en": "The bot reminds clients 24 hours and 2 hours before their appointment."
  },
  "m189": {
    "uk": "Підключено",
    "en": "Connected"
  },
  "m190": {
    "uk": "Посилання підключення",
    "en": "Connection link"
  },
  "m191": {
    "uk": "КЛІЄНТ",
    "en": "CLIENT"
  },
  "m192": {
    "uk": "ТЕЛЕФОН",
    "en": "PHONE"
  },
  "m193": {
    "uk": "Нічого не знайдено",
    "en": "No results"
  },
  "m194": {
    "uk": "Тут будуть ваші клієнти",
    "en": "Your clients will appear here"
  },
  "m195": {
    "uk": "Додайте клієнта вручну або підключіть бота: нові клієнти з’являться після згоди на обробку даних.",
    "en": "Add clients manually or connect the bot. New clients appear after giving consent."
  },
  "m196": {
    "uk": "Пошук за ім’ям або телефоном",
    "en": "Search by name or phone"
  },
  "m197": {
    "uk": "＋ Додати клієнта",
    "en": "＋ Add client"
  },
  "m198": {
    "uk": "видима",
    "en": "visible"
  },
  "m199": {
    "uk": "прихована",
    "en": "hidden"
  },
  "m200": {
    "uk": "хв · до",
    "en": "min · up to"
  },
  "m201": {
    "uk": "учасників ·",
    "en": "participants ·"
  },
  "m202": {
    "uk": "ресурсів",
    "en": "resources"
  },
  "m203": {
    "uk": "Бот:",
    "en": "Bot:"
  },
  "m204": {
    "uk": "· Сайт:",
    "en": "· Website:"
  },
  "m205": {
    "uk": "/ особу",
    "en": "/ person"
  },
  "m206": {
    "uk": "Змінити",
    "en": "Edit"
  },
  "m207": {
    "uk": "Додайте першу послугу",
    "en": "Add your first service"
  },
  "m208": {
    "uk": "Укажіть тривалість, ціну на учасника та доступність для запису.",
    "en": "Set the duration, price per participant and booking channels."
  },
  "m209": {
    "uk": "Пости та майстри",
    "en": "Bays and specialists"
  },
  "m210": {
    "uk": "Спеціалісти та ресурси",
    "en": "Specialists and resources"
  },
  "m211": {
    "uk": "Хто або де надає послугу?",
    "en": "Who provides the service, and where?"
  },
  "m212": {
    "uk": "Створіть спеціалістів, кабінети або пости. В одному записі можна зарезервувати кілька ресурсів.",
    "en": "Add specialists, rooms or bays. A booking can reserve multiple resources."
  },
  "m213": {
    "uk": "Послуги",
    "en": "Services"
  },
  "m214": {
    "uk": "＋ Послуга",
    "en": "＋ Service"
  },
  "m215": {
    "uk": "＋ Ресурс",
    "en": "＋ Resource"
  },
  "m216": {
    "uk": "Бот читає актуальні послуги при виборі. Нова ціна або назва доступні для нових записів; старі візити зберігають вартість. Робочі години та дні задаються у профілі. Додаткові вільні ресурси бот підбирає автоматично.",
    "en": "The bot reads the current service list. Changes apply to new bookings; existing visits retain their value. Set working hours and days in your profile. The bot assigns additional free resources automatically."
  },
  "m217": {
    "uk": "Не підключено",
    "en": "Not connected"
  },
  "m218": {
    "uk": "Скопіюйте посилання для нових клієнтів. Для наявних використовуйте персональне посилання з розділу «Клієнти».",
    "en": "Copy this link for new clients. For existing clients, use their personal link in Clients."
  },
  "m219": {
    "uk": "Перевірити бота",
    "en": "Check bot"
  },
  "m220": {
    "uk": "Замінити токен",
    "en": "Replace token"
  },
  "m221": {
    "uk": "Відключити",
    "en": "Disconnect"
  },
  "m222": {
    "uk": "Підключити бота",
    "en": "Connect bot"
  },
  "m223": {
    "uk": "На сервері він зберігається зашифрованим.",
    "en": "It is stored encrypted on the server."
  },
  "m224": {
    "uk": "На комп’ютері він зберігається у захищеному сховищі ОС.",
    "en": "It is stored in the OS secure storage on your computer."
  },
  "m225": {
    "uk": "Збережених копій ще немає.",
    "en": "No backups saved yet."
  },
  "m226": {
    "uk": "Зберегти зараз",
    "en": "Back up now"
  },
  "m227": {
    "uk": "Зберегти ключ відновлення",
    "en": "Save recovery key"
  },
  "m228": {
    "uk": "Очікуємо входу в Google…",
    "en": "Waiting for Google sign-in…"
  },
  "m229": {
    "uk": "Увійти через Google",
    "en": "Sign in with Google"
  },
  "m230": {
    "uk": "Скасувати вхід",
    "en": "Cancel sign-in"
  },
  "m231": {
    "uk": "Натисніть кнопку та надайте доступ у браузері. Після підключення збережіть ключ відновлення копій.",
    "en": "Select the button and grant access in your browser. Save your recovery key after connecting."
  },
  "m232": {
    "uk": "Підключення Google ще не налаштоване видавцем застосунку.",
    "en": "Google connection has not been configured by the publisher yet."
  },
  "m233": {
    "uk": "Увімкнено",
    "en": "Enabled"
  },
  "m234": {
    "uk": "Вимкнено",
    "en": "Disabled"
  },
  "m235": {
    "uk": "API для сайту",
    "en": "Website API"
  },
  "m236": {
    "uk": "Вмикається у профілі компанії. Публікуйте послуги для сайту окремо від Telegram. Сервер сайту отримує каталог і вільний час, а потім створює запис.",
    "en": "Enable it in the company profile. Publish website services separately from Telegram. Your website server loads services and availability, then creates a booking."
  },
  "m237": {
    "uk": "Записи та послуги спільні для застосунків і бота. Бот працює, поки сервер увімкнений. Google Drive зберігає резервні копії вибраної компанії через цей застосунок.",
    "en": "Apps and the bot share bookings and services. The bot runs while the server is available. This app saves company backups to Google Drive."
  },
  "m238": {
    "uk": "У локальному режимі бот працює лише з відкритим застосунком. Для спільної бази й серверного бота увійдіть за логіном і паролем.",
    "en": "The local bot requires the app to stay open. Sign in for a shared database and a server bot."
  },
  "m239": {
    "uk": "Telegram-бот",
    "en": "Telegram bot"
  },
  "m240": {
    "uk": "Клієнт вибирає послугу, спеціаліста й вільний час. Отримує нагадування та може скасувати запис.",
    "en": "Clients choose a service, specialist and available time. They receive reminders and can cancel bookings."
  },
  "m241": {
    "uk": "Стан:",
    "en": "Status:"
  },
  "m242": {
    "uk": "Токен від BotFather вводиться один раз.",
    "en": "Enter your BotFather token once."
  },
  "m243": {
    "uk": "Бот має бути виділений цій CRM. Клієнт сам запускає бота й дає згоду.",
    "en": "Use a dedicated bot for this CRM. Clients start the bot and give consent themselves."
  },
  "m244": {
    "uk": "Google Drive власника",
    "en": "Owner’s Google Drive"
  },
  "m245": {
    "uk": "Повна зашифрована копія бази щогодини, поки застосунок відкритий. Кожна копія — окремий файл на Google Drive власника.",
    "en": "A complete encrypted backup every hour while the app is open. Each backup is a separate file in the owner’s Google Drive."
  },
  "m246": {
    "uk": "Копії не містять токенів.",
    "en": "Backups do not include tokens."
  },
  "m247": {
    "uk": "Режим роботи настільної версії.",
    "en": "Desktop operating mode."
  },
  "m248": {
    "uk": "Уся база · JSON",
    "en": "Full database · JSON"
  },
  "m249": {
    "uk": "Усі таблиці · CSV",
    "en": "All tables · CSV"
  },
  "m250": {
    "uk": "Зашифрована копія",
    "en": "Encrypted backup"
  },
  "m251": {
    "uk": "Відновити локальну копію",
    "en": "Restore local backup"
  },
  "m252": {
    "uk": "Повний експорт доступний власнику та адміністратору.",
    "en": "Full export is available to owners and administrators."
  },
  "m253": {
    "uk": "У збірці налаштований довірений ключ видавця.",
    "en": "The publisher trust key is configured in this build."
  },
  "m254": {
    "uk": "Збірка для оцінювання: комерційне блокування вимкнене. Для випуску задайте публічний ключ сервера.",
    "en": "Evaluation build: commercial enforcement is off. Configure the server public key for release."
  },
  "m255": {
    "uk": "Спільна серверна база",
    "en": "Shared server database"
  },
  "m256": {
    "uk": "Локальна база",
    "en": "Local database"
  },
  "m257": {
    "uk": "Компанія, бот і застосунки використовують спільну серверну базу. Зміни завантажуються при оновленні екрана. Без сервера доступний перегляд останньої копії.",
    "en": "Your company, bot and apps share a server database. Screens refresh changes automatically. The latest copy remains available to view without the server."
  },
  "m258": {
    "uk": "Локальний режим працює на одному комп’ютері. Для співробітників і кількох пристроїв увійдіть у серверну компанію.",
    "en": "Local mode runs on one computer. Sign in to a server company for staff and multiple devices."
  },
  "m259": {
    "uk": "Профіль компанії",
    "en": "Company profile"
  },
  "m260": {
    "uk": "Назва",
    "en": "Name"
  },
  "m261": {
    "uk": "Експорт і резервні копії",
    "en": "Export and backups"
  },
  "m262": {
    "uk": "Повна база вибраної компанії: клієнти, учасники візитів, ресурси, ціни, платежі та журнал дій.",
    "en": "The full company database: clients, participants, resources, prices, payments and activity log."
  },
  "m263": {
    "uk": "JSON і CSV містять персональні дані відкритим текстом. Копія .orbit захищена паролем. Спільну базу відновлює оператор із серверної копії; тут відновлюється локальна база.",
    "en": "JSON and CSV contain personal data in plain text. The .orbit backup is password protected. The server operator restores shared databases; this action restores local data."
  },
  "m264": {
    "uk": "Вхід і резервний ключ",
    "en": "Sign-in and backup key"
  },
  "m265": {
    "uk": "Основний спосіб доступу — логін і пароль. Ліцензія пристрою видається автоматично. Для окремої локальної компанії можна застосувати підписаний ключ.",
    "en": "Sign in with your email and password. The device license is issued automatically. A separate local company can use a signed key."
  },
  "m266": {
    "uk": "Увійти за логіном",
    "en": "Sign in"
  },
  "m267": {
    "uk": "Увести ключ",
    "en": "Enter key"
  },
  "m268": {
    "uk": "ID пристрою",
    "en": "Device ID"
  },
  "m269": {
    "uk": "Зберігання даних",
    "en": "Data storage"
  },
  "m270": {
    "uk": "Google Drive — незалежні зашифровані резервні копії. Excel підходить для експорту й аналізу, але не для спільної робочої бази.",
    "en": "Google Drive stores independent encrypted backups. Use Excel for export and analysis, not as a shared working database."
  },
  "m271": {
    "uk": "Зберегти",
    "en": "Save"
  },
  "m272": {
    "uk": "Спочатку додайте клієнта, послугу та ресурс у відповідних розділах.",
    "en": "First add a client, service and resource in their sections."
  },
  "m273": {
    "uk": "Новий запис",
    "en": "New booking"
  },
  "m274": {
    "uk": "Клієнти · можна вибрати кількох",
    "en": "Clients · multiple selection"
  },
  "m275": {
    "uk": "Послуга",
    "en": "Service"
  },
  "m276": {
    "uk": "Спеціалісти / пости · кілька одночасно",
    "en": "Specialists / bays · multiple selection"
  },
  "m277": {
    "uk": "Дата й час компанії",
    "en": "Business date and time"
  },
  "m278": {
    "uk": "Часовий пояс:",
    "en": "Time zone:"
  },
  "m279": {
    "uk": "Учасників разом, включно з гостями",
    "en": "Participants including guests"
  },
  "m280": {
    "uk": "Повна вартість візиту",
    "en": "Total appointment value"
  },
  "m281": {
    "uk": "Витрати на візит",
    "en": "Appointment costs"
  },
  "m282": {
    "uk": "Коментар",
    "en": "Notes"
  },
  "m283": {
    "uk": "Запис створено",
    "en": "Booking created"
  },
  "m284": {
    "uk": "⌘ на Mac або Ctrl на Windows — вибрати кілька.",
    "en": "Hold ⌘ on Mac or Ctrl on Windows for multiple selection."
  },
  "m285": {
    "uk": "Не вдалося визначити час",
    "en": "Could not determine the time"
  },
  "m286": {
    "uk": "Тривалість, хвилин",
    "en": "Duration in minutes"
  },
  "m287": {
    "uk": "Ціна на учасника",
    "en": "Price per participant"
  },
  "m288": {
    "uk": "Максимум учасників",
    "en": "Maximum participants"
  },
  "m289": {
    "uk": "Потрібна кількість ресурсів",
    "en": "Required resource count"
  },
  "m290": {
    "uk": "Доступна для запису через бота",
    "en": "Available for bot booking"
  },
  "m291": {
    "uk": "Доступна в API сайту",
    "en": "Available in the website API"
  },
  "m292": {
    "uk": "Сервер компанії",
    "en": "Company server"
  },
  "m293": {
    "uk": "Увійти до своєї компанії",
    "en": "Sign in to your company"
  },
  "m294": {
    "uk": "Логін · email",
    "en": "Login · email"
  },
  "m295": {
    "uk": "Пароль",
    "en": "Password"
  },
  "m296": {
    "uk": "Увійдіть один раз. Компанія, послуги й співробітники завантажаться автоматично; вхід збережеться на цьому комп’ютері. Для першого входу потрібен інтернет.",
    "en": "Sign in once. Your company, services and staff load automatically; sign-in is saved on this computer. Internet is required for the first sign-in."
  },
  "m297": {
    "uk": "У цій тестовій збірці адресу компанії ще не задав видавець.",
    "en": "The publisher has not configured a company address in this test build yet."
  },
  "m298": {
    "uk": "Вхід виконано. Можна працювати.",
    "en": "Signed in. Ready to work."
  },
  "m299": {
    "uk": "Змінити послугу",
    "en": "Edit service"
  },
  "m300": {
    "uk": "Оплата або повернення",
    "en": "Payment or refund"
  },
  "m301": {
    "uk": "Сума · повернення зі знаком мінус",
    "en": "Amount · negative for a refund"
  },
  "m302": {
    "uk": "Спосіб",
    "en": "Method"
  },
  "m303": {
    "uk": "Додати користувача",
    "en": "Add user"
  },
  "m304": {
    "uk": "Ім’я",
    "en": "Name"
  },
  "m305": {
    "uk": "Початковий пароль",
    "en": "Initial password"
  },
  "m306": {
    "uk": "Роль",
    "en": "Role"
  },
  "m307": {
    "uk": "Доступ користувача",
    "en": "User access"
  },
  "m308": {
    "uk": "Доступ",
    "en": "Access"
  },
  "m309": {
    "uk": "Дозволено",
    "en": "Allowed"
  },
  "m310": {
    "uk": "Новий пароль · необов’язково",
    "en": "New password · optional"
  },
  "m311": {
    "uk": "Ще один бізнес",
    "en": "Another business"
  },
  "m312": {
    "uk": "Компанію створено. Налаштуйте послуги та профіль.",
    "en": "Company created. Configure services and your profile."
  },
  "m313": {
    "uk": "Бот @",
    "en": "Bot @"
  },
  "m314": {
    "uk": "відповідає на getMe. Для перевірки запису клієнт має надіслати /start.",
    "en": "responds to getMe. A client should send /start to test booking."
  },
  "m315": {
    "uk": "Підключення до видавця Orbit",
    "en": "Connect to the Orbit publisher"
  },
  "m316": {
    "uk": "Адреса сервера видавця",
    "en": "Publisher server address"
  },
  "m317": {
    "uk": "Код запрошення",
    "en": "Invitation code"
  },
  "m318": {
    "uk": "Натискаючи «Підключити», ви реєструєте пристрій у видавця. Передаються ключ пристрою, ОС, версія та час зв’язку. Записи клієнтів, Google і Telegram-токени не передаються.",
    "en": "Connecting registers this device with the publisher. Its key, OS, version and connection time are shared. Client bookings and Google or Telegram tokens are not sent."
  },
  "m319": {
    "uk": "Пристрій зареєстровано у видавця",
    "en": "Device registered with the publisher"
  },
  "m320": {
    "uk": "Підключити",
    "en": "Connect"
  },
  "m321": {
    "uk": "Додати клієнта",
    "en": "Add client"
  },
  "m322": {
    "uk": "Телефон",
    "en": "Phone"
  },
  "m323": {
    "uk": "Примітка / автомобіль",
    "en": "Notes / vehicle"
  },
  "m324": {
    "uk": "Додати послугу",
    "en": "Add service"
  },
  "m325": {
    "uk": "Додати ресурс",
    "en": "Add resource"
  },
  "m326": {
    "uk": "Ім’я спеціаліста або назва поста",
    "en": "Specialist name or bay name"
  },
  "m327": {
    "uk": "Підключити Telegram-бота",
    "en": "Connect Telegram bot"
  },
  "m328": {
    "uk": "Створіть окремого бота через @BotFather і вставте токен. Після збереження він не показуватиметься.",
    "en": "Create a dedicated bot with @BotFather and paste its token. It is hidden after saving."
  },
  "m329": {
    "uk": "Токен бота",
    "en": "Bot token"
  },
  "m330": {
    "uk": "Бота підключено. Нові записи перевіряються кожні 10 секунд.",
    "en": "Bot connected. New updates are checked every 10 seconds."
  },
  "m331": {
    "uk": "Бота відключено від цієї CRM",
    "en": "Bot disconnected from this CRM"
  },
  "m332": {
    "uk": "Google Drive підключено",
    "en": "Google Drive connected"
  },
  "m333": {
    "uk": "Резервні копії зберігатимуться на підключеному диску. Збережіть ключ відновлення окремо від застосунку: він потрібен на іншому комп’ютері.",
    "en": "Backups will be saved to the connected Drive. Save the recovery key separately; it is required on another computer."
  },
  "m334": {
    "uk": "Ключ відновлення",
    "en": "Recovery key"
  },
  "m335": {
    "uk": "Зберегти ключ у файл",
    "en": "Save key to file"
  },
  "m336": {
    "uk": "Готово",
    "en": "Done"
  },
  "m337": {
    "uk": "Ключ збережено. Зберігайте його окремо від застосунку.",
    "en": "Key saved. Keep it separate from the app."
  },
  "m338": {
    "uk": "Зберігаємо копію на Google Drive…",
    "en": "Saving a Google Drive backup…"
  },
  "m339": {
    "uk": "Копію збережено",
    "en": "Backup saved"
  },
  "m340": {
    "uk": "Drive відключено. Дозвіл можна відкликати в акаунті Google.",
    "en": "Drive disconnected. You can revoke access in your Google account."
  },
  "m341": {
    "uk": "Повну базу експортовано",
    "en": "Full database exported"
  },
  "m342": {
    "uk": "Усі таблиці експортовано",
    "en": "All tables exported"
  },
  "m343": {
    "uk": "Пароль копії",
    "en": "Backup password"
  },
  "m344": {
    "uk": "Зберігайте пароль окремо: відновлення без нього неможливе.",
    "en": "Keep the password separately; recovery is impossible without it."
  },
  "m345": {
    "uk": "Зберегти копію",
    "en": "Save backup"
  },
  "m346": {
    "uk": "Відновити базу",
    "en": "Restore database"
  },
  "m347": {
    "uk": "Пароль або ключ відновлення",
    "en": "Password or recovery key"
  },
  "m348": {
    "uk": "Виберіть .orbit з комп’ютера або Google Drive. Перед заміною бази застосунок запитає підтвердження.",
    "en": "Choose an .orbit file from your computer or Google Drive. The app will ask for confirmation before replacing the database."
  },
  "m349": {
    "uk": "Базу відновлено",
    "en": "Database restored"
  },
  "m350": {
    "uk": "Вибрати копію",
    "en": "Choose backup"
  },
  "m351": {
    "uk": "Активація",
    "en": "Activation"
  },
  "m352": {
    "uk": "Ключ активації",
    "en": "Activation key"
  },
  "m353": {
    "uk": "Ліцензію активовано",
    "en": "License activated"
  },
  "m354": {
    "uk": "Активувати",
    "en": "Activate"
  },
  "m355": {
    "uk": "Підключити наявного клієнта",
    "en": "Link an existing client"
  },
  "m356": {
    "uk": "Персональне посилання",
    "en": "Personal link"
  },
  "m357": {
    "uk": "Передайте посилання цьому клієнту. Він запустить бота й погодиться на сповіщення. Нове посилання скасовує попереднє.",
    "en": "Send this link to the client. They will start the bot and consent to notifications. A new link invalidates the previous one."
  },
  "m358": {
    "uk": "Скасувати запис?",
    "en": "Cancel this booking?"
  },
  "m359": {
    "uk": "Запис буде скасовано, час стане доступним для інших клієнтів.",
    "en": "The booking will be cancelled and the time will become available."
  },
  "m360": {
    "uk": "Скасувати запис",
    "en": "Cancel booking"
  },
  "m361": {
    "uk": "Налаштування збережено",
    "en": "Settings saved"
  },
  "m362": {
    "uk": "Для змін дочекайтеся підключення до компанії.",
    "en": "Wait for reconnection to make changes."
  },
  "m363": {
    "uk": "Новий контакт",
    "en": "New contact"
  },
  "m364": {
    "uk": "Пробний період",
    "en": "Trial"
  },
  "m365": {
    "uk": "Активний",
    "en": "Active"
  },
  "m366": {
    "uk": "Призупинено",
    "en": "Suspended"
  },
  "m367": {
    "uk": "Користувача додано",
    "en": "User added"
  },
  "m368": {
    "uk": "Умови оновлено",
    "en": "Terms updated"
  },
  "m369": {
    "uk": "Запрошення видано",
    "en": "Invitation issued"
  },
  "m370": {
    "uk": "Пристрій активовано",
    "en": "Device activated"
  },
  "m371": {
    "uk": "Пристрій вимкнено",
    "en": "Device disabled"
  },
  "m372": {
    "uk": "Запит інсталятора",
    "en": "Installer requested"
  },
  "m373": {
    "uk": "Файл передано",
    "en": "File delivered"
  },
  "m374": {
    "uk": "Завантаження перервано",
    "en": "Download interrupted"
  },
  "m375": {
    "uk": "Огляд",
    "en": "Overview"
  },
  "m376": {
    "uk": "Хто користується Orbit і як зростає продукт.",
    "en": "Who uses Orbit and how your product grows."
  },
  "m377": {
    "uk": "Користувачі",
    "en": "Users"
  },
  "m378": {
    "uk": "Компанії, контакти й умови доступу.",
    "en": "Companies, contacts and access terms."
  },
  "m379": {
    "uk": "Пристрої та ліцензії",
    "en": "Devices and licenses"
  },
  "m380": {
    "uk": "Активації, версії та останнє підключення.",
    "en": "Activations, versions and last connections."
  },
  "m381": {
    "uk": "Завантаження",
    "en": "Downloads"
  },
  "m382": {
    "uk": "Історія персональних посилань на інсталятори.",
    "en": "History of personal installer links."
  },
  "m383": {
    "uk": "Сервер і експорт",
    "en": "Server and export"
  },
  "m384": {
    "uk": "Центральна база продукту під вашим контролем.",
    "en": "The central product database under your control."
  },
  "m385": {
    "uk": "Компанії та налаштування",
    "en": "Companies and setup"
  },
  "m386": {
    "uk": "Підготуйте профіль, послуги й ресурси до першого входу клієнта.",
    "en": "Prepare the profile, services and resources before the client signs in."
  },
  "m387": {
    "uk": "Пароль змінено",
    "en": "Password changed"
  },
  "m388": {
    "uk": "Компанію створено",
    "en": "Company created"
  },
  "m389": {
    "uk": "Вхід у застосунок",
    "en": "App sign-in"
  },
  "m390": {
    "uk": "Користувачі та події з’являться після видачі запрошень і підключення застосунків до сервера.",
    "en": "Users and events appear after invitations and app connections."
  },
  "m391": {
    "uk": "Термін сплив",
    "en": "Expired"
  },
  "m392": {
    "uk": "передач файлу",
    "en": "file deliveries"
  },
  "m393": {
    "uk": "Запросити",
    "en": "Invite"
  },
  "m394": {
    "uk": "Умови",
    "en": "Terms"
  },
  "m395": {
    "uk": "КОРИСТУВАЧ / КОМПАНІЯ",
    "en": "USER / COMPANY"
  },
  "m396": {
    "uk": "ДОСТУП ДО",
    "en": "ACCESS UNTIL"
  },
  "m397": {
    "uk": "ПРИСТРОЇ",
    "en": "DEVICES"
  },
  "m398": {
    "uk": "Користувачів поки немає",
    "en": "No users yet"
  },
  "m399": {
    "uk": "КОЛИ",
    "en": "WHEN"
  },
  "m400": {
    "uk": "ПОДІЯ",
    "en": "EVENT"
  },
  "m401": {
    "uk": "ПЛАТФОРМА",
    "en": "PLATFORM"
  },
  "m402": {
    "uk": "Подій поки немає",
    "en": "No events yet"
  },
  "m403": {
    "uk": "Контакти та компанії",
    "en": "Contacts and companies"
  },
  "m404": {
    "uk": "Активні за 24 години",
    "en": "Active in 24 hours"
  },
  "m405": {
    "uk": "За останнім зв’язком пристрою",
    "en": "By last device connection"
  },
  "m406": {
    "uk": "Активовані пристрої",
    "en": "Activated devices"
  },
  "m407": {
    "uk": "З доступом до сервера",
    "en": "With server access"
  },
  "m408": {
    "uk": "Файли передано",
    "en": "Files delivered"
  },
  "m409": {
    "uk": "Встановлення враховується окремо",
    "en": "Installation is tracked separately"
  },
  "m410": {
    "uk": "Зараз сервер працює на цьому комп’ютері. Для користувачів з інтернету розгорніть сервер з HTTPS і підключіть до нього панель. Посилання 127.0.0.1 працюють лише на вашому комп’ютері.",
    "en": "The server is running on this computer. Deploy an HTTPS server for internet users and connect this panel to it. Links to 127.0.0.1 work only on your computer."
  },
  "m411": {
    "uk": "Останні користувачі",
    "en": "Recent users"
  },
  "m412": {
    "uk": "Усі користувачі →",
    "en": "All users →"
  },
  "m413": {
    "uk": "Останні події",
    "en": "Recent events"
  },
  "m414": {
    "uk": "Ім’я, email або компанія",
    "en": "Name, email or company"
  },
  "m415": {
    "uk": "Email заданий власником, не підтверджений листом",
    "en": "Email supplied by the owner, not verified"
  },
  "m416": {
    "uk": "ПРИСТРІЙ",
    "en": "DEVICE"
  },
  "m417": {
    "uk": "АКТИВАЦІЯ",
    "en": "ACTIVATION"
  },
  "m418": {
    "uk": "ОСТАННІЙ ЗВ’ЯЗОК",
    "en": "LAST CONNECTION"
  },
  "m419": {
    "uk": "ДОСТУП",
    "en": "ACCESS"
  },
  "m420": {
    "uk": "Пристроїв поки немає",
    "en": "No devices yet"
  },
  "m421": {
    "uk": "Відключення пристрою блокує доступ до сервера. При наступному зв’язку клієнт видалить ліцензію; без мережі вона діє щонайбільше 3 дні. Перевірка ліцензії обов’язкова лише у збірці з довіреним ключем.",
    "en": "Revoking a device blocks server access. The license is removed on its next connection; offline it remains valid for up to 3 days. Enforcement requires a trusted publisher key."
  },
  "m422": {
    "uk": "Власник видає персональне посилання конкретному користувачу. «Файл передано» — завершене передавання сервером, а не встановлення. Пересилання посилання змінює фактичного одержувача. Завантаження в обхід сервера не видно. Останні 500 подій.",
    "en": "The owner issues a personal link to a specific user. File delivered means transfer completion, not installation. Forwarded links may be downloaded by someone else. Downloads outside this server are not tracked. Latest 500 events."
  },
  "m423": {
    "uk": "На цьому комп’ютері",
    "en": "On this computer"
  },
  "m424": {
    "uk": "Підключений сервер",
    "en": "Connected server"
  },
  "m425": {
    "uk": "Сервер продукту",
    "en": "Product server"
  },
  "m426": {
    "uk": "Панель звертається до API через основний процес. Ключ адміністратора зберігається у захищеному сховищі ОС і не передається інтерфейсу.",
    "en": "The panel accesses the API through the main process. The admin key stays in the OS secure storage and is never exposed to the interface."
  },
  "m427": {
    "uk": "Підключити сервер",
    "en": "Connect server"
  },
  "m428": {
    "uk": "Експорт CRM власника",
    "en": "Export owner CRM"
  },
  "m429": {
    "uk": "Контакти, пристрої та журнал подій у JSON. Приватні ключі, ключ адміністратора й секрети запрошень не експортуються.",
    "en": "Contacts, devices and events in JSON. Private keys, the admin key and invitation secrets are not exported."
  },
  "m430": {
    "uk": "Експортувати базу",
    "en": "Export database"
  },
  "m431": {
    "uk": "Це дані для аналізу. Повна аварійна копія сервера потребує окремого захищеного збереження бази й ключів.",
    "en": "This export is for analysis. A complete disaster recovery backup also requires secure copies of server databases and keys."
  },
  "m432": {
    "uk": "Опублікувати інсталятори",
    "en": "Publish installers"
  },
  "m433": {
    "uk": "Для локального сервера виберіть DMG та EXE на комп’ютері. Для віддаленого сервера шляхи задаються в конфігурації.",
    "en": "Choose local DMG and EXE files for a local server. Configure file paths on a remote server."
  },
  "m434": {
    "uk": "Вибрати DMG",
    "en": "Choose DMG"
  },
  "m435": {
    "uk": "Вибрати EXE",
    "en": "Choose EXE"
  },
  "m436": {
    "uk": "Інсталятори видаються за персональними посиланнями. Для комерційного поширення підпишіть їх сертифікатами.",
    "en": "Installers are delivered through personal links. Sign them with certificates for commercial distribution."
  },
  "m437": {
    "uk": "Що бачить власник",
    "en": "What the owner sees"
  },
  "m438": {
    "uk": "Контакт і компанія, завантаження через сервер, ключ пристрою, ОС, версія, час активації й останнього підключення.",
    "en": "Contact, company, server downloads, device key, OS, version, activation and connection times."
  },
  "m439": {
    "uk": "Записи відвідувачів, телефони клієнтів, Google OAuth і Telegram-токени залишаються в CRM бізнесу та не передаються цій панелі.",
    "en": "Visitor bookings, client phone numbers, Google OAuth and Telegram tokens remain in the business CRM and are not sent to this panel."
  },
  "m440": {
    "uk": "● Локальний сервер",
    "en": "● Local server"
  },
  "m441": {
    "uk": "● Сервер підключено",
    "en": "● Server connected"
  },
  "m442": {
    "uk": "Профіль і логотип",
    "en": "Profile and logo"
  },
  "m443": {
    "uk": "КОМПАНІЯ",
    "en": "COMPANY"
  },
  "m444": {
    "uk": "ГОЛОВНИЙ КОРИСТУВАЧ",
    "en": "MAIN USER"
  },
  "m445": {
    "uk": "ПОЧАТКОВЕ НАЛАШТУВАННЯ",
    "en": "INITIAL SETUP"
  },
  "m446": {
    "uk": "Компаній поки немає",
    "en": "No companies yet"
  },
  "m447": {
    "uk": "Головний користувач може мати кілька компаній. Співробітникам надається доступ за ролями.",
    "en": "The main user can own several companies. Staff access is role based."
  },
  "m448": {
    "uk": "＋ Компанія",
    "en": "＋ Company"
  },
  "m449": {
    "uk": "Створіть головного користувача з логіном і паролем, підготуйте компанію та передайте застосунок. Після входу завантажаться профіль і послуги. Ключ активації не потрібен.",
    "en": "Create an owner account, prepare the company and provide the app. The profile and services load after sign-in. No activation key is needed."
  },
  "m450": {
    "uk": "Хвилин",
    "en": "Minutes"
  },
  "m451": {
    "uk": "Ресурсів одночасно",
    "en": "Simultaneous resources"
  },
  "m452": {
    "uk": "Доступна в боті",
    "en": "Available in the bot"
  },
  "m453": {
    "uk": "Новий користувач",
    "en": "New user"
  },
  "m454": {
    "uk": "Контактна особа",
    "en": "Contact person"
  },
  "m455": {
    "uk": "Компанія та доступ",
    "en": "Company and access"
  },
  "m456": {
    "uk": "Нова компанія · головний власник",
    "en": "New company · main owner"
  },
  "m457": {
    "uk": "Назва нової компанії",
    "en": "New company name"
  },
  "m458": {
    "uk": "Роль у наявній компанії",
    "en": "Role in existing company"
  },
  "m459": {
    "uk": "Пробний період, днів",
    "en": "Trial days"
  },
  "m460": {
    "uk": "Ліміт пристроїв компанії",
    "en": "Company device limit"
  },
  "m461": {
    "uk": "Для співробітника умови підписки успадковуються від головної компанії. Передайте логін і пароль захищеним каналом.",
    "en": "Staff inherit the main company subscription. Send credentials through a secure channel."
  },
  "m462": {
    "uk": "Змінити пароль",
    "en": "Change password"
  },
  "m463": {
    "uk": "Новий пароль",
    "en": "New password"
  },
  "m464": {
    "uk": "Поточні сесії користувача завершаться. Старий пароль відновити неможливо.",
    "en": "Current user sessions will end. The old password cannot be recovered."
  },
  "m465": {
    "uk": "Нова компанія",
    "en": "New company"
  },
  "m466": {
    "uk": "Головний користувач",
    "en": "Main user"
  },
  "m467": {
    "uk": "Б’юті",
    "en": "Beauty"
  },
  "m468": {
    "uk": "СТО",
    "en": "Vehicle repair"
  },
  "m469": {
    "uk": "Інший",
    "en": "Other"
  },
  "m470": {
    "uk": "Валюта",
    "en": "Currency"
  },
  "m471": {
    "uk": "Початок дня",
    "en": "Opening time"
  },
  "m472": {
    "uk": "Кінець дня",
    "en": "Closing time"
  },
  "m473": {
    "uk": "Увімкнути API сайту",
    "en": "Enable website API"
  },
  "m474": {
    "uk": "Послуги та ресурси компанії",
    "en": "Company services and resources"
  },
  "m475": {
    "uk": "увімк.",
    "en": "on"
  },
  "m476": {
    "uk": "вимк.",
    "en": "off"
  },
  "m477": {
    "uk": "хв ·",
    "en": "min ·"
  },
  "m478": {
    "uk": "· бот",
    "en": "· bot"
  },
  "m479": {
    "uk": "Ресурси",
    "en": "Resources"
  },
  "m480": {
    "uk": "＋ Спеціаліст / пост",
    "en": "＋ Specialist / bay"
  },
  "m481": {
    "uk": "Нова послуга",
    "en": "New service"
  },
  "m482": {
    "uk": "Додати спеціаліста / пост",
    "en": "Add specialist / bay"
  },
  "m483": {
    "uk": "Умови доступу",
    "en": "Access terms"
  },
  "m484": {
    "uk": "Стан",
    "en": "Status"
  },
  "m485": {
    "uk": "Доступ до, включно",
    "en": "Access through"
  },
  "m486": {
    "uk": "Ліміт пристроїв",
    "en": "Device limit"
  },
  "m487": {
    "uk": "Запрошення та завантаження",
    "en": "Invitation and download"
  },
  "m488": {
    "uk": "Адреса сервера для застосунку",
    "en": "App server address"
  },
  "m489": {
    "uk": "Одноразовий код активації",
    "en": "One-time activation code"
  },
  "m490": {
    "uk": "Персональне посилання · macOS",
    "en": "Personal link · macOS"
  },
  "m491": {
    "uk": "Персональне посилання · Windows",
    "en": "Personal link · Windows"
  },
  "m492": {
    "uk": "Діє до",
    "en": "Valid until"
  },
  "m493": {
    "uk": ". Скопіюйте зараз: код не зберігається відкритим текстом і більше не показуватиметься. Передайте конкретному користувачу. Для кожного додаткового пристрою видайте нове запрошення.",
    "en": ". Copy it now: it is not stored in plain text and will not be shown again. Send it to the intended user. Issue a new invitation for each additional device."
  },
  "m494": {
    "uk": "Відключити пристрій?",
    "en": "Revoke this device?"
  },
  "m495": {
    "uk": "Нові звернення до сервера буде заборонено. Видана офлайн-ліцензія може діяти до 3 днів.",
    "en": "New server requests will be blocked. An issued offline license may remain valid for up to 3 days."
  },
  "m496": {
    "uk": "Підключити сервер власника",
    "en": "Connect owner server"
  },
  "m497": {
    "uk": "HTTPS-адреса сервера",
    "en": "HTTPS server address"
  },
  "m498": {
    "uk": "Ключ адміністратора",
    "en": "Administrator key"
  },
  "m499": {
    "uk": "Ключ створюється на сервері та зберігається в admin.secret. Не передавайте його користувачам CRM.",
    "en": "The server creates the key in admin.secret. Do not share it with CRM users."
  },
  "m500": {
    "uk": "Дані експортовано",
    "en": "Data exported"
  },
  "m501": {
    "uk": "Інсталятор macOS підключено",
    "en": "macOS installer connected"
  },
  "m502": {
    "uk": "Інсталятор Windows підключено",
    "en": "Windows installer connected"
  },
  "m503": {
    "uk": "Некоректна дата",
    "en": "Invalid date"
  },
  "m504": {
    "uk": "Виберіть коректний період",
    "en": "Choose a valid period"
  },
  "m505": {
    "uk": "Версія для оцінювання · сервер ліцензій не підключено",
    "en": "Evaluation version · license server not connected"
  },
  "m506": {
    "uk": "Ліцензія:",
    "en": "License:"
  },
  "m507": {
    "uk": "Потрібна активація · експорт доступний",
    "en": "Activation required · export available"
  },
  "m508": {
    "uk": "Активуйте ліцензію. Експорт бази доступний без активації.",
    "en": "Activate your license. Database export remains available without activation."
  },
  "m509": {
    "uk": "Недопустиме джерело запиту",
    "en": "Invalid request source"
  },
  "m510": {
    "uk": "Операцію не виконано",
    "en": "Operation failed"
  },
  "m511": {
    "uk": "Логотип до 2 МБ",
    "en": "Logo must not exceed 2 MB"
  },
  "m512": {
    "uk": "Виберіть PNG або JPEG",
    "en": "Choose PNG or JPEG"
  },
  "m513": {
    "uk": "Бот обробляє запит. Повторіть за кілька секунд.",
    "en": "The bot is processing an update. Try again in a few seconds."
  },
  "m514": {
    "uk": "Спочатку підключіть бота",
    "en": "Connect the bot first"
  },
  "m515": {
    "uk": "Клієнта не знайдено",
    "en": "Client not found"
  },
  "m516": {
    "uk": "Клієнт уже підключений",
    "en": "Client already linked"
  },
  "m517": {
    "uk": "Спочатку підключіть Google Drive",
    "en": "Connect Google Drive first"
  },
  "m518": {
    "uk": "BIZ · ключ відновлення копій Google Drive",
    "en": "BIZ · Google Drive backup recovery key"
  },
  "m519": {
    "uk": "Зберігайте окремо від застосунку. Цей ключ є паролем для відновлення .orbit.",
    "en": "Keep this separate from the app. This key is the password for restoring .orbit backups."
  },
  "m520": {
    "uk": "Дочекайтеся завершення операції Google Drive",
    "en": "Wait for the Google Drive operation to finish"
  },
  "m521": {
    "uk": "Відключено · доступ можна відкликати в Google",
    "en": "Disconnected · revoke access in Google"
  },
  "m522": {
    "uk": "Це збірка для оцінювання. Комерційний ключ перевірки ще не налаштований.",
    "en": "This is an evaluation build. The commercial verification key is not configured."
  },
  "m523": {
    "uk": "Неправильний формат",
    "en": "Invalid format"
  },
  "m524": {
    "uk": "Експорт усієї бази",
    "en": "Export full database"
  },
  "m525": {
    "uk": "Відновлення доступне для локальної бази. Спільну базу відновлює оператор із серверної копії.",
    "en": "Restore is available for the local database. The operator restores shared databases from server backups."
  },
  "m526": {
    "uk": "Дочекайтеся завершення інтеграцій і повторіть",
    "en": "Wait for integrations to finish and retry"
  },
  "m527": {
    "uk": "Відновити резервну копію",
    "en": "Restore backup"
  },
  "m528": {
    "uk": "Файл більший за 100 МБ",
    "en": "File exceeds 100 MB"
  },
  "m529": {
    "uk": "Замінити базу",
    "en": "Replace database"
  },
  "m530": {
    "uk": "Поточну базу буде замінено",
    "en": "The current database will be replaced"
  },
  "m531": {
    "uk": "Спочатку експортуйте поточну базу. Токени інтеграцій залишаться на цьому комп’ютері.",
    "en": "Export the current database first. Integration tokens stay on this computer."
  },
  "m532": {
    "uk": "Інтеграція ще виконується. Повторіть відновлення за кілька секунд.",
    "en": "An integration is still running. Retry restore in a few seconds."
  },
  "m533": {
    "uk": "Перевірте заповнення полів",
    "en": "Check the required fields"
  },
  "m534": {
    "uk": "Некоректна сума",
    "en": "Invalid amount"
  },
  "m535": {
    "uk": "Некоректний час у вибраному часовому поясі",
    "en": "Invalid time in the selected time zone"
  },
  "m536": {
    "uk": "Мій бізнес",
    "en": "My business"
  },
  "m537": {
    "uk": "Перевірте тривалість, кількість учасників і ресурсів",
    "en": "Check duration, participants and resources"
  },
  "m538": {
    "uk": "Послугу не знайдено",
    "en": "Service not found"
  },
  "m539": {
    "uk": "Виберіть час у майбутньому, не далі року",
    "en": "Choose a future time within one year"
  },
  "m540": {
    "uk": "Перевірте учасників, місткість послуги й кількість ресурсів",
    "en": "Check participants, service capacity and resource count"
  },
  "m541": {
    "uk": "Цей час уже зайнятий. Виберіть інший інтервал.",
    "en": "This time is already booked. Choose another time."
  },
  "m542": {
    "uk": "Клієнт уже має запис на цей час.",
    "en": "The client already has an appointment at this time."
  },
  "m543": {
    "uk": "Сума завелика",
    "en": "Amount is too large"
  },
  "m544": {
    "uk": "Некоректний стан",
    "en": "Invalid status"
  },
  "m545": {
    "uk": "Запис уже закритий",
    "en": "Booking is already closed"
  },
  "m546": {
    "uk": "Непідтримуваний формат резервної копії",
    "en": "Unsupported backup format"
  },
  "m547": {
    "uk": "Резервна копія завелика",
    "en": "Backup is too large"
  },
  "m548": {
    "uk": "Некоректна сума платежу",
    "en": "Invalid payment amount"
  },
  "m549": {
    "uk": "Некоректний час платежу",
    "en": "Invalid payment time"
  },
  "m550": {
    "uk": "Від’ємна сума дозволена лише для повернення",
    "en": "Negative amounts are only allowed for refunds"
  },
  "m551": {
    "uk": "Запис не знайдено",
    "en": "Booking not found"
  },
  "m552": {
    "uk": "Перевірте тип бізнесу",
    "en": "Check the business type"
  },
  "m553": {
    "uk": "Некоректний часовий пояс",
    "en": "Invalid time zone"
  },
  "m554": {
    "uk": "Валюта: код із трьох літер",
    "en": "Currency must be a three-letter code"
  },
  "m555": {
    "uk": "Перевірте робочі години",
    "en": "Check the working hours"
  },
  "m556": {
    "uk": "Перевірте робочі дні",
    "en": "Check the working days"
  },
  "m557": {
    "uk": "Потрібен логотип PNG/JPEG до 2 МБ",
    "en": "A PNG/JPEG logo up to 2 MB is required"
  },
  "m558": {
    "uk": "Укажіть HTTPS-адресу видавця або локальну http://127.0.0.1:4545",
    "en": "Enter the publisher HTTPS address or local http://127.0.0.1:4545"
  },
  "m559": {
    "uk": "Немає зв’язку. Перевірте інтернет; застосунок підключиться автоматично.",
    "en": "No connection. Check your internet; the app reconnects automatically."
  },
  "m560": {
    "uk": "Помилка сервера видавця",
    "en": "Publisher server error"
  },
  "m561": {
    "uk": "Некоректний ключ видавця",
    "en": "Invalid publisher key"
  },
  "m562": {
    "uk": "Ключ сервера не збігається з довіреним ключем застосунку",
    "en": "The server key does not match the app trust key"
  },
  "m563": {
    "uk": "Дочекайтеся завершення підключення",
    "en": "Wait for the connection to finish"
  },
  "m564": {
    "uk": "Захищене сховище недоступне",
    "en": "Secure storage unavailable"
  },
  "m565": {
    "uk": "Адміністратор ще не надав доступ до компанії",
    "en": "The administrator has not assigned a company yet"
  },
  "m566": {
    "uk": "Ви вийшли з акаунта",
    "en": "Signed out"
  },
  "m567": {
    "uk": "Увійдіть в акаунт",
    "en": "Sign in to your account"
  },
  "m568": {
    "uk": "Немає доступу до компанії",
    "en": "No access to this company"
  },
  "m569": {
    "uk": "Зараз доступний перегляд збереженого розкладу. Для змін дочекайтеся підключення.",
    "en": "You can view the saved schedule. Wait for reconnection to make changes."
  },
  "m570": {
    "uk": "Акаунт або компанія змінилися. Оновіть екран.",
    "en": "The account or company changed. Refresh the screen."
  },
  "m571": {
    "uk": "Захищений ключ пристрою недоступний",
    "en": "Secure device key unavailable"
  },
  "m572": {
    "uk": "Пристрій зареєстровано",
    "en": "Device registered"
  },
  "m573": {
    "uk": "Зв’язок із видавцем активний",
    "en": "Publisher connection active"
  },
  "m574": {
    "uk": "Захищене сховище ОС недоступне. Токен не збережено.",
    "en": "OS secure storage is unavailable. The token was not saved."
  },
  "m575": {
    "uk": "Розблокуйте захищене сховище ОС",
    "en": "Unlock OS secure storage"
  },
  "m576": {
    "uk": "Пароль копії: від 12 до 1024 символів",
    "en": "Backup password: 12 to 1024 characters"
  },
  "m577": {
    "uk": "Неправильний пароль або пошкоджена копія",
    "en": "Wrong password or damaged backup"
  },
  "m578": {
    "uk": "Ліцензія недійсна, прострочена або видана для іншого пристрою",
    "en": "The license is invalid, expired or issued to a different device"
  },
  "m579": {
    "uk": "Сервіс недоступний. Перевірте інтернет.",
    "en": "Service unavailable. Check your internet connection."
  },
  "m580": {
    "uk": "Сервіс відхилив запит (HTTP",
    "en": "Service rejected the request (HTTP"
  },
  "m581": {
    "uk": "). Перевірте підключення та дозволи.",
    "en": "). Check your connection and permissions."
  },
  "m582": {
    "uk": "Некоректна відповідь сервісу",
    "en": "Invalid service response"
  },
  "m583": {
    "uk": "Підключіть Telegram-бота",
    "en": "Connect your Telegram bot"
  },
  "m584": {
    "uk": "Telegram відхилив запит. Перевірте права бота.",
    "en": "Telegram rejected the request. Check bot permissions."
  },
  "m585": {
    "uk": "Некоректний токен Telegram",
    "en": "Invalid Telegram token"
  },
  "m586": {
    "uk": "Бот уже має webhook. Використайте окремого бота або вимкніть попередню інтеграцію.",
    "en": "The bot already has a webhook. Use a dedicated bot or disconnect the previous integration."
  },
  "m587": {
    "uk": "Будь-який вільний",
    "en": "Any available"
  },
  "m588": {
    "uk": "Посилання недійсне. Зверніться до адміністратора.",
    "en": "Invalid link. Contact your administrator."
  },
  "m589": {
    "uk": "Для запису й нагадувань натисніть «Погоджуюсь». Ми збережемо ім’я та Telegram ID у базі бізнесу. /stop вимикає сповіщення. /privacy — про дані.",
    "en": "Select I agree to book and receive reminders. We save your name and Telegram ID in the business database. /stop disables notifications. /privacy explains data use."
  },
  "m590": {
    "uk": "Погоджуюсь · записатися",
    "en": "I agree · book"
  },
  "m591": {
    "uk": "Власник бізнесу зберігає ім’я, Telegram ID та історію записів у CRM. Зашифровані копії можуть зберігатися на його Google Drive. Для видалення даних зверніться до власника. /stop відключає Telegram.",
    "en": "The business owner stores your name, Telegram ID and booking history in the CRM. Encrypted backups may be saved in their Google Drive. Contact the owner to delete your data. /stop disconnects Telegram."
  },
  "m592": {
    "uk": "Сповіщення вимкнено. Для нового запису: /start",
    "en": "Notifications disabled. Start again with /start"
  },
  "m593": {
    "uk": "Посилання прострочене. Отримайте нове в адміністратора.",
    "en": "Link expired. Ask your administrator for a new link."
  },
  "m594": {
    "uk": "Клієнт Telegram",
    "en": "Telegram client"
  },
  "m595": {
    "uk": "Для запису й згоди на сповіщення надішліть /start",
    "en": "Send /start to book and consent to notifications"
  },
  "m596": {
    "uk": "Виберіть послугу",
    "en": "Choose a service"
  },
  "m597": {
    "uk": "Послуг поки немає. Зверніться до адміністратора.",
    "en": "No services yet. Contact your administrator."
  },
  "m598": {
    "uk": "Ваші майбутні записи. Кнопка скасовує вибраний запис.",
    "en": "Your upcoming appointments. Select a booking to cancel."
  },
  "m599": {
    "uk": "Майбутніх записів немає. /book — записатися.",
    "en": "No upcoming appointments. Send /book to book."
  },
  "m600": {
    "uk": "Скасувати:",
    "en": "Cancel:"
  },
  "m601": {
    "uk": "Запис скасовано. /book — вибрати інший час.",
    "en": "Booking cancelled. Send /book to choose another time."
  },
  "m602": {
    "uk": "Послуга більше недоступна. Виберіть знову: /book",
    "en": "This service is no longer available. Choose again with /book"
  },
  "m603": {
    "uk": "Скільки учасників буде на візиті?",
    "en": "How many people will attend?"
  },
  "m604": {
    "uk": "осіб",
    "en": "people"
  },
  "m605": {
    "uk": "Виберіть спеціаліста / пост або будь-якого вільного",
    "en": "Choose a specialist / bay, or any available"
  },
  "m606": {
    "uk": "Виберіть послугу: /book. /appointments — ваші записи.",
    "en": "Choose a service with /book. /appointments shows your bookings."
  },
  "m607": {
    "uk": "Виберіть основного спеціаліста / пост або будь-якого вільного. Додаткові ресурси резервуються автоматично.",
    "en": "Choose a primary specialist / bay, or any available. Additional resources are reserved automatically."
  },
  "m608": {
    "uk": "Виберіть дату за часом компанії",
    "en": "Choose a date in the business time zone"
  },
  "m609": {
    "uk": "Вільний час (",
    "en": "Available times ("
  },
  "m610": {
    "uk": "Немає вільного часу. /book — вибрати інший день.",
    "en": "No available times. Send /book to choose another day."
  },
  "m611": {
    "uk": "Ви записані:",
    "en": "You are booked:"
  },
  "m612": {
    "uk": "Спеціаліст / пост:",
    "en": "Specialist / bay:"
  },
  "m613": {
    "uk": "Учасників:",
    "en": "Participants:"
  },
  "m614": {
    "uk": "/appointments — переглянути або скасувати запис.",
    "en": "/appointments — view or cancel your booking."
  },
  "m615": {
    "uk": "Час уже недоступний. Виберіть знову: /book",
    "en": "This time is no longer available. Choose again with /book"
  },
  "m616": {
    "uk": "Нагадування:",
    "en": "Reminder:"
  },
  "m617": {
    "uk": "/appointments — керування записом",
    "en": "/appointments — manage your booking"
  },
  "m618": {
    "uk": "Працює на сервері · CRM можна закрити",
    "en": "Running on the server · you can close the CRM"
  },
  "m619": {
    "uk": "Працює · застосунок має бути відкритим",
    "en": "Running · the app must stay open"
  },
  "m620": {
    "uk": "Вхід у Google вже відкритий",
    "en": "Google sign-in is already open"
  },
  "m621": {
    "uk": "Дочекайтеся завершення резервного копіювання",
    "en": "Wait for the backup to finish"
  },
  "m622": {
    "uk": "Вхід у Google ще не налаштований видавцем застосунку",
    "en": "Google sign-in has not been configured by the publisher"
  },
  "m623": {
    "uk": "Захищене сховище ОС недоступне",
    "en": "OS secure storage unavailable"
  },
  "m624": {
    "uk": "Вхід у Google скасовано",
    "en": "Google sign-in cancelled"
  },
  "m625": {
    "uk": "Авторизацію отримано. Поверніться в BIZ.",
    "en": "Authorization received. Return to BIZ."
  },
  "m626": {
    "uk": "Не вдалося відкрити локальну адресу авторизації",
    "en": "Could not open the local authorization address"
  },
  "m627": {
    "uk": "Час авторизації сплив",
    "en": "Authorization timed out"
  },
  "m628": {
    "uk": "Google не надав фоновий доступ. Повторіть підключення.",
    "en": "Google did not grant background access. Try connecting again."
  },
  "m629": {
    "uk": "Підключено · повторний вхід не завершено",
    "en": "Connected · reauthorization incomplete"
  },
  "m630": {
    "uk": "Вхід у Google не завершено",
    "en": "Google sign-in incomplete"
  },
  "m631": {
    "uk": "Використайте HTTPS-адресу сервера або локальну http://127.0.0.1:4545",
    "en": "Use an HTTPS server address or local http://127.0.0.1:4545"
  },
  "m632": {
    "uk": "Сервер власника недоступний",
    "en": "Owner server unavailable"
  },
  "m633": {
    "uk": "Недопустимий запит",
    "en": "Invalid request"
  },
  "m634": {
    "uk": "Потрібен PNG або JPEG",
    "en": "PNG or JPEG required"
  },
  "m635": {
    "uk": "Перевірте ключ адміністратора",
    "en": "Check the administrator key"
  },
  "m636": {
    "uk": "На віддаленому сервері задайте шляхи до інсталяторів у конфігурації",
    "en": "Configure installer paths on the remote server"
  },
  "m637": {
    "uk": "Некоректна платформа",
    "en": "Invalid platform"
  },
  "m638": {
    "uk": "BIZ Admin · CRM власника",
    "en": "BIZ Admin · owner CRM"
  },
  "m639": {
    "uk": "Пароль: від 12 до 128 символів",
    "en": "Password: 12 to 128 characters"
  },
  "m640": {
    "uk": "Доступ призупинений або підписка спливла",
    "en": "Access suspended or subscription expired"
  },
  "m641": {
    "uk": "Користувача не знайдено",
    "en": "User not found"
  },
  "m642": {
    "uk": "Сесія спливла. Увійдіть знову",
    "en": "Session expired. Sign in again"
  },
  "m643": {
    "uk": "Немає доступу до цього бізнесу",
    "en": "No access to this business"
  },
  "m644": {
    "uk": "Забагато спроб. Повторіть через 15 хвилин",
    "en": "Too many attempts. Try again in 15 minutes"
  },
  "m645": {
    "uk": "Неправильний логін або пароль",
    "en": "Incorrect login or password"
  },
  "m646": {
    "uk": "Некоректний ключ пристрою",
    "en": "Invalid device key"
  },
  "m647": {
    "uk": "Потрібен Ed25519",
    "en": "Ed25519 required"
  },
  "m648": {
    "uk": "Час входу сплив",
    "en": "Sign-in timed out"
  },
  "m649": {
    "uk": "Немає підтвердження пристрою",
    "en": "Device proof missing"
  },
  "m650": {
    "uk": "Пристрій вимкнений або прив’язаний до іншого акаунта",
    "en": "Device revoked or linked to another account"
  },
  "m651": {
    "uk": "Досягнуто ліміту пристроїв компанії",
    "en": "Company device limit reached"
  },
  "m652": {
    "uk": "Метод не знайдено",
    "en": "Method not found"
  },
  "m653": {
    "uk": "Цей бот уже підключений до іншого бізнесу",
    "en": "This bot is already linked to another business"
  },
  "m654": {
    "uk": "Бот обробляє запит",
    "en": "Bot is processing an update"
  },
  "m655": {
    "uk": "Перевірте клієнта й підключення бота",
    "en": "Check the client and bot connection"
  },
  "m656": {
    "uk": "Користувачами керує головний власник",
    "en": "Only the main owner can manage users"
  },
  "m657": {
    "uk": "Виберіть роль адміністратора або співробітника",
    "en": "Choose administrator or staff role"
  },
  "m658": {
    "uk": "Перевірте email",
    "en": "Check the email address"
  },
  "m659": {
    "uk": "Потрібна роль головного власника",
    "en": "Main owner role required"
  },
  "m660": {
    "uk": "Не можна вимкнути власний доступ",
    "en": "You cannot revoke your own access"
  },
  "m661": {
    "uk": "Немає доступу до користувача",
    "en": "No access to this user"
  },
  "m662": {
    "uk": "Перевірте роль і стан",
    "en": "Check role and status"
  },
  "m663": {
    "uk": "Новий бізнес створює головний власник",
    "en": "Only the main owner can create a business"
  },
  "m664": {
    "uk": "Бізнес не знайдено",
    "en": "Business not found"
  },
  "m665": {
    "uk": "API сайту вимкнений",
    "en": "Website API is disabled"
  },
  "m666": {
    "uk": "Потрібна згода на обробку даних",
    "en": "Consent to data processing is required"
  },
  "m667": {
    "uk": "Послуга не опублікована",
    "en": "Service is not published"
  },
  "m668": {
    "uk": "Потрібен унікальний request_id",
    "en": "A unique request_id is required"
  },
  "m669": {
    "uk": "Час недоступний",
    "en": "Time unavailable"
  },
  "m670": {
    "uk": "Запит завеликий",
    "en": "Request too large"
  },
  "m671": {
    "uk": "Некоректний JSON",
    "en": "Invalid JSON"
  },
  "m672": {
    "uk": "Некоректний термін або кількість пристроїв",
    "en": "Invalid term or device count"
  },
  "m673": {
    "uk": "Недійсне запрошення",
    "en": "Invalid invitation"
  },
  "m674": {
    "uk": "Запрошення недійсне, використане або прострочене",
    "en": "Invitation invalid, used or expired"
  },
  "m675": {
    "uk": "Потрібен доступ власника",
    "en": "Owner access required"
  },
  "m676": {
    "uk": "Некоректний підпис запиту",
    "en": "Invalid request signature"
  },
  "m677": {
    "uk": "Повторний запит",
    "en": "Repeated request"
  },
  "m678": {
    "uk": "Виберіть роль",
    "en": "Choose a role"
  },
  "m679": {
    "uk": "Перевірте термін і пристрої",
    "en": "Check the term and devices"
  },
  "m680": {
    "uk": "Пристрій не знайдено",
    "en": "Device not found"
  },
  "m681": {
    "uk": "Забагато запитів",
    "en": "Too many requests"
  },
  "m682": {
    "uk": "Підписка спливла",
    "en": "Subscription expired"
  },
  "m683": {
    "uk": "Запит активації сплив",
    "en": "Activation request expired"
  },
  "m684": {
    "uk": "Немає підтвердження ключа пристрою",
    "en": "Device key proof missing"
  },
  "m685": {
    "uk": "Активація недоступна",
    "en": "Activation unavailable"
  },
  "m686": {
    "uk": "Пристрій уже зареєстрований або вимкнений",
    "en": "Device already registered or revoked"
  },
  "m687": {
    "uk": "Досягнуто ліміту пристроїв",
    "en": "Device limit reached"
  },
  "m688": {
    "uk": "Інсталятор ще не опублікований",
    "en": "Installer not published yet"
  },
  "m689": {
    "uk": "Не вдалося виконати операцію",
    "en": "Could not complete the operation"
  },
  "m690": {
    "uk": "ЗАПИС І БІЗНЕС",
    "en": "BOOKING AND BUSINESS"
  },
  "m691": {
    "uk": "М",
    "en": "M"
  },
  "m692": {
    "uk": "Робочий простір",
    "en": "Workspace"
  },
  "m693": {
    "uk": "КЕРУВАННЯ",
    "en": "MANAGEMENT"
  },
  "m694": {
    "uk": "Працюйте навіть без інтернету.",
    "en": "Work even without internet."
  },
  "m695": {
    "uk": "Ваші дані належать вам.",
    "en": "Your data belongs to you."
  },
  "m696": {
    "uk": "BIZ · рання версія",
    "en": "BIZ · preview"
  },
  "m697": {
    "uk": "ВАШ БІЗНЕС У ПОРЯДКУ",
    "en": "YOUR BUSINESS AT A GLANCE"
  },
  "m698": {
    "uk": "＋ Новий запис",
    "en": "＋ New booking"
  },
  "m699": {
    "uk": "Вибір компанії",
    "en": "Choose company"
  },
  "m700": {
    "uk": "Закрити",
    "en": "Close"
  },
  "m701": {"uk": "АДМІН-ПАНЕЛЬ", "en": "ADMIN PANEL"},
  "m702": {
    "uk": "О",
    "en": "O"
  },
  "m703": {"uk": "Адмін-панель застосунку", "en": "Application admin panel"},
  "m704": {"uk": "Компанії, доступ і ліцензії", "en": "Companies, access and licenses"},
  "m705": {"uk": "КЕРУВАННЯ ЗАСТОСУНКОМ", "en": "APPLICATION MANAGEMENT"},
  "m706": {
    "uk": "Доступ лише власнику",
    "en": "Owner access only"
  },
  "m707": {"uk": "Користувачі, компанії та ліцензії.", "en": "Users, companies and licenses."},
  "m708": {"uk": "Версії, пошта та безпека.", "en": "Versions, email and security."},
  "m709": {"uk": "Адмін-панель застосунку · BIZ", "en": "Application admin panel · BIZ"},
  "m710": {
    "uk": "● Сервер",
    "en": "● Server"
  },
  "m711": {
    "uk": "ВАШ ПРОДУКТ У ЦИФРАХ",
    "en": "YOUR PRODUCT AT A GLANCE"
  },
  "m712": {
    "uk": "＋ Додати користувача",
    "en": "＋ Add user"
  },
  "language": {
    "uk": "Мова",
    "en": "Language"
  },
  "light": {
    "uk": "Денна тема",
    "en": "Light theme"
  },
  "dark": {
    "uk": "Нічна тема",
    "en": "Dark theme"
  },
  "theme": {
    "uk": "Оформлення",
    "en": "Appearance"
  },
  "botMenu": {
    "uk": "Вітаємо! Оберіть дію нижче 👇",
    "en": "Welcome! Choose an option below 👇"
  },
  "botBook": {
    "uk": "📅 Записатися",
    "en": "📅 Book an appointment"
  },
  "botVisits": {
    "uk": "🗓 Мої записи",
    "en": "🗓 My appointments"
  },
  "botInfo": {
    "uk": "📍 Про компанію",
    "en": "📍 Business details"
  },
  "botLanguage": {
    "uk": "🌐 Мова / Language",
    "en": "🌐 Language / Мова"
  },
  "botHome": {
    "uk": "🏠 Головне меню",
    "en": "🏠 Main menu"
  },
  "botBack": {
    "uk": "← Назад",
    "en": "← Back"
  },
  "botNext": {
    "uk": "Далі →",
    "en": "Next →"
  },
  "botAgree": {
    "uk": "✅ Погоджуюсь і продовжую",
    "en": "✅ I agree, continue"
  },
  "botConsent": {
    "uk": "Щоб записатися й отримувати нагадування, потрібна ваша згода. Компанія збереже ваше ім’я, Telegram ID та історію записів. Ви можете відключити сповіщення командою /stop або звернутися до компанії для видалення даних.",
    "en": "To book and receive reminders, we need your consent. The business stores your name, Telegram ID and booking history. Send /stop to disconnect notifications or contact the business to delete your data."
  },
  "botChooseService": {
    "uk": "Яка послуга вас цікавить?",
    "en": "Which service would you like?"
  },
  "botChooseResource": {
    "uk": "До кого бажаєте записатися? Можна обрати будь-якого вільного спеціаліста / пост.",
    "en": "Who would you like to book with? You can choose any available specialist / bay."
  },
  "botChooseDay": {
    "uk": "Оберіть зручний день. Усі дати й час — за часовим поясом компанії:",
    "en": "Choose a day. All dates and times use the business time zone:"
  },
  "botChooseTime": {
    "uk": "Оберіть зручний час:",
    "en": "Choose a time:"
  },
  "botNoTimes": {
    "uk": "На цей день вільного часу немає. Оберіть іншу дату або іншого спеціаліста.",
    "en": "No times are available on this day. Choose another date or specialist."
  },
  "botDates": {
    "uk": "📆 Інша дата",
    "en": "📆 Another date"
  },
  "botResources": {
    "uk": "👤 Інший спеціаліст",
    "en": "👤 Another specialist"
  },
  "botQuote": {
    "uk": "Перевірте ваш запис перед підтвердженням:",
    "en": "Review your booking before confirming:"
  },
  "botConfirm": {
    "uk": "✅ Підтвердити запис",
    "en": "✅ Confirm booking"
  },
  "botEdit": {
    "uk": "✏️ Змінити час",
    "en": "✏️ Change time"
  },
  "botBooked": {
    "uk": "✅ Запис підтверджено! Чекаємо на вас.",
    "en": "✅ Booking confirmed! We look forward to seeing you."
  },
  "botCancel": {
    "uk": "Скасувати запис",
    "en": "Cancel booking"
  },
  "botCancelQuestion": {
    "uk": "Скасувати цей запис? Час стане доступним для інших клієнтів.",
    "en": "Cancel this appointment? Its time will become available to other clients."
  },
  "botCancelConfirm": {
    "uk": "Так, скасувати",
    "en": "Yes, cancel it"
  },
  "botKeep": {
    "uk": "Залишити запис",
    "en": "Keep booking"
  },
  "botCancelled": {
    "uk": "Запис скасовано. Можете обрати новий зручний час.",
    "en": "Booking cancelled. You can choose another time."
  },
  "botNoVisits": {
    "uk": "У вас поки немає майбутніх записів. Оберемо зручний час?",
    "en": "You have no upcoming appointments. Shall we find a time?"
  },
  "botVisitList": {
    "uk": "Ваші майбутні записи. Натисніть, щоб переглянути деталі.",
    "en": "Your upcoming appointments. Select one to see details."
  },
  "botService": {
    "uk": "Послуга",
    "en": "Service"
  },
  "botWhen": {
    "uk": "Дата й час",
    "en": "Date and time"
  },
  "botResource": {
    "uk": "Спеціаліст / пост",
    "en": "Specialist / bay"
  },
  "botPeople": {
    "uk": "Учасників",
    "en": "Participants"
  },
  "botPrice": {
    "uk": "Вартість",
    "en": "Total price"
  },
  "botMinutes": {
    "uk": "хв",
    "en": "min"
  },
  "botMissingInfo": {
    "uk": "Уточніть у адміністратора компанії.",
    "en": "Please ask the business administrator."
  },
  "botExpired": {
    "uk": "Цей крок уже неактуальний. Почніть запис знову або відкрийте свої записи.",
    "en": "This step has expired. Start a new booking or view your appointments."
  },
  "botChanged": {
    "uk": "Умови послуги змінилися. Оберіть послугу знову, щоб перевірити нову вартість і час.",
    "en": "The service details have changed. Choose it again to review the current price and duration."
  },
  "botTaken": {
    "uk": "Цей час щойно зайняли. Оберіть інший час — ми перевіримо доступність знову.",
    "en": "This time was just booked. Choose another time and we will check availability again."
  },
  "botReminder": {
    "uk": "🔔 Нагадуємо про ваш запис",
    "en": "🔔 Your appointment reminder"
  },
  "googleConfig": {
    "uk": "Некоректна конфігурація Google у видавця застосунку",
    "en": "Invalid publisher Google configuration"
  },
  "googleDesktop": {
    "uk": "Потрібен Google OAuth Desktop app",
    "en": "A Google OAuth Desktop app client is required"
  },
"calendarMonth":{"uk": "Місяць", "en": "Month"},
"calendarYear":{"uk": "Рік", "en": "Year"},
"calendarHour":{"uk": "Година", "en": "Hour"},
"calendarMinute":{"uk": "Хвилина", "en": "Minute"},
"calendarApply":{"uk": "Обрати", "en": "Select"},
"calendarToday":{"uk": "Сьогодні", "en": "Today"},
"calendarChoose":{"uk": "Обрати дату", "en": "Choose date"},
"updateRequired":{"uk": "Потрібне оновлення. Перегляд і експорт доступні.", "en": "Update required. Viewing and export remain available."},
"updateSignature":{"uk": "Не вдалося перевірити підпис оновлення.", "en": "Update signature could not be verified."},
"updateHash":{"uk": "Файл оновлення пошкоджений або підмінений.", "en": "The update file is corrupted or has been replaced."},
"updateDownloadError":{"uk": "Не вдалося завантажити оновлення.", "en": "Could not download the update."},
"updatesTitle":{"uk": "Версії та оновлення", "en": "Versions and updates"},
"updatesSubtitle":{"uk": "Публікації, обов’язкові оновлення та версії пристроїв.", "en": "Releases, mandatory updates and device versions."},
"publishRelease":{"uk": "Опублікувати версію", "en": "Publish release"},
"minimumVersion":{"uk": "Мінімальна версія", "en": "Minimum version"},
"updateDeadline":{"uk": "Термін переходу", "en": "Update deadline"},
"updateMessage":{"uk": "Повідомлення клієнту", "en": "Client message"},
"updateScope":{"uk": "Для всіх клієнтів", "en": "All customers"},
"updatePolicy":{"uk": "Обов’язкове оновлення", "en": "Mandatory update"},
"clearPolicy":{"uk": "Скасувати вимогу", "en": "Clear requirement"},
"releaseVersion":{"uk": "Версія", "en": "Version"},
"releaseNotes":{"uk": "Що нового", "en": "Release notes"},
"releaseFile":{"uk": "Файл інсталятора", "en": "Installer file"},
"releasePublished":{"uk": "Версію опубліковано", "en": "Release published"},
"releaseWithdraw":{"uk": "Відкликати версію", "en": "Withdraw release"},
"demoCreate":{"uk": "Створити демодоступ", "en": "Create demo access"},
"demoDays":{"uk": "Днів демонстрації (1–30)", "en": "Demo days (1–30)"},
"demoCredentials":{"uk": "Дані демодоступу — збережіть зараз", "en": "Demo credentials — save now"},
"revokeKey":{"uk": "Відкликати ключ", "en": "Revoke key"},
"licenseAccounts":{"uk": "Клієнти", "en": "Customers"},
"licenseActive":{"uk": "Чинні ліцензії", "en": "Active licenses"},
"licenseTrial":{"uk": "Демоліцензії", "en": "Demo licenses"},
"licenseBlocked":{"uk": "Вимкнені / прострочені", "en": "Disabled / expired"},
"totpCode":{"uk": "Код автентифікатора", "en": "Authenticator code"},
"totpHint":{"uk": "Віддалений доступ: секрет адміністратора та одноразовий код. Сесія діє 15 хвилин.", "en": "Remote access requires the admin secret and a one-time code. Sessions last 15 minutes."},
"updateButton":{"uk": "Зберегти копію та завантажити оновлення", "en": "Save backup and download update"},
"updateBackupPassword":{"uk": "Пароль резервної копії (від 12 символів)", "en": "Backup password (at least 12 characters)"},
"updateBackupHint":{"uk": "Спочатку збережемо зашифровану копію даних та налаштувань. Серверна база не переміщується. Після завантаження встановіть нову версію та відкрийте CRM.", "en": "First we save an encrypted backup of data and settings. The server database stays in place. Install the downloaded version and reopen the CRM."},
"updateAvailable":{"uk": "Доступне оновлення", "en": "Update available"},
"updateSaved":{"uk": "Копію збережено, інсталятор перевірено. Встановіть нову версію.", "en": "Backup saved and installer verified. Install the new version."},
"updateCancelled":{"uk": "Оновлення скасовано", "en": "Update cancelled"},
"updateCurrent":{"uk": "Поточна версія", "en": "Current version"},
"updateNoRelease":{"uk": "Для цього пристрою немає нової версії.", "en": "No newer release is available for this device."},
"updateChooseFolder":{"uk": "Оберіть папку для копії та інсталятора", "en": "Choose a folder for the backup and installer"},
"keyRevokeQuestion":{"uk": "Відкликати одноразовий ключ? Уже активована ліцензія керується окремо.", "en": "Revoke this one-time key? Already activated licenses are managed separately."},
"updateWithdrawQuestion":{"uk": "Відкликати інсталятор? Клієнти більше не зможуть його завантажити.", "en": "Withdraw this installer? Customers will no longer be able to download it."},
"updateBlockedBanner":{"uk": "Оновлення обов’язкове. Перегляд та експорт доступні; зміни заблоковано.", "en": "An update is required. Viewing and export remain available; changes are blocked."},
"pendingUpdate":{"uk": "Оновіть до", "en": "Update by"},
"activationKeys":{"uk": "Одноразові ключі", "en": "One-time keys"},
"policySafety":{"uk": "Спершу опублікуйте перевірений інсталятор для кожної платформи. Скасування вимоги повертає доступ старим версіям.", "en": "Publish a verified installer for each platform first. Clearing the policy restores access for older versions."},
"siteTitle":{"uk": "Лендинг", "en": "Landing page"},
"siteSubtitle":{"uk": "Тексти, анонси, завантаження та заявки на демо.", "en": "Content, announcements, downloads and demo requests."},
"securityTitle":{"uk": "Безпека", "en": "Security"},
"securitySubtitle":{"uk": "Відхилені запити, відкликані пристрої та адміністративні дії.", "en": "Rejected requests, revoked devices and administrative actions."},
"siteEdit":{"uk": "Редагувати тексти", "en": "Edit content"},
"sitePublish":{"uk": "Опублікувати чернетку", "en": "Publish draft"},
"siteDraft":{"uk": "Чернетка", "en": "Draft"},
"sitePublished":{"uk": "Опубліковано", "en": "Published"},
"siteLanguage":{"uk": "Мова матеріалу", "en": "Content language"},
"siteEmail":{"uk": "Контактний email", "en": "Contact email"},
"siteEnabled":{"uk": "Показувати сайт", "en": "Enable website"},
"siteEyebrow":{"uk": "Надзаголовок", "en": "Eyebrow"},
"siteHero":{"uk": "Головний заголовок", "en": "Main headline"},
"siteDescription":{"uk": "Опис застосунку", "en": "App description"},
"sitePrice":{"uk": "Заголовок пропозиції / ціна", "en": "Offer heading / price"},
"sitePriceNote":{"uk": "Умови пропозиції", "en": "Offer details"},
"siteAbout":{"uk": "Про продукт", "en": "About the product"},
"sitePrivacy":{"uk": "Згода на обробку заявки", "en": "Demo request consent"},
"siteDraftHint":{"uk": "Зміни зберігаються в чернетці. Для відображення на сайті натисніть «Опублікувати». Нові релізи з розділу версій з’являються автоматично.", "en": "Changes stay in the draft until you publish. Releases from the versions section appear automatically."},
"siteAnnouncements":{"uk": "Анонси", "en": "Announcements"},
"siteAnnouncementAdd":{"uk": "Додати анонс", "en": "Add announcement"},
"siteAnnouncementEdit":{"uk": "Редагувати анонс", "en": "Edit announcement"},
"siteVisible":{"uk": "Показувати після публікації", "en": "Show after publishing"},
"siteLeads":{"uk": "Заявки на демо", "en": "Demo requests"},
"siteNew":{"uk": "Нова", "en": "New"},
"siteContacted":{"uk": "Зв’язалися", "en": "Contacted"},
"siteClosed":{"uk": "Закрита", "en": "Closed"},
"siteLeadEdit":{"uk": "Опрацювати заявку", "en": "Manage request"},
"siteDelete":{"uk": "Видалити", "en": "Delete"},
"siteDeleteQuestion":{"uk": "Видалити цю заявку та контактні дані?", "en": "Delete this request and its contact details?"},
"sitePublishQuestion":{"uk": "Опублікувати поточну чернетку обома мовами? Вона одразу стане видимою на сайті.", "en": "Publish the current draft in both languages? It becomes visible on the website immediately."},
"siteExport":{"uk": "Експорт сайта та всіх заявок", "en": "Export website and all requests"},
"sitePublicDownloads":{"uk": "Публічні завантаження", "en": "Public downloads"},
"siteDownloadsHint":{"uk": "Показано передачі файлів сервером. Це не кількість встановлень або унікальних людей. Дати — UTC.", "en": "Counts describe server file transfers, not installations or unique people. Dates use UTC."},
"siteRequests":{"uk": "Запитано", "en": "Requested"},
"siteComplete":{"uk": "Передано", "en": "Transferred"},
"siteNoLeads":{"uk": "Заявок поки немає", "en": "No requests yet"},
"siteNoAnnouncements":{"uk": "Анонсів поки немає", "en": "No announcements yet"},
"siteSecurityHint":{"uk": "Журнал показує відмови доступу та повтори запитів, а не доведені злами. Приватні ключі, паролі та токени не записуються. Відсутність подій не доводить безпеку пристрою.", "en": "The log shows access rejections and repeated requests, not proven compromises. Private keys, passwords and tokens are not recorded. No events does not prove a device is safe."},
"siteRejected":{"uk": "Відмови за 24 години", "en": "Rejections in 24 hours"},
"siteRecentlyActive":{"uk": "Пристрої за 15 хвилин", "en": "Devices seen in 15 minutes"},
"siteRevoked":{"uk": "Відкликані пристрої", "en": "Revoked devices"},
"siteAdminActions":{"uk": "Дії адміністратора", "en": "Administrator actions"},
"siteArea":{"uk": "Область", "en": "Area"},
"siteCount":{"uk": "Кількість", "en": "Count"},
"siteShow":{"uk": "Показати", "en": "Show"},
"siteHide":{"uk": "Приховати", "en": "Hide"},
"siteSaved":{"uk": "Чернетку збережено", "en": "Draft saved"},
"siteBody":{"uk": "Текст", "en": "Body"},
"siteName":{"uk": "Ім’я", "en": "Name"},
"siteBusiness":{"uk": "Бізнес", "en": "Business"},
"siteMessage":{"uk": "Повідомлення", "en": "Message"},
"navFeaturesSite":{"uk":"Можливості","en":"Features"},
"mailTitle":{"uk": "Пошта", "en": "Email"},
"mailSubtitle":{"uk": "SMTP, листи клієнтам і підтвердження покупок.", "en": "SMTP, customer emails and purchase confirmations."},
"mailSettings":{"uk": "Налаштувати SMTP", "en": "Configure SMTP"},
"mailVerify":{"uk": "Перевірити з’єднання", "en": "Verify connection"},
"mailTest":{"uk": "Тестовий лист собі", "en": "Send test to sender"},
"mailEnabled":{"uk": "Увімкнути листи", "en": "Enable emails"},
"mailFrom":{"uk": "Email відправника", "en": "Sender email"},
"mailFromName":{"uk": "Ім’я відправника", "en": "Sender name"},
"mailOwner":{"uk": "Email для нових заявок", "en": "Email for new demo requests"},
"mailPasswordHint":{"uk": "Залиште пароль порожнім, щоб зберегти наявний. Gmail: пароль застосунку.", "en": "Leave the password blank to keep the existing one. Gmail requires an app password."},
"mailReceipt":{"uk": "Підтверджувати отримання заявки клієнту", "en": "Send a request receipt to the customer"},
"mailNotice":{"uk": "Повідомляти власника про заявки", "en": "Notify the owner about requests"},
"mailSite":{"uk": "Публічний сайт (HTTPS)", "en": "Public website (HTTPS)"},
"mailAPI":{"uk": "Публічний сервер CRM (HTTPS)", "en": "Public CRM server (HTTPS)"},
"mailReady":{"uk": "SMTP налаштовано", "en": "SMTP configured"},
"mailNotReady":{"uk": "SMTP не налаштовано", "en": "SMTP not configured"},
"mailAccessReady":{"uk": "Листи з доступом готові", "en": "Access emails ready"},
"mailAccessMissing":{"uk": "Для листів із доступом вкажіть сайт і сервер CRM", "en": "Set website and CRM server URLs for access emails"},
"mailStatusHint":{"uk": "«Accepted» означає прийняття SMTP-сервером, а не доставку до скриньки. Невизначений результат не повторюється автоматично, щоб уникнути дублів.", "en": "“Accepted” means the SMTP server accepted the message, not inbox delivery. Uncertain outcomes are not retried automatically to avoid duplicates."},
"mailRetry":{"uk": "Повторити", "en": "Retry"},
"mailResend":{"uk": "Надіслати новий доступ", "en": "Send new access key"},
"mailResendHint":{"uk": "Попередні невикористані ключі буде відкликано. Клієнт отримає одноразовий ключ і посилання для встановлення пароля.", "en": "Previous unused keys will be revoked. The customer receives a one-time key and a password setup link."},
"mailPurchase":{"uk": "Підтвердити покупку", "en": "Confirm purchase"},
"mailPaymentReference":{"uk": "Номер платежу / замовлення", "en": "Payment / order reference"},
"mailPaymentConfirm":{"uk": "Підтверджую, що оплату отримано", "en": "I confirm payment was received"},
"mailPurchaseHint":{"uk": "Онлайн-оплату не підключено. Ця дія підтверджує оплату вручну, активує/подовжує ліцензію та надсилає доступ.", "en": "Online payments are not connected. This action confirms payment manually, activates or extends the license and emails access."},
"mailQueued":{"uk": "Лист поставлено в чергу", "en": "Email queued"},
"mailVerified":{"uk": "SMTP-з’єднання працює", "en": "SMTP connection verified"},
"mailNotConfiguredDemo":{"uk": "Демо створено. Лист не поставлено в чергу: налаштуйте SMTP і публічні URL.", "en": "Demo created. No email queued: configure SMTP and public URLs."},
"mailLanguage":{"uk": "Мова листа", "en": "Email language"}
};
  let language='uk';try{if(globalThis.localStorage?.getItem('orbit.language')==='en')language='en';}catch{}
  function t(key,lang=language){const value=messages[key];if(!value)throw Error('Unknown message: '+key);return value[lang==='en'?'en':'uk'];}
  function setLanguage(lang){if(!['uk','en'].includes(lang))throw Error('Unsupported language');language=lang;}
  function message(value){const text=String(value||'');for(const v of Object.values(messages))if(text===v.uk||text===v.en)return v[language];return Object.values(messages).filter(v=>v.uk.length>12&&v.en.length>12).sort((a,b)=>b.uk.length-a.uk.length).reduce((s,v)=>s.replaceAll(language==='en'?v.uk:v.en,v[language]),text);}
  function locale(){return language==='en'?'en-GB':'uk-UA';}
  return{t,setLanguage,locale,message,get language(){return language;},supported:['uk','en'],messages};
});
